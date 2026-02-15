import { useState, useEffect } from 'react';
import api from '../services/api';
import { downloadCertificatePDF } from '../utils/certificatePDF';

export default function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/certificates/my').then(({ data }) => {
      setCertificates(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleDownload = (cert) => {
    downloadCertificatePDF(cert);
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>My Certificates</h2>
        <p>Download your earned certificates</p>
      </div>

      <div className="certificates-grid">
        {certificates.map((cert) => (
          <div key={cert.id} className="certificate-card card">
            <div className="certificate-header">
              <span className="certificate-icon">▣</span>
              <h3>{cert.course_title}</h3>
            </div>
            <div className="certificate-details">
              <p><strong>Certificate ID:</strong> {cert.certificate_id}</p>
              <p><strong>Completed:</strong> {new Date(cert.completion_date).toLocaleDateString()}</p>
              <p><strong>Instructor:</strong> {cert.instructor_name}</p>
            </div>
            <div className="certificate-actions">
              <a href={`/certificate/verify/${cert.certificate_id}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                View / Verify
              </a>
              <button className="btn btn-primary" onClick={() => handleDownload(cert)}>
                Download PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      {!certificates.length && (
        <div className="card">
          <p className="empty-state">No certificates yet. Complete courses to earn certificates.</p>
        </div>
      )}
    </div>
  );
}
