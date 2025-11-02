import nodemailer from 'nodemailer';

// Email configuration - you'll need to set these up
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export async function sendCompletionEmail(
  email: string,
  reminderTitle: string,
  category: string
): Promise<void> {
  try {
    if (!EMAIL_USER || !EMAIL_PASS) {
      console.warn('Email credentials not configured. Skipping email send.');
      return;
    }

    const title = reminderTitle || category;

    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: `✅ Reminder Completed: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">✅ Reminder Completed!</h2>
          <p>Your reminder has been completed:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Title:</strong> ${title}</p>
            <p style="margin: 10px 0 0 0;"><strong>Category:</strong> ${category}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Great job completing your task! 🎉
          </p>
        </div>
      `,
    });

    console.log(`Email sent to ${email} for reminder: ${title}`);
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw - email failure shouldn't break the app
  }
}

