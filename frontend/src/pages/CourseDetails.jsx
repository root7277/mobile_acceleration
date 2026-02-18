import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function CourseDetails() {
  const { courseId } = useParams();
  const { t } = useLanguage();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const { data } = await api.get(`/courses/${courseId}`);
      setCourse(data);
      const enrollments = await api.get('/enrollments/my');
      const myEnrollment = enrollments.data.find(e => e.course_id == courseId);
      if (myEnrollment) {
        const progRes = await api.get(`/progress/enrollment/${myEnrollment.id}`);
        setProgress(progRes.data);
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
      loadCourse();
    } catch (err) {
      alert(err.response?.data?.error || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading || !course) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  const myEnrollment = progress?.enrollment;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>{course.title}</h2>
          <p>{course.instructor_name} • {course.lesson_count} {t('lessons')}</p>
        </div>
        {!myEnrollment ? (
          <button className="btn btn-primary" onClick={handleEnroll} disabled={enrolling || !course.is_published}>
            {enrolling ? '...' : t('enroll_now')}
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="progress-summary">
              <div className="progress-bar" style={{ width: 200, height: 10 }}>
                <div className="progress-bar-fill" style={{ width: `${progress?.progress ?? 0}%` }} />
              </div>
              <span>{progress?.progress ?? 0}% {t('completed')}</span>
            </div>
            {progress?.is_completed && (
              <span className="badge badge-success">Completed</span>
            )}
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
        {course.lessons?.length ? (
          <div>
            <p style={{ marginBottom: '1rem' }}>{course.lesson_count} {t('lessons')}</p>
            {progress?.is_completed ? (
              <span className="btn btn-primary" style={{ opacity: 0.9, cursor: 'default', pointerEvents: 'none' }}>
                Completed
              </span>
            ) : (
              <Link to={`/courses/${courseId}/lessons`} className="btn btn-primary">
                {myEnrollment ? t('continue_course') : t('view_enroll')}
              </Link>
            )}
          </div>
        ) : (
          <p className="empty-state">{t('no_lessons')}</p>
        )}
      </div>
    </div>
  );
}
