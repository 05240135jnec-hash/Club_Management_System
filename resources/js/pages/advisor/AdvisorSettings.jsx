import { useState, useEffect, useRef } from 'react';
import AdvisorLayout from './components/AdvisorLayout';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';

function EyeIcon({ open }) {
  return open
    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}

function MsgBox({ msg }) {
  if (!msg?.text) return null;
  return (
    <div style={{ fontSize:12.5, fontWeight:600, padding:'8px 12px', borderRadius:8,
      background: msg.type==='success'?'#d1fae5':'#fef2f2',
      color:      msg.type==='success'?'#065f46':'#b91c1c',
      border:     `1px solid ${msg.type==='success'?'#6ee7b7':'#fca5a5'}`,
    }}>{msg.text}</div>
  );
}

export default function AdvisorSettings() {
  const userRole    = (() => { try { return JSON.parse(sessionStorage.getItem('user')||'{}').role||'advisor'; } catch { return 'advisor'; } })();
  const isCoAdvisor = userRole === 'co_advisor';
  const token       = () => sessionStorage.getItem('token');

  // ── Password ──
  const [pwdOpen, setPwdOpen]     = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg]       = useState({ text:'', type:'' });
  const [showPwd, setShowPwd]     = useState({ current:false, new:false, confirm:false });
  const [pwdForm, setPwdForm]     = useState({ current_password:'', new_password:'', new_password_confirmation:'' });

  // ── E-Signature ──
  const [signature, setSignature]         = useState(null);
  const [sigModal, setSigModal]           = useState(false);
  const [sigTab, setSigTab]               = useState('draw');
  const [sigSaving, setSigSaving]         = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadFile, setUploadFile]       = useState(null);
  const [sigDotOpen, setSigDotOpen]       = useState(false);
  const canvasRef = useRef(null);
  const sigDotRef = useRef(null);
  const drawing   = useRef(false);
  const lastPos   = useRef({ x: 0, y: 0 });

  // ── Appoint New Advisor ──
  const [appointOpen, setAppointOpen]             = useState(false);
  const [appointLoading, setAppointLoading]       = useState(false);
  const [appointCoAdvisors, setAppointCoAdvisors] = useState([]);
  const [appointSelected, setAppointSelected]     = useState(null);
  const [appointMsg, setAppointMsg]               = useState({ text:'', type:'' });
  const [appointStep, setAppointStep]             = useState(1);

  useEffect(() => {
    async function fetchSig() {
      try {
        const res  = await fetch('/api/profile', { headers:{ Authorization:`Bearer ${token()}` } });
        const data = await res.json();
        setSignature(data.user?.signature || null);
      } catch {}
    }
    fetchSig();
    const handler = (e) => {
      if (sigDotRef.current && !sigDotRef.current.contains(e.target)) setSigDotOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Canvas drawing ──
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
    const ctx = canvas.getContext('2d');
    const pos = getPos(canvas, e);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y); ctx.strokeStyle = '#1a2332';
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.stroke();
    lastPos.current = pos;
  }
  function stopDraw() { drawing.current = false; }
  function clearCanvas() { if (canvasRef.current) canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); }

  function openSigModal() {
    setSigTab('draw'); setUploadPreview(null); setUploadFile(null); setSigModal(true);
    setTimeout(() => { if (canvasRef.current) clearCanvas(); }, 100);
  }

  async function saveSignature() {
    setSigSaving(true);
    try {
      if (sigTab === 'draw') {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        const res = await fetch('/api/profile/signature', {
          method: 'POST', headers: { Authorization:`Bearer ${token()}`, 'Content-Type':'application/json' },
          body: JSON.stringify({ signature_data: dataUrl }),
        });
        const data = await res.json();
        if (res.ok) { setSignature(data.signature); setSigModal(false); Swal.fire({ icon:'success', title:'Signature Saved!', timer:1500, showConfirmButton:false }); }
      } else {
        if (!uploadFile) { Swal.fire({ icon:'warning', title:'No file selected' }); setSigSaving(false); return; }
        const formData = new FormData();
        formData.append('signature', uploadFile);
        const res = await fetch('/api/profile/signature', { method:'POST', headers:{ Authorization:`Bearer ${token()}` }, body:formData });
        const data = await res.json();
        if (res.ok) { setSignature(data.signature); setSigModal(false); Swal.fire({ icon:'success', title:'Signature Uploaded!', timer:1500, showConfirmButton:false }); }
      }
    } catch { Swal.fire({ icon:'error', title:'Error', text:'Failed to save signature.' }); }
    setSigSaving(false);
  }

  async function clearSignature() {
    const result = await Swal.fire({ title:'Remove Signature?', icon:'warning', showCancelButton:true, confirmButtonColor:'#ef4444', confirmButtonText:'Yes, Remove' });
    if (!result.isConfirmed) return;
    await fetch('/api/profile/signature', { method:'POST', headers:{ Authorization:`Bearer ${token()}`, 'Content-Type':'application/json' }, body:JSON.stringify({ clear:true }) });
    setSignature(null);
    Swal.fire({ icon:'success', title:'Signature Removed', timer:1500, showConfirmButton:false });
  }

  function openPwd() {
    setPwdForm({ current_password:'', new_password:'', new_password_confirmation:'' });
    setPwdMsg({ text:'', type:'' });
    setShowPwd({ current:false, new:false, confirm:false });
    setPwdOpen(true);
  }

  async function savePwd() {
    if (!pwdForm.current_password)                                 { setPwdMsg({text:'Enter your current password.',type:'error'}); return; }
    if (pwdForm.new_password.length < 8)                           { setPwdMsg({text:'New password must be at least 8 characters.',type:'error'}); return; }
    if (pwdForm.new_password !== pwdForm.new_password_confirmation) { setPwdMsg({text:'Passwords do not match.',type:'error'}); return; }
    setPwdSaving(true); setPwdMsg({text:'',type:''});
    try {
      const res  = await fetch('/api/profile/password', { method:'PUT', headers:{ Authorization:`Bearer ${token()}`, 'Content-Type':'application/json' }, body:JSON.stringify(pwdForm) });
      const data = await res.json();
      if (!res.ok) { setPwdMsg({text:data.message||'Failed.',type:'error'}); return; }
      setPwdMsg({text:'Password changed successfully!',type:'success'});
      setTimeout(() => { setPwdOpen(false); }, 1500);
    } catch { setPwdMsg({text:'Could not connect.',type:'error'}); }
    finally { setPwdSaving(false); }
  }

  async function openAppoint() {
    setAppointStep(1); setAppointSelected(null); setAppointMsg({text:'',type:''});
    setAppointLoading(true); setAppointOpen(true);
    try {
      const res  = await fetch('/api/club/co-advisors', { headers:{ Authorization:`Bearer ${token()}` } });
      const data = await res.json();
      setAppointCoAdvisors(data.co_advisors || []);
    } catch { setAppointMsg({text:'Failed to load co-advisors.',type:'error'}); }
    finally { setAppointLoading(false); }
  }

  async function confirmAppoint() {
    if (!appointSelected) return;
    setAppointLoading(true); setAppointMsg({text:'',type:''});
    try {
      const res  = await fetch('/api/club/appoint-advisor', { method:'POST', headers:{ Authorization:`Bearer ${token()}`, 'Content-Type':'application/json' }, body:JSON.stringify({ co_advisor_user_id: appointSelected.user_id }) });
      const data = await res.json();
      if (!res.ok) { setAppointMsg({text:data.message,type:'error'}); return; }
      sessionStorage.clear(); window.location.href = '/login';
    } catch { setAppointMsg({text:'Something went wrong.',type:'error'}); }
    finally { setAppointLoading(false); }
  }

  return (
    <AdvisorLayout title="Settings" subtitle="Application settings">
      <div>

        {/* ── HEADER CARD ── */}
        <div style={{ background:'#fff', borderRadius:16, padding:'28px 32px', marginBottom:20, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize:20, fontWeight:800, color:'#1a1a2e', marginBottom:4 }}>Account Settings</div>
          <div style={{ fontSize:13, color:'#8892a4' }}>Manage your profile and security</div>
        </div>

        {/* ── CHANGE PASSWORD CARD ── */}
        <div onClick={openPwd} style={{ background:'#fff', borderRadius:16, padding:'22px 24px', marginBottom:12, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', display:'flex', alignItems:'center', gap:18, cursor:'pointer', border:'1.5px solid transparent', transition:'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 16px rgba(45,91,227,0.12)'; e.currentTarget.style.borderColor='#d0d9f7'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.07)'; e.currentTarget.style.borderColor='transparent'; }}>
          <div style={{ width:48, height:48, borderRadius:12, background:'#eef1fd', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#2d5be3" strokeWidth="2" width="22" height="22" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#1a1a2e', marginBottom:3 }}>Change Password</div>
            <div style={{ fontSize:12.5, color:'#8892a4' }}>Update your account password</div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="#b0bac8" strokeWidth="2" width="18" height="18" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>

        {/* ── APPOINT ADVISOR CARD ── */}
        {!isCoAdvisor && (
          <div onClick={openAppoint} style={{ background:'#fff', borderRadius:16, padding:'22px 24px', marginBottom:12, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', display:'flex', alignItems:'center', gap:18, cursor:'pointer', border:'1.5px solid transparent', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 16px rgba(217,119,6,0.12)'; e.currentTarget.style.borderColor='#fde68a'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.07)'; e.currentTarget.style.borderColor='transparent'; }}>
            <div style={{ width:48, height:48, borderRadius:12, background:'#fffbeb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" width="22" height="22" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:700, color:'#1a1a2e', marginBottom:3 }}>Appoint New Advisor</div>
              <div style={{ fontSize:12.5, color:'#8892a4' }}>Make a co-advisor the main advisor</div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="#b0bac8" strokeWidth="2" width="18" height="18" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        )}

        {/* ── E-SIGNATURE CARD ── */}
        <div style={{ background:'#fff', borderRadius:16, padding:'22px 24px', marginBottom:12, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', border:'1.5px solid transparent' }}>
          <div style={{ fontSize:15, fontWeight:700, color:'#1a1a2e', marginBottom:4 }}>E-Signature</div>
          <div style={{ fontSize:12.5, color:'#8892a4', marginBottom:16 }}>Your signature will appear on student certificates</div>
          {signature ? (
            <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <div style={{ border:'1.5px solid #e2e8f0', borderRadius:12, padding:16, background:'#f8fafc', flex:1, minHeight:80, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <img src={signature} alt="signature" style={{ maxHeight:80, maxWidth:'100%', objectFit:'contain' }}/>
              </div>
              <div style={{ position:'relative', flexShrink:0 }} ref={sigDotRef}>
                <button onClick={() => setSigDotOpen(o => !o)} style={{ width:32, height:32, borderRadius:'50%', border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                </button>
                {sigDotOpen && (
                  <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', zIndex:9999, minWidth:160, overflow:'hidden' }}>
                    <button onClick={() => { setSigDotOpen(false); openSigModal(); }} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', width:'100%', border:'none', background:'none', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', color:'#374151', textAlign:'left' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      Update Signature
                    </button>
                    <button onClick={() => { setSigDotOpen(false); clearSignature(); }} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', width:'100%', border:'none', background:'none', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', color:'#ef4444', textAlign:'left' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                      Remove Signature
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, padding:'16px 0' }}>
              <div style={{ width:52, height:52, borderRadius:'50%', background:'#f1f5f9', border:'2px dashed #cbd5e1', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
              <p style={{ fontSize:13.5, color:'#475569', fontWeight:600, margin:0 }}>No signature yet</p>
              <button onClick={openSigModal} style={{ padding:'9px 22px', borderRadius:8, border:'none', background:'#172D3D', color:'#c9a84c', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', marginTop:4 }}>
                + Add Signature
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ══ PASSWORD MODAL ══ */}
      {pwdOpen && createPortal(
        <div className="al-modal-backdrop" onClick={() => setPwdOpen(false)}>
          <div className="al-profile-modal" onClick={e => e.stopPropagation()} style={{maxWidth:420}}>
            <div className="al-pm-header">
              <span className="al-pm-title">Reset Password</span>
              <button className="al-pm-close" onClick={() => setPwdOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="al-pm-body">
              <div style={{width:64,height:64,borderRadius:'50%',background:'#eef1fd',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#2d5be3" strokeWidth="2" width="28" height="28"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <p style={{fontSize:13,color:'#6b7280',marginBottom:20,textAlign:'center'}}>Enter your current password and choose a new one.</p>
              <div className="al-pm-form" style={{width:'100%'}}>
                {[
                  {label:'Current Password', key:'current_password', showKey:'current'},
                  {label:'New Password', key:'new_password', showKey:'new', placeholder:'Min. 8 characters'},
                  {label:'Confirm Password', key:'new_password_confirmation', showKey:'confirm', placeholder:'Re-enter new password'},
                ].map(({label,key,showKey,placeholder}) => (
                  <div className="al-pm-form-group" key={key}>
                    <label className="al-pm-label">{label} <span style={{color:'#e53e3e'}}>*</span></label>
                    <div style={{position:'relative'}}>
                      <input className="al-pm-input" type={showPwd[showKey]?'text':'password'} value={pwdForm[key]} onChange={e => setPwdForm(f=>({...f,[key]:e.target.value}))} placeholder={placeholder||''} style={{paddingRight:40}}/>
                      <button type="button" onClick={() => setShowPwd(s=>({...s,[showKey]:!s[showKey]}))} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#9ca3af',padding:0}}>
                        <EyeIcon open={showPwd[showKey]}/>
                      </button>
                    </div>
                  </div>
                ))}
                <MsgBox msg={pwdMsg}/>
                <div className="al-pm-form-actions">
                  <button className="al-pm-cancel" onClick={() => setPwdOpen(false)}>Cancel</button>
                  <button className="al-pm-save" onClick={savePwd} disabled={pwdSaving}>{pwdSaving ? 'Changing...' : 'Change Password'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>, document.body
      )}

      {/* ══ APPOINT MODAL ══ */}
      {appointOpen && createPortal(
        <div className="al-modal-backdrop" onClick={() => setAppointOpen(false)}>
          <div className="al-profile-modal" onClick={e => e.stopPropagation()} style={{maxWidth:460}}>
            <div className="al-pm-header">
              <span className="al-pm-title">Appoint New Advisor</span>
              <button className="al-pm-close" onClick={() => setAppointOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="al-pm-body" style={{gap:14}}>
              <div style={{width:64,height:64,borderRadius:'50%',background:'#fef3c7',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" width="28" height="28"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </div>
              {appointStep===1 ? (
                <>
                  <p style={{fontSize:13.5,fontWeight:600,color:'#1a1a2e',textAlign:'center'}}>Select a co-advisor to become the new main advisor</p>
                  <p style={{fontSize:12.5,color:'#6b7280',textAlign:'center',marginTop:-6}}>After appointing, you will automatically leave the club.</p>
                  {appointLoading ? (
                    <p style={{fontSize:13,color:'#6b7280',textAlign:'center',padding:'20px 0'}}>Loading...</p>
                  ) : appointCoAdvisors.length===0 ? (
                    <div style={{background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:10,padding:'14px 16px',fontSize:13,color:'#b91c1c',fontWeight:600,textAlign:'center',width:'100%'}}>
                      ⚠️ No co-advisors yet.
                    </div>
                  ) : (
                    <div style={{width:'100%',display:'flex',flexDirection:'column',gap:10}}>
                      {appointCoAdvisors.map(ca => (
                        <div key={ca.user_id} onClick={() => setAppointSelected(ca)} style={{display:'flex',alignItems:'center',gap:14,padding:'13px 16px',borderRadius:12,border:`2px solid ${appointSelected?.user_id===ca.user_id?'#2d5be3':'#e8eaf0'}`,background:appointSelected?.user_id===ca.user_id?'#eef4ff':'#fff',cursor:'pointer',transition:'all 0.18s'}}>
                          <div style={{width:40,height:40,borderRadius:'50%',background:'#d1fae5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#065f46',flexShrink:0}}>
                            {(ca.name||'').split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase()}
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:14,fontWeight:700,color:'#1a1a2e'}}>{ca.name}</div>
                            <div style={{fontSize:12,color:'#6b7280',marginTop:2}}>{ca.email}</div>
                          </div>
                          {appointSelected?.user_id===ca.user_id && <svg viewBox="0 0 24 24" fill="none" stroke="#2d5be3" strokeWidth="3" width="18" height="18"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                      ))}
                    </div>
                  )}
                  <MsgBox msg={appointMsg}/>
                  <div className="al-pm-form-actions" style={{marginTop:4,width:'100%'}}>
                    <button className="al-pm-cancel" onClick={() => setAppointOpen(false)}>Cancel</button>
                    <button className="al-pm-save" onClick={() => { if (appointSelected) setAppointStep(2); }} disabled={!appointSelected||appointCoAdvisors.length===0} style={{background:appointSelected?'#1a2332':'#e2e8f0',color:appointSelected?'#c9a84c':'#9ca3af'}}>Next →</button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{fontSize:13.5,fontWeight:700,color:'#1a1a2e',textAlign:'center'}}>Are you sure you want to appoint</p>
                  <div style={{background:'#f0f7ff',border:'1px solid #bfdbfe',borderRadius:10,padding:'14px 18px',textAlign:'center',width:'100%'}}>
                    <div style={{fontSize:15,fontWeight:800,color:'#1a1a2e'}}>{appointSelected?.name}</div>
                    <div style={{fontSize:12,color:'#6b7280',marginTop:3}}>{appointSelected?.email}</div>
                  </div>
                  <div style={{background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:10,padding:'12px 16px',fontSize:12.5,color:'#b91c1c',fontWeight:600,lineHeight:1.6,width:'100%'}}>
                    ⚠️ <strong>Warning:</strong> Once appointed, you will permanently leave this club.
                  </div>
                  <MsgBox msg={appointMsg}/>
                  <div className="al-pm-form-actions" style={{marginTop:4,width:'100%'}}>
                    <button className="al-pm-cancel" onClick={() => setAppointStep(1)}>← Back</button>
                    <button onClick={confirmAppoint} disabled={appointLoading} style={{flex:2,padding:'10px 16px',fontSize:13,fontWeight:700,fontFamily:'inherit',background:'#dc2626',color:'#fff',border:'none',borderRadius:9,cursor:'pointer',opacity:appointLoading?0.6:1}}>
                      {appointLoading ? 'Appointing...' : 'Yes, Appoint & Leave'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>, document.body
      )}

      {/* ══ SIGNATURE MODAL ══ */}
      {sigModal && createPortal(
        <div className="al-modal-backdrop" onClick={() => setSigModal(false)}>
          <div className="al-profile-modal" onClick={e => e.stopPropagation()} style={{maxWidth:500}}>
            <div className="al-pm-header">
              <span className="al-pm-title">E-Signature</span>
              <button className="al-pm-close" onClick={() => setSigModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="al-pm-body">
              <div style={{ display:'flex', gap:8, marginBottom:16, width:'100%' }}>
                {['draw','upload'].map(tab => (
                  <button key={tab} onClick={() => setSigTab(tab)} style={{ flex:1, padding:'9px 0', borderRadius:8, border: sigTab===tab ? 'none' : '1.5px solid #e2e8f0', background: sigTab===tab ? '#172D3D' : '#fff', color: sigTab===tab ? '#c9a84c' : '#374151', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                    {tab==='draw' ? '✏️ Draw Signature' : '📁 Upload Image'}
                  </button>
                ))}
              </div>
              {sigTab==='draw' && (
                <div style={{ width:'100%' }}>
                  <p style={{ fontSize:12.5, color:'#64748b', marginBottom:8 }}>Draw your signature below:</p>
                  <canvas ref={canvasRef} width={440} height={160}
                    style={{ border:'1.5px solid #e2e8f0', borderRadius:8, background:'#fff', cursor:'crosshair', touchAction:'none', width:'100%' }}
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                    onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}/>
                  <button onClick={clearCanvas} style={{ marginTop:8, padding:'6px 14px', borderRadius:7, border:'1.5px solid #e2e8f0', background:'#f1f5f9', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', color:'#374151' }}>Clear</button>
                </div>
              )}
              {sigTab==='upload' && (
                <div style={{ width:'100%' }}>
                  <p style={{ fontSize:12.5, color:'#64748b', marginBottom:8 }}>Upload signature image (PNG/JPG on white background):</p>
                  <input type="file" accept="image/*" onChange={e => { const file=e.target.files[0]; if(file){ setUploadFile(file); const r=new FileReader(); r.onload=ev=>setUploadPreview(ev.target.result); r.readAsDataURL(file); }}} style={{ marginBottom:12 }}/>
                  {uploadPreview && <div style={{ border:'1.5px solid #e2e8f0', borderRadius:8, padding:12, background:'#f8fafc', textAlign:'center' }}><img src={uploadPreview} alt="preview" style={{ maxHeight:80, maxWidth:'100%', objectFit:'contain' }}/></div>}
                </div>
              )}
              <div className="al-pm-form-actions" style={{ marginTop:16, width:'100%' }}>
                <button className="al-pm-cancel" onClick={() => setSigModal(false)}>Cancel</button>
                <button className="al-pm-save" onClick={saveSignature} disabled={sigSaving}>{sigSaving ? 'Saving...' : 'Save Signature'}</button>
              </div>
            </div>
          </div>
        </div>, document.body
      )}

    </AdvisorLayout>
  );
}