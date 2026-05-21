import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import AdvisorLayout from './components/AdvisorLayout';
import '../../styles/advisor/enrollmentkey.css';

export default function AdvisorEnrollmentKey() {
  const [keyData, setKeyData]     = useState(null);   // { enrollment_key, max_members, joined, slots_left }
  const [loading, setLoading]     = useState(true);
  const [keyInput, setKeyInput]   = useState('');
  const [maxInput, setMaxInput]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [revoking, setRevoking]   = useState(false);
  const [copied, setCopied]       = useState(false);
  const [toast, setToast]         = useState({ show: false, msg: '', type: 'success' });
  const [keyError, setKeyError]   = useState('');
  const [maxError, setMaxError]   = useState('');

  useEffect(() => { fetchKey(); }, []);

  // ── FETCH CURRENT KEY ──────────────────────────────────────
  const fetchKey = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/clubs/enrollment-key', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKeyData(res.data);
    } catch (err) {
      // 404 means no key yet — that's fine
      setKeyData(null);
    } finally {
      setLoading(false);
    }
  };

  // ── CREATE / UPDATE KEY ────────────────────────────────────
  const handleCreateKey = async () => {
    let valid = true;
    setKeyError('');
    setMaxError('');

    if (!keyInput.trim()) {
      setKeyError('Please enter an enrollment key.');
      valid = false;
    }
    if (!maxInput || parseInt(maxInput) < 1) {
      setMaxError('Please enter a valid maximum members number.');
      valid = false;
    }
    if (!valid) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/clubs/enrollment-key', {
        enrollment_key: keyInput.trim(),
        max_members:    parseInt(maxInput),
      }, { headers: { Authorization: `Bearer ${token}` } });

      setKeyInput('');
      setMaxInput('');
      await fetchKey();
      showToast('Enrollment key created successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create key.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── REVOKE KEY ─────────────────────────────────────────────
  const handleRevoke = async () => {
    const result = await Swal.fire({
      title: 'Revoke Enrollment Key?',
      text: 'Students will no longer be able to join using this key.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Revoke it!',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    setRevoking(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete('/api/clubs/enrollment-key', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKeyData(null);
      Swal.fire({
        title: 'Revoked!',
        text: 'Enrollment key has been revoked.',
        icon: 'success',
        confirmButtonColor: '#1a1a2e',
      });
    } catch (err) {
      Swal.fire({
        title: 'Error!',
        text: err.response?.data?.message || 'Failed to revoke key.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
      });
    } finally {
      setRevoking(false);
    }
  };

  // ── COPY KEY ───────────────────────────────────────────────
  const handleCopy = () => {
    if (!keyData?.enrollment_key) return;
    navigator.clipboard.writeText(keyData.enrollment_key).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = keyData.enrollment_key;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── TOAST ──────────────────────────────────────────────────
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
                type="text"
                value={keyInput}
                onChange={e => { setKeyInput(e.target.value); setKeyError(''); }}
              />
              <svg className="ek-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            {keyError
              ? <span className="ek-error">{keyError}</span>
              : <span className="ek-hint">Type any key — share this with new students to join</span>
            }
          </div>

          <div className="ek-form-group">
            <label className="ek-form-label">Maximum Members</label>
            <input
              className={`ek-input ${maxError ? 'ek-input-error' : ''}`}
              type="number"
              min="1"
              value={maxInput}
              onChange={e => { setMaxInput(e.target.value); setMaxError(''); }}
            />
            {maxError
              ? <span className="ek-error">{maxError}</span>
              : <span className="ek-hint">Key stops working once this limit is reached</span>
            }
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
        <div className="ek-card-header">
          <h2 className="ek-card-title">Active Key</h2>
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
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Copy Key
                  </>
                )}
              </button>
              <button className="ek-btn-revoke" onClick={handleRevoke} disabled={revoking}>
                {revoking ? 'Revoking...' : 'Revoke'}
              </button>
            </div>

            <div className="ek-key-stats">
              <div className="ek-stat">
                <div className="ek-stat-value">{keyData.joined ?? 0}</div>
                <div className="ek-stat-label">JOINED</div>
              </div>
              <div className="ek-stat-divider" />
              <div className="ek-stat">
                <div className="ek-stat-value">{keyData.max_members ?? '—'}</div>
                <div className="ek-stat-label">MAX</div>
              </div>
              <div className="ek-stat-divider" />
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
            {toast.type === 'success'
              ? <polyline points="20 6 9 17 4 12"/>
              : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
            }
          </svg>
          {toast.msg}
        </div>
      )}

    </AdvisorLayout>
  );
}