import nodemailer from 'nodemailer';

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Feature flag: control whether admin signup notification emails are sent
// Default: enabled (unless explicitly set to 'false')
const ADMIN_SIGNUP_EMAIL_ENABLED = process.env.ADMIN_SIGNUP_EMAIL_ENABLED !== 'false';

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface StudentWelcomeData {
  name: string;
  email: string;
  university?: string;
  major?: string;
}

export interface AdminNotificationData {
  studentName: string;
  studentEmail: string;
  university?: string;
  major?: string;
  signUpDate: string;
  profileCompleted: boolean;
}

// Email Templates
export const emailTemplates = {
  studentWelcome: (data: StudentWelcomeData): EmailTemplate => ({
    subject: '🎉 Welcome to Bidaaya - Your Career Journey Starts Here!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Bidaaya</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .welcome-message { font-size: 18px; margin-bottom: 30px; }
          .features { margin: 30px 0; }
          .feature { display: flex; align-items: flex-start; margin-bottom: 20px; }
          .feature-icon { background: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 14px; flex-shrink: 0; }
          .cta-button { display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
          .footer a { color: #10b981; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Bidaaya!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your gateway to amazing career opportunities</p>
          </div>
          
          <div class="content">
            <div class="welcome-message">
              <p>Hi ${data.name || 'there'}! 👋</p>
              <p>We're thrilled to have you join the Bidaaya community! You've just taken the first step towards discovering incredible career opportunities that match your skills and aspirations.</p>
              ${data.university ? `<p>We see you're studying at <strong>${data.university}</strong>${data.major ? ` in ${data.major}` : ''} - that's fantastic! 🎓</p>` : ''}
            </div>

            <div class="features">
              <h3 style="color: #1f2937; margin-bottom: 20px;">Here's what you can do on Bidaaya:</h3>
              
              <div class="feature">
                <div class="feature-icon">🔍</div>
                <div>
                  <strong>Discover Opportunities</strong><br>
                  Browse through curated internships, jobs, and projects from top companies
                </div>
              </div>
              
              <div class="feature">
                <div class="feature-icon">💼</div>
                <div>
                  <strong>Build Your Profile</strong><br>
                  Showcase your skills, projects, and achievements to stand out to employers
                </div>
              </div>
              
              <div class="feature">
                <div class="feature-icon">🤝</div>
                <div>
                  <strong>Connect with Companies</strong><br>
                  Get direct access to hiring managers and company representatives
                </div>
              </div>
              
              <div class="feature">
                <div class="feature-icon">📈</div>
                <div>
                  <strong>Track Your Applications</strong><br>
                  Monitor your application status and get real-time updates
                </div>
              </div>
            </div>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard" class="cta-button">
                Complete Your Profile & Start Exploring
              </a>
            </div>

            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 6px;">
              <p style="margin: 0; color: #166534;"><strong>💡 Pro Tip:</strong> Complete your profile to get 3x more visibility from employers and unlock premium features!</p>
            </div>
          </div>

          <div class="footer">
            <p>Need help getting started? We're here for you!</p>
            <p>
              <a href="mailto:${process.env.EMAIL_USER}">Contact Support</a> • 
              <a href="${process.env.NEXTAUTH_URL}/help">Help Center</a> • 
              <a href="${process.env.NEXTAUTH_URL}/about">About Bidaaya</a>
            </p>
            <p style="margin-top: 20px;">
              <strong>Bidaaya</strong> - Connecting MENA talent with global opportunities
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to Bidaaya, ${data.name || 'there'}!
      
      We're thrilled to have you join our community! You've just taken the first step towards discovering incredible career opportunities.
      
      ${data.university ? `We see you're studying at ${data.university}${data.major ? ` in ${data.major}` : ''} - that's fantastic!` : ''}
      
      Here's what you can do on Bidaaya:
      
      🔍 Discover Opportunities - Browse curated internships, jobs, and projects
      💼 Build Your Profile - Showcase your skills and achievements  
      🤝 Connect with Companies - Get direct access to hiring managers
      📈 Track Applications - Monitor your application status in real-time
      
      Get started: ${process.env.NEXTAUTH_URL}/dashboard
      
      Need help? Contact us at ${process.env.EMAIL_USER}
      
      Best regards,
      The Bidaaya Team
    `
  }),

  adminNotification: (data: AdminNotificationData): EmailTemplate => ({
    subject: `🎯 New Student Sign-up: ${data.studentName} from ${data.university || 'Unknown University'}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Student Registration</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .student-info { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb; }
          .info-row:last-child { border-bottom: none; margin-bottom: 0; }
          .label { font-weight: 600; color: #374151; }
          .value { color: #6b7280; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
          .status-completed { background: #d1fae5; color: #065f46; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .cta-section { text-align: center; margin: 30px 0; padding: 20px; background: #f0f9ff; border-radius: 8px; }
          .cta-button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 0 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 New Student Registration</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">A new student has joined Bidaaya!</p>
          </div>
          
          <div class="content">
            <div class="student-info">
              <h3 style="margin-top: 0; color: #1f2937;">Student Information</h3>
              
              <div class="info-row">
                <span class="label">Name:</span>
                <span class="value">${data.studentName}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">${data.studentEmail}</span>
              </div>
              
              <div class="info-row">
                <span class="label">University:</span>
                <span class="value">${data.university || 'Not specified'}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Major:</span>
                <span class="value">${data.major || 'Not specified'}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Sign-up Date:</span>
                <span class="value">${data.signUpDate}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Profile Status:</span>
                <span class="value">
                  <span class="status-badge ${data.profileCompleted ? 'status-completed' : 'status-pending'}">
                    ${data.profileCompleted ? '✅ Completed' : '⏳ Pending'}
                  </span>
                </span>
              </div>
            </div>

            <div class="cta-section">
              <h4 style="margin-top: 0; color: #1f2937;">Quick Actions</h4>
              <a href="mailto:${data.studentEmail}" class="cta-button">
                📧 Email Student
              </a>
              <a href="${process.env.NEXTAUTH_URL}/admin/students" class="cta-button">
                👥 View All Students
              </a>
            </div>

            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 6px;">
              <p style="margin: 0; color: #991b1b; font-size: 14px;">
                <strong>Action Required:</strong> ${data.profileCompleted ? 'Student has completed their profile and is ready to start applying!' : 'Student needs to complete their profile setup.'}
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      New Student Registration - Bidaaya
      
      A new student has joined the platform!
      
      Student Details:
      - Name: ${data.studentName}
      - Email: ${data.studentEmail}
      - University: ${data.university || 'Not specified'}
      - Major: ${data.major || 'Not specified'}
      - Sign-up Date: ${data.signUpDate}
      - Profile Status: ${data.profileCompleted ? 'Completed' : 'Pending'}
      
      ${data.profileCompleted ? 'Student is ready to start applying!' : 'Student needs to complete profile setup.'}
      
      Quick Actions:
      - Email student: ${data.studentEmail}
      - Admin panel: ${process.env.NEXTAUTH_URL}/admin/students
    `
  })
};

// Email sending functions
export async function sendStudentWelcomeEmail(data: StudentWelcomeData): Promise<boolean> {
  try {
    const template = emailTemplates.studentWelcome(data);
    
    await transporter.sendMail({
      from: `"Bidaaya Team" <${process.env.EMAIL_USER}>`,
      to: data.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    console.log(`✅ Welcome email sent to: ${data.email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return false;
  }
}

export async function sendAdminNotificationEmail(data: AdminNotificationData): Promise<boolean> {
  try {
    if (!ADMIN_SIGNUP_EMAIL_ENABLED) {
      console.log('📧 Admin signup notification email is disabled via ADMIN_SIGNUP_EMAIL_ENABLED=false');
      return true; // Treat as success to avoid error paths upstream
    }

    const template = emailTemplates.adminNotification(data);
    
    // Send to admin email (you)
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    
    await transporter.sendMail({
      from: `"Bidaaya System" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    console.log(`✅ Admin notification sent to: ${adminEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending admin notification:', error);
    return false;
  }
}

// Combined function to send both emails
export async function sendNewStudentEmails(studentData: StudentWelcomeData & { profileCompleted?: boolean }): Promise<{ welcome: boolean; admin: boolean }> {
  const welcomeResult = await sendStudentWelcomeEmail(studentData);
  
  const adminResult = await sendAdminNotificationEmail({
    studentName: studentData.name,
    studentEmail: studentData.email,
    university: studentData.university,
    major: studentData.major,
    signUpDate: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    profileCompleted: studentData.profileCompleted || false,
  });

  return {
    welcome: welcomeResult,
    admin: adminResult
  };
} 