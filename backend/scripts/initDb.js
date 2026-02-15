require('dotenv').config();
const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = require('../config/database');
const schemaPath = path.join(__dirname, '../../database/schema-sqlite.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

console.log('Initializing database...');
db.exec(schema);
console.log('Database initialized successfully!');

// Create super admin if not exists
const bcrypt = require('bcryptjs');
const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('superadmin');

if (!existingAdmin) {
  const passwordHash = bcrypt.hashSync('SuperAdmin123!', 10);
  db.prepare(`
    INSERT INTO users (full_name, region, district, neighborhood, phone_number, username, password_hash, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('Super Administrator', 'Toshkent', 'Toshkent Shahri', 'Admin Mahalla', '+998900000000', 'superadmin', passwordHash, 'super_admin');
  console.log('Super admin created: username=superadmin, password=SuperAdmin123!');
}

// Add sample course and lessons if empty
const courseCount = db.prepare('SELECT COUNT(*) as count FROM courses').get().count;
if (courseCount === 0) {
  const superAdmin = db.prepare('SELECT id FROM users WHERE role = ?').get('super_admin');
  if (superAdmin) {
    db.prepare(`
      INSERT INTO courses (course_id, title, description, instructor_name, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run('MOBIL-ACC-001', 'Mobile Acceleration Fundamentals', 
      'Introduction to mobile development and acceleration concepts for remote community participants.', 
      'O\'zbekiston Mobile Academy', superAdmin.id);
    
    const course = db.prepare('SELECT id FROM courses WHERE course_id = ?').get('MOBIL-ACC-001');
    const lessons = [
      ['Introduction to Mobile Development', 'Overview of mobile platforms and development basics', 1],
      ['Setting Up Your Environment', 'Installing and configuring development tools', 2],
      ['Building Your First App', 'Creating a simple mobile application', 3],
      ['Testing and Deployment', 'Testing strategies and app store deployment', 4],
    ];
    const insertLesson = db.prepare('INSERT INTO lessons (course_id, title, description, order_index) VALUES (?, ?, ?, ?)');
    lessons.forEach(([title, desc, idx]) => insertLesson.run(course.id, title, desc, idx));
    console.log('Sample course and lessons created.');
  }
}

db.close();
