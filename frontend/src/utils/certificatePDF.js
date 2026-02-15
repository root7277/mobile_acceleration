import { jsPDF } from 'jspdf';

export function downloadCertificatePDF(cert) {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(15, 15, 18);
  doc.rect(0, 0, w, h, 'F');

  // Border
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(2);
  doc.rect(15, 15, w - 30, h - 30);

  // Title
  doc.setTextColor(34, 197, 94);
  doc.setFontSize(28);
  doc.text('Certificate of Completion', w / 2, 45, { align: 'center' });

  doc.setTextColor(161, 161, 170);
  doc.setFontSize(12);
  doc.text('Mobil Acceleration Courses Platform', w / 2, 55, { align: 'center' });

  doc.setTextColor(244, 244, 245);
  doc.setFontSize(14);
  doc.text('This certifies that', w / 2, 75, { align: 'center' });

  doc.setFontSize(22);
  doc.setTextColor(34, 197, 94);
  doc.text(cert.full_name || cert.user?.full_name, w / 2, 95, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(244, 244, 245);
  doc.text('has successfully completed the course', w / 2, 110, { align: 'center' });

  doc.setFontSize(18);
  doc.setTextColor(34, 197, 94);
  doc.text(cert.course_title, w / 2, 130, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(161, 161, 170);
  doc.text(`Completed on ${new Date(cert.completion_date).toLocaleDateString()}`, w / 2, 150, { align: 'center' });
  doc.text(`Certificate ID: ${cert.certificate_id}`, w / 2, 165, { align: 'center' });

  doc.save(`certificate-${cert.certificate_id}.pdf`);
}
