import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const id        = searchParams.get('id');
    const hash      = searchParams.get('hash');
    const expires   = searchParams.get('expires');
    const signature = searchParams.get('signature');

    axios.get(`/api/verify-email/${id}/${hash}?expires=${expires}&signature=${signature}`)
      .then(() => {
        setStatus('success');
        let count = 3;
        const iv = setInterval(() => {
          count--;
          setCountdown(count);
          if (count === 0) { clearInterval(iv); navigate('/login'); }
        }, 1000);
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', 'Segoe UI', sans-serif", padding: '2rem',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Background decoration */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'rgba(201,168,76,0.05)', top: -100, right: -100, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'rgba(201,168,76,0.04)', bottom: -50, left: -50, pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        background: '#ffffff',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: 24, padding: '48px 40px',
        width: '100%', maxWidth: 440,
        textAlign: 'center',
        boxShadow: '0 32px 80px rgba(0,0,0,0.08)',
        position: 'relative', zIndex: 1,
        animation: 'cardIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* VERIFYING */}
        {status === 'verifying' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(201,168,76,0.1)',
                border: '2px solid rgba(201,168,76,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                animation: 'spin 1.5s linear infinite',
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2.5" width="32" height="32">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              </div>
            </div>
            <h2 style={{ color: '#c9a84c', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
              Verifying Your Email
            </h2>
            <p style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14, lineHeight: 1.6 }}>
              Please wait while we verify your account...
            </p>
          </div>
        )}

        {/* SUCCESS */}
        {status === 'success' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(22,163,74,0.15)',
              border: '2px solid rgba(22,163,74,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" width="38" height="38">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h2 style={{ color: '#c9a84c', fontSize: 24, fontWeight: 800, marginBottom: 10 }}>
              Email Verified!
            </h2>
            <p style={{ color: 'rgba(0,0,0,0.6)', fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>
              Your account has been successfully verified. You can now log in to JNEC Club Management.
            </p>
            <p style={{
              color: 'rgba(0,0,0,0.35)', fontSize: 12.5, marginBottom: 28,
            }}>
              Redirecting to login in <strong style={{ color: '#c9a84c' }}>{countdown}</strong> second{countdown !== 1 ? 's' : ''}...
            </p>

            {/* Progress bar */}
            <div style={{
              width: '100%', height: 3, background: 'rgba(0,0,0,0.08)',
              borderRadius: 99, marginBottom: 28, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', background: '#c9a84c', borderRadius: 99,
                width: `${((3 - countdown) / 3) * 100}%`,
                transition: 'width 1s linear',
              }} />
            </div>

            <button onClick={() => navigate('/login')} style={{
              width: '100%', padding: '14px 0',
              background: 'linear-gradient(135deg, #c9a84c, #e6c97a)',
              color: '#0c1b33', border: 'none', borderRadius: 12,
              fontWeight: 800, fontSize: 14, cursor: 'pointer',
              letterSpacing: 0.5, fontFamily: 'inherit',
              boxShadow: '0 4px 20px rgba(201,168,76,0.35)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 24px rgba(201,168,76,0.45)'; }}
              onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 20px rgba(201,168,76,0.35)'; }}
            >
              GO TO LOGIN →
            </button>
          </div>
        )}

        {/* ERROR */}
        {status === 'error' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(239,68,68,0.15)',
              border: '2px solid rgba(239,68,68,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" width="38" height="38">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <h2 style={{ color: '#f87171', fontSize: 24, fontWeight: 800, marginBottom: 10 }}>
              Verification Failed
            </h2>
            <p style={{ color: 'rgba(0,0,0,0.6)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
              This link has <strong style={{ color: '#f87171' }}>expired</strong> or is invalid. Please request a new verification email from the login page.
            </p>
            <button onClick={() => navigate('/login')} style={{
              width: '100%', padding: '14px 0',
              background: 'linear-gradient(135deg, #c9a84c, #e6c97a)',
              color: '#0c1b33', border: 'none', borderRadius: 12,
              fontWeight: 800, fontSize: 14, cursor: 'pointer',
              letterSpacing: 0.5, fontFamily: 'inherit',
              boxShadow: '0 4px 20px rgba(201,168,76,0.35)',
              transition: 'transform 0.15s',
            }}
              onMouseEnter={e => e.target.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.target.style.transform = 'none'}
            >
              BACK TO LOGIN
            </button>
          </div>
        )}

        {/* Footer */}
        <p style={{ color: 'rgba(0,0,0,0.25)', fontSize: 11.5, marginTop: 28 }}>
          JNEC Club Management System
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}