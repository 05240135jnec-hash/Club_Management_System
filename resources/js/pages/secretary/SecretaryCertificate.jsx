import React, { useState, useEffect, useRef } from 'react';
import SecretaryLayout from './components/SecretaryLayout';

const getToken = () => sessionStorage.getItem('token');

export default function SecretaryCertificate() {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [showReqs, setShowReqs]       = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [certCanvas, setCertCanvas]   = useState(null);
  const [rendering, setRendering]     = useState(false);
  const reqRef = useRef(null);

  useEffect(() => {
    fetch('/api/certificate/secretary', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = (e) => { if (reqRef.current && !reqRef.current.contains(e.target)) setShowReqs(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (data?.certificate_template_url) {
      renderCertificate(data);
    }
  }, [data]);

  const fixUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('data:')) return url;
    try {
      const u = new URL(url);
      u.host = window.location.host;
      u.protocol = window.location.protocol;
      return u.toString();
    } catch { return url; }
  };

  async function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      if (src && src.startsWith('http')) img.crossOrigin = 'anonymous';
      img.onload  = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  async function loadPdfJs() {
    if (!window.pdfjsLib) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        s.onload = res; s.onerror = rej; document.head.appendChild(s);
      });
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    if (!window.jspdf) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload = res; s.onerror = rej; document.head.appendChild(s);
      });
    }
  }

  async function drawSignatures(ctx, W, H, certData) {
    const sigWidth  = W * 0.20;
    const sigHeight = H * 0.08;
    if (certData.advisor_signature) {
      const img = await loadImage(fixUrl(certData.advisor_signature));
      if (img) {
        ctx.drawImage(img, W * 0.070, H * 0.860 - sigHeight, sigWidth, sigHeight);
      }
    }
    if (certData.super_admin_signature) {
      const img2 = await loadImage(fixUrl(certData.super_admin_signature));
      if (img2) {
        ctx.drawImage(img2, W * 0.660, H * 0.860 - sigHeight, sigWidth, sigHeight);
      }
    }
  }

  async function renderCertificate(certData) {
    setRendering(true);
    try {
      await loadPdfJs();
      const pdf      = await window.pdfjsLib.getDocument(fixUrl(certData.certificate_template_url)).promise;
      const page     = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2 });
      const canvas   = document.createElement('canvas');
      canvas.width   = viewport.width;
      canvas.height  = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      const W = canvas.width;
      const H = canvas.height;
      overlayData(ctx, W, H, certData);
      await drawSignatures(ctx, W, H, certData);
      setCertCanvas(canvas.toDataURL('image/jpeg', 0.98));
    } catch (err) {
      console.error('Render error:', err);
    }
    setRendering(false);
  }

  function overlayData(ctx, W, H, certData) {
    ctx.fillStyle    = '#1a3a6b';
    ctx.textBaseline = 'middle';
    const fs = Math.round(W * 0.016);
    ctx.font = `bold ${fs}px Arial`;
    ctx.fillText(certData.student_name, W * 0.300, H * 0.505);
    ctx.fillText(certData.student_id,   W * 0.720, H * 0.505);
    ctx.fillText(certData.role_label,   W * 0.400, H * 0.635);
    ctx.fillText(certData.from,         W * 0.395, H * 0.710);
    ctx.fillText(certData.to,           W * 0.565, H * 0.710);
  }

  async function handleDownload() {
    if (!data?.certificate_template_url) return;
    setDownloading(true);
    try {
      await loadPdfJs();
      const pdf      = await window.pdfjsLib.getDocument(fixUrl(data.certificate_template_url)).promise;
      const page     = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2 });
      const canvas   = document.createElement('canvas');
      canvas.width   = viewport.width;
      canvas.height  = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      const W = canvas.width;
      const H = canvas.height;
      overlayData(ctx, W, H, data);
      await drawSignatures(ctx, W, H, data);
      const { jsPDF } = window.jspdf;
      const outPdf = new jsPDF({ orientation: W > H ? 'landscape' : 'portrait', unit: 'px', format: [W, H] });
      outPdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, W, H);
      outPdf.save(`certificate_${data.student_name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF. Please try again.');
    }
    setDownloading(false);
  }

  if (loading) return (
    <SecretaryLayout title="Certificate" subtitle="Generate your secretary certificate">
      <div style={{ textAlign: 'center', padding: 80, color: '#64748b' }}>Loading...</div>
    </SecretaryLayout>
  );

  const eligible    = data?.eligible;
  const templateUrl = data?.certificate_template_url;

  const requirements = data ? [
    { label: 'Certificate generation enabled by admin',                                                                  met: data.cert_enabled },
    { label: `Club conducted ≥${data.min_sessions ?? 5} sessions (currently ${data.total_sessions ?? 0})`,             met: data.club_has_enough_sessions },
    { label: 'Advisor e-signature uploaded',                                                                             met: data.has_advisor_sig },
    { label: 'Dean e-signature uploaded',                                                                                met: data.has_super_admin_sig },
  ] : [];

  return (
    <SecretaryLayout title="Certificate" subtitle="Generate your secretary certificate">
      <div style={{ maxWidth: '100%' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a2332', margin: 0 }}>Your Certificate</h2>
            <p style={{ fontSize: 13, color: eligible ? '#15803d' : '#64748b', margin: '4px 0 0', fontWeight: 500 }}>
              {eligible ? '✅ All requirements met — ready to download!' : 'Complete requirements to unlock download'}
            </p>
          </div>

          <div style={{ position: 'relative' }} ref={reqRef}>
            <button onClick={() => setShowReqs(o => !o)} title="View Requirements" style={{
              width: 38, height: 38, borderRadius: '50%',
              border: '1.5px solid #e2e8f0', background: '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b',
            }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>

            {showReqs && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: '#fff', border: '1.5px solid #e2e8f0',
                borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                zIndex: 999, minWidth: 320, padding: '16px 18px',
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Certificate Requirements
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {requirements.map((r, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', borderRadius: 8,
                      background: r.met ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${r.met ? '#bbf7d0' : '#fecaca'}`,
                    }}>
                      {r.met
                        ? <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2.5" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      }
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: r.met ? '#15803d' : '#b91c1c' }}>{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {!templateUrl ? (
          <div style={{
            background: '#fff', borderRadius: 16, border: '1.5px solid #e2e8f0',
            padding: '72px 24px', textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f1f5f9', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', margin: '0 auto 20px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
                <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a2332', margin: '0 0 10px' }}>Certificate Not Available Yet</h3>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0, maxWidth: 420, marginInline: 'auto', lineHeight: 1.7 }}>
              The admin has not uploaded the certificate template yet. Please check back later.
            </p>
          </div>
        ) : (
          <div>
            <div style={{
              background: '#f1f5f9', borderRadius: 16,
              padding: '28px',
              border: '1.5px solid #dde3ea',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {rendering ? (
                <div style={{ padding: 60, color: '#64748b', fontSize: 14 }}>Rendering certificate...</div>
              ) : certCanvas ? (
                <img src={certCanvas} alt="Certificate Preview"
                  style={{ width: '90%', borderRadius: 8, display: 'block', boxShadow: '0 2px 16px rgba(0,0,0,0.1)' }}
                />
              ) : (
                <div style={{ padding: 60, color: '#64748b', fontSize: 14 }}>Loading certificate...</div>
              )}
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#fff', borderRadius: 14, border: '1.5px solid #e2e8f0',
              padding: '16px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: eligible ? '#15803d' : '#64748b' }}>
                  {eligible ? '🎓 Your certificate is ready to download' : '🔒 Requirements not met yet'}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {eligible ? 'Your name, ID, role and signatures will be in the PDF' : 'Click ⋮ above to see what you need'}
                </div>
              </div>
              <button
                onClick={eligible ? handleDownload : undefined}
                disabled={!eligible || downloading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: eligible ? '#172D3D' : '#e2e8f0',
                  color: eligible ? '#c9a84c' : '#94a3b8',
                  border: 'none', borderRadius: 10,
                  padding: '12px 28px', fontSize: 14, fontWeight: 700,
                  cursor: eligible && !downloading ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit', flexShrink: 0,
                  opacity: downloading ? 0.7 : 1,
                  transition: 'all 0.15s',
                }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                {downloading ? 'Generating PDF...' : eligible ? 'Download Certificate' : 'Locked'}
              </button>
            </div>
          </div>
        )}
      </div>
    </SecretaryLayout>
  );
}