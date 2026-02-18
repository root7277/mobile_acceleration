import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/courses?published=true'),
      api.get('/enrollments/my')
    ]).then(([coursesRes, enrollRes]) => {
      setCourses(coursesRes.data);
      setEnrollments(enrollRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const enrolledIds = new Set(enrollments.map(e => e.course_id));
  const completedIds = new Set(enrollments.filter(e => e.is_completed).map(e => e.course_id));

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Courses</h2>
        <p>Browse and enroll in mobile acceleration courses</p>
      </div>

      <div className="courses-grid">
        {courses.map((c) => (
          <div key={c.id} className="course-card card">
            <div className="course-card-header">
              <span className="course-id">{c.course_id}</span>
              <span className="badge badge-muted">{c.lesson_count} lessons</span>
            </div>
            <h3>{c.title}</h3>
            <p className="course-desc">{c.description || 'No description.'}</p>
            <p className="course-instructor">Instructor: {c.instructor_name}</p>
            <div className="course-card-footer">
              {completedIds.has(c.id) ? (
                <span className="btn btn-primary" style={{ opacity: 0.9, cursor: 'default', pointerEvents: 'none' }}>
                  Completed
                </span>
              ) : enrolledIds.has(c.id) ? (
                <Link to={`/courses/${c.id}`} className="btn btn-primary">
                  Continue Course
                </Link>
              ) : (
                <Link to={`/courses/${c.id}`} className="btn btn-secondary">
                  View & Enroll
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {!courses.length && (
        <div className="card">
          <p className="empty-state">No courses available yet.</p>
        </div>
      )}
    </div>
  );
}
