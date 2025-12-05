import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
});

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        console.warn('SMTP credentials not set. Skipping email.');
        return;
    }

    try {
        await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to,
            subject,
            text,
            html: html || text,
        });
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

export function generateAnnouncementEmail(title: string, description: string, authorName: string) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; letter-spacing: 1px; }
            .content { padding: 30px; color: #333; line-height: 1.6; }
            .title { font-size: 22px; font-weight: bold; color: #2d3748; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            .description { font-size: 16px; color: #4a5568; white-space: pre-wrap; }
            .footer { background-color: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #edf2f7; }
            .emoji { font-size: 24px; vertical-align: middle; }
            .btn { display: inline-block; background-color: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📢 New Announcement!</h1>
            </div>
            <div class="content">
                <div class="title">${title}</div>
                <div class="description">
                    ${description.replace(/\n/g, '<br>')}
                </div>
                <p style="margin-top: 30px; font-style: italic; color: #718096;">
                    Posted by ${authorName} ✍️
                </p>
                <div style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="btn">View in App 🚀</a>
                </div>
            </div>
            <div class="footer">
                <p>You received this email because you are subscribed to updates from the Blog App.</p>
                <p>✨ Have a wonderful day! ✨</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

export function generatePrivateMessageEmail(senderName: string, postTitle: string, messageContent: string) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
            .content { padding: 30px; color: #333; line-height: 1.6; }
            .info { background-color: #edf2f7; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea; }
            .message-box { background-color: #f7fafc; padding: 20px; border-radius: 8px; border: 1px dashed #cbd5e0; font-style: italic; color: #4a5568; }
            .footer { background-color: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #edf2f7; }
            .btn { display: inline-block; background-color: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔒 New Private Message</h1>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>You have received a new private reply regarding your announcement.</p>
                
                <div class="info">
                    <strong>From:</strong> ${senderName}<br>
                    <strong>Re:</strong> ${postTitle}
                </div>

                <div class="message-box">
                    "${messageContent}"
                </div>

                <div style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin" class="btn">View in Dashboard 🚀</a>
                </div>
            </div>
            <div class="footer">
                <p>This is a private message notification from the Blog App.</p>
                <p>✨ Secure & Confidential ✨</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

export function generateResetPasswordEmail(resetLink: string) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
            .content { padding: 30px; color: #333; line-height: 1.6; }
            .alert { background-color: #fff5f5; border-left: 4px solid #fc8181; padding: 15px; margin-bottom: 20px; color: #c53030; }
            .footer { background-color: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #edf2f7; }
            .btn { display: inline-block; background-color: #FF416C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔑 Password Reset Request</h1>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>We received a request to reset the password for your account. If you didn't make this request, you can safely ignore this email.</p>
                
                <div class="alert">
                    This link will expire in 1 hour.
                </div>

                <div style="text-align: center;">
                    <a href="${resetLink}" class="btn">Reset Password</a>
                </div>

                <p style="margin-top: 30px; font-size: 14px;">
                    Or copy and paste this link into your browser:<br>
                    <a href="${resetLink}" style="color: #FF416C;">${resetLink}</a>
                </p>
            </div>
            <div class="footer">
                <p>Secure Account System</p>
            </div>
        </div>
    </body>
    </html>
    `;
}
