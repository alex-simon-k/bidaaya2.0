# Bidaaya Subscription System Implementation

## Overview
Comprehensive subscription tier system with enforcement, UI, and backend integration.

## Student Subscription Tiers
*Pricing designed to be very affordable for students, with yearly discounts available*

### 1. Explorer (Free) - $0/month
- 5 Bidaaya applications per month
- Basic project discovery
- Career discovery quiz (free)
- Basic profile setup
- Email notifications
- Community support

### 2. Career Builder - $5/month ($48/year with 20% discount)
- 15 Bidaaya applications per month
- External job application tracking
- Enhanced profile with portfolio
- Priority in search rankings
- Advanced career timeline
- Application analytics
- Email support

### 3. Career Accelerator - $20/month ($192/year with 20% discount)
- 30 Bidaaya applications per month
- Unlimited external job tracking
- One-to-one mentorship sessions
- Interview preparation resources
- AI-powered career recommendations
- Premium profile badge
- Priority interview invitations
- Dedicated career support
- Advanced analytics dashboard

## Company Subscription Tiers

### 1. Basic - $49/month
- 1 active project at a time
- AI shortlisting (top 10 candidates only)
- Template-based projects only
- Interview scheduling tools
- Email notifications
- Basic analytics
- **Limitation**: Only see shortlisted candidates

### 2. HR Booster - $149/month
- Up to 5 simultaneous projects
- AI shortlisting (top 10 candidates)
- **Full applicant pool visibility**
- Custom project creation
- Interview scheduling & management
- Candidate communication tools
- Advanced analytics dashboard
- Priority email support

### 3. Full-Service - $299/month
- Unlimited simultaneous projects
- AI shortlisting & ranking
- Complete applicant transparency
- **We conduct interviews for you**
- Interview transcript analysis
- Team recommendations delivered
- Dedicated account manager
- Custom integrations
- White-label options
- API access

## Key Implementation Features

### 1. Subscription Enforcement
- Application limits enforced at API level
- Project creation limits for companies
- Upgrade prompts when limits reached
- Monthly reset system for application counts

### 2. Applicant Visibility Levels
- **Basic**: Only shortlisted candidates (10 max)
- **HR Booster**: Full applicant pool + shortlisted
- **Full-Service**: Complete transparency + interview service

### 3. UI Components
- Subscription management page (`/subscription`)
- Usage stats dashboard widget
- Upgrade prompt modals (compact & full-screen)
- Updated paywall modals for both student and company
- Navigation integration

### 4. API Features
- Subscription validation in applications API
- Project creation limits in projects API
- Monthly reset endpoint for admins
- Feature access matrix system

### 5. Database Integration
- Uses existing Prisma schema fields:
  - `subscriptionPlan` (FREE, STUDENT_PRO, STUDENT_PREMIUM, COMPANY_BASIC, etc.)
  - `subscriptionStatus` (FREE, ACTIVE, CANCELLED, etc.)
  - `applicationsThisMonth` tracking
  - `lastMonthlyReset` for automated resets

### 6. Pricing Structure
- **Student-Friendly Pricing**: Very affordable at $5 and $20 monthly
- **Yearly Discounts**: 20% off for annual subscriptions
- **Company Premium Pricing**: Higher prices reflect business value and service level
- **Billing Toggle**: Monthly vs yearly options with clear savings display

## Technical Architecture

### Core Files
- `src/lib/subscription.ts` - Main subscription logic and tier definitions
- `src/lib/pricing.ts` - Pricing configuration for modals
- `src/components/upgrade-prompt.tsx` - Upgrade UI components
- `src/app/subscription/page.tsx` - Subscription management page

### API Endpoints
- `POST /api/applications` - Enforces application limits
- `POST /api/projects` - Enforces project limits  
- `POST /api/users/reset-monthly` - Admin monthly reset
- `GET /api/users/reset-monthly` - Reset statistics

### Helper Functions
- `canUserApply(user, applicationCount)` - Check student limits
- `canCompanyCreateProject(user, projectCount)` - Check company limits
- `getApplicantVisibilityLevel(user)` - Determine visibility level
- `getSubscriptionTier(plan, role)` - Get tier configuration

## UI/UX Features

### Subscription Page Features
- Role-based tier display (Student vs Company)
- Current plan highlighting
- Feature comparison table
- Mobile-responsive design
- Upgrade/downgrade buttons (ready for Stripe)

### Dashboard Integration
- Usage stats card showing monthly progress
- Progress bars with color coding (green/amber/red)
- Navigation menu integration
- Admin panel access for admins

### Upgrade Prompts
- Contextual prompts when limits hit
- Compact banner and full modal versions
- Clear messaging about current vs next tier
- Direct links to subscription page

## Business Logic

### Application Limits
- Students: 5, 15, 30 applications per month by tier
- Enforced at application creation
- Automatic monthly reset system
- Clear error messages with upgrade paths

### Project Limits  
- Companies: 1, 5, unlimited projects by tier
- Enforced at project creation
- Active project counting (PENDING_APPROVAL + LIVE)
- Upgrade prompts for limit exceeded

### Visibility Controls
- Basic: Shortlisted candidates only (promotes fairness)
- HR Booster: Full applicant pool access
- Full-Service: Complete transparency + interview service

## Future Enhancements Ready
- Stripe payment integration (placeholders ready)
- Interview service automation for Full-Service tier
- Advanced analytics features
- External job tracking for students
- Mentorship scheduling system
- API access for Premium company tier

## Admin Features
- Monthly application reset endpoint
- Reset statistics monitoring
- User subscription management via Prisma Studio
- Case-insensitive admin role checking 