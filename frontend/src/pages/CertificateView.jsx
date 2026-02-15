import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { downloadCertificatePDF } from '../utils/certificatePDF';

export default function CertificateView() {
  const { code } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/certificates/verify/${code}`)
      .then(({ data }) => setCert(data))
      .catch(() => setError('Certificate not found'))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (error) return (
    <div className="auth-page">
      <div className="card" style={{ maxWidth: 400, textAlign: 'center' }}>
        <h2>Certificate Not Found</h2>
        <p>{error}</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Go Home</Link>
      </div>
    </div>
  );

  return (
    <div className="certificate-view-page">
      <div className="certificate-view-card" id="certificate-print">
        <div className="certificate-border">
          <h1>Certificate of Completion</h1>
          <p className="certificate-subtitle">Mobil Acceleration Courses Platform</p>
          <p className="certificate-body">This certifies that</p>
          <h2 className="certificate-name">{cert.full_name}</h2>
          <p className="certificate-body">has successfully completed the course</p>
          <h3>{cert.course_title}</h3>
          <p className="certificate-date">Completed on {new Date(cert.completion_date).toLocaleDateString()}</p>
          <p className="certificate-id">Certificate ID: {cert.certificate_id}</p>
        </div>
      </div>
      <div className="certificate-actions-bar">
        <button className="btn btn-primary" onClick={() => downloadCertificatePDF(cert)}>
          Download PDF
        </button>
        <Link to="/" className="btn btn-secondary">Back to Platform</Link>
      </div>
    </div>
  );
}
