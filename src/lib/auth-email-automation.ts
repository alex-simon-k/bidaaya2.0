import { sendNewStudentEmails } from './email-service';

export interface NewStudentData {
  name: string;
  email: string;
  university?: string;
  major?: string;
}

export async function triggerNewStudentEmails(studentData: NewStudentData): Promise<void> {
  try {
    console.log(`🎯 Triggering welcome emails for new student: ${studentData.email}`);
    
    const emailData = {
      name: studentData.name,
      email: studentData.email,
      university: studentData.university,
      major: studentData.major,
      profileCompleted: false, // New students haven't completed profile yet
    };

    const results = await sendNewStudentEmails(emailData);
    
    console.log(`📧 Email automation results for ${studentData.email}:`, {
      welcomeEmail: results.welcome ? '✅ sent' : '❌ failed',
      adminNotification: results.admin ? '✅ sent' : '❌ failed',
      timestamp: new Date().toISOString(),
    });

    if (!results.welcome) {
      console.error(`❌ Failed to send welcome email to ${studentData.email}`);
    }
    
    if (!results.admin) {
      console.error(`❌ Failed to send admin notification for ${studentData.email}`);
    }

  } catch (error) {
    console.error('❌ Error in email automation:', error);
    // Don't throw error - we don't want email failures to break sign-up
  }
}

// Helper function to extract student data from user object
export function extractStudentDataFromUser(user: any): NewStudentData {
  return {
    name: user.name || user.email?.split('@')[0] || 'Student',
    email: user.email,
    university: user.university,
    major: user.major,
  };
} 