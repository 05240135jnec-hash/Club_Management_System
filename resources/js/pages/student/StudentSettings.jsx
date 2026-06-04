import { useState } from 'react';
import { createPortal } from 'react-dom';
import StudentLayout from './components/StudentLayout';

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

export default function StudentSettings() {
  const token = () => sessionStorage.getItem('token');

  const [pwdOpen, setPwdOpen]     = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg]       = useState({ text:'', type:'' });
  const [showPwd, setShowPwd]     = useState({ current:false, new:false, confirm:false });
  const [pwdForm, setPwdForm]     = useState({ current_password:'', new_password:'', new_password_confirmation:'' });

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
      const res  = await fetch('/api/profile/password', {
        method:'PUT',
        headers:{ Authorization:`Bearer ${token()}`, 'Content-Type':'application/json' },
        body:JSON.stringify(pwdForm),
      });
      const data = await res.json();
      if (!res.ok) { setPwdMsg({text:data.message||'Failed to change password.',type:'error'}); return; }
      setPwdMsg({text:'Password changed successfully!',type:'success'});
      setTimeout(() => { setPwdOpen(false); setPwdMsg({text:'',type:''}); }, 1500);
    } catch { setPwdMsg({text:'Could not connect to server.',type:'error'}); }
    finally  { setPwdSaving(false); }
  }

  return (
    <StudentLayout pageTitle="Settings" pageSubtitle="Manage your account settings">
      <div>

        {/* HEADER */}
        <div style={{ background:'#fff', borderRadius:16, padding:'28px 32px', marginBottom:20, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize:20, fontWeight:800, color:'#1a1a2e', marginBottom:4 }}>Account Settings</div>
          <div style={{ fontSize:13, color:'#8892a4' }}>Manage your profile and security</div>
        </div>

        {/* CHANGE PASSWORD CARD */}
        <div
          onClick={openPwd}
          style={{
            background:'#fff', borderRadius:16, padding:'22px 24px',
            marginBottom:12, boxShadow:'0 1px 4px rgba(0,0,0,0.07)',
            display:'flex', alignItems:'center', gap:18,
            cursor:'pointer', transition:'box-shadow 0.15s',
            border:'1.5px solid transparent',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 16px rgba(45,91,227,0.12)'; e.currentTarget.style.borderColor='#bfdbfe'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.07)'; e.currentTarget.style.borderColor='transparent'; }}
        >
          <div style={{ width:48, height:48, borderRadius:12, background:'#eef1fd', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#2d5be3" strokeWidth="2" width="22" height="22" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#1a1a2e', marginBottom:3 }}>Change Password</div>
            <div style={{ fontSize:12.5, color:'#8892a4' }}>Update your account password</div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="#b0bac8" strokeWidth="2" width="18" height="18" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>

      </div>

      {/* RESET PASSWORD MODAL */}
      {pwdOpen && createPortal(
        <div className="sl-modal-overlay" onClick={() => setPwdOpen(false)}>
          <div className="sl-profile-modal" onClick={e => e.stopPropagation()} style={{maxWidth:420}}>
            <div className="sl-modal-head">
              <span style={{fontSize:15, fontWeight:700, color:'#1a1a2e'}}>Reset Password</span>
              <button className="sl-modal-x" onClick={() => setPwdOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="sl-pm-body">
              <div style={{width:64,height:64,borderRadius:'50%',background:'#eef1fd',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#2d5be3" strokeWidth="2" width="28" height="28"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <p style={{fontSize:13,color:'#6b7280',marginBottom:20,textAlign:'center'}}>Enter your current password and choose a new one.</p>
              <div className="sl-pm-form" style={{width:'100%'}}>
                {[
                  {label:'Current Password', key:'current_password',          showKey:'current'},
                  {label:'New Password',     key:'new_password',              showKey:'new',     placeholder:'Min. 8 characters'},
                  {label:'Confirm Password', key:'new_password_confirmation', showKey:'confirm', placeholder:'Re-enter new password'},
                ].map(({label,key,showKey,placeholder}) => (
                  <div className="sl-pm-form-group" key={key}>
                    <label className="sl-pm-label">{label} <span style={{color:'#e53e3e'}}>*</span></label>
                    <div style={{position:'relative'}}>
                      <input className="sl-pm-input" type={showPwd[showKey]?'text':'password'}
                        value={pwdForm[key]} onChange={e => setPwdForm(f=>({...f,[key]:e.target.value}))}
                        placeholder={placeholder||''} style={{paddingRight:40}} />
                      <button type="button" onClick={() => setShowPwd(s=>({...s,[showKey]:!s[showKey]}))}
                        style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#9ca3af',padding:0}}>
                        <EyeIcon open={showPwd[showKey]} />
                      </button>
                    </div>
                  </div>
                ))}
                <MsgBox msg={pwdMsg} />
                <div className="sl-pm-form-actions">
                  <button className="sl-pm-cancel" onClick={() => setPwdOpen(false)}>Cancel</button>
                  <button className="sl-pm-save" onClick={savePwd} disabled={pwdSaving}>
                    {pwdSaving ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>, document.body
      )}

    </StudentLayout>
  );
}