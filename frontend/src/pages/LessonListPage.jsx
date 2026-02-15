import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function LessonListPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [course, setCourse] = useState(null);
  const [status, setStatus] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    load();
  }, [courseId]);

  const load = async () => {
    try {
      const [courseRes, enrollRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get('/enrollments/my')
      ]);
      setCourse(courseRes.data);
      const myEnr = enrollRes.data.find(e => e.course_id == courseId);
      setEnrollment(myEnr);
      if (myEnr) {
        const statusRes = await api.get(`/lessons/course/${courseId}/status`);
        setStatus(statusRes.data);
      } else {
        setStatus({ lessons: courseRes.data.lessons?.map(l => ({ ...l, status: 'locked', locked: true })) || [] });
      }
    } catch {
      setCourse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await api.post(`/enrollments/course/${courseId}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading || !course) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  const lessons = status?.lessons || course.lessons || [];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link to={`/courses/${courseId}`} className="back-link">← {t('back_to_course')}</Link>
          <h2>{course.title}</h2>
          <p>{course.instructor_name} • {lessons.length} {t('lessons')}</p>
        </div>
        {!enrollment ? (
          <button className="btn btn-primary" onClick={handleEnroll} disabled={enrolling || !course.is_published}>
            {enrolling ? '...' : t('enroll_now')}
          </button>
        ) : (
          <div className="progress-summary">
            <div className="progress-bar" style={{ width: 200, height: 10 }}>
              <div className="progress-bar-fill" style={{ width: `${status?.progress || 0}%` }} />
            </div>
            <span>{status?.progress || 0}% {t('completed')}</span>
          </div>
        )}
      </div>

      {course.description && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h4>{t('about')}</h4>
          <p>{course.description}</p>
        </div>
      )}

      <div className="card">
        <h3>{t('lessons')}</h3>
        {lessons.length ? (
          <ul className="lesson-list lesson-list-status">
            {lessons.map((item, idx) => {
              const lid = item.lesson_id ?? item.id;
              const title = item.title;
              const st = item.status || (item.locked ? 'locked' : (item.completed ? 'completed' : 'available'));
              const locked = st === 'locked';
              const completed = st === 'completed';

              return (
                <li key={lid} className={`lesson-item ${locked ? 'locked' : ''} ${completed ? 'completed' : ''}`}>
                  <span className="lesson-num lesson-status-icon">
                    {completed ? '✓' : locked ? '🔒' : '▶'}
                  </span>
                  <div className="lesson-content" style={{ flex: 1 }}>
                    <strong>{title}</strong>
                    {locked && <p className="lesson-lock-msg">{t('complete_previous')}</p>}
                  </div>
                  {enrollment && !locked && (
                    <Link to={`/courses/${courseId}/lessons/${lid}`} className="btn btn-sm btn-primary">
                      {completed ? t('completed') : t('view_lesson')}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty-state">{t('no_lessons')}</p>
        )}
      </div>
    </div>
  );
}
