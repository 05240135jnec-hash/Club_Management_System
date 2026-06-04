import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import AdvisorLayout from './components/AdvisorLayout';
import '../../styles/advisor/enrollmentkey.css';

export default function AdvisorEnrollmentKey() {
  const [keyData, setKeyData]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [keyInput, setKeyInput] = useState('');
  const [maxInput, setMaxInput] = useState('');
  const [saving, setSaving]     = useState(false);
  const [copied, setCopied]     = useState(false);
  const [toast, setToast]       = useState({ show: false, msg: '', type: 'success' });
  const [keyError, setKeyError] = useState('');
  const [maxError, setMaxError] = useState('');

  // 3-dot menu
  const [menuOpen, setMenuOpen]     = useState(false);
  const [editOpen, setEditOpen]     = useState(false);
  const [editKey, setEditKey]       = useState('');
  const [editMax, setEditMax]       = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [actioning, setActioning]   = useState(false);
  const menuRef = useRef();

  const token = () => sessionStorage.getItem('token');
  const headers = () => ({ Authorization: `Bearer ${token()}` });

  useEffect(() => { fetchKey(); }, []);

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── FETCH ──────────────────────────────────────────────────
  const fetchKey = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/clubs/enrollment-key', { headers: headers() });
      setKeyData(res.data);
    } catch { setKeyData(null); }
    finally  { setLoading(false); }
  };

  // ── CREATE KEY ─────────────────────────────────────────────
  const handleCreateKey = async () => {
    let valid = true;
    setKeyError(''); setMaxError('');
    if (!keyInput.trim())                    { setKeyError('Please enter an enrollment key.'); valid = false; }
    if (!maxInput || parseInt(maxInput) < 1) { setMaxError('Please enter a valid maximum members number.'); valid = false; }
    if (!valid) return;
    setSaving(true);
    try {
      await axios.put('/api/clubs/enrollment-key', {
        enrollment_key: keyInput.trim(),
        max_members:    parseInt(maxInput),
      }, { headers: headers() });
      setKeyInput(''); setMaxInput('');
      await fetchKey();
      showToast('Enrollment key created successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create key.', 'error');
    } finally { setSaving(false); }
  };

  // ── OPEN EDIT MODAL ────────────────────────────────────────
  const openEdit = () => {
    setEditKey(keyData?.enrollment_key || '');
    setEditMax(String(keyData?.max_members || ''));
    setMenuOpen(false);
    // small delay so menu closes before modal renders
    setTimeout(() => setEditOpen(true), 50);
  };

  // ── SAVE EDIT ──────────────────────────────────────────────
  const handleEditSave = async () => {
    if (!editKey.trim())                    { showToast('Please enter an enrollment key.', 'error'); return; }
    if (!editMax || parseInt(editMax) < 1)  { showToast('Please enter a valid max members number.', 'error'); return; }
    setEditSaving(true);
    try {
      await axios.put('/api/clubs/enrollment-key', {
        enrollment_key: editKey.trim(),
        max_members:    parseInt(editMax),
      }, { headers: headers() });
      await fetchKey();
      setEditOpen(false);
      showToast('Enrollment key updated successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update key.', 'error');
    } finally { setEditSaving(false); }
  };

  // ── GENERATE RANDOM KEY ────────────────────────────────────
  // DELETE /clubs/enrollment-key calls revoke() which auto-generates a random key
  const handleGenerate = async () => {
    setMenuOpen(false);
    const result = await Swal.fire({
      title: 'Generate New Key?',
      text: 'A random key will be auto-generated and used to join the club.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#172D3D',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Generate',
    });
    if (!result.isConfirmed) return;
    setActioning(true);
    try {
      // POST to generate a new random key (keeps max_members intact)
      await axios.post('/api/clubs/enrollment-key/generate', {}, { headers: headers() });
      await fetchKey();
      showToast('New enrollment key generated!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to generate key.', 'error');
    } finally { setActioning(false); }
  };

  // ── REVOKE KEY ─────────────────────────────────────────────
  // Note: DELETE revoke() in backend actually generates a new random key
  // To fully "remove" the key we update it to empty — but since backend requires a key,
  // we just inform the user and let them know revoke = regenerate
  const handleRevoke = async () => {
    setMenuOpen(false);
    const result = await Swal.fire({
      title: 'Revoke Enrollment Key?',
      text: 'The current key will be replaced with a new random key. Students cannot join until you share the new key.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Revoke',
    });
    if (!result.isConfirmed) return;
    setActioning(true);
    try {
      await axios.delete('/api/clubs/enrollment-key', { headers: headers() });
      // ✅ Don't show the new auto-generated key — treat as "no active key"
      setKeyData(null);
      showToast('Enrollment key revoked successfully.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to revoke key.', 'error');
    } finally { setActioning(false); }
  };

  // ── COPY ───────────────────────────────────────────────────
  const handleCopy = () => {
    if (!keyData?.enrollment_key) return;
    navigator.clipboard.writeText(keyData.enrollment_key).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = keyData.enrollment_key;
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
  };

  const hasActiveKey = keyData && keyData.enrollment_key;

  return (
    <AdvisorLayout title="Enrollment Key" subtitle="Manage club enrollment keys">

      {/* ── Card 1: Create Key ── */}
      <div className="ek-card">
        <div className="ek-card-header">
          <h2 className="ek-card-title">Create Enrollment Key</h2>
          <p className="ek-card-desc">
            Type your own key that students will use to join the club. Set a maximum member limit so the key stops working once full.
          </p>
        </div>

        <div className="ek-form-row">
          <div className="ek-form-group">
            <label className="ek-form-label">Enrollment Key</label>
            <div className="ek-input-wrap">
              <input
                className={`ek-input ${keyError ? 'ek-input-error' : ''}`}
                type="text" value={keyInput}
                onChange={e => { setKeyInput(e.target.value); setKeyError(''); }}
                placeholder="e.g. CLUB2025"
              />
              <svg className="ek-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            {keyError ? <span className="ek-error">{keyError}</span> : <span className="ek-hint">Type any key — share this with new students to join</span>}
          </div>

          <div className="ek-form-group">
            <label className="ek-form-label">Maximum Members</label>
            <input
              className={`ek-input ${maxError ? 'ek-input-error' : ''}`}
              type="number" min="1" value={maxInput}
              onChange={e => { setMaxInput(e.target.value); setMaxError(''); }}
              placeholder="e.g. 50"
            />
            {maxError ? <span className="ek-error">{maxError}</span> : <span className="ek-hint">Key stops working once this limit is reached</span>}
          </div>
        </div>

        <div className="ek-form-footer">
          <button className="ek-btn-create" onClick={handleCreateKey} disabled={saving}>
            {saving ? 'Creating...' : 'Create Key'}
          </button>
        </div>
      </div>

      {/* ── Card 2: Active Key ── */}
      <div className="ek-card">
        <div className="ek-card-header" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
          <h2 className="ek-card-title">Active Key</h2>

          {/* ✅ 3-DOT MENU */}
          {hasActiveKey && (
            <div ref={menuRef} style={{ position:'relative' }}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                style={{
                  width:34, height:34, borderRadius:'50%', border:'none',
                  background: menuOpen ? '#f0f2f5' : 'transparent',
                  cursor:'pointer', display:'flex', alignItems:'center',
                  justifyContent:'center', color:'#6b7280', transition:'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background='#f0f2f5'}
                onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.background='transparent'; }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                </svg>
              </button>

              {menuOpen && (
                <div style={{
                  position:'absolute', top:'calc(100% + 6px)', right:0,
                  background:'#fff', borderRadius:12, minWidth:190,
                  boxShadow:'0 8px 28px rgba(0,0,0,0.13), 0 0 0 1px rgba(0,0,0,0.06)',
                  zIndex:999, overflow:'hidden',
                  animation:'ekMenuIn 0.18s cubic-bezier(0.34,1.36,0.64,1)',
                }}>

                  {/* Edit */}
                  <button onClick={openEdit} style={{
                    display:'flex', alignItems:'center', gap:12, padding:'11px 16px',
                    width:'100%', border:'none', background:'none', cursor:'pointer',
                    fontSize:13.5, fontWeight:600, color:'#1a1a2e', fontFamily:'inherit',
                    transition:'background 0.13s', textAlign:'left', borderBottom:'1px solid #f0f2f5',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='#f7f8fc'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}>
                    <div style={{ width:30, height:30, borderRadius:8, background:'#eef1fd', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#2d5be3" strokeWidth="2" width="14" height="14" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </div>
                    Edit Key & Limit
                  </button>

                  {/* Generate */}
                  <button onClick={handleGenerate} disabled={actioning} style={{
                    display:'flex', alignItems:'center', gap:12, padding:'11px 16px',
                    width:'100%', border:'none', background:'none', cursor:'pointer',
                    fontSize:13.5, fontWeight:600, color:'#1a1a2e', fontFamily:'inherit',
                    transition:'background 0.13s', textAlign:'left', borderBottom:'1px solid #f0f2f5',
                    opacity: actioning ? 0.6 : 1,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='#f7f8fc'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}>
                    <div style={{ width:30, height:30, borderRadius:8, background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" width="14" height="14" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10"/>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                      </svg>
                    </div>
                    Generate Random Key
                  </button>

                  {/* Revoke */}
                  <button onClick={handleRevoke} disabled={actioning} style={{
                    display:'flex', alignItems:'center', gap:12, padding:'11px 16px',
                    width:'100%', border:'none', background:'none', cursor:'pointer',
                    fontSize:13.5, fontWeight:600, color:'#dc2626', fontFamily:'inherit',
                    transition:'background 0.13s', textAlign:'left',
                    opacity: actioning ? 0.6 : 1,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='#fef2f2'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}>
                    <div style={{ width:30, height:30, borderRadius:8, background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" width="14" height="14" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                      </svg>
                    </div>
                    Revoke Key
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="ek-no-key">Loading...</div>
        ) : !hasActiveKey ? (
          <div className="ek-no-key">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="38" height="38">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
            </svg>
            <p>No active enrollment key. Create one above.</p>
          </div>
        ) : (
          <div className="ek-active-box">
            <div className="ek-key-label">CURRENT ENROLLMENT KEY</div>
            <div className="ek-key-display">{keyData.enrollment_key}</div>
            <div className="ek-key-actions">
              <button className={`ek-btn-copy ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                {copied ? (
                  <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>Copied!</>
                ) : (
                  <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy Key</>
                )}
              </button>
            </div>
            <div className="ek-key-stats">
              <div className="ek-stat">
                <div className="ek-stat-value">{keyData.joined ?? 0}</div>
                <div className="ek-stat-label">JOINED</div>
              </div>
              <div className="ek-stat-divider"/>
              <div className="ek-stat">
                <div className="ek-stat-value">{keyData.max_members ?? '—'}</div>
                <div className="ek-stat-label">MAX</div>
              </div>
              <div className="ek-stat-divider"/>
              <div className="ek-stat">
                <div className="ek-stat-value">{keyData.slots_left ?? '—'}</div>
                <div className="ek-stat-label">SLOTS LEFT</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Toast ── */}
      {toast.show && (
        <div className={`ek-toast ${toast.type}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {toast.type === 'success' ? <polyline points="20 6 9 17 4 12"/> : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
          </svg>
          {toast.msg}
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editOpen && (
        <div style={{
          position:'fixed', inset:0, zIndex:9999,
          background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)',
          display:'flex', alignItems:'center', justifyContent:'center', padding:20,
        }} onClick={() => setEditOpen(false)}>
          <div style={{
            background:'#fff', borderRadius:20, width:'min(440px,95vw)',
            boxShadow:'0 24px 64px rgba(0,0,0,0.22)', overflow:'hidden',
          }} onClick={e => e.stopPropagation()}>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 14px', borderBottom:'1px solid #f0f2f5' }}>
              <span style={{ fontSize:15, fontWeight:700, color:'#1a1a2e' }}>Edit Enrollment Key</span>
              <button onClick={() => setEditOpen(false)} style={{ width:32, height:32, borderRadius:'50%', border:'none', background:'#f0f2f5', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#4a5568' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div style={{ padding:'24px 24px 28px', display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:12.5, fontWeight:600, color:'#2d3748' }}>Enrollment Key <span style={{color:'#e53e3e'}}>*</span></label>
                <input
                  style={{ padding:'10px 14px', fontSize:13.5, fontFamily:'inherit', color:'#1a1a2e', background:'#f7f8fc', border:'1.5px solid #e0e4f0', borderRadius:8, outline:'none', width:'100%', boxSizing:'border-box' }}
                  type="text" value={editKey}
                  onChange={e => setEditKey(e.target.value)}
                  onFocus={e => { e.target.style.borderColor='#2d5be3'; e.target.style.background='#fff'; }}
                  onBlur={e => { e.target.style.borderColor='#e0e4f0'; e.target.style.background='#f7f8fc'; }}
                  autoFocus
                />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:12.5, fontWeight:600, color:'#2d3748' }}>Maximum Members <span style={{color:'#e53e3e'}}>*</span></label>
                <input
                  style={{ padding:'10px 14px', fontSize:13.5, fontFamily:'inherit', color:'#1a1a2e', background:'#f7f8fc', border:'1.5px solid #e0e4f0', borderRadius:8, outline:'none', width:'100%', boxSizing:'border-box' }}
                  type="number" min="1" value={editMax}
                  onChange={e => setEditMax(e.target.value)}
                  onFocus={e => { e.target.style.borderColor='#2d5be3'; e.target.style.background='#fff'; }}
                  onBlur={e => { e.target.style.borderColor='#e0e4f0'; e.target.style.background='#f7f8fc'; }}
                />
              </div>
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button onClick={() => setEditOpen(false)} style={{ flex:1, padding:'10px 16px', fontSize:13, fontWeight:600, fontFamily:'inherit', background:'#f0f2f5', color:'#4a5568', border:'none', borderRadius:9, cursor:'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleEditSave} disabled={editSaving} style={{ flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'10px 16px', fontSize:13, fontWeight:700, fontFamily:'inherit', background:'#172D3D', color:'#c9a84c', border:'none', borderRadius:9, cursor:'pointer', opacity:editSaving?0.7:1 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ekMenuIn {
          from { opacity:0; transform:translateY(-6px) scale(0.96); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
      `}</style>

    </AdvisorLayout>
  );
}