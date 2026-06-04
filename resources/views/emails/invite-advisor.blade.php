<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #f0f2f5;
            padding: 40px 16px;
        }
        .container {
            background: #ffffff;
            border-radius: 16px;
            max-width: 520px;
            margin: 0 auto;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.10);
        }

        /* ── HEADER ── */
        .header {
            background: #172D3D;
            padding: 32px 36px 28px;
            text-align: center;
        }
        .header-logo {
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #c9a84c;
            margin-bottom: 6px;
        }
        .header-title {
            font-size: 22px;
            font-weight: 800;
            color: #ffffff;
            line-height: 1.3;
        }

        /* ── BODY ── */
        .body {
            padding: 36px 36px 28px;
        }
        .greeting {
            font-size: 15px;
            font-weight: 600;
            color: #1a1a2e;
            margin-bottom: 14px;
        }
        .message {
            font-size: 14px;
            color: #4b5563;
            line-height: 1.75;
            margin-bottom: 10px;
        }
        .club-name {
            display: inline-block;
            background: #f0f4ff;
            color: #1a2332;
            font-weight: 700;
            padding: 2px 10px;
            border-radius: 6px;
            border: 1px solid #d0d9f0;
        }
        .role-badge {
            display: inline-block;
            background: #172D3D;
            color: #c9a84c;
            font-size: 12px;
            font-weight: 700;
            padding: 3px 12px;
            border-radius: 20px;
            letter-spacing: 0.5px;
            margin-bottom: 28px;
            margin-top: 6px;
        }

        /* ── BUTTON ── */
        .btn-wrap {
            text-align: center;
            margin: 28px 0;
        }
        .btn {
            display: inline-block;
            padding: 14px 40px;
            background: #172D3D;
            color: #c9a84c !important;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 800;
            font-size: 15px;
            letter-spacing: 0.4px;
            box-shadow: 0 4px 16px rgba(23,45,61,0.35);
        }

        /* ── DIVIDER ── */
        .divider {
            height: 1px;
            background: #e8eaf0;
            margin: 24px 0;
        }

        /* ── EXPIRY BOX ── */
        .expiry-box {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            background: #fffbeb;
            border: 1px solid #fcd34d;
            border-radius: 10px;
            padding: 14px 16px;
            margin-bottom: 18px;
        }
        .expiry-icon {
            font-size: 18px;
            flex-shrink: 0;
            margin-top: 1px;
        }
        .expiry-text {
            font-size: 13px;
            color: #92400e;
            line-height: 1.6;
        }
        .expiry-text strong { font-weight: 700; }

        /* ── IGNORE NOTE ── */
        .ignore-note {
            font-size: 12.5px;
            color: #9ca3af;
            line-height: 1.6;
            text-align: center;
        }

        /* ── FOOTER ── */
        .footer {
            background: #f7f8fc;
            border-top: 1px solid #e8eaf0;
            padding: 18px 36px;
            text-align: center;
        }
        .footer-text {
            font-size: 12px;
            color: #9ca3af;
            font-weight: 500;
        }
        .footer-brand {
            font-size: 12px;
            font-weight: 700;
            color: #172D3D;
            margin-top: 3px;
        }
    </style>
</head>
<body>
    <div class="container">

        <!-- HEADER -->
        <div class="header">
            <div class="header-logo">JNEC Club Management</div>
            <div class="header-title">You've Been Invited!</div>
        </div>

        <!-- BODY -->
        <div class="body">
            <p class="greeting">Hello,</p>
            <p class="message">
                You have been invited to join
                <span class="club-name">{{ $clubName }}</span>
                as a:
            </p>
            <div>
                <span class="role-badge">Co-Advisor</span>
            </div>
            <p class="message">
                Click the button below to accept the invitation and create your account:
            </p>

            <!-- CTA BUTTON -->
            <div class="btn-wrap">
                <a href="{{ $inviteUrl }}" class="btn">Accept Invitation</a>
            </div>

            <div class="divider"></div>

            <!-- EXPIRY WARNING -->
            <div class="expiry-box">
                <div class="expiry-icon">⏰</div>
                <div class="expiry-text">
                    This invitation link will expire in <strong>48 hours</strong>.
                    After that, you will need to request a new invitation.
                </div>
            </div>

            <p class="ignore-note">
                If you did not expect this invitation, you can safely ignore this email.
                No account will be created without your action.
            </p>
        </div>

        <!-- FOOTER -->
        <div class="footer">
            <div class="footer-text">Sent by</div>
            <div class="footer-brand">JNEC Club Management System</div>
        </div>

    </div>
</body>
</html>