import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { labels: { color: '#a1a1aa' } }
  },
  scales: {
    x: { ticks: { color: '#a1a1aa' } },
    y: { ticks: { color: '#a1a1aa' } }
  }
};

export default function Statistics() {
  const [overview, setOverview] = useState(null);
  const [byRegion, setByRegion] = useState([]);
  const [byDistrict, setByDistrict] = useState([]);
  const [courseStats, setCourseStats] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (regionFilter) {
      api.get(`/statistics/by-district?region=${regionFilter}`).then(({ data }) => setByDistrict(data));
    } else {
      setByDistrict([]);
    }
  }, [regionFilter]);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/statistics/overview'),
      api.get('/statistics/by-region'),
      api.get('/statistics/courses'),
      api.get('/statistics/enrollment-trends?days=30')
    ]).then(([overviewRes, regionRes, courseRes, trendsRes]) => {
      setOverview(overviewRes.data);
      setByRegion(regionRes.data);
      setCourseStats(courseRes.data);
      setTrends(trendsRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const regionChartData = {
    labels: byRegion.map(r => r.region),
    datasets: [
      { label: 'Users', data: byRegion.map(r => r.total_users), backgroundColor: 'rgba(34, 197, 94, 0.7)' },
      { label: 'Enrollments', data: byRegion.map(r => r.enrollments), backgroundColor: 'rgba(34, 197, 94, 0.4)' }
    ]
  };

  const trendsChartData = {
    labels: trends.map(t => new Date(t.date).toLocaleDateString()),
    datasets: [{ label: 'Enrollments', data: trends.map(t => t.count), borderColor: '#22c55e', fill: true, tension: 0.3 }]
  };

  const courseChartData = {
    labels: courseStats.map(c => c.title?.slice(0, 20) + (c.title?.length > 20 ? '...' : '')),
    datasets: [{ data: courseStats.map(c => c.completions), backgroundColor: ['#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7'] }]
  };

  return (
    <div>
      <div className="page-header">
        <h2>Statistics & Analytics</h2>
        <p>Platform analytics by region, district, and neighborhood</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="value">{overview?.total_users ?? 0}</div>
          <div className="label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="value">{overview?.active_users ?? 0}</div>
          <div className="label">Active (30d)</div>
        </div>
        <div className="stat-card">
          <div className="value">{overview?.total_enrollments ?? 0}</div>
          <div className="label">Enrollments</div>
        </div>
        <div className="stat-card">
          <div className="value">{overview?.total_certificates ?? 0}</div>
          <div className="label">Certificates</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card chart-card">
          <h3>Users by Region</h3>
          <div style={{ height: 300 }}>
            <Bar data={regionChartData} options={chartOptions} />
          </div>
        </div>
        <div className="card chart-card">
          <h3>Enrollment Trends (30 days)</h3>
          <div style={{ height: 300 }}>
            <Line data={trendsChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div className="card chart-card" style={{ marginTop: '1.5rem' }}>
        <h3>Completions by Course</h3>
        <div style={{ height: 250, maxWidth: 400, margin: '0 auto' }}>
          <Doughnut data={courseChartData} options={chartOptions} />
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3>Region Details</h3>
        <div className="filters-row" style={{ marginBottom: '1rem' }}>
          <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
            <option value="">Select region for districts</option>
            {byRegion.map(r => <option key={r.region} value={r.region}>{r.region}</option>)}
          </select>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Region</th>
                <th>Total Users</th>
                <th>Active Users</th>
                <th>Enrollments</th>
                <th>Certificates</th>
              </tr>
            </thead>
            <tbody>
              {byRegion.map((r) => (
                <tr key={r.region}>
                  <td><strong>{r.region}</strong></td>
                  <td>{r.total_users}</td>
                  <td>{r.active_users ?? 0}</td>
                  <td>{r.enrollments}</td>
                  <td>{r.certificates}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {byDistrict.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3>Districts in {regionFilter}</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>District</th>
                  <th>Users</th>
                  <th>Enrollments</th>
                  <th>Certificates</th>
                </tr>
              </thead>
              <tbody>
                {byDistrict.map((d, i) => (
                  <tr key={i}>
                    <td>{d.district}</td>
                    <td>{d.total_users}</td>
                    <td>{d.enrollments}</td>
                    <td>{d.certificates}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
