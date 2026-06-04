import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import SuperAdminLayout from './components/SuperAdminLayout';
import Swal from 'sweetalert2';
import '../../styles/superadmin/settings.css';

const getToken = () => sessionStorage.getItem('token');

export default function SuperAdminCertificate() {
  const [certEnabled,       setCertEnabled]       = useState(false);
  const [certToggling,      setCertToggling]       = useState(false);
  const [minSessions,       setMinSessions]        = useState(5);
  const [minSessionsModal,  setMinSessionsModal]   = useState(false);
  const [minSessionsInput,  setMinSessionsInput]   = useState(5);
  const [minSessionsSaving, setMinSessionsSaving]  = useState(false);
  const [templateUrl,       setTemplateUrl]        = useState(null);
  const [uploading,         setUploading]          = useState(false);
  const [dotOpen,           setDotOpen]            = useState(false);
  const [dotPos,            setDotPos]             = useState({ top: 0, right: 0 });
  const [previewModal,      setPreviewModal]       = useState(false);

  // Signature
  const [signature,       setSignature]       = useState(null);
  const [sigModal,        setSigModal]        = useState(false);
  const [sigTab,          setSigTab]          = useState('draw');
  const [sigSaving,       setSigSaving]       = useState(false);
  const [uploadPreview,   setUploadPreview]   = useState(null);
  const [uploadFile,      setUploadFile]      = useState(null);
  const [sigDotOpen,      setSigDotOpen]      = useState(false);

  const fileRef   = useRef(null);
  const dotRef    = useRef(null);
  const sigDotRef = useRef(null);
  const canvasRef = useRef(null);
  const drawing   = useRef(false);
  const lastPos   = useRef({ x: 0, y: 0 });

  useEffect(() => {
    fetchSettings();
    fetchProfile();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dotRef.current && !dotRef.current.contains(e.target)) setDotOpen(false);
      if (sigDotRef.current && !sigDotRef.current.contains(e.target)) setSigDotOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  async function fetchSettings() {
    try {
      const res  = await fetch('/api/superadmin/settings', { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      setCertEnabled(data.certificate_enabled ?? false);
      setMinSessions(data.min_sessions_for_cert ?? 5);
      setTemplateUrl(data.certificate_template_url ?? null);
    } catch {}
  }

  async function fetchProfile() {
    try {
      const res  = await fetch('/api/profile', { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      setSignature(data.user?.signature || null);
    } catch {}
  }

  // ── Toggle ──
  async function toggleCertEnabled() {
    setCertToggling(true);
    try {
      const res  = await fetch('/api/superadmin/settings', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificate_enabled: !certEnabled }),
      });
      const data = await res.json();
      if (res.ok) {
        setCertEnabled(data.certificate_enabled);
        Swal.fire({ icon: 'success', title: data.certificate_enabled ? 'Certificate Enabled!' : 'Certificate Disabled!', timer: 1500, showConfirmButton: false });
      }
    } catch { Swal.fire({ icon: 'error', title: 'Error', text: 'Could not connect.' }); }
    setCertToggling(false);
  }

  // ── Min sessions ──
  async function saveMinSessions() {
    const val = parseInt(minSessionsInput);
    if (!val || val < 1 || val > 100) {
      Swal.fire({ icon: 'warning', title: 'Invalid', text: 'Please enter a number between 1 and 100.' });
      return;
    }
    setMinSessionsSaving(true);
    try {
      const res  = await fetch('/api/superadmin/settings', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ min_sessions_for_cert: val }),
      });
      const data = await res.json();
      if (res.ok) {
        setMinSessions(data.min_sessions_for_cert);
        setMinSessionsModal(false);
        Swal.fire({ icon: 'success', title: 'Updated!', text: `Minimum sessions set to ${val}.`, timer: 1500, showConfirmButton: false });
      }
    } catch { Swal.fire({ icon: 'error', title: 'Error', text: 'Could not connect.' }); }
    setMinSessionsSaving(false);
  }

  // ── Template upload ──
  async function handleTemplateUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      Swal.fire({ icon: 'warning', title: 'Invalid file', text: 'Please upload a PDF file only.' });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('certificate_template', file);
      const res  = await fetch('/api/superadmin/certificate/template', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setTemplateUrl(data.certificate_template_url);
        Swal.fire({ icon: 'success', title: 'Template Uploaded!', text: 'Students and secretary can now generate certificates.', timer: 2000, showConfirmButton: false });
      } else {
        Swal.fire({ icon: 'error', title: 'Upload Failed', text: data.message || 'Could not upload template.' });
      }
    } catch { Swal.fire({ icon: 'error', title: 'Error', text: 'Could not connect.' }); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
    setDotOpen(false);
  }

  async function removeTemplate() {
    setDotOpen(false);
    const result = await Swal.fire({
      title: 'Remove Template?',
      text: 'Students will no longer see the certificate until you upload a new one.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Remove',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch('/api/superadmin/certificate/template', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setTemplateUrl(null);
        Swal.fire({ icon: 'success', title: 'Template Removed', timer: 1500, showConfirmButton: false });
      }
    } catch { Swal.fire({ icon: 'error', title: 'Error', text: 'Could not connect.' }); }
  }

  // ── Signature drawing ──
  function getPos(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }
  function startDraw(e) { e.preventDefault(); drawing.current = true; lastPos.current = getPos(canvasRef.current, e); }
  function draw(e) {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const pos    = getPos(canvas, e);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y); ctx.strokeStyle = '#1a2332';
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.stroke();
    lastPos.current = pos;
  }
  function stopDraw() { drawing.current = false; }
  function clearCanvas() { if (canvasRef.current) canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); }
  function openSigModal() { setSigTab('draw'); setUploadPreview(null); setUploadFile(null); setSigModal(true); setTimeout(() => { if (canvasRef.current) clearCanvas(); }, 100); }

  async function saveSignature() {
    setSigSaving(true);
    try {
      if (sigTab === 'draw') {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        const res = await fetch('/api/profile/signature', {
          method: 'POST',
          headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ signature_data: dataUrl }),
        });
        const data = await res.json();
        if (res.ok) { setSignature(data.signature); setSigModal(false); Swal.fire({ icon: 'success', title: 'Signature Saved!', timer: 1500, showConfirmButton: false }); }
      } else {
        if (!uploadFile) { Swal.fire({ icon: 'warning', title: 'No file selected' }); setSigSaving(false); return; }
        const formData = new FormData();
        formData.append('signature', uploadFile);
        const res = await fetch('/api/profile/signature', {
          method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: formData,
        });
        const data = await res.json();
        if (res.ok) { setSignature(data.signature); setSigModal(false); Swal.fire({ icon: 'success', title: 'Signature Uploaded!', timer: 1500, showConfirmButton: false }); }
      }
    } catch { Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to save signature.' }); }
    setSigSaving(false);
  }

  async function clearSignature() {
    const result = await Swal.fire({
      title: 'Remove Signature?', text: 'Your e-signature will be removed.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280', confirmButtonText: 'Yes, Remove',
    });
    if (!result.isConfirmed) return;
    try {
      await fetch('/api/profile/signature', {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ clear: true }),
      });
      setSignature(null);
      Swal.fire({ icon: 'success', title: 'Signature Removed', timer: 1500, showConfirmButton: false });
    } catch { Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to remove signature.' }); }
  }

  return (
    <SuperAdminLayout title="Certificate" subtitle="Manage certificate settings, template and signature">
      <div className="st-page">

        {/* ── CERTIFICATE SETTINGS CARD ── */}
        <div className="st-card">
          <div className="st-card-header">
            <div className="st-card-title">Certificate Settings</div>
            <div className="st-card-sub">Control who can generate certificates</div>
          </div>

          {/* TOGGLE */}
          <div className="st-row" style={{ cursor: 'default' }}>
            <div className="st-row-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
              </svg>
            </div>
            <div className="st-row-info">
              <div className="st-row-title">Certificate Generation</div>
              <div className="st-row-desc">
                {certEnabled
                  ? `✅ Enabled — clubs with ≥${minSessions} sessions can generate certificates`
                  : '❌ Disabled — nobody can generate certificates'}
              </div>
            </div>
            <button onClick={toggleCertEnabled} disabled={certToggling} style={{
              width: 52, height: 28, borderRadius: 99, border: 'none',
              background: certEnabled ? '#172D3D' : '#e2e8f0',
              position: 'relative', cursor: 'pointer',
              transition: 'background 0.2s', flexShrink: 0,
              opacity: certToggling ? 0.6 : 1,
            }}>
              <span style={{
                position: 'absolute', top: 3,
                left: certEnabled ? 26 : 3,
                width: 22, height: 22, borderRadius: '50%',
                background: certEnabled ? '#c9a84c' : '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                transition: 'left 0.2s',
              }}/>
            </button>
          </div>

          <div className="st-divider"/>

          {/* MIN SESSIONS */}
          <div className="st-row" onClick={() => { setMinSessionsInput(minSessions); setMinSessionsModal(true); }}>
            <div className="st-row-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <div className="st-row-info">
              <div className="st-row-title">Minimum Sessions for Certificate</div>
              <div className="st-row-desc">Club must conduct at least <strong>{minSessions}</strong> session{minSessions !== 1 ? 's' : ''} to qualify</div>
            </div>
            <span style={{ background: '#eff6ff', color: '#2563eb', fontWeight: 800, fontSize: 16, padding: '4px 14px', borderRadius: 20, border: '1.5px solid #bfdbfe', marginRight: 8 }}>{minSessions}</span>
            <svg className="st-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>

        {/* ── CERTIFICATE TEMPLATE CARD ── */}
        <div className="st-card">
          <div className="st-card-header">
            <div className="st-card-title">Certificate Template</div>
            <div className="st-card-sub">Upload the blank certificate PDF — student data will be overlaid automatically</div>
          </div>
          <div style={{ padding: '20px 24px' }}>
            {templateUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', border: '1.5px solid #bbf7d0', borderRadius: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fff', border: '1.5px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" width="22" height="22">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#15803d' }}>✅ Template uploaded successfully</div>
                  <div style={{ fontSize: 12.5, color: '#16a34a', marginTop: 3 }}>Students and secretary can now view and download their certificates</div>
                </div>
                {/* 3-dot menu */}
                <div style={{ flexShrink: 0 }} ref={dotRef}>
                  <button onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setDotPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
                    setDotOpen(o => !o);
                  }} style={{
                    width: 36, height: 36, borderRadius: '50%',
                    border: '1.5px solid #bbf7d0', background: '#fff',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a',
                  }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f1f5f9', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                </div>
                <p style={{ fontSize: 14, color: '#475569', fontWeight: 700, margin: 0 }}>No template uploaded yet</p>
                <p style={{ fontSize: 12.5, color: '#94a3b8', margin: 0, textAlign: 'center', maxWidth: 380 }}>Upload the blank certificate PDF. Student name, ID, role, dates and signatures will be placed on it automatically.</p>
                <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ padding: '10px 28px', borderRadius: 8, border: 'none', background: '#172D3D', color: '#c9a84c', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>
                  {uploading ? 'Uploading...' : '+ Upload Template PDF'}
                </button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleTemplateUpload}/>
          </div>
        </div>

        {/* ── E-SIGNATURE CARD ── */}
        <div className="st-card">
          <div className="st-card-header">
            <div className="st-card-title">E-Signature</div>
            <div className="st-card-sub">Your signature will appear on student certificates</div>
          </div>
          <div style={{ padding: '20px 24px' }}>
            {signature ? (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%' }}>
                <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 16, background: '#f8fafc', flex: 1, minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={signature} alt="signature" style={{ maxHeight: 100, maxWidth: '100%', objectFit: 'contain' }}/>
                </div>
                <div style={{ position: 'relative', flexShrink: 0 }} ref={sigDotRef}>
                  <button onClick={() => setSigDotOpen(o => !o)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                  </button>
                  {sigDotOpen && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 9999, minWidth: 160, overflow: 'hidden' }}>
                      <button onClick={() => { setSigDotOpen(false); openSigModal(); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', width: '100%', border: 'none', background: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#374151', textAlign: 'left' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        Update Signature
                      </button>
                      <button onClick={() => { setSigDotOpen(false); clearSignature(); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', width: '100%', border: 'none', background: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#ef4444', textAlign: 'left' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                        Remove Signature
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f1f5f9', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="26" height="26"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </div>
                <p style={{ fontSize: 14, color: '#475569', fontWeight: 600, margin: 0 }}>No signature yet</p>
                <p style={{ fontSize: 12.5, color: '#94a3b8', margin: 0 }}>Upload or draw your signature to use on certificates</p>
                <button onClick={openSigModal} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#172D3D', color: '#c9a84c', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>
                  + Add Signature
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── 3-DOT PORTAL DROPDOWN ── */}
      {dotOpen && createPortal(
        <div style={{ position: 'fixed', top: dotPos.top, right: dotPos.right, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', zIndex: 10001, minWidth: 180, overflow: 'hidden' }}>
          <button onClick={() => { setDotOpen(false); setPreviewModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', width: '100%', border: 'none', borderBottom: '1px solid #f1f5f9', background: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#374151', textAlign: 'left' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Preview Template
          </button>
          <button onClick={() => { setDotOpen(false); fileRef.current?.click(); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', width: '100%', border: 'none', borderBottom: '1px solid #f1f5f9', background: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#374151', textAlign: 'left' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Replace Template
          </button>
          <button onClick={removeTemplate} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', width: '100%', border: 'none', background: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#ef4444', textAlign: 'left' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
            Remove Template
          </button>
        </div>, document.body
      )}

      {/* ── PREVIEW MODAL ── */}
      {previewModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setPreviewModal(false)}>
          <div style={{ background: '#fff', borderRadius: 16, width: '90%', maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#1a2332' }}>Certificate Template Preview</span>
              <button onClick={() => setPreviewModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
              <iframe src={templateUrl} title="Template Preview" style={{ width: '100%', height: 560, border: 'none', borderRadius: 8 }}/>
            </div>
          </div>
        </div>, document.body
      )}

      {/* ── MIN SESSIONS MODAL ── */}
      {minSessionsModal && createPortal(
        <div className="st-modal-backdrop" onClick={() => setMinSessionsModal(false)}>
          <div className="st-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="st-modal-header">
              <span className="st-modal-title">Minimum Sessions for Certificate</span>
              <button className="st-modal-close" onClick={() => setMinSessionsModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="st-modal-body">
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.6 }}>
                Clubs must conduct at least this many sessions before certificates can be generated.
              </p>
              <div className="st-form-group">
                <label className="st-form-label">Minimum Sessions <span style={{ color: '#ef4444' }}>*</span></label>
                <input className="st-form-input" type="number" min={1} max={100} value={minSessionsInput}
                  onChange={e => setMinSessionsInput(e.target.value)}
                  style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', height: 52 }}/>
                <span style={{ fontSize: 12, color: '#5a78a1' }}>Enter a value between 1 and 100</span>
              </div>
              <div className="st-modal-footer">
                <button className="st-btn-cancel" onClick={() => setMinSessionsModal(false)}>Cancel</button>
                <button className="st-btn-save" onClick={saveMinSessions} disabled={minSessionsSaving}>
                  {minSessionsSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>, document.body
      )}

      {/* ── SIGNATURE MODAL ── */}
      {sigModal && createPortal(
        <div className="st-modal-backdrop" onClick={() => setSigModal(false)}>
          <div className="st-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="st-modal-header">
              <span className="st-modal-title">E-Signature</span>
              <button className="st-modal-close" onClick={() => setSigModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="st-modal-body">
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {['draw', 'upload'].map(tab => (
                  <button key={tab} onClick={() => setSigTab(tab)} style={{
                    flex: 1, padding: '9px 0', borderRadius: 8,
                    border: sigTab === tab ? 'none' : '1.5px solid #e2e8f0',
                    background: sigTab === tab ? '#172D3D' : '#fff',
                    color: sigTab === tab ? '#c9a84c' : '#374151',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    {tab === 'draw' ? '✏️ Draw Signature' : '📁 Upload Image'}
                  </button>
                ))}
              </div>
              {sigTab === 'draw' && (
                <div>
                  <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 8 }}>Draw your signature below using your mouse or finger:</p>
                  <canvas ref={canvasRef} width={440} height={160}
                    style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'crosshair', touchAction: 'none', width: '100%' }}
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                    onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
                  />
                  <button onClick={clearCanvas} style={{ marginTop: 8, padding: '6px 14px', borderRadius: 7, border: '1.5px solid #e2e8f0', background: '#f1f5f9', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>
                    Clear
                  </button>
                </div>
              )}
              {sigTab === 'upload' && (
                <div>
                  <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 8 }}>Upload a clear signature image on white background (PNG/JPG):</p>
                  <input type="file" accept="image/*" onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      setUploadFile(file);
                      const reader = new FileReader();
                      reader.onload = ev => setUploadPreview(ev.target.result);
                      reader.readAsDataURL(file);
                    }
                  }} style={{ marginBottom: 12 }}/>
                  {uploadPreview && (
                    <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: 12, background: '#f8fafc', textAlign: 'center' }}>
                      <img src={uploadPreview} alt="preview" style={{ maxHeight: 100, maxWidth: '100%', objectFit: 'contain' }}/>
                    </div>
                  )}
                </div>
              )}
              <div className="st-modal-footer" style={{ marginTop: 16 }}>
                <button className="st-btn-cancel" onClick={() => setSigModal(false)}>Cancel</button>
                <button className="st-btn-save" onClick={saveSignature} disabled={sigSaving}>
                  {sigSaving ? 'Saving...' : 'Save Signature'}
                </button>
              </div>
            </div>
          </div>
        </div>, document.body
      )}

    </SuperAdminLayout>
  );
}