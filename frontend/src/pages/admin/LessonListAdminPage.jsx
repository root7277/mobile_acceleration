import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export default function LessonListAdminPage() {
  const { courseId } = useParams();
  const { t } = useLanguage();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [courseId]);

  const load = async () => {
    try {
      const [courseRes, lessonsRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/lessons/course/${courseId}`)
      ]);
      setCourse(courseRes.data);
      setLessons(lessonsRes.data);
    } catch {
      setCourse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      await api.delete(`/lessons/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  };

  if (loading || !course) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link to="/admin/courses" className="back-link">← Courses</Link>
          <h2>{course.title}</h2>
          <p>{t('lessons_management')}</p>
        </div>
        <Link to={`/admin/courses/${courseId}/lessons/new`} className="btn btn-primary">
          + {t('create_lesson')}
        </Link>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t('order_index')}</th>
                <th>{t('lesson_title')}</th>
                <th>Video</th>
                <th>{t('duration')}</th>
                <th>{t('delete')}</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((l) => (
                <tr key={l.id}>
                  <td>{l.order_index}</td>
                  <td>
                    <Link to={`/admin/courses/${courseId}/lessons/${l.id}/edit`}>{l.title}</Link>
                  </td>
                  <td>{l.video_url || l.external_video_url ? '✓' : '-'}</td>
                  <td>{l.duration || 0} min</td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(l.id)}>
                      {t('delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!lessons.length && <p className="empty-state">{t('no_lessons')}</p>}
      </div>
    </div>
  );
}
