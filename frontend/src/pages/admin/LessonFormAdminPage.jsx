import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export default function LessonFormAdminPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isNew = lessonId === 'new';
  const [course, setCourse] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    content_type: 'article',
    content: '',
    video_url: '',
    external_video_url: '',
    file_url: '',
    duration: 0,
    order_index: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    load();
  }, [courseId, lessonId]);

  const load = async () => {
    try {
      const courseRes = await api.get(`/courses/${courseId}`);
      setCourse(courseRes.data);
      if (!isNew) {
        const lessonRes = await api.get(`/lessons/${lessonId}`);
        const l = lessonRes.data;
        setForm({
          title: l.title || '',
          description: l.description || '',
          content_type: l.content_type || 'article',
          content: l.content || '',
          video_url: l.video_url || '',
          external_video_url: l.external_video_url || '',
          file_url: l.file_url || '',
          duration: l.duration || 0,
          order_index: l.order_index ?? 0
        });
      } else {
        setForm(f => ({ ...f, order_index: courseRes.data.lessons?.length ?? 0 }));
      }
    } catch {
      setCourse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'duration' || name === 'order_index' ? parseInt(value) || 0 : value }));
  };

  const CONTENT_TYPES = [
    { value: 'video', label: 'Video (YouTube/Vimeo)' },
    { value: 'article', label: 'Article (Text/Markdown)' },
    { value: 'file', label: 'File (Downloadable Resource)' }
  ];

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const fd = new FormData();
      fd.append('video', file);
      const { data } = await api.post('/lessons/upload-video', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm(f => ({ ...f, video_url: data.url }));
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/lessons/upload-file', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm(f => ({ ...f, file_url: data.url }));
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploadingFile(false);
    }
  };

  const normalizePayload = () => ({
    title: form.title?.trim() || '',
    description: form.description?.trim() ?? '',
    content_type: form.content_type || 'article',
    content: form.content?.trim() || '',
    video_url: form.video_url?.trim() || '',
    external_video_url: form.external_video_url?.trim() || '',
    file_url: form.file_url?.trim() || '',
    duration: parseInt(form.duration) || 0,
    order_index: parseInt(form.order_index) ?? 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title?.trim()) {
      alert(t('lesson_title') + ' is required');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...normalizePayload(), course_id: courseId };
      if (isNew) {
        await api.post('/lessons', payload);
      } else {
        await api.put(`/lessons/${lessonId}`, payload);
      }
      navigate(`/admin/courses/${courseId}/lessons`);
    } catch (err) {
      alert(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !course) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>{isNew ? t('create_lesson') : t('edit_lesson')}</h2>
        <p>{course.title}</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('lesson_title')}</label>
            <input name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>{t('lesson_description')}</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={2} />
          </div>
          <div className="form-group">
            <label>Content Type</label>
            <select name="content_type" value={form.content_type} onChange={handleChange}>
              {CONTENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>{t('lesson_content')}</label>
            <textarea name="content" value={form.content} onChange={handleChange} rows={6} placeholder="HTML/Markdown content" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{t('upload_video')} (optional)</label>
              <input type="file" accept="video/mp4,video/webm,video/ogg" onChange={handleVideoUpload} disabled={uploadingVideo} />
              {form.video_url ? (
                <div className="upload-preview">
                  <span className="small">{form.video_url}</span>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setForm(f => ({ ...f, video_url: '' }))}>Clear</button>
                </div>
              ) : null}
            </div>
            <div className="form-group">
              <label>{t('external_video_url')} (optional)</label>
              <input name="external_video_url" value={form.external_video_url} onChange={handleChange} placeholder="YouTube, Google Drive, etc." />
            </div>
          </div>
          <div className="form-group">
            <label>{t('upload_file')} (optional)</label>
            <input type="file" accept=".pdf,.doc,.docx,.zip" onChange={handleFileUpload} disabled={uploadingFile} />
            {form.file_url ? (
              <div className="upload-preview">
                <span className="small">{form.file_url}</span>
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setForm(f => ({ ...f, file_url: '' }))}>Clear</button>
              </div>
            ) : null}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{t('duration')}</label>
              <input name="duration" type="number" value={form.duration} onChange={handleChange} min={0} />
            </div>
            <div className="form-group">
              <label>{t('order_index')}</label>
              <input name="order_index" type="number" value={form.order_index} onChange={handleChange} min={0} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : t('save')}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(`/admin/courses/${courseId}/lessons`)}>
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
