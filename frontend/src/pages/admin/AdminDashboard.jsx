import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/statistics/overview').then(({ data }) => {
      setStats(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Admin Dashboard</h2>
        <p>System overview and quick actions</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="value">{stats.total_users}</div>
          <div className="label">Total Students</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.active_users}</div>
          <div className="label">Active (30d)</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.total_courses}</div>
          <div className="label">Courses</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.total_enrollments}</div>
          <div className="label">Enrollments</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.total_certificates}</div>
          <div className="label">Certificates</div>
        </div>
      </div>

      <div className="admin-quick-actions">
        <Link to="/admin/users" className="card admin-action-card">
          <h4>Manage Users</h4>
          <p>View and manage all platform users</p>
        </Link>
        <Link to="/admin/courses" className="card admin-action-card">
          <h4>Manage Courses</h4>
          <p>Create, edit, and delete courses</p>
        </Link>
        <Link to="/admin/enrollments" className="card admin-action-card">
          <h4>View Enrollments</h4>
          <p>Track course enrollments</p>
        </Link>
        <Link to="/admin/statistics" className="card admin-action-card">
          <h4>Statistics</h4>
          <p>Analytics by region and district</p>
        </Link>
      </div>
    </div>
  );
}
