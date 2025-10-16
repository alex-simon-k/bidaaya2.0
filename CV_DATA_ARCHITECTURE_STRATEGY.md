# CV Data Architecture Strategy
## Understanding What We're Building: A Conversational CV Builder

---

## Executive Summary

**What we're fundamentally doing:** Building an intelligent conversation system that:
1. **Collects CV-worthy data** through natural dialogue
2. **Captures extra context** that enhances matching but won't appear on CVs
3. **Stores everything strategically** for multiple use cases:
   - ✅ Dynamic CV generation tailored to specific opportunities
   - ✅ Intelligent opportunity matching
   - ✅ Personalized career suggestions
   - ✅ Smooth, context-aware chat experience

**The Challenge:** We need to evolve from a **flat profile** (name, university, skills array) to a **rich, structured CV builder** (education history, experience with impact metrics, projects, certifications, etc.).

---

## Part 1: What Do CVs Actually Need?

### The Core Components of a Modern CV

Every professional CV contains these essential elements:

#### **L1 (Critical - Must Have)**
These go on EVERY CV, regardless of the role:
- Full name, contact (email, phone, LinkedIn)
- Education history with institutions, degrees, dates
- Work experience with companies, titles, dates
- Core skills relevant to career path

#### **L2 (Important - Situational)**
These are tailored based on the opportunity:
- Specific project highlights relevant to the role
- Targeted skills that match job requirements
- Certifications related to the position
- Leadership experiences that demonstrate relevant competencies

#### **L3 (Enrichment - Nice to Have)**
These add depth but aren't always included:
- GPA/grades (if strong)
- Coursework details
- Additional links/portfolios
- Hobbies/interests (when culturally expected)
- References

---

## Part 2: Current State vs. Desired State

### What You Currently Collect (Flat Schema)

From your `User` model in Prisma:

```typescript
// PROFILE BASICS
name: String
email: String
location: String
whatsapp: String
linkedin: String
bio: String (single text field)
dateOfBirth: DateTime

// EDUCATION (Flat, Single Entry)
education: String              // e.g., "University Student"
university: String             // e.g., "UCL"
major: String                  // e.g., "PPE"
subjects: String               // e.g., "Economics, Politics, Data Science"
graduationYear: Int            // e.g., 2025
highSchool: String

// CAREER
goal: String[]                 // Array of career goals
interests: String[]            // Array of interests
skills: String[]               // Flat array: ["R", "Python", "HTML"]

// BEHAVIORAL
mena: Boolean
```

**Problems with this approach:**
- ❌ Can only store ONE university experience
- ❌ No work experience structure
- ❌ No projects, certifications, or achievements
- ❌ Skills are unstructured (no proficiency levels, no categorization)
- ❌ No dates for most things (when did they learn skills? when did they complete projects?)
- ❌ No impact metrics or quantifiable achievements
- ❌ Can't track progression over time

### What You Want to Collect (Structured Schema v0.1)

Your proposed schema is significantly richer:

#### **0) Profile** (Enhanced Contact & Preferences)
```typescript
full_name: string              // ✅ Already have as 'name'
headline: string               // ❌ NEW - "Software Engineer | AI Enthusiast"
location: geo                  // ✅ Already have (needs parsing)
phone: phone                   // ✅ Already have as 'whatsapp'
email: email                   // ✅ Already have
links[]: url                   // ⚠️ PARTIAL - only have linkedin, need portfolio, github
work_authorization[]: enum     // ❌ NEW - uk_student_visa, uae_resident
open_to_roles[]: string        // ⚠️ SIMILAR to 'goal' but more specific
relocation_preferences: string // ❌ NEW
```

#### **1) Education[] (Array Structure)**
```typescript
{
  degree_type: "bsc" | "a_levels" | "short_course"  // ❌ NEW
  degree_title: string                               // ❌ NEW
  field_of_study: string                             // ⚠️ Similar to 'major'
  institution: string                                // ⚠️ Similar to 'university'
  location: geo                                      // ❌ NEW
  start_date / end_date: date                        // ❌ NEW (only have graduationYear)
  is_current: boolean                                // ❌ NEW
  predicted_grade: string                            // ❌ NEW
  gpa: float                                         // ❌ NEW
  modules[]: string                                  // ⚠️ Similar to 'subjects'
  coursework_highlights[]: string                    // ❌ NEW
  honors_awards[]: string                            // ❌ NEW
}
```

**Critical difference:** This is an **ARRAY** - can store multiple education entries (BSc, A-Levels, short courses, etc.)

#### **2) Certifications_Courses[]**
```typescript
{
  name: string                   // "SEO Mastery Course"
  issuer: string                 // "Udemy"
  credential_id: string          // "UC-abc123"
  issue_date: date
  expiry_date: date | null
  url: url                       // Link to certificate
}
```

❌ **Completely missing** from current schema

#### **3) Experience[] (Jobs, Internships, Freelance)**
```typescript
{
  title: string                  // "Operations Manager Intern"
  employer: string               // "Revolut"
  org_type: enum                 // startup, scaleup, enterprise, bank
  location: geo
  employment_type: enum          // internship, full_time, part_time
  start_date / end_date: date
  is_current: boolean
  summary: string                // 1-2 lines about the role
  
  impact[]: {                    // STRUCTURED ACHIEVEMENTS
    statement: string            // "Reduced processing time by 40%"
    metrics: [{                  // QUANTIFIED METRICS
      value: 40,
      unit: "%"
    }]
    skills[]: string             // Skills used in this achievement
    evidence_links[]: url        // Optional proof
    star: {                      // STAR format for interviews
      situation: string
      task: string
      action: string
      result: string
    }
  }
}
```

❌ **Completely missing** from current schema - this is huge for CV building

#### **4) Projects[]**
```typescript
{
  name: string                   // "Sertie - AI CV Builder"
  role: string                   // "Co-Founder & Lead Developer"
  start_date / end_date: date
  tech_stack[]: string           // ["Next.js", "React", "OpenAI"]
  summary: string
  impact[]: {...}                // Same structure as experience.impact
}
```

⚠️ You have a `Project` model but it's for **company-posted projects** (opportunities), not **student's personal projects**

#### **5) Leadership_Volunteering[]**
❌ **Missing** - for team lead roles, volunteer work, society positions

#### **6) Extracurriculars_Achievements[]**
❌ **Missing** - for competitions, awards, recognitions

#### **7) Skills (Structured)**
```typescript
{
  hard_skills[]: string          // Canonicalized: "python", "r", "java"
  soft_skills[]: string          // "team_leadership", "client_acquisition"
  tools_platforms[]: string      // "r_studio", "web_scraping"
  proficiency: {
    "python": {
      level: "advanced",
      evidence: "github.com/..."
    },
    "r": {
      level: "intermediate"
    }
  }
}
```

⚠️ Currently just `skills: String[]` - no categorization or proficiency

#### **8) Languages[]**
```typescript
{
  language: string               // "English"
  proficiency_level: enum        // native, fluent, professional, intermediate
}
```

❌ **Completely missing**

#### **9) Keywords_Tags[]**
```typescript
{
  tag: string                    // "fintech", "early_careers", "ai_cv_builder"
}
```

⚠️ You have `StudentTag` but it's admin-generated, not student-provided

---

## Part 3: What Should Be Stored Where?

### Fixed Fields (Structured Database Columns)

**Why Fixed?** This data needs to be:
- ✅ Precisely filterable (e.g., "show me all students graduating in 2025")
- ✅ Sortable (e.g., "order by GPA")
- ✅ Efficiently queryable (e.g., "find students with Python AND React")
- ✅ Used for exact matching (e.g., "must have UK work authorization")

**What goes in fixed fields:**

| Category | Examples | Why Fixed |
|----------|----------|-----------|
| **Dates** | start_date, end_date, graduation_year, issue_date | Filtering by time ranges |
| **Enums** | degree_type, employment_type, proficiency_level, work_authorization | Categorical filtering |
| **Identifiers** | institution, employer, certification issuer | Exact matching |
| **Metrics** | gpa, years_of_experience, salary_expectations | Numerical comparisons |
| **Contact** | email, phone, linkedin | Direct access |
| **Arrays (small, structured)** | skills[], modules[], tech_stack[] | Tag-based filtering |
| **Booleans** | is_current, remote, open_to_relocation | Yes/No filters |

### Vector Embeddings (Semantic Storage)

**Why Vectors?** This data needs to be:
- ✅ Semantically searchable ("find students who understand fintech")
- ✅ Used for AI-powered matching (profile similarity)
- ✅ Contextually understood (not just keyword matching)
- ✅ Flexible (can capture nuance and relationships)

**What goes in vectors:**

| Category | Examples | Why Vector |
|----------|----------|-----------|
| **Narrative descriptions** | bio, project summaries, role descriptions | Semantic meaning |
| **Impact statements** | "Grew user base from 100 to 1,500 in 7 months" | Context-dependent matching |
| **Career narratives** | How experiences build on each other | Pattern recognition |
| **Motivations & goals** | "Interested in fintech because..." | Intent understanding |
| **Soft skills evidence** | Examples of leadership, teamwork | Qualitative assessment |
| **Coursework highlights** | "Dissertation on neural networks in finance" | Contextual relevance |
| **Overall profile** | Combination of all CV elements | Holistic matching |

### Your Current Vector System

From `vector-embedding-service.ts`:

```typescript
StudentVector {
  profileVector: number[]      // Main profile embedding
  skillsVector: number[]       // Skills-focused embedding
  academicVector: number[]     // Academic background embedding
}
```

**What it currently embeds:**
- Profile: name, bio, university, major, subjects, skills, interests, goals, location, application history
- Skills: skills + major + interests + goals + related keywords
- Academic: university, major, subjects, education level, high school

**What it's MISSING for CV generation:**
- ❌ Work experience narratives
- ❌ Project descriptions & impact
- ❌ Certifications context
- ❌ Achievement stories
- ❌ Leadership examples

**Recommendation:** Add two more vectors:
```typescript
experienceVector: number[]    // Work history + projects + impact
achievementsVector: number[]  // Leadership + awards + extracurriculars
```

---

## Part 4: How to Structure the Conversation

### The Conversation Flow Architecture

#### **Phase 1: Foundation (L1 Data)**
**Goal:** Collect minimum viable CV information

```typescript
Conversation Topics:
1. "Let's start with the basics - what's your full name?"
2. "Where are you currently based?"
3. "How can employers reach you?" (phone, email, linkedin)
4. "Tell me about your current education"
   - Which university/institution?
   - What are you studying?
   - When did you start? When do you expect to graduate?
   - What's your predicted grade?
```

**Data Collected:**
- ✅ Profile (name, location, contact)
- ✅ Primary education entry
- ✅ Timeline context

**Storage Strategy:**
- Fixed fields: names, dates, institution
- Vector: conversational context for personalization

#### **Phase 2: Experience Deep Dive (L1 + L2 Data)**
**Goal:** Build the work experience section

```typescript
Conversation Topics:
1. "Have you had any work experience - internships, jobs, or freelance work?"
2. For each experience:
   - "What was your role at [Company]?"
   - "When did you work there?"
   - "What were your main responsibilities?"
   - "Can you tell me about one significant achievement?"
     → Extract metrics: "How many? How much? How fast?"
   - "What skills did you develop?"
```

**Data Collected:**
- ✅ experience[] array with structured entries
- ✅ impact[] with metrics
- ✅ skills[] linked to experiences

**Storage Strategy:**
- Fixed fields: title, employer, dates, employment_type
- Vector: role descriptions, impact statements, achievement narratives
- Extract metrics to structured format: `{ value: 40, unit: "%" }`

#### **Phase 3: Projects & Side Work (L2 Data)**
**Goal:** Showcase initiative and practical skills

```typescript
Conversation Topics:
1. "Have you worked on any personal projects, side hustles, or entrepreneurial ventures?"
2. For each project:
   - "What did you build/create?"
   - "What was your role?"
   - "What technologies did you use?"
   - "What impact did it have?" (users, revenue, learning)
```

**Data Collected:**
- ✅ projects[] array
- ✅ tech_stack[] for technical projects
- ✅ impact[] with metrics

**Storage Strategy:**
- Fixed fields: name, tech_stack[], dates
- Vector: project descriptions, impact narratives

#### **Phase 4: Skills & Certifications (L1 + L2 Data)**
**Goal:** Catalog capabilities with evidence

```typescript
Conversation Topics:
1. "What are your core technical/professional skills?"
   - For each skill: "How would you rate your proficiency?"
   - "Where did you learn this?" (formal education, self-taught, on-the-job)
2. "Have you completed any courses or earned certifications?"
   - Course name, platform, completion date
   - Any credentials or certificates?
```

**Data Collected:**
- ✅ skills with proficiency levels
- ✅ certifications_courses[] array

**Storage Strategy:**
- Fixed fields: skill names, proficiency enum, certification details
- Vector: how skills were acquired, application context

#### **Phase 5: Additional Background (L2 + L3 Data)**
**Goal:** Capture supplementary CV elements

```typescript
Conversation Topics:
1. Education history:
   - "Any other degrees, diplomas, or relevant education?"
   - A-Levels, other universities, bootcamps
2. Languages:
   - "What languages do you speak?"
   - Proficiency levels
3. Leadership & extracurriculars:
   - "Any leadership roles, volunteer work, or society involvement?"
4. Awards & achievements:
   - "Any competitions, awards, or recognitions?"
```

**Data Collected:**
- ✅ education[] additional entries
- ✅ languages[]
- ✅ leadership_volunteering[]
- ✅ extracurriculars_achievements[]

**Storage Strategy:**
- Fixed fields: all core attributes (dates, names, types)
- Vector: narratives and context

#### **Phase 6: Career Preferences (Matching Context)**
**Goal:** Collect data for personalized suggestions (NOT for CV)

```typescript
Conversation Topics:
1. "What types of roles are you interested in?"
2. "Any specific industries or company types you prefer?"
3. "Are you open to relocating? Remote work?"
4. "What are your salary expectations?" (optional, sensitive)
5. "What matters most to you in your next opportunity?"
```

**Data Collected:**
- ✅ open_to_roles[]
- ✅ relocation_preferences
- ✅ work_authorization[] (critical for filtering)
- ✅ career priorities (learning, compensation, impact, etc.)

**Storage Strategy:**
- Fixed fields: work_authorization (for legal filtering), open_to_roles
- Vector: motivations, preferences, career narrative

---

## Part 5: Key Variables to Track

### Conversation State Variables

To make the chat smooth, you need to track:

```typescript
ConversationState {
  // PROGRESS TRACKING
  currentPhase: 1 | 2 | 3 | 4 | 5 | 6          // Which phase are we in?
  completedSections: string[]                    // ["profile", "education", "experience"]
  incompleteSections: string[]                   // ["projects", "certifications"]
  
  // CONTEXT AWARENESS
  lastCollectedEntity: string                    // "experience_revolut"
  lastAskedQuestion: string                      // "What was your role at Revolut?"
  pendingFollowUps: string[]                     // ["Ask about Revolut metrics", "Ask about skills gained"]
  
  // USER BEHAVIOR
  engagementLevel: "high" | "medium" | "low"     // How detailed are their answers?
  preferredAnswerStyle: "brief" | "detailed"     // Do they give long or short answers?
  sensitivTopicsSkipped: string[]                // ["salary", "gpa"]
  
  // DATA QUALITY
  fieldsWithHighConfidence: string[]             // Well-structured, complete answers
  fieldsNeedingClarification: string[]           // Vague or incomplete answers
  
  // CONVERSATION FLOW
  totalMessagesExchanged: number
  timeInConversation: number                     // seconds
  interruptionsDetected: number                  // User changed topic mid-flow
}
```

### Data Completeness Tracking

```typescript
CVCompleteness {
  // OVERALL
  overallScore: number                           // 0-100%
  isMinimumViable: boolean                       // Can we generate a basic CV?
  
  // BY SECTION
  profile: {
    score: number,                               // 0-100%
    missingFields: string[],                     // ["linkedin", "headline"]
    priority: "critical" | "important" | "optional"
  },
  education: {
    score: number,
    entriesCount: number,                        // How many education entries?
    missingFields: string[],
    priority: "critical"
  },
  experience: {
    score: number,
    entriesCount: number,
    hasMetrics: boolean,                         // Do any experiences have quantified impact?
    priority: "critical"
  },
  // ... similar for other sections
  
  // ACTIONABLE INSIGHTS
  nextRecommendedSection: string                 // What should we ask about next?
  estimatedTimeToComplete: number                // minutes
}
```

### Matching-Specific Variables

```typescript
MatchingContext {
  // DERIVED FROM CV DATA
  primarySkills: string[]                        // Top 5-7 core skills
  secondarySkills: string[]                      // Supporting skills
  experienceLevel: "entry" | "junior" | "mid"    // Based on years + impact
  strongestDomain: string                        // "fintech", "ai", "marketing"
  
  // CAREER TRAJECTORY
  roleProgression: string[]                      // ["Intern" → "Project Lead" → "Founder"]
  interestEvolution: string[]                    // How interests changed over time
  
  // MATCHING PREFERENCES
  idealRoleProfile: {
    roleTypes: string[],
    industries: string[],
    companyStages: string[],                     // startup, scaleup, enterprise
    requiredSkills: string[],
    niceToHaveSkills: string[]
  },
  
  // CONSTRAINTS
  workAuthorization: string[],
  locationPreferences: {
    current: string,
    openToRemote: boolean,
    openToRelocation: boolean,
    preferredLocations: string[]
  },
  availabilityConstraints: {
    startDate: date,
    hoursPerWeek: number,
    duration: string
  }
}
```

---

## Part 6: Making It All Reusable

### Use Case 1: Custom CV Generation

**How it works:**

```typescript
async function generateCustomCV(
  studentId: string,
  opportunity: {
    title: string,
    description: string,
    required_skills: string[],
    nice_to_have_skills: string[],
    role_type: string
  }
): Promise<CustomCV> {
  
  // 1. Fetch ALL student data (fixed + vector)
  const studentData = await fetchCompleteStudentProfile(studentId)
  
  // 2. Analyze opportunity requirements
  const requirements = extractRequirements(opportunity)
  
  // 3. Select relevant experiences (using vector similarity)
  const relevantExperiences = studentData.experience.filter(exp => 
    calculateRelevanceScore(exp, requirements) > 0.6
  ).sort((a, b) => b.relevanceScore - a.relevanceScore)
  
  // 4. Select relevant projects
  const relevantProjects = studentData.projects.filter(proj =>
    calculateRelevanceScore(proj, requirements) > 0.6
  ).sort((a, b) => b.relevanceScore - a.relevanceScore)
  
  // 5. Prioritize skills (show required skills first)
  const orderedSkills = [
    ...requirements.required_skills.filter(skill => 
      studentData.skills.includes(skill)
    ),
    ...studentData.skills.filter(skill =>
      !requirements.required_skills.includes(skill)
    )
  ]
  
  // 6. Craft a targeted headline
  const headline = generateHeadline(studentData, opportunity)
  // e.g., "PPE Student | Python & R | Fintech Experience @ Revolut"
  
  // 7. Select relevant coursework/modules
  const relevantModules = studentData.education.flatMap(edu =>
    edu.modules.filter(module =>
      isRelevantToOpportunity(module, requirements)
    )
  )
  
  // 8. Assemble CV in priority order
  return {
    profile: {
      name: studentData.name,
      headline: headline,
      contact: studentData.contact,
      location: studentData.location
    },
    education: studentData.education.map(edu => ({
      ...edu,
      modules: relevantModules.filter(m => m.educationId === edu.id),
      coursework_highlights: edu.coursework_highlights.filter(h =>
        isRelevantToOpportunity(h, requirements)
      )
    })),
    experience: relevantExperiences.slice(0, 3), // Top 3 most relevant
    projects: relevantProjects.slice(0, 2),      // Top 2 most relevant
    skills: orderedSkills.slice(0, 8),           // Top 8 most relevant
    certifications: studentData.certifications.filter(cert =>
      isRelevantToOpportunity(cert, requirements)
    )
  }
}
```

**Key Insight:** The SAME data is repackaged differently for each opportunity.

### Use Case 2: Intelligent Matching

**How it works:**

```typescript
async function findMatchingOpportunities(
  studentId: string,
  limit: number = 10
): Promise<RankedOpportunity[]> {
  
  // 1. Fetch student profile + vector
  const student = await fetchCompleteStudentProfile(studentId)
  const studentVector = await getStudentVector(studentId)
  
  // 2. Get all active opportunities
  const opportunities = await getActiveOpportunities()
  
  // 3. Calculate multiple similarity scores
  const rankedOpportunities = await Promise.all(
    opportunities.map(async (opp) => {
      
      // Generate opportunity vector
      const oppVector = await generateOpportunityVector(opp)
      
      // Calculate different types of matches
      const scores = {
        // Vector similarity (semantic understanding)
        profileMatch: cosineSimilarity(
          studentVector.profileVector, 
          oppVector
        ),
        
        // Fixed field matching (hard requirements)
        skillsMatch: calculateSkillOverlap(
          student.skills, 
          opp.required_skills
        ),
        
        experienceMatch: calculateExperienceRelevance(
          student.experience,
          opp.experience_level
        ),
        
        educationMatch: calculateEducationFit(
          student.education,
          opp.education_requirements
        ),
        
        // Preference alignment
        roleInterestMatch: calculateInterestAlignment(
          student.open_to_roles,
          opp.role_type
        ),
        
        locationMatch: calculateLocationFit(
          student.location,
          student.relocation_preferences,
          opp.location,
          opp.remote
        )
      }
      
      // Weighted composite score
      const overallScore = (
        scores.profileMatch * 0.25 +
        scores.skillsMatch * 0.30 +
        scores.experienceMatch * 0.20 +
        scores.roleInterestMatch * 0.15 +
        scores.locationMatch * 0.10
      )
      
      return {
        opportunity: opp,
        score: overallScore,
        breakdown: scores,
        explanation: generateMatchExplanation(student, opp, scores)
      }
    })
  )
  
  // 4. Sort by score and return top matches
  return rankedOpportunities
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
```

### Use Case 3: Personalized Suggestions

**How it works:**

```typescript
async function generateCareerSuggestions(
  studentId: string
): Promise<CareerSuggestions> {
  
  const student = await fetchCompleteStudentProfile(studentId)
  const studentVector = await getStudentVector(studentId)
  
  // Analyze career trajectory
  const trajectory = analyzeCareerTrajectory(student.experience, student.projects)
  
  // Find skill gaps for desired roles
  const desiredRoles = student.open_to_roles
  const skillGaps = await Promise.all(
    desiredRoles.map(async role => {
      const roleRequirements = await getRoleTypicalSkills(role)
      const missing = roleRequirements.filter(skill =>
        !student.skills.includes(skill)
      )
      return { role, missingSkills: missing }
    })
  )
  
  // Find similar students who succeeded
  const similarSuccessfulStudents = await findSimilarStudents(
    studentVector.profileVector,
    filters: { hasPlacementInRole: student.open_to_roles }
  )
  
  // Generate suggestions
  return {
    roleProgression: {
      current: inferCurrentLevel(student),
      next: inferNextLevelRoles(student),
      explanation: "Based on your experience at Revolut and Bidaaya..."
    },
    
    skillDevelopment: {
      priority: skillGaps.filter(gap => gap.missingSkills.length > 0),
      reasoning: "To strengthen your profile for Product Manager roles..."
    },
    
    certifications: {
      recommended: recommendCertifications(student, skillGaps),
      reasoning: "These certifications would address your skill gaps..."
    },
    
    experiences: {
      suggestedNextSteps: [
        "Seek roles that involve cross-functional collaboration",
        "Build a portfolio project showcasing Product Management"
      ],
      basedOn: "Students with similar backgrounds who succeeded..."
    },
    
    opportunities: {
      bestMatches: await findMatchingOpportunities(studentId, 5),
      reasoning: "These opportunities align with your skills and goals..."
    }
  }
}
```

### Use Case 4: Smooth Conversational Experience

**How it works:**

```typescript
async function generateSmartResponse(
  message: string,
  conversationId: string,
  userId: string
): Promise<ChatResponse> {
  
  // 1. Fetch conversation context
  const conversation = await getConversation(conversationId)
  const state = conversation.state // ConversationState object
  
  // 2. Fetch what we know about the student so far
  const studentData = await fetchCompleteStudentProfile(userId)
  const completeness = calculateCVCompleteness(studentData)
  
  // 3. Detect user intent
  const intent = detectIntent(message)
  
  // 4. Handle different intents
  switch (intent) {
    case 'providing_info':
      // Extract structured data from their message
      const extracted = await extractStructuredData(
        message, 
        state.lastAskedQuestion
      )
      
      // Save to database
      await saveExtractedData(userId, extracted)
      
      // Update conversation state
      state.lastCollectedEntity = extracted.entityType
      
      // Determine next question
      const nextQuestion = determineNextQuestion(
        state,
        completeness
      )
      
      return {
        message: `Great! ${generateAcknowledgment(extracted)}. ${nextQuestion}`,
        action: 'continue_collection',
        dataCollected: extracted
      }
    
    case 'asking_about_opportunities':
      // User wants to see matches
      const matches = await findMatchingOpportunities(userId, 5)
      
      return {
        message: `Based on your ${studentData.major} background and ${studentData.skills[0]} skills, here are some great matches:`,
        action: 'show_opportunities',
        opportunities: matches
      }
    
    case 'asking_for_cv':
      // User wants to see/download their CV
      if (!completeness.isMinimumViable) {
        return {
          message: `I'd love to generate your CV, but we need a bit more information first. Let's complete these sections: ${completeness.incompleteSections.join(', ')}`,
          action: 'redirect_to_collection'
        }
      }
      
      const cv = await generateGenericCV(userId)
      
      return {
        message: `Here's your CV! I've highlighted your ${studentData.experience[0]?.employer} experience and ${studentData.skills[0]} skills.`,
        action: 'show_cv',
        cv: cv
      }
    
    case 'asking_for_suggestions':
      // User wants career advice
      const suggestions = await generateCareerSuggestions(userId)
      
      return {
        message: `Based on your trajectory from ${studentData.experience[0]?.employer} to ${studentData.projects[0]?.name}, I'd suggest...`,
        action: 'show_suggestions',
        suggestions: suggestions
      }
    
    case 'confused_or_off_topic':
      // User seems lost
      return {
        message: `No worries! We're building your professional profile together. Right now we're in the ${state.currentPhase === 1 ? 'basics' : state.currentPhase === 2 ? 'experience' : 'projects'} section. ${state.lastAskedQuestion}`,
        action: 'refocus'
      }
  }
}
```

**Key Features for Smoothness:**
- ✅ **Context retention:** Remember what was already asked
- ✅ **Smart acknowledgments:** Confirm what was understood
- ✅ **Adaptive pacing:** Detect engagement and adjust question depth
- ✅ **Flexible navigation:** Let users jump between sections
- ✅ **Real-time validation:** Catch incomplete or unclear answers immediately

---

## Part 7: Database Schema Recommendations

### Option A: Keep User Model, Add CV Tables (Recommended)

```prisma
// Keep existing User model as-is for backward compatibility
model User {
  // ... existing fields ...
  
  // Add relations to new CV tables
  cvProfile         CVProfile?
  cvEducation       CVEducation[]
  cvExperience      CVExperience[]
  cvProjects        CVProject[]
  cvCertifications  CVCertification[]
  cvLanguages       CVLanguage[]
  cvAchievements    CVAchievement[]
}

// New CV-specific tables
model CVProfile {
  id                     String   @id @default(cuid())
  userId                 String   @unique
  
  // Enhanced profile fields
  headline               String?
  professional_summary   String?
  portfolio_link         String?
  github_link            String?
  work_authorization     String[] // ["uk_student_visa", "uae_resident"]
  open_to_roles          String[]
  relocation_preferences String?
  
  user User @relation(fields: [userId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model CVEducation {
  id                  String   @id @default(cuid())
  userId              String
  
  degree_type         String   // bsc, msc, a_levels, etc.
  degree_title        String   // "BSc in Economics and Politics"
  field_of_study      String   // "Economics"
  institution         String   // "UCL"
  institution_location String?
  
  start_date          DateTime
  end_date            DateTime?
  is_current          Boolean  @default(false)
  
  predicted_grade     String?
  final_grade         String?
  gpa                 Float?
  
  modules             String[] // ["Econometrics", "Game Theory"]
  coursework_highlights String[] // ["Dissertation on FinTech"]
  honors_awards       String[]
  
  user User @relation(fields: [userId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId])
  @@index([start_date])
}

model CVExperience {
  id              String   @id @default(cuid())
  userId          String
  
  title           String   // "Operations Manager Intern"
  employer        String   // "Revolut"
  org_type        String?  // startup, scaleup, enterprise
  location        String?
  employment_type String   // internship, full_time, part_time
  
  start_date      DateTime
  end_date        DateTime?
  is_current      Boolean  @default(false)
  
  summary         String?  // 1-2 line role description
  
  user User @relation(fields: [userId], references: [id])
  impacts CVExperienceImpact[] // One-to-many relation
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId])
  @@index([start_date])
}

model CVExperienceImpact {
  id           String @id @default(cuid())
  experienceId String
  
  statement    String // "Reduced processing time by 40%"
  metrics      Json?  // [{ value: 40, unit: "%" }]
  skills_used  String[]
  evidence_links String[]
  
  // STAR format (optional)
  star_situation String?
  star_task      String?
  star_action    String?
  star_result    String?
  
  experience CVExperience @relation(fields: [experienceId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  
  @@index([experienceId])
}

model CVProject {
  id          String @id @default(cuid())
  userId      String
  
  name        String   // "Bidaaya"
  role        String?  // "Co-Founder"
  summary     String?
  tech_stack  String[] // ["Next.js", "React", "Prisma"]
  
  start_date  DateTime?
  end_date    DateTime?
  is_current  Boolean @default(false)
  
  project_url String?
  github_url  String?
  
  user User @relation(fields: [userId], references: [id])
  impacts CVProjectImpact[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId])
}

model CVProjectImpact {
  id        String @id @default(cuid())
  projectId String
  
  statement String
  metrics   Json?
  skills_used String[]
  
  project CVProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@index([projectId])
}

model CVCertification {
  id            String @id @default(cuid())
  userId        String
  
  name          String   // "SEO Mastery Course"
  issuer        String   // "Udemy"
  credential_id String?
  credential_url String?
  
  issue_date    DateTime
  expiry_date   DateTime?
  
  user User @relation(fields: [userId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId])
  @@index([issue_date])
}

model CVLanguage {
  id                String @id @default(cuid())
  userId            String
  
  language          String // "English"
  proficiency_level String // native, fluent, professional, intermediate, basic
  
  user User @relation(fields: [userId], references: [id])
  
  createdAt DateTime @default(now())
  
  @@unique([userId, language])
  @@index([userId])
}

model CVAchievement {
  id          String @id @default(cuid())
  userId      String
  
  type        String   // leadership, volunteering, award, competition
  name        String   // "Team Lead - HSBC DeFi Challenge"
  issuer      String?  // "HSBC"
  date        DateTime
  description String?
  
  user User @relation(fields: [userId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId])
  @@index([type])
}

model CVSkill {
  id          String @id @default(cuid())
  userId      String
  
  skill_name  String   // "Python"
  category    String   // hard_skill, soft_skill, tool, language
  proficiency String?  // beginner, intermediate, advanced, expert
  evidence_url String? // Portfolio/GitHub link demonstrating skill
  
  user User @relation(fields: [userId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([userId, skill_name])
  @@index([userId])
  @@index([category])
}
```

### Option B: JSON Storage (Simpler, Less Structured)

```prisma
model User {
  // ... existing fields ...
  
  // Add single JSON field for entire CV
  cv_data Json?
  cv_last_updated DateTime?
}

// Structure of cv_data:
{
  profile: {...},
  education: [...],
  experience: [...],
  projects: [...],
  certifications: [...],
  skills: [...],
  languages: [...],
  achievements: [...]
}
```

**Pros:**
- ✅ Faster to implement
- ✅ More flexible (easy to add fields)
- ✅ Simpler queries (single JSON field)

**Cons:**
- ❌ Can't filter/sort by specific CV fields in SQL
- ❌ No referential integrity
- ❌ Harder to validate data structure
- ❌ Less efficient for large datasets

**Recommendation:** Use **Option A** for production. It's more work upfront but provides better performance, validation, and query capabilities.

---

## Part 8: Updated Vector Strategy

### Expand Vector Model

```prisma
model StudentVector {
  id                  String @id @default(cuid())
  userId              String @unique
  
  // Existing vectors
  profileVector       Json   // General profile (bio + basic info)
  skillsVector        Json   // Skills-focused
  academicVector      Json   // Education-focused
  
  // NEW: Additional specialized vectors
  experienceVector    Json   // Work history + projects + impact narratives
  achievementsVector  Json   // Leadership + awards + extracurriculars
  careerNarrativeVector Json // Overall career story and trajectory
  
  vectorVersion       String @default("v2.0")
  lastUpdated         DateTime @default(now())
  createdAt           DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([vectorVersion])
  @@index([lastUpdated])
}
```

### What Each Vector Captures

```typescript
// profileVector: Basic understanding of the person
const profileText = `
  ${name}, based in ${location}
  Currently: ${education.institution}, ${education.field_of_study}
  Interested in: ${open_to_roles.join(', ')}
  ${bio}
`

// skillsVector: Capability-focused
const skillsText = `
  Technical Skills: ${hard_skills.join(', ')}
  Soft Skills: ${soft_skills.join(', ')}
  Tools: ${tools.join(', ')}
  Proficiency: ${Object.entries(proficiency).map(([skill, level]) => `${skill} (${level})`).join(', ')}
`

// academicVector: Educational background
const academicText = `
  ${education.map(edu => `
    ${edu.degree_type} in ${edu.field_of_study} at ${edu.institution}
    Modules: ${edu.modules.join(', ')}
    Achievements: ${edu.honors_awards.join(', ')}
  `).join('. ')}
`

// experienceVector: Work narrative
const experienceText = `
  ${experience.map(exp => `
    ${exp.title} at ${exp.employer}: ${exp.summary}
    Key achievements: ${exp.impacts.map(i => i.statement).join('; ')}
  `).join('. ')}
  
  ${projects.map(proj => `
    ${proj.name}: ${proj.summary}
    Impact: ${proj.impacts.map(i => i.statement).join('; ')}
    Tech: ${proj.tech_stack.join(', ')}
  `).join('. ')}
`

// achievementsVector: Leadership & recognition
const achievementsText = `
  ${leadership.map(l => `${l.title} at ${l.organization}: ${l.impact}`).join('. ')}
  ${achievements.map(a => `${a.name} - ${a.description}`).join('. ')}
`

// careerNarrativeVector: Holistic story
const careerNarrativeText = `
  ${name} is ${infer_current_level} with experience in ${infer_domains}.
  Started with ${education[0].field_of_study} at ${education[0].institution},
  then gained experience through ${experience.map(e => e.employer).join(', ')}.
  Built projects like ${projects.map(p => p.name).join(', ')}.
  Demonstrated ${soft_skills.join(', ')} through ${leadership[0]?.title}.
  Seeking ${open_to_roles.join(' or ')} opportunities where can apply ${top_skills.join(', ')}.
`
```

### When to Regenerate Vectors

```typescript
const REGENERATE_TRIGGERS = [
  'new_experience_added',
  'new_project_added',
  'skills_updated',
  'education_updated',
  'major_profile_changes'
]

async function handleDataUpdate(userId: string, updateType: string, data: any) {
  // Save fixed field data
  await saveStructuredData(userId, updateType, data)
  
  // Check if vectors need regeneration
  if (REGENERATE_TRIGGERS.includes(updateType)) {
    console.log(`📊 Triggering vector regeneration for ${userId}`)
    
    // Regenerate affected vectors asynchronously
    await queueVectorRegeneration({
      userId,
      vectorTypes: determineAffectedVectors(updateType),
      priority: 'medium'
    })
  }
}
```

---

## Part 9: Implementation Roadmap

### Phase 1: Database Migration (Week 1)
- [ ] Create new CV-related tables (CVEducation, CVExperience, etc.)
- [ ] Add relations to User model
- [ ] Write migration scripts
- [ ] Update Prisma schema
- [ ] Run migrations on dev environment

### Phase 2: Data Collection Logic (Week 2-3)
- [ ] Build conversation flow state machine
- [ ] Implement entity extraction from messages
- [ ] Create data validation logic
- [ ] Build completeness calculator
- [ ] Add conversation context tracking

### Phase 3: Storage & Retrieval (Week 3-4)
- [ ] Implement CRUD operations for all CV tables
- [ ] Build data completeness APIs
- [ ] Create vector regeneration service
- [ ] Add caching layer for performance

### Phase 4: CV Generation (Week 4-5)
- [ ] Build custom CV generator
- [ ] Implement relevance scoring
- [ ] Create CV templates
- [ ] Add export functionality (PDF, JSON)

### Phase 5: Matching Enhancement (Week 5-6)
- [ ] Enhance vector matching with new vectors
- [ ] Build composite scoring algorithm
- [ ] Implement opportunity ranking
- [ ] Add match explanation generator

### Phase 6: Chat Integration (Week 6-7)
- [ ] Update chat API to use new data structures
- [ ] Implement smart questioning logic
- [ ] Add real-time data validation
- [ ] Build conversation recovery mechanisms

### Phase 7: Testing & Refinement (Week 7-8)
- [ ] Test conversation flows end-to-end
- [ ] Validate CV generation quality
- [ ] Test matching accuracy
- [ ] Optimize vector regeneration performance
- [ ] User testing & feedback collection

---

## Part 10: Quick Reference

### What Goes Where?

| Data Type | Storage Method | Example |
|-----------|---------------|---------|
| **Names, titles, dates** | Fixed fields | `institution: "UCL"`, `start_date: 2022-09-01` |
| **Enums & categories** | Fixed fields | `degree_type: "bsc"`, `proficiency: "advanced"` |
| **Small arrays** | Fixed fields | `modules: ["Economics", "Statistics"]` |
| **Metrics** | Structured JSON | `metrics: [{ value: 40, unit: "%" }]` |
| **Descriptions** | Fixed fields + Vector | Fixed: raw text, Vector: embedding |
| **Impact statements** | Fixed fields + Vector | Fixed: statement text, Vector: semantic understanding |
| **Career narratives** | Vector only | Holistic profile understanding |

### Conversation Structure

1. **Phase 1:** Profile basics (name, contact, primary education)
2. **Phase 2:** Work experience (jobs, internships, impact)
3. **Phase 3:** Projects (personal projects, side work)
4. **Phase 4:** Skills & certifications
5. **Phase 5:** Additional background (languages, leadership, awards)
6. **Phase 6:** Career preferences (roles, preferences, constraints)

### Key Metrics to Track

- **Conversation completion rate:** % of students who complete all phases
- **Data quality score:** How complete and detailed is the collected data
- **Time to minimum viable CV:** How long until we can generate a basic CV
- **Vector regeneration frequency:** How often do we need to update embeddings
- **Matching accuracy:** Do generated matches result in applications?
- **CV customization effectiveness:** Do custom CVs perform better than generic ones?

---

## Conclusion

You're building a **sophisticated conversational CV builder** that:

1. ✅ **Collects structured data** through natural dialogue (not a form)
2. ✅ **Stores strategically** using both fixed fields (filtering) and vectors (semantic matching)
3. ✅ **Enables multiple use cases**:
   - Dynamic, opportunity-specific CV generation
   - Intelligent candidate-opportunity matching
   - Personalized career suggestions
   - Smooth conversational experience with context retention

4. ✅ **Evolves from flat to rich**:
   - Currently: Single education entry, basic skills array, no work history
   - Target: Multiple education entries with modules/grades, structured work experience with impact metrics, projects with tech stacks, certifications, languages, achievements

5. ✅ **Balances efficiency with capability**:
   - Fixed fields for filtering, sorting, exact matching
   - Vectors for semantic understanding, similarity, personalization

**Next Steps:**
1. Review and approve this strategy
2. Decide on database schema approach (Option A recommended)
3. Begin Phase 1: Database migration
4. Build conversation flow state machine
5. Implement data collection logic

**Remember:** Every piece of data you collect should answer: "Does this help build a better CV, improve matching, or enhance the user experience?" If yes, it's worth collecting. If no, skip it.

