const nodemailer = require('nodemailer');

// Configure the transporter
// Configure the transporter
const transporterOptions = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_PORT == 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : ''
    },
    tls: {
        rejectUnauthorized: false
    }
};

// If using Gmail, 'service' property is more reliable
if (transporterOptions.host.includes('gmail.com')) {
    transporterOptions.service = 'gmail';
}

const transporter = nodemailer.createTransport(transporterOptions);

// Log configuration status (without secrets)
console.log(`[Email] Initialized with Service: ${transporterOptions.service || 'Custom'}, Host: ${transporterOptions.host}, User: ${process.env.EMAIL_USER ? 'Present' : 'MISSING'}`);


/**
 * Send an email
 * Supports both individual arguments or a single object
 */
const sendEmail = async (toOrObj, subject, text, html = "") => {
    let to, finalSubject, finalText, finalHtml;

    if (typeof toOrObj === 'object') {
        to = toOrObj.email || toOrObj.to;
        finalSubject = toOrObj.subject;
        finalText = toOrObj.message || toOrObj.text;
        finalHtml = toOrObj.html;
    } else {
        to = toOrObj;
        finalSubject = subject;
        finalText = text;
        finalHtml = html;
    }

    if (!to) {
        console.log(`[Email] Skip: No recipient email provided.`);
        return;
    }

    try {
        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'Staff Presence System'}" <${process.env.EMAIL_USER}>`,
            to,
            subject: finalSubject,
            text: finalText,
            html: finalHtml || finalText
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`\n==========================================`);
        console.log(`📧 [EMAIL SENT]`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${finalSubject}`);
        console.log(`Message ID: ${info.messageId}`);
        console.log(`==========================================\n`);
        return info;
    } catch (error) {
        console.error(`❌ [Email Error] Failed to send email to ${to}:`, error);
    }
};

module.exports = { sendEmail };
