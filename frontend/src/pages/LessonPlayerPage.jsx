import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const hasValue = (v) => v != null && String(v).trim() !== '';

const getEmbedUrl = (url) => {
  if (!hasValue(url)) return null;
  const u = String(url).trim();
  if (u.includes('youtube.com/watch')) {
    const m = u.match(/v=([^&]+)/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : u;
  }
  if (u.includes('youtu.be/')) {
    const id = u.split('youtu.be/')[1]?.split('?')[0];
    return id ? `https://www.youtube.com/embed/${id}` : u;
  }
  if (u.includes('vimeo.com/')) {
    const m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return m ? `https://player.vimeo.com/video/${m[1]}` : u;
  }
  return u;
};

const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export default function LessonPlayerPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [sidebarLessons, setSidebarLessons] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (lessonId && courseId) {
      load();
    } else {
      setLoading(false);
      setError('Invalid lesson or course.');
    }
  }, [courseId, lessonId]);

  const load = async () => {
    if (!lessonId || !courseId) return;
    setLoading(true);
    setError('');
    try {
      const lessonRes = await api.get(`/lessons/${lessonId}`);
      console.log('Fetched Lesson Data:', lessonRes.data);
      setLesson(lessonRes.data);

      const [courseRes, enrollRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get('/enrollments/my')
      ]);
      setCourse(courseRes.data);
      const myEnr = enrollRes.data.find(e => e.course_id == courseId);
      setEnrollment(myEnr);

      try {
        const statusRes = await api.get(`/lessons/course/${courseId}/status`);
        setSidebarLessons(statusRes.data.lessons || []);
      } catch (statusErr) {
        console.warn('Sidebar status failed, using fallback:', statusErr?.response?.data);
        const fallback = (courseRes.data?.lessons || []).map(l => ({ lesson_id: l.id, id: l.id, title: l.title, status: 'available' }));
        setSidebarLessons(fallback);
      }
    } catch (err) {
      console.error('Lesson fetch error:', err?.response?.data || err?.message || err);
      if (err.response?.status === 403) {
        setError(err.response?.data?.message || t('complete_previous'));
        navigate(`/courses/${courseId}/lessons`, { replace: true });
      } else if (err.response?.status === 404) {
        setError(err.response?.data?.error || 'Lesson not found.');
      } else {
        const msg = err.response?.data?.error || err?.message || 'Failed to load lesson';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration || completing) return;
    const pct = Math.floor((v.currentTime / v.duration) * 100);
    if (pct >= 90) {
      setCompleting(true);
      api.put(`/lesson-progress/${lessonId}/video-progress`, { videoWatchPercent: 100 }).catch(() => {});
    }
  };

  const handleMarkComplete = async () => {
    if (!enrollment) return;
    setCompleting(true);
    try {
      const { data } = await api.post('/lesson-progress/complete', {
        lessonId: parseInt(lessonId),
        enrollmentId: enrollment.id,
        forceComplete: true
      });
      if (data.certificate) {
        alert('Course completed! Certificate generated.');
      }
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading lesson...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '1.5rem' }}>
        <Link to={`/courses/${courseId}/lessons`} className="back-link">← {t('back_to_course')}</Link>
        <p className="alert alert-error">{error}</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="card">
        <p className="lesson-no-materials">{t('no_content_available')}</p>
      </div>
    );
  }

  const contentType = (lesson.content_type || 'article').toLowerCase();
  const hasUploadedVideo = hasValue(lesson.video_url);
  const hasExternalVideo = hasValue(lesson.external_video_url);
  const embedUrl = getEmbedUrl(lesson.external_video_url);
  const hasVideo = hasUploadedVideo || !!embedUrl;
  const hasContent = hasValue(lesson.content);
  const hasFile = hasValue(lesson.file_url);
  const hasAnyContent = hasVideo || hasContent || hasFile;

  return (
    <div className="lesson-player-layout">
      <aside className="lesson-sidebar">
        <Link to={`/courses/${courseId}/lessons`} className="back-link">← {t('back_to_course')}</Link>
        <h4>{course?.title}</h4>
        <ul className="lesson-sidebar-list">
          {sidebarLessons.map((item) => {
            const l = item.lesson_id ? item : item;
            const lid = l.lesson_id || l.id;
            const locked = l.status === 'locked';
            const completed = l.status === 'completed';
            const active = lid == lessonId;
            return (
              <li key={lid} className={locked ? 'locked' : ''}>
                {locked ? (
                  <span className="lesson-sidebar-item">🔒 {l.title}</span>
                ) : (
                  <Link to={`/courses/${courseId}/lessons/${lid}`} className={`lesson-sidebar-item ${active ? 'active' : ''}`}>
                    {completed ? '✓' : '▶'} {l.title}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </aside>
      <main className="lesson-main">
        <div className="lesson-player-card card">
          <h2>{lesson.title}</h2>

          <div className="lesson-content-block">
            {hasVideo && (
              <>
                {hasUploadedVideo ? (
                  <div className="video-container">
                    <video
                      ref={videoRef}
                      src={lesson.video_url}
                      controls
                      onTimeUpdate={handleTimeUpdate}
                      style={{ width: '100%', maxHeight: 400 }}
                    />
                  </div>
                ) : embedUrl ? (
                  <div className="video-container">
                    <iframe
                      src={embedUrl}
                      title={lesson.title}
                      allowFullScreen
                      style={{ width: '100%', aspectRatio: '16/9', border: 'none' }}
                    />
                  </div>
                ) : null}
              </>
            )}

            {(contentType === 'article' || hasContent) && hasContent && (
              <div className="lesson-content-html" dangerouslySetInnerHTML={{ __html: lesson.content }} />
            )}

            {(contentType === 'file' || hasFile) && hasFile && (
              <div className="lesson-files">
                <a href={lesson.file_url} download target="_blank" rel="noopener noreferrer" className="btn btn-secondary download-resource-btn">
                  <DownloadIcon />
                  <span>{t('download_resource')}</span>
                </a>
              </div>
            )}

            {!hasAnyContent && (
              <p className="lesson-no-materials">{lesson.description || t('no_content_available')}</p>
            )}
          </div>

          {enrollment && (
            <div className="lesson-actions lesson-actions-footer">
              <button className="btn btn-primary" onClick={handleMarkComplete} disabled={completing}>
                {completing ? '...' : t('mark_completed')}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
