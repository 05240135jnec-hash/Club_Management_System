import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * This page handles /auth/google/success
 * Laravel redirects here with token + role in URL params
 */
function GoogleCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token   = params.get('token');
    const role    = params.get('role');
    const name    = params.get('name');
    const email   = params.get('email');
    const clubId  = params.get('club_id');

    if (!token || !role) {
      window.location.replace('/login?google_error=Authentication failed. Please try again.');
      return;
    }

    // Store in sessionStorage same as normal login
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('role', role);
    sessionStorage.setItem('user', JSON.stringify({ name, email, role, club_id: clubId }));
    if (clubId) sessionStorage.setItem('club_id', clubId);

    // Redirect based on role
    if (role === 'super_admin') {
      window.location.replace('/superadmin/dashboard');
    } else if (role === 'advisor' || role === 'co_advisor') {
      window.location.replace('/advisor/dashboard');
    } else if (role === 'secretary') {
      window.location.replace('/secretary/dashboard');
    } else {
      window.location.replace('/student/StudentHome');
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#f0f2f5', flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        border: '3px solid #2d5be3', borderTopColor: 'transparent',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ fontSize: 14, color: '#4a5568', fontFamily: 'Inter, sans-serif' }}>
        Signing you in...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default GoogleCallback;