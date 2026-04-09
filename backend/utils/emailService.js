const axios = require('axios');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_API_KEY = process.env.BREVO_API_KEY;

const SENDER = {
    name: process.env.EMAIL_FROM_NAME || 'Staff Presence Verification System',
    email: process.env.EMAIL_USER || 'kriskanna17@gmail.com'
};

// Log initialization
console.log(`[Email] Brevo initialized | Sender: ${SENDER.email} | API Key: ${BREVO_API_KEY ? 'Present ✅' : 'MISSING ❌'}`);

/**
 * Core send function via Brevo API
 * @param {string} to - Recipient email
 * @param {string} subject - Subject line
 * @param {string} htmlContent - HTML body
 * @param {string} textContent - Plain text fallback
 */
const sendEmail = async (to, subject, textContent, htmlContent = '') => {
    if (!to) {
        console.log('[Email] Skipped: No recipient email provided.');
        return;
    }

    try {
        const payload = {
            sender: SENDER,
            to: [{ email: to }],
            subject,
            htmlContent: htmlContent || `<p>${textContent}</p>`,
            textContent
        };

        const response = await axios.post(BREVO_API_URL, payload, {
            headers: {
                'api-key': BREVO_API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        console.log(`\n==========================================`);
        console.log(`📧 [EMAIL SENT via Brevo]`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Message ID: ${response.data?.messageId || 'N/A'}`);
        console.log(`==========================================\n`);

        return response.data;
    } catch (error) {
        const errMsg = error.response?.data || error.message;
        console.error(`❌ [Brevo Email Error] Failed to send to ${to}:`, errMsg);
        // Don't throw — prevent server crashes for email failures
    }
};

// ─────────────────────────────────────────────────────────
// TEMPLATE 1: Welcome / Account Creation
// ─────────────────────────────────────────────────────────
const sendWelcomeCredentialsEmail = async (to, name, role, password) => {
    const subject = '🎉 Your Staff Portal Account Has Been Created';
    const textContent = `Welcome ${name}! Your account has been created. Email: ${to} | Password: ${password} | Role: ${role}. Please log in and change your password immediately.`;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Account Created</title>
    </head>
    <body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

                        <!-- Header -->
                        <tr>
                            <td style="background:linear-gradient(135deg,#1e3a5f 0%,#0d47a1 100%);border-radius:16px 16px 0 0;padding:40px 40px 30px;text-align:center;">
                                <div style="width:64px;height:64px;background:rgba(255,255,255,0.15);border-radius:50%;margin:0 auto 16px;display:table-cell;vertical-align:middle;text-align:center;font-size:32px;">🏫</div>
                                <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:0.5px;">Staff Presence Verification</h1>
                                <p style="color:#90caf9;margin:6px 0 0;font-size:14px;">Account Management Portal</p>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="background:#1e293b;padding:40px;">
                                <h2 style="color:#e2e8f0;margin:0 0 8px;font-size:20px;">Welcome, ${name}! 👋</h2>
                                <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 28px;">
                                    Your account has been successfully created by the administrator. 
                                    You can now log in to the <strong style="color:#60a5fa;">Staff Portal</strong> using the credentials below.
                                </p>

                                <!-- Credentials Box -->
                                <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:28px;margin-bottom:28px;">
                                    <p style="color:#64748b;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 16px;">Your Login Credentials</p>
                                    
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="padding:10px 0;border-bottom:1px solid #1e293b;">
                                                <span style="color:#64748b;font-size:13px;display:block;margin-bottom:4px;">Email Address</span>
                                                <span style="color:#60a5fa;font-size:15px;font-weight:600;">${to}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding:10px 0;border-bottom:1px solid #1e293b;">
                                                <span style="color:#64748b;font-size:13px;display:block;margin-bottom:4px;">Temporary Password</span>
                                                <span style="color:#34d399;font-size:16px;font-weight:700;letter-spacing:2px;font-family:monospace;">${password}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding:10px 0;">
                                                <span style="color:#64748b;font-size:13px;display:block;margin-bottom:4px;">Role</span>
                                                <span style="background:#1e3a5f;color:#60a5fa;font-size:13px;font-weight:600;padding:4px 12px;border-radius:20px;text-transform:capitalize;">${role}</span>
                                            </td>
                                        </tr>
                                    </table>
                                </div>

                                <!-- Warning -->
                                <div style="background:#451a03;border:1px solid #92400e;border-radius:10px;padding:16px 20px;margin-bottom:28px;">
                                    <p style="color:#fbbf24;margin:0;font-size:13px;">
                                        ⚠️ <strong>Security Notice:</strong> Please change your password immediately after your first login. Do not share these credentials with anyone.
                                    </p>
                                </div>

                                <!-- CTA Button -->
                                <div style="text-align:center;">
                                    <a href="https://staff-presence-verification.vercel.app" 
                                       style="display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
                                        Login to Portal →
                                    </a>
                                </div>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background:#0f172a;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border-top:1px solid #1e293b;">
                                <p style="color:#475569;font-size:12px;margin:0;">
                                    © ${new Date().getFullYear()} Staff Presence Verification System. This is an automated email — please do not reply.
                                </p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;

    return sendEmail(to, subject, textContent, htmlContent);
};

// ─────────────────────────────────────────────────────────
// TEMPLATE 2: Login Security Alert
// ─────────────────────────────────────────────────────────
const sendLoginSecurityAlert = async (to, name, loginInfo) => {
    const { dateStr, timeStr, device } = loginInfo;
    const subject = '🔐 New Login Detected on Your Account';
    const textContent = `Hi ${name}, a new login was detected on your account. Date: ${dateStr} | Time: ${timeStr} IST | Device: ${device}. If this was not you, please contact the administrator immediately.`;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Security Alert</title>
    </head>
    <body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

                        <!-- Header -->
                        <tr>
                            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);border-radius:16px 16px 0 0;padding:40px 40px 30px;text-align:center;">
                                <div style="font-size:40px;margin-bottom:12px;">🔒</div>
                                <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">Security Alert</h1>
                                <p style="color:#94a3b8;margin:6px 0 0;font-size:14px;">Staff Presence Verification System</p>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="background:#1e293b;padding:40px;">
                                <p style="color:#e2e8f0;font-size:16px;margin:0 0 8px;">Hi <strong>${name}</strong>,</p>
                                <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 28px;">
                                    We detected a new login to your account. If this was you, no action is needed. 
                                    If you <strong style="color:#f87171;">did not</strong> initiate this login, contact your administrator immediately.
                                </p>

                                <!-- Login Detail Cards -->
                                <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:28px;margin-bottom:28px;">
                                    <p style="color:#64748b;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 20px;">Login Details</p>
                                    
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="padding:12px 0;border-bottom:1px solid #1e293b;vertical-align:middle;">
                                                <span style="font-size:20px;margin-right:12px;">📅</span>
                                                <span style="color:#64748b;font-size:13px;">Date</span>
                                            </td>
                                            <td style="padding:12px 0;border-bottom:1px solid #1e293b;text-align:right;">
                                                <strong style="color:#e2e8f0;font-size:14px;">${dateStr}</strong>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding:12px 0;border-bottom:1px solid #1e293b;vertical-align:middle;">
                                                <span style="font-size:20px;margin-right:12px;">🕐</span>
                                                <span style="color:#64748b;font-size:13px;">Time (IST)</span>
                                            </td>
                                            <td style="padding:12px 0;border-bottom:1px solid #1e293b;text-align:right;">
                                                <strong style="color:#e2e8f0;font-size:14px;">${timeStr}</strong>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding:12px 0;vertical-align:middle;">
                                                <span style="font-size:20px;margin-right:12px;">💻</span>
                                                <span style="color:#64748b;font-size:13px;">Device / Browser</span>
                                            </td>
                                            <td style="padding:12px 0;text-align:right;">
                                                <strong style="color:#e2e8f0;font-size:14px;">${device}</strong>
                                            </td>
                                        </tr>
                                    </table>
                                </div>

                                <!-- Alert Banner -->
                                <div style="background:#1a0a0a;border:1px solid #7f1d1d;border-radius:10px;padding:16px 20px;">
                                    <p style="color:#fca5a5;margin:0;font-size:13px;line-height:1.6;">
                                        🚨 <strong>Not you?</strong> Your account may be compromised. Contact the system administrator and request an immediate password reset.
                                    </p>
                                </div>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background:#0f172a;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border-top:1px solid #1e293b;">
                                <p style="color:#475569;font-size:12px;margin:0;">
                                    © ${new Date().getFullYear()} Staff Presence Verification System. This is an automated security notification.
                                </p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;

    return sendEmail(to, subject, textContent, htmlContent);
};

module.exports = { sendEmail, sendWelcomeCredentialsEmail, sendLoginSecurityAlert };
