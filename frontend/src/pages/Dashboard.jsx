import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/me/stats').then(({ data }) => {
      setData(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  const { enrollments, certificates, activity_logs, stats } = data;

  return (
    <div>
      <div className="page-header">
        <h2>Welcome, {user?.full_name}</h2>
        <p>{user?.region} • {user?.district} • {user?.neighborhood}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="value">{stats?.total_enrollments ?? 0}</div>
          <div className="label">Enrolled Courses</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats?.completed_courses ?? 0}</div>
          <div className="label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats?.total_certificates ?? 0}</div>
          <div className="label">Certificates</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>My Courses</h3>
          {enrollments?.length ? (
            <ul className="course-list">
              {enrollments.map((e) => (
                <li key={e.id} className="course-list-item">
                  <Link to={`/courses/${e.course_id}`}>
                    <div className="course-list-title">{e.course_title}</div>
                    <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
                      <div className="progress-bar-fill" style={{ width: `${e.progress}%` }} />
                    </div>
                    <span className="progress-text">{e.progress}% complete</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No enrollments yet. <Link to="/courses">Browse courses</Link></p>
          )}
        </div>

        <div className="card">
          <h3>Recent Certificates</h3>
          {certificates?.length ? (
            <ul className="cert-list">
              {certificates.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link to={`/certificates`}>
                    <strong>{c.course_title}</strong>
                    <span className="cert-date">{new Date(c.completion_date).toLocaleDateString()}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No certificates yet. Complete courses to earn them.</p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3>Activity History</h3>
        {activity_logs?.length ? (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Action</th><th>Time</th></tr>
              </thead>
              <tbody>
                {activity_logs.map((a, i) => (
                  <tr key={i}>
                    <td>{a.action}</td>
                    <td>{new Date(a.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No recent activity.</p>
        )}
      </div>
    </div>
  );
}
