import { NextResponse } from 'next/server';
import { triggerNewStudentEmails } from '@/lib/auth-email-automation';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const name = searchParams.get('name') || 'Test Student';
    const university = searchParams.get('university') || 'Test University';
    const major = searchParams.get('major') || 'Computer Science';

    if (!email) {
      return NextResponse.json({ 
        error: 'Email parameter is required',
        usage: 'GET /api/test-welcome-email?email=test@example.com&name=John&university=MIT&major=CS'
      }, { status: 400 });
    }

    console.log(`🧪 Testing welcome emails for: ${email}`);

    const studentData = {
      name,
      email,
      university,
      major,
    };

    await triggerNewStudentEmails(studentData);

    return NextResponse.json({
      success: true,
      message: 'Welcome emails triggered successfully',
      studentData,
      note: 'Check your email and the admin email for the welcome and notification emails'
    });

  } catch (error) {
    console.error('❌ Error in test welcome email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send test emails',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 