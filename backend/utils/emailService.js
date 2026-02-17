const nodemailer = require('nodemailer');

// Configure the transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Send an email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - Optional HTML body
 */
const sendEmail = async (to, subject, text, html = "") => {
    if (!to) {
        console.log(`[Email] Skip: No recipient email provided.`);
        return;
    }

    try {
        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'Staff Presence System'}" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html: html || text
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`\n==========================================`);
        console.log(`📧 [EMAIL SENT]`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Message ID: ${info.messageId}`);
        console.log(`==========================================\n`);
        return info;
    } catch (error) {
        console.error(`❌ [Email Error] Failed to send email to ${to}:`, error);
        // Don't throw error to avoid crashing the server, but log it
    }
};

module.exports = { sendEmail };
