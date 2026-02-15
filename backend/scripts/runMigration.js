require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../config/database');

const migrationsDir = path.join(__dirname, '../../database/migrations');
if (!fs.existsSync(migrationsDir)) {
  console.log('No migrations directory.');
  db.close();
  return;
}

const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let depth = 0; // track BEGIN/END nesting
  const lines = sql.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--')) continue;
    const upper = trimmed.toUpperCase();
    if (upper.startsWith('BEGIN')) depth++;
    current += (current ? '\n' : '') + line;
    if (upper.startsWith('END') && trimmed.endsWith(';')) depth--;
    if (trimmed.endsWith(';') && depth === 0) {
      const stmt = current.trim();
      if (stmt) statements.push(stmt.slice(0, -1)); // remove trailing ;
      current = '';
    }
  }
  if (current.trim()) statements.push(current.trim().replace(/;$/, ''));
  return statements;
}

migrations.forEach(filename => {
  const filepath = path.join(migrationsDir, filename);
  const sql = fs.readFileSync(filepath, 'utf8');
  const statements = splitSqlStatements(sql);

  console.log('\n---', filename);
  statements.forEach((stmt, i) => {
    if (!stmt) return;
    try {
      db.prepare(stmt).run();
      console.log('OK');
    } catch (err) {
      const msg = err.message || '';
      if (
        msg.includes('duplicate column') ||
        msg.includes('already exists') ||
        msg.includes('duplicate trigger')
      ) {
        console.log('SKIP:', msg.split('\n')[0]);
      } else {
        console.error('FAIL:', stmt.substring(0, 100));
        throw err;
      }
    }
  });
});

console.log('\nMigrations complete.');
db.close();
