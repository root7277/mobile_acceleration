import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/courses'),
      api.get(`/enrollments${filterCourse ? `?courseId=${filterCourse}` : ''}`)
    ]).then(([coursesRes, enrollRes]) => {
      setCourses(coursesRes.data);
      setEnrollments(enrollRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filterCourse]);

  return (
    <div>
      <div className="page-header">
        <h2>Enrollments</h2>
        <p>Track course enrollments and completion</p>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-inline"><div className="spinner" /></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Course</th>
                  <th>Region</th>
                  <th>District</th>
                  <th>Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <strong>{e.full_name}</strong>
                      <br /><span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{e.username}</span>
                    </td>
                    <td>{e.course_title}</td>
                    <td>{e.region}</td>
                    <td>{e.district}</td>
                    <td>{new Date(e.enrolled_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
