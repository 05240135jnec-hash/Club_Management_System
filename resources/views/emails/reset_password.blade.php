<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #f4f6f9; margin: 0; padding: 40px 20px; }
    .container { max-width: 520px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
    .header { background: linear-gradient(135deg, #172D3D, #0c1b33); padding: 36px 32px; text-align: center; }
    .header img { width: 64px; height: 64px; border-radius: 50%; margin-bottom: 12px; }
    .header h1 { color: #c9a84c; font-size: 20px; margin: 0; font-weight: 800; letter-spacing: 0.5px; }
    .header p { color: rgba(255,255,255,0.6); font-size: 13px; margin: 6px 0 0; }
    .body { padding: 36px 32px; }
    .body p { color: #334155; font-size: 14px; line-height: 1.7; margin: 0 0 16px; }
    .btn { display: block; width: fit-content; margin: 24px auto; padding: 14px 36px; background: linear-gradient(135deg, #c9a84c, #e6c97a); color: #0c1b33; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 14px; letter-spacing: 0.3px; }
    .note { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 20px; }
    .footer { background: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e8eaf0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{ asset('image/logo.png') }}" alt="JNEC Logo">
      <h1>JNEC Club Management</h1>
      <p>Password Reset Request</p>
    </div>
    <div class="body">
      <p>Hello <strong>{{ $user->name }}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to set a new password. This link will expire in <strong>60 minutes</strong>.</p>
      <a href="{{ $url }}" class="btn">Reset Password</a>
      <p>If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    </div>
    <div class="footer">
      © {{ date('Y') }} JNEC Club Management System · Jigme Namgyel Engineering College
    </div>
  </div>
</body>
</html>