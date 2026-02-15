import { useState, useEffect } from 'react';
import api from '../services/api';

const CONTENT_TYPES = [
  { value: 'video', label: 'Video (YouTube/Vimeo)' },
  { value: 'article', label: 'Article (Text/Markdown)' },
  { value: 'file', label: 'File (Downloadable Resource)' }
];

const defaultLesson = () => ({
  title: '',
  description: '',
  content_type: 'article',
  video_url: '',
  external_video_url: '',
  content: '',
  file_url: ''
});

export default function CourseForm({ course, onSaved, onCancel }) {
  const [form, setForm] = useState({
    course_id: '',
    title: '',
    description: '',
    instructor_name: '',
    is_published: true,
    lessons: []
  });
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (course) {
      api.get(`/courses/${course.id}`).then(({ data }) => {
        setForm({
          course_id: data.course_id,
          title: data.title,
          description: data.description || '',
          instructor_name: data.instructor_name,
          is_published: data.is_published,
          lessons: (data.lessons || []).map(l => ({
            id: l.id,
            title: l.title || '',
            description: l.description || '',
            content_type: l.content_type || 'article',
            video_url: l.video_url || '',
            external_video_url: l.external_video_url || '',
            content: l.content || '',
            file_url: l.file_url || ''
          }))
        });
      });
    }
  }, [course?.id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const addLesson = () => {
    const newLesson = defaultLesson();
    const nextIdx = form.lessons.length;
    setForm(f => ({ ...f, lessons: [...f.lessons, newLesson] }));
    setExpandedLesson(nextIdx);
  };

  const updateLesson = (idx, field, value) => {
    setForm(f => ({
      ...f,
      lessons: f.lessons.map((l, i) => i === idx ? { ...l, [field]: value } : l)
    }));
  };

  const removeLesson = (idx) => {
    setForm(f => ({ ...f, lessons: f.lessons.filter((_, i) => i !== idx) }));
    setExpandedLesson(null);
  };

  const toggleExpand = (idx) => {
    setExpandedLesson(prev => (prev === idx ? null : idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        course_id: form.course_id,
        title: form.title,
        description: form.description,
        instructor_name: form.instructor_name,
        lessons: form.lessons.map(l => ({
          title: l.title,
          description: l.description,
          content_type: l.content_type || 'article',
          video_url: l.video_url?.trim() || null,
          external_video_url: l.external_video_url?.trim() || null,
          content: l.content?.trim() || null,
          file_url: l.file_url?.trim() || null
        }))
      };
      if (course) {
        await api.put(`/courses/${course.id}`, { ...payload, is_published: form.is_published });
      } else {
        await api.post('/courses', payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-row">
        <div className="form-group">
          <label>Course ID</label>
          <input name="course_id" value={form.course_id} onChange={handleChange} required disabled={!!course} />
        </div>
        <div className="form-group">
          <label>Title</label>
          <input name="title" value={form.title} onChange={handleChange} required />
        </div>
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
      </div>
      <div className="form-group">
        <label>Instructor Name</label>
        <input name="instructor_name" value={form.instructor_name} onChange={handleChange} required />
      </div>
      {course && (
        <div className="form-group">
          <label>
            <input type="checkbox" name="is_published" checked={form.is_published} onChange={handleChange} />
            Published
          </label>
        </div>
      )}
      <div className="form-group lessons-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <label>Lessons</label>
          <button type="button" className="btn btn-sm btn-secondary" onClick={addLesson}>+ Add Lesson</button>
        </div>
        {form.lessons.map((l, idx) => (
          <div key={idx} className="lesson-card">
            <div className="lesson-card-header" onClick={() => toggleExpand(idx)}>
              <span className="lesson-title-preview">{l.title || `Lesson ${idx + 1}`}</span>
              <span className="lesson-expand-icon">{expandedLesson === idx ? '▼' : '▶'}</span>
            </div>
            {expandedLesson === idx && (
              <div className="lesson-card-body">
                <div className="form-group">
                  <label>Lesson Title *</label>
                  <input
                    value={l.title}
                    onChange={(e) => updateLesson(idx, 'title', e.target.value)}
                    placeholder="e.g. Introduction to Mobile Development"
                  />
                </div>
                <div className="form-group">
                  <label>Short Description (optional)</label>
                  <input
                    value={l.description}
                    onChange={(e) => updateLesson(idx, 'description', e.target.value)}
                    placeholder="Brief overview"
                  />
                </div>
                <div className="form-group">
                  <label>Content Type *</label>
                  <select
                    value={l.content_type || 'article'}
                    onChange={(e) => updateLesson(idx, 'content_type', e.target.value)}
                  >
                    {CONTENT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                {(l.content_type || 'article') === 'video' && (
                  <div className="form-group">
                    <label>YouTube / Vimeo URL *</label>
                    <input
                      value={l.external_video_url || ''}
                      onChange={(e) => updateLesson(idx, 'external_video_url', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                    />
                  </div>
                )}
                {(l.content_type || 'article') === 'article' && (
                  <div className="form-group">
                    <label>Lesson Content (Markdown/HTML) *</label>
                    <textarea
                      value={l.content || ''}
                      onChange={(e) => updateLesson(idx, 'content', e.target.value)}
                      rows={8}
                      placeholder="Write lesson notes, instructions, or paste rich text..."
                    />
                  </div>
                )}
                {(l.content_type || 'article') === 'file' && (
                  <div className="form-group">
                    <label>Attachment URL *</label>
                    <input
                      value={l.file_url || ''}
                      onChange={(e) => updateLesson(idx, 'file_url', e.target.value)}
                      placeholder="https://... or /uploads/files/..."
                    />
                    <p className="small">Paste a link to a PDF, DOC, or other resource. You can upload files when editing the lesson individually.</p>
                  </div>
                )}
                <button type="button" className="btn btn-sm btn-danger" onClick={() => removeLesson(idx)}>Remove Lesson</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
