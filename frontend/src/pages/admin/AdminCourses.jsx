import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import CourseForm from '../../components/CourseForm';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminCourses() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = () => {
    api.get('/courses').then(({ data }) => {
      setCourses(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this course? This will remove all lessons and enrollments.')) return;
    try {
      await api.delete(`/courses/${id}`);
      loadCourses();
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditing(null);
    loadCourses();
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Courses</h2>
          <p>Create and manage courses</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          + Create Course
        </button>
      </div>

      {(showForm || editing) && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <CourseForm
            course={editing}
            onSaved={handleSaved}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="loading-inline"><div className="spinner" /></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Instructor</th>
                  <th>Lessons</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id}>
                    <td>{c.course_id}</td>
                    <td>{c.title}</td>
                    <td>{c.instructor_name}</td>
                    <td>{c.lesson_count ?? 0}</td>
                    <td>
                      <span className={`badge ${c.is_published ? 'badge-success' : 'badge-muted'}`}>
                        {c.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td>
                      <Link to={`/admin/courses/${c.id}/lessons`} className="btn btn-sm btn-secondary">
                        {t('lessons')}
                      </Link>
                      <button className="btn btn-sm btn-secondary" style={{ marginLeft: '0.5rem' }} onClick={() => { setEditing(c); setShowForm(true); }}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-danger" style={{ marginLeft: '0.5rem' }} onClick={() => handleDelete(c.id)}>
                        {t('delete')}
                      </button>
                    </td>
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
