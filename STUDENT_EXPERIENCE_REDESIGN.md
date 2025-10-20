# Student Experience Redesign - Product Vision

## Overview
Transform Bidaaya from a complex application platform into a **daily matchmaking service** that suggests the best opportunities to students based on their profile.

---

## Student Journey

### Phase 1: Onboarding & Profile Building
**Current:** CV chat system with 3-level conversation
**New Vision:** Checklist-based conversational profile builder

#### Profile Completion Checklist
- ✅ Personal Information (name, email, university, major)
- ✅ Work Experience
- ✅ Volunteering Experience
- ✅ Projects
- ✅ Skills & Competencies
- ✅ Hobbies & Interests
- ✅ Career Goals & Preferences
- ✅ Availability & Location Preferences

#### User Experience
1. Student lands on chat interface (similar to ChatGPT/Claude)
2. Bidaaya shows checklist of what it needs to know
3. Student talks (text or voice) about their experiences
4. As they talk, checkboxes get ticked off automatically
5. AI extracts and structures all information
6. Once all checkboxes complete → Profile is ready

### Phase 2: Daily Dashboard (Main Experience)
**Current:** Chat is always prominent
**New Vision:** Dashboard-first, chat becomes a widget

#### Dashboard Layout

##### 1. Today's Pick (Top Section - LOCKED for Free Users)
**Free Users:**
- 🔒 Shows 1 exclusive early-access opportunity
- Requires credits to unlock
- "Unlock for X credits" button

**Basic Paid Tier ($X/month):**
- 🔓 10 free unlocks per month
- 24-48 hour early access to new opportunities
- Can use credits for additional unlocks
- Badge: "Early Access - Posted X hours ago"

**Premium Paid Tier ($Y/month):**
- 🔓 20 free unlocks per month  
- 24-48 hour early access to new opportunities
- Can use credits for additional unlocks
- Badge: "Early Access - Posted X hours ago"

**What Qualifies as "Today's Pick":**
- Opportunities posted in last 24-48 hours
- High match score for the student
- Limited time advantage (48h head start vs free users)

##### 2. Bidaaya Exclusive Internships
- 2 AI-matched Bidaaya-hosted projects
- Match score displayed (e.g., "92% Match")
- One-click apply (uses profile data automatically)
- No separate application flow needed

##### 3. External Opportunities
- 2 AI-matched external internships
- Match score displayed
- Custom CV generation (costs credits)
- Custom cover letter generation (costs credits)
- "Apply with Bidaaya CV" → Opens external link + downloads CV

##### 4. Quick Actions
- "Update My Profile" → Opens chat widget
- "Generate CV" (costs credits)
- "View All Opportunities"

##### 5. Chat Widget (Bottom Right Corner)
- Minimized by default
- Expandable chat bubble
- For quick updates: "I just completed X project"
- For questions: "Why did you suggest this opportunity?"
- Updates profile in real-time

---

## Matchmaking & Feedback System

### Match Score Display
Each opportunity card shows:
- **Match Percentage:** "87% Match"
- **Why This Match:** 
  - ✅ Your skills match 4/5 requirements
  - ✅ Your major aligns with role
  - ⚠️ Missing: 1 year Python experience (you have 6 months)

### Feedback Loop (Learning System)
When student views an opportunity and realizes they don't match:

**Feedback Flow:**
1. Student clicks opportunity
2. Sees full requirements
3. If they don't match, clicks "Report Mismatch"
4. Modal appears:
   - "What requirement didn't you meet?"
   - Options:
     * Specific degree requirement
     * Experience requirement (not enough years)
     * Skill requirement
     * Location mismatch
     * Other (text input)
5. Bidaaya learns and adjusts:
   - **Option A:** Show warning to other students with same gap
   - **Option B:** Don't suggest to students with same profile
   - **Option C:** Use for general ML model improvement

---

## Admin Requirements

### Opportunity Management Dashboard

#### Upload Opportunities
- CSV upload or manual entry
- Fields:
  - Title, company, description, requirements
  - Location, duration, compensation
  - **New Field:** `isNewOpportunity` (boolean)
  - **New Field:** `publishedAt` (timestamp)
  - **New Field:** `earlyAccessUntil` (timestamp = publishedAt + 48h)

#### New Opportunity Workflow
1. Admin uploads opportunity
2. Marks as "New Opportunity" (checkbox)
3. System automatically:
   - Sets `earlyAccessUntil` = now + 48 hours
   - Shows to paid users only for 48 hours
   - Shows "🌟 New - Early Access" badge
   - After 48h, shows to all users

#### Opportunity Status Filters
- All Opportunities
- Early Access (last 48h)
- Active
- Expired
- Draft

#### Analytics Dashboard
- Total opportunities
- Early access opportunities count
- Applications by tier (Free vs Basic vs Premium)
- Most applied opportunities
- Average match scores

---

## UX/UI Enhancements

### Opportunity Cards (Widget Design)
```
┌─────────────────────────────────────────┐
│ 🌟 NEW - Early Access (12h remaining)  │
├─────────────────────────────────────────┤
│                                         │
│  Software Engineer Intern               │
│  Tech Company Ltd.                      │
│                                         │
│  📍 London • 💰 £25k/year • ⏱️ 3 months │
│                                         │
│  ┌─────────────────┐                   │
│  │   87% Match ✨   │                   │
│  └─────────────────┘                   │
│                                         │
│  Why this matches you:                  │
│  ✅ React skills match                  │
│  ✅ Computer Science background         │
│  ⚠️  Need +6mo Python (you have 3mo)   │
│                                         │
│  [ View Details ]  [ Apply Now ]       │
│                                         │
└─────────────────────────────────────────┘
```

### Dashboard Responsive Design
- Desktop: 2-column grid for opportunities
- Mobile: Stacked single column
- Smooth animations
- Loading skeletons
- Pull-to-refresh on mobile

---

## Technical Implementation Plan

### Phase 1: Profile Builder Redesign ✅ (Partially Done)
- [x] CV chat system exists
- [ ] Add visible checklist UI
- [ ] Auto-tick checkboxes as user talks
- [ ] Add voice input support
- [ ] Add "Profile Complete" state

### Phase 2: Dashboard Transformation
- [ ] Create new dashboard layout
- [ ] Move chat to bottom-right widget
- [ ] Design opportunity cards
- [ ] Add match score calculation
- [ ] Implement credit system for unlocks

### Phase 3: Early Access System
- [ ] Add database fields: `isNewOpportunity`, `publishedAt`, `earlyAccessUntil`
- [ ] Create admin toggle for "New Opportunity"
- [ ] Implement 48h timer logic
- [ ] Filter opportunities by user tier
- [ ] Add "unlock with credits" flow

### Phase 4: Matchmaking & Feedback
- [ ] Build match score algorithm
- [ ] Create "Report Mismatch" flow
- [ ] Store feedback in database
- [ ] Create admin feedback dashboard
- [ ] Implement ML learning loop

### Phase 5: Simplified Applications
- [ ] Auto-apply to Bidaaya projects using profile
- [ ] Remove separate application forms for internal projects
- [ ] Keep credit-based CV/cover letter for external

---

## Database Schema Updates Needed

### New Tables
```sql
-- Early Access Unlocks
CREATE TABLE EarlyAccessUnlock {
  id          String   @id @default(cuid())
  userId      String
  opportunityId String
  unlockedAt  DateTime @default(now())
  usedCredit  Boolean  @default(false)
  
  user        User     @relation(fields: [userId], references: [id])
  opportunity Opportunity @relation(fields: [opportunityId], references: [id])
}

-- Opportunity Feedback
CREATE TABLE OpportunityFeedback {
  id             String   @id @default(cuid())
  userId         String
  opportunityId  String
  mismatchType   String   // "degree", "experience", "skill", "location", "other"
  details        String?
  createdAt      DateTime @default(now())
  
  user           User     @relation(fields: [userId], references: [id])
  opportunity    Opportunity @relation(fields: [opportunityId], references: [id])
}
```

### Updated Fields on Opportunity Model
```sql
model Opportunity {
  // ... existing fields
  isNewOpportunity Boolean   @default(false)
  publishedAt      DateTime? 
  earlyAccessUntil DateTime?
}
```

### Updated Fields on User Model
```sql
model User {
  // ... existing fields
  profileCompletionChecklist Json? // Store which checkboxes are ticked
  earlyAccessUnlocksRemaining Int @default(0) // Monthly unlocks
  earlyAccessUnlocksResetAt   DateTime? // When monthly counter resets
}
```

---

## Subscription Tier Updates

### Free Tier
- All basic features
- Cannot see "Today's Pick" without spending credits
- Can apply to regular opportunities
- Limited CV generations

### Basic Paid Tier ($15/month)
- Everything in Free
- 10 early access unlocks/month
- 24-48h early access to new opportunities
- Unlimited CV generations
- X credits/month

### Premium Paid Tier ($30/month)
- Everything in Basic
- 20 early access unlocks/month
- 24-48h early access to new opportunities
- Unlimited CV + cover letter generations
- Y credits/month
- Priority matching

---

## Success Metrics

### Student Engagement
- Daily active users
- Profile completion rate
- Average opportunities applied per week
- Match score accuracy (feedback-based)

### Revenue Metrics
- Conversion rate (Free → Paid)
- Early access unlock usage
- Credit purchases
- Churn rate by tier

### Quality Metrics
- Application success rate
- Feedback/mismatch rate (should decrease over time)
- Student satisfaction (NPS)

---

## Next Steps

1. **Immediate:** Design new dashboard mockups
2. **Week 1:** Implement profile checklist UI
3. **Week 2:** Build new dashboard layout
4. **Week 3:** Add early access system
5. **Week 4:** Implement feedback loop
6. **Week 5:** Testing & refinement
7. **Week 6:** Launch beta to select students

---

## Open Questions

1. How many credits should early access unlock cost for free users?
2. Should we have a separate "Save for Later" feature?
3. Do we want to gamify profile completion? (badges, progress bars)
4. Should match score be public or private?
5. How often should daily opportunities refresh? (daily at midnight? real-time?)

