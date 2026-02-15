import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: '', region: '', search: '' });

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.role) params.append('role', filters.role);
    if (filters.region) params.append('region', filters.region);
    if (filters.search) params.append('search', filters.search);
    api.get(`/users?${params}`).then(({ data }) => {
      setUsers(data.users);
      setTotal(data.total);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  return (
    <div>
      <div className="page-header">
        <h2>Users</h2>
        <p>Manage all platform users</p>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="filters-row">
          <input
            type="text"
            placeholder="Search by name, username, region..."
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            className="filter-input"
          />
          <select
            value={filters.role}
            onChange={(e) => setFilters(f => ({ ...f, role: e.target.value }))}
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <input
            type="text"
            placeholder="Region"
            value={filters.region}
            onChange={(e) => setFilters(f => ({ ...f, region: e.target.value }))}
            className="filter-input"
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-inline"><div className="spinner" /></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Region</th>
                  <th>District</th>
                  <th>Phone</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.full_name}</td>
                    <td>{u.username}</td>
                    <td><span className="badge badge-muted">{u.role}</span></td>
                    <td>{u.region}</td>
                    <td>{u.district}</td>
                    <td>{u.phone_number}</td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Total: {total}</p>
          </div>
        )}
      </div>
    </div>
  );
}
