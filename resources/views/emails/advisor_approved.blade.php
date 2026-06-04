<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f4f6fb;padding:40px 0;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="text-align:center;margin-bottom:24px;">
      <img src="https://jnec.edu.bt/wp-content/uploads/2022/07/JNEC-Logo.png" height="60" alt="JNEC"/>
    </div>
    <h2 style="color:#2d5be3;text-align:center;">Congratulations, {{ $advisorName }}!</h2>
    <p style="color:#374151;line-height:1.7;">
      You have been <strong>approved as a Club Advisor</strong> at Jigme Namgyel Engineering College.
      You can now log in to access your club dashboard and start managing your club.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="{{ config('app.url') }}/login" style="background:#2d5be3;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:700;">
        Log In Now
      </a>
    </div>
    <p style="color:#6b7280;font-size:13px;text-align:center;">
      JNEC Club Management System<br/>
      Jigme Namgyel Engineering College
    </p>
  </div>
</body>
</html>