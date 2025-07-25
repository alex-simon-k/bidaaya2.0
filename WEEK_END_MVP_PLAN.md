# 🎯 Week-End MVP: Bidaaya Platform

## Vision Summary
A functional platform where:
- **Students**: Free (2 applications/2 weeks) or Premium (5 applications/2 weeks + extra document)
- **Companies**: Basic paid tier only (post projects, see compatibility scores, shortlist candidates)
- **AI-Powered**: Compatibility scoring using DeepSeq API or similar
- **Admin-Approved**: All projects require admin approval
- **Email Automation**: Automated notifications with Calendly integration

---

## 🏗️ **DAY 1-2: Core Application System**

### 1. **Application Limitations & Tier Enforcement**
```typescript
// Update User model to track application usage
model User {
  // ... existing fields
  applicationsThisWeek: Int @default(0)
  lastApplicationReset: DateTime @default(now())
  subscriptionTier: String @default("FREE") // FREE, PREMIUM
  documentsAllowed: Int @default(1) // Premium gets +1 document
}

// Application tracking logic
- Check user tier before allowing application
- Reset weekly counters
- Enforce document upload limits
```

### 2. **Enhanced Application System**
```typescript
model Application {
  // ... existing fields
  coverLetter: String?
  additionalDocument: String? // Premium feature
  compatibilityScore: Float? // AI-generated
  adminNotes: String?
}
```

### 3. **Student Application Flow**
- Check tier limits before showing apply button
- Different forms for Free vs Premium users
- Real-time counter showing remaining applications

---

## 🏗️ **DAY 3: AI Compatibility Scoring**

### 1. **DeepSeq API Integration**
```typescript
// AI Scoring Service
const calculateCompatibilityScore = async (student, project) => {
  const studentProfile = {
    skills: student.skills,
    interests: student.interests,
    university: student.university,
    major: student.major
  }
  
  const projectRequirements = {
    description: project.description,
    skillsRequired: project.skillsRequired,
    industry: project.company.industry
  }
  
  // Call DeepSeq API or similar
  const score = await deepSeqAPI.compare(studentProfile, projectRequirements)
  return score // 0-100 compatibility score
}
```

### 2. **Scoring Triggers**
- Calculate score when student applies
- Show scores to companies after 3+ applications
- Update scores if student profile changes

---

## 🏗️ **DAY 4: Company Features**

### 1. **Project Approval Workflow**
```typescript
model Project {
  // ... existing fields
  status: ProjectStatus // DRAFT, PENDING_APPROVAL, LIVE, CLOSED
  adminFeedback: String?
  calendlyLink: String // Required from company onboarding
}
```

### 2. **Company Dashboard Enhancements**
- View applicants with compatibility scores (hidden until 3+ apps)
- Shortlist functionality
- Send interview emails with Calendly link
- Project approval status tracking

### 3. **Talent Pool Browser**
```typescript
// Blurred talent pool for companies
const getTalentPool = async (companyId) => {
  return await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      university: true,
      major: true,
      skills: true,
      interests: true,
      graduationYear: true,
      // Exclude: name, email, contact info
    }
  })
}
```

---

## 🏗️ **DAY 5: Admin System**

### 1. **Admin Project Approval**
```typescript
// Admin API endpoints
POST /api/admin/projects/approve
POST /api/admin/projects/reject

// Admin dashboard component
- List pending projects
- Approve/reject with feedback
- View project details
```

### 2. **Admin Dashboard**
- Pending projects queue
- User statistics
- Platform metrics
- Content moderation tools

---

## 🏗️ **DAY 6-7: Email Automation & Polish**

### 1. **Email Automation System**
```typescript
// Email templates and triggers
const emailTriggers = {
  applicationSubmitted: (student, project) => {},
  applicationShortlisted: (student, project, calendlyLink) => {},
  projectApproved: (company, project) => {},
  weeklyApplicationReset: (student) => {},
}
```

### 2. **Calendly Integration in Emails**
```html
<!-- Email template for shortlisted candidates -->
<p>Congratulations! You've been shortlisted for {{projectTitle}}.</p>
<p>Schedule your interview: <a href="{{companyCalendlyLink}}">Book Interview</a></p>
```

### 3. **Payment Processing**
```typescript
// Student premium upgrade
const studentPlans = {
  FREE: { applications: 2, documents: 1, price: 0 },
  PREMIUM: { applications: 5, documents: 2, price: 5 }
}

// Company basic plan
const companyPlans = {
  BASIC: { projects: 1, price: 20, features: ['post_projects', 'see_scores', 'shortlist'] }
}
```

---

## 📊 **Technical Implementation Details**

### 1. **Application Limiting Logic**
```typescript
const canApply = async (userId: string) => {
  const user = await getUser(userId)
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  
  // Reset counter if it's been 2 weeks
  if (user.lastApplicationReset < weekAgo) {
    await resetApplicationCounter(userId)
    return true
  }
  
  const maxApplications = user.subscriptionTier === 'PREMIUM' ? 5 : 2
  return user.applicationsThisWeek < maxApplications
}
```

### 2. **AI Scoring Implementation**
```typescript
// DeepSeq API integration (or OpenAI as fallback)
const getCompatibilityScore = async (studentData, projectData) => {
  try {
    const response = await fetch('https://api.deepseq.ai/v1/compatibility', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.DEEPSEQ_API_KEY}` },
      body: JSON.stringify({ student: studentData, project: projectData })
    })
    return response.json().score
  } catch {
    // Fallback to OpenAI
    return await openAICompatibilityScore(studentData, projectData)
  }
}
```

### 3. **Email System**
```typescript
// Email service with templates
class EmailService {
  async sendApplicationConfirmation(student, project) {
    await this.send({
      to: student.email,
      template: 'application-confirmation',
      data: { studentName: student.name, projectTitle: project.title }
    })
  }
  
  async sendShortlistNotification(student, project, calendlyLink) {
    await this.send({
      to: student.email,
      template: 'shortlist-notification',
      data: { 
        studentName: student.name, 
        projectTitle: project.title,
        calendlyLink: calendlyLink 
      }
    })
  }
}
```

---

## 🎯 **Success Metrics for Week-End**

### Student Flow ✅
1. Student registers and sets up profile
2. Browses projects (can see all, but apply limitations)
3. Applies to projects (2 free, 5 premium)
4. Gets confirmation email
5. Can upgrade to premium for more applications
6. Receives shortlist notifications with interview links

### Company Flow ✅
1. Company completes onboarding (including Calendly)
2. Posts project (goes to pending approval)
3. Admin approves project → goes live
4. Sees applications come in
5. Views compatibility scores (after 3+ applications)
6. Shortlists candidates → automated email with interview link

### Admin Flow ✅
1. Admin dashboard shows pending projects
2. Can approve/reject with feedback
3. View platform statistics
4. Monitor user activity

### Payment Processing ✅
1. Students can upgrade to premium ($5/month)
2. Companies pay for basic tier ($20/month)
3. Stripe integration working end-to-end

---

## 🚀 **Revenue Model (Week 1)**

### Target Metrics:
- **5 Companies** × $20/month = $100/month
- **50 Students** × 10% premium = 5 × $5/month = $25/month
- **Total Week 1 Revenue**: $125/month

### Growth Path:
- Week 2: 10 companies, 100 students = $275/month
- Month 1: 25 companies, 250 students = $625/month
- Month 3: 50 companies, 500 students = $1,250/month

---

This MVP focuses on core functionality with clear monetization and sets up the foundation for rapid scaling. The AI scoring creates immediate value for companies, while tier limitations drive student upgrades.

Ready to start building? 🚀 