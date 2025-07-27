import nodemailer from 'nodemailer'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface CandidateInfo {
  id: string
  name: string
  email: string
  projectTitle: string
  companyName: string
}

interface InterviewSchedulingInfo {
  candidateInfo: CandidateInfo
  calendlyLink: string
  interviewType: 'initial' | 'technical' | 'final'
  deadline: string
  companyContactName: string
  companyContactEmail: string
}

export class EmailAutomationService {
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    this.initializeTransporter()
  }

  private initializeTransporter() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('📧 Email automation: Development mode (no credentials)')
      return
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  }

  // Application Status Updates
  async sendShortlistNotification(candidateInfo: CandidateInfo): Promise<boolean> {
    const template = this.getShortlistTemplate(candidateInfo)
    return this.sendEmail(candidateInfo.email, template)
  }

  async sendRejectionNotification(candidateInfo: CandidateInfo, reason?: string): Promise<boolean> {
    const template = this.getRejectionTemplate(candidateInfo, reason)
    return this.sendEmail(candidateInfo.email, template)
  }

  // Interview Scheduling
  async sendInterviewInvitation(schedulingInfo: InterviewSchedulingInfo): Promise<boolean> {
    const template = this.getInterviewInvitationTemplate(schedulingInfo)
    
    // Send to candidate
    const candidateSuccess = await this.sendEmail(schedulingInfo.candidateInfo.email, template)
    
    // Send confirmation to company
    const companyTemplate = this.getCompanyInterviewNotificationTemplate(schedulingInfo)
    const companySuccess = await this.sendEmail(schedulingInfo.companyContactEmail, companyTemplate)
    
    return candidateSuccess && companySuccess
  }

  async sendInterviewReminder(schedulingInfo: InterviewSchedulingInfo, hoursUntil: number): Promise<boolean> {
    const template = this.getInterviewReminderTemplate(schedulingInfo, hoursUntil)
    return this.sendEmail(schedulingInfo.candidateInfo.email, template)
  }

  async sendInterviewFollowUp(candidateInfo: CandidateInfo, nextSteps: string): Promise<boolean> {
    const template = this.getInterviewFollowUpTemplate(candidateInfo, nextSteps)
    return this.sendEmail(candidateInfo.email, template)
  }

  // Final Selection Notifications
  async sendAcceptanceOffer(candidateInfo: CandidateInfo, offerDetails: any): Promise<boolean> {
    const template = this.getAcceptanceTemplate(candidateInfo, offerDetails)
    return this.sendEmail(candidateInfo.email, template)
  }

  async sendFinalRejection(candidateInfo: CandidateInfo, feedback?: string): Promise<boolean> {
    const template = this.getFinalRejectionTemplate(candidateInfo, feedback)
    return this.sendEmail(candidateInfo.email, template)
  }

  // Company Notifications
  async sendCompanyApplicationAlert(companyEmail: string, applicationInfo: any): Promise<boolean> {
    const template = this.getCompanyApplicationTemplate(applicationInfo)
    return this.sendEmail(companyEmail, template)
  }

  async sendCompanyInterviewSummary(companyEmail: string, interviewSummary: any): Promise<boolean> {
    const template = this.getCompanyInterviewSummaryTemplate(interviewSummary)
    return this.sendEmail(companyEmail, template)
  }

  // Core Email Sending
  private async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      if (!this.transporter) {
        console.log('📧 Development mode - Email would be sent to:', to)
        console.log('📧 Subject:', template.subject)
        console.log('📧 Content:', template.text)
        return true
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: template.subject,
        html: template.html,
        text: template.text
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log('📧 Email sent successfully:', { to, messageId: info.messageId })
      return true

    } catch (error) {
      console.error('📧 Email sending failed:', error)
      return false
    }
  }

  // Email Templates
  private getShortlistTemplate(candidateInfo: CandidateInfo): EmailTemplate {
    const subject = `🎉 Great news! You've been shortlisted for ${candidateInfo.projectTitle}`
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3B82F6; margin: 0;">Bidaaya</h1>
          <p style="color: #6B7280; margin: 5px 0;">Student-Company Platform</p>
        </div>
        
        <h2 style="color: #059669;">🎉 Congratulations ${candidateInfo.name}!</h2>
        
        <p>We're excited to inform you that you've been <strong>shortlisted</strong> for the position:</p>
        
        <div style="background: linear-gradient(135deg, #059669 0%, #34D399 100%); color: white; padding: 20px; margin: 20px 0; text-align: center; border-radius: 12px;">
          <h3 style="margin: 0; font-size: 20px;">${candidateInfo.projectTitle}</h3>
          <p style="margin: 5px 0; opacity: 0.9;">at ${candidateInfo.companyName}</p>
        </div>
        
        <h3>What's Next?</h3>
        <ul style="line-height: 1.6;">
          <li>📅 You'll receive an interview invitation within 2-3 business days</li>
          <li>📋 The company will review your profile and prepare interview questions</li>
          <li>💬 Feel free to prepare questions about the role and company</li>
          <li>🚀 This is a great opportunity - we're rooting for you!</li>
        </ul>
        
        <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #6B7280; font-size: 14px;">
            <strong>Tip:</strong> Research the company and prepare examples of your work to discuss during the interview.
          </p>
        </div>
        
        <p>Best of luck!</p>
        <p><strong>The Bidaaya Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
        <div style="text-align: center; color: #9CA3AF; font-size: 12px;">
          <p>© 2024 Bidaaya - Connecting Students & Companies</p>
        </div>
      </div>
    `
    
    const text = `
Congratulations ${candidateInfo.name}!

You've been shortlisted for ${candidateInfo.projectTitle} at ${candidateInfo.companyName}.

What's Next?
- You'll receive an interview invitation within 2-3 business days
- The company will review your profile and prepare interview questions
- Feel free to prepare questions about the role and company

Best of luck!
The Bidaaya Team
    `
    
    return { subject, html, text }
  }

  private getInterviewInvitationTemplate(schedulingInfo: InterviewSchedulingInfo): EmailTemplate {
    const { candidateInfo, calendlyLink, interviewType, deadline, companyContactName } = schedulingInfo
    
    const subject = `📅 Interview Invitation: ${candidateInfo.projectTitle} at ${candidateInfo.companyName}`
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3B82F6; margin: 0;">Bidaaya</h1>
          <p style="color: #6B7280; margin: 5px 0;">Student-Company Platform</p>
        </div>
        
        <h2 style="color: #7C3AED;">📅 Interview Invitation</h2>
        
        <p>Hi ${candidateInfo.name},</p>
        
        <p>Great news! <strong>${candidateInfo.companyName}</strong> would like to interview you for:</p>
        
        <div style="background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%); color: white; padding: 20px; margin: 20px 0; text-align: center; border-radius: 12px;">
          <h3 style="margin: 0; font-size: 20px;">${candidateInfo.projectTitle}</h3>
          <p style="margin: 5px 0; opacity: 0.9;">
            ${interviewType.charAt(0).toUpperCase() + interviewType.slice(1)} Interview
          </p>
        </div>
        
        <h3>📋 Interview Details</h3>
        <ul style="line-height: 1.6;">
          <li><strong>Type:</strong> ${interviewType.charAt(0).toUpperCase() + interviewType.slice(1)} Interview</li>
          <li><strong>Format:</strong> Video call (link will be provided after scheduling)</li>
          <li><strong>Duration:</strong> 45-60 minutes</li>
          <li><strong>Interviewer:</strong> ${companyContactName}</li>
          <li><strong>Deadline to schedule:</strong> ${new Date(deadline).toLocaleDateString()}</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${calendlyLink}" 
             style="background: #7C3AED; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            📅 Schedule Your Interview
          </a>
        </div>
        
        <h3>🎯 How to Prepare</h3>
        <ul style="line-height: 1.6;">
          <li>Review the project requirements and your application</li>
          <li>Prepare examples of relevant work or projects</li>
          <li>Research the company and prepare thoughtful questions</li>
          <li>Test your video/audio setup beforehand</li>
          <li>Have your resume and portfolio ready to share</li>
        </ul>
        
        <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #92400E;">
            <strong>Important:</strong> Please schedule your interview by ${new Date(deadline).toLocaleDateString()} to secure your slot.
          </p>
        </div>
        
        <p>We're excited about this opportunity and wish you the best of luck!</p>
        
        <p><strong>The Bidaaya Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
        <div style="text-align: center; color: #9CA3AF; font-size: 12px;">
          <p>© 2024 Bidaaya - Connecting Students & Companies</p>
        </div>
      </div>
    `
    
    const text = `
Interview Invitation: ${candidateInfo.projectTitle}

Hi ${candidateInfo.name},

${candidateInfo.companyName} would like to interview you for ${candidateInfo.projectTitle}.

Interview Details:
- Type: ${interviewType} Interview
- Format: Video call
- Duration: 45-60 minutes
- Interviewer: ${companyContactName}
- Deadline to schedule: ${new Date(deadline).toLocaleDateString()}

Schedule your interview: ${calendlyLink}

How to Prepare:
- Review the project requirements and your application
- Prepare examples of relevant work or projects
- Research the company and prepare thoughtful questions
- Test your video/audio setup beforehand

Please schedule by ${new Date(deadline).toLocaleDateString()}.

Best of luck!
The Bidaaya Team
    `
    
    return { subject, html, text }
  }

  private getRejectionTemplate(candidateInfo: CandidateInfo, reason?: string): EmailTemplate {
    const subject = `Update on your application for ${candidateInfo.projectTitle}`
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3B82F6; margin: 0;">Bidaaya</h1>
          <p style="color: #6B7280; margin: 5px 0;">Student-Company Platform</p>
        </div>
        
        <h2 style="color: #374151;">Application Update</h2>
        
        <p>Hi ${candidateInfo.name},</p>
        
        <p>Thank you for your interest in <strong>${candidateInfo.projectTitle}</strong> at ${candidateInfo.companyName}.</p>
        
        <p>After careful consideration, the company has decided to move forward with other candidates whose experience more closely matches their specific requirements.</p>
        
        ${reason ? `
        <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #6B7280;">
            <strong>Feedback:</strong> ${reason}
          </p>
        </div>
        ` : ''}
        
        <h3>🚀 Keep Moving Forward</h3>
        <ul style="line-height: 1.6;">
          <li>This decision doesn't reflect your potential or abilities</li>
          <li>New opportunities are posted regularly on our platform</li>
          <li>Consider applying to similar projects that match your skills</li>
          <li>Use this experience to strengthen future applications</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://bidaaya-web-app.vercel.app/dashboard/projects" 
             style="background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            🔍 Explore New Opportunities
          </a>
        </div>
        
        <p>We appreciate your participation and encourage you to continue pursuing great opportunities!</p>
        
        <p><strong>The Bidaaya Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
        <div style="text-align: center; color: #9CA3AF; font-size: 12px;">
          <p>© 2024 Bidaaya - Connecting Students & Companies</p>
        </div>
      </div>
    `
    
    const text = `
Application Update

Hi ${candidateInfo.name},

Thank you for your interest in ${candidateInfo.projectTitle} at ${candidateInfo.companyName}.

After careful consideration, the company has decided to move forward with other candidates whose experience more closely matches their specific requirements.

${reason ? `Feedback: ${reason}` : ''}

Keep moving forward:
- This doesn't reflect your potential or abilities
- New opportunities are posted regularly
- Consider applying to similar projects
- Use this experience to strengthen future applications

Explore new opportunities: https://bidaaya-web-app.vercel.app/dashboard/projects

Best regards,
The Bidaaya Team
    `
    
    return { subject, html, text }
  }

  private getInterviewReminderTemplate(schedulingInfo: InterviewSchedulingInfo, hoursUntil: number): EmailTemplate {
    const subject = `🔔 Interview Reminder: ${schedulingInfo.candidateInfo.projectTitle} in ${hoursUntil} hours`
    // Implementation similar to above templates...
    return { subject, html: '', text: '' }
  }

  private getInterviewFollowUpTemplate(candidateInfo: CandidateInfo, nextSteps: string): EmailTemplate {
    const subject = `Thank you for your interview - ${candidateInfo.projectTitle}`
    // Implementation similar to above templates...
    return { subject, html: '', text: '' }
  }

  private getAcceptanceTemplate(candidateInfo: CandidateInfo, offerDetails: any): EmailTemplate {
    const subject = `🎉 Congratulations! Offer for ${candidateInfo.projectTitle}`
    // Implementation similar to above templates...
    return { subject, html: '', text: '' }
  }

  private getFinalRejectionTemplate(candidateInfo: CandidateInfo, feedback?: string): EmailTemplate {
    const subject = `Final update on ${candidateInfo.projectTitle} position`
    // Implementation similar to above templates...
    return { subject, html: '', text: '' }
  }

  private getCompanyApplicationTemplate(applicationInfo: any): EmailTemplate {
    const subject = `New application received for ${applicationInfo.projectTitle}`
    // Implementation for company notifications...
    return { subject, html: '', text: '' }
  }

  private getCompanyInterviewNotificationTemplate(schedulingInfo: InterviewSchedulingInfo): EmailTemplate {
    const subject = `Interview scheduled: ${schedulingInfo.candidateInfo.name} for ${schedulingInfo.candidateInfo.projectTitle}`
    // Implementation for company notifications...
    return { subject, html: '', text: '' }
  }

  private getCompanyInterviewSummaryTemplate(interviewSummary: any): EmailTemplate {
    const subject = `Interview completed: ${interviewSummary.candidateName}`
    // Implementation for company notifications...
    return { subject, html: '', text: '' }
  }
}

// Calendly Integration
export class CalendlyIntegration {
  private baseUrl = 'https://api.calendly.com'
  private accessToken = process.env.CALENDLY_ACCESS_TOKEN

  async createEventType(companyId: string, interviewType: string): Promise<string> {
    // This would integrate with Calendly API to create custom event types
    // For now, return a mock Calendly link
    const calendlyUsername = `company-${companyId}`
    return `https://calendly.com/${calendlyUsername}/${interviewType}-interview`
  }

  async getScheduledEvents(eventType: string): Promise<any[]> {
    // This would fetch scheduled events from Calendly
    return []
  }

  async cancelEvent(eventId: string): Promise<boolean> {
    // This would cancel a Calendly event
    return true
  }
}

export const emailAutomation = new EmailAutomationService()
export const calendlyIntegration = new CalendlyIntegration() 