<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: #0c1b33; padding: 30px; text-align: center; }
    .header h1 { color: #c9a84c; font-size: 20px; margin: 12px 0 0; letter-spacing: 2px; }
    .body { padding: 32px 36px; }
    .body p { color: #444; font-size: 14px; line-height: 1.7; margin: 0 0 16px; }
    .btn { display: block; width: fit-content; margin: 24px auto; padding: 14px 36px; background: #0c1b33; color: #c9a84c !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; letter-spacing: 1px; }
    .footer { background: #f9f9f9; padding: 16px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>JNEC CLUBS</h1>
    </div>
    <div class="body">
      <p>Hi <strong>{{ $user->name }}</strong>,</p>
      <p>Thank you for registering! Please verify your JNEC email address by clicking the button below:</p>
      <a href="{{ $url }}" class="btn">✅ YES, IT'S ME </a>
      <p>This link expires in <strong>60 minutes</strong>.</p>
      <p>If you did not create an account, you can ignore this email.</p>
    </div>
    <div class="footer">© 2025 JNEC Club Management · Jigme Namgyel Engineering College</div>
  </div>
</body>
</html>