const db = require('../config/database');

const logActivity = (action, entityType = null, entityId = null, details = {}) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      if (req.user && res.statusCode < 400) {
        try {
          db.prepare(`
            INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            req.user?.id,
            action,
            entityType,
            entityId || (req.params?.id ? parseInt(req.params.id) : null),
            JSON.stringify(details),
            req.ip || req.connection?.remoteAddress
          );
        } catch (err) {
          console.error('Activity log error:', err.message);
        }
      }
      return originalJson(data);
    };
    next();
  };
};

module.exports = { logActivity };
