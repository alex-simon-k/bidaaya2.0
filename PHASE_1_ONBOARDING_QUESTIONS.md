# Phase 1: Structured Onboarding Questions (Chat Format)

## Overview
These questions replace the existing multi-page onboarding form. They are presented in a **structured chat format** with multiple choice options (except name/text fields). Students cannot proceed to Phase 2 until all Phase 1 questions are answered.

## Question Flow

### Question 1: Name
- **Type:** Text input
- **Agent Message:** "Welcome to Bidaaya! I'm excited to help you discover amazing opportunities. Let's start with the basics - what's your full name?"
- **Format:** Free text input
- **Validation:** Required, must be at least 2 characters
- **Database Field:** `name`

### Question 2: Date of Birth
- **Type:** Date picker
- **Agent Message:** "Great to meet you, [Name]! When is your date of birth?"
- **Format:** Date picker or text input (DD/MM/YYYY)
- **Validation:** Required, must be 16+ years old
- **Database Field:** `dateOfBirth`

### Question 3: Education Status
- **Type:** Multiple choice (4 options)
- **Agent Message:** "Perfect! Now, what's your current education status?"
- **Options:**
  1. 🎒 High School
  2. 🌟 Gap Year
  3. 🎓 University
  4. 👔 Graduated
- **Format:** Button selection
- **Database Field:** `educationStatus`

### Question 4: MENA Connection
- **Type:** Multiple choice (4 options)
- **Agent Message:** "Thanks! How frequently are you in the MENA region?"
- **Options:**
  1. 🏠 I live there
  2. ✈️ I go back for holidays
  3. 📚 I study abroad and go back as much as possible
  4. 🌍 No, I don't live there. I'm a tourist.
- **Format:** Button selection
- **Database Field:** `mena`

### Question 5: WhatsApp Number
- **Type:** Text input (phone number)
- **Agent Message:** "Almost done with the basics! What's your WhatsApp number? This helps companies verify and reach you faster. 📱"
- **Format:** Phone number input (optional)
- **Validation:** Optional, but recommended
- **Database Field:** `whatsapp`
- **Note:** Show benefit: "📊 Students who provide contact details receive 50% more interview opportunities"

### Question 6: LinkedIn Profile
- **Type:** Text input (URL)
- **Agent Message:** "Do you have a LinkedIn profile you'd like to share? It really helps boost your profile!"
- **Format:** URL input (optional)
- **Validation:** Optional, must be valid URL if provided
- **Database Field:** `linkedin`

### Question 7: Terms & Conditions
- **Type:** Multiple choice (2 options)
- **Agent Message:** "Before we continue, please confirm you've read and agree to our Terms & Conditions."
- **Options:**
  1. ✅ I agree to the [Terms & Conditions](/terms)
  2. ❌ I need to read them first
- **Format:** Button selection
- **Validation:** Required, must select "I agree"
- **Database Field:** `terms`
- **Action:** If "I need to read them first" is selected, open terms in new tab and ask again

---

## Phase 1 Completion Trigger

Once all 7 questions are answered:
1. Save data to database (`name`, `dateOfBirth`, `educationStatus`, `mena`, `whatsapp`, `linkedin`, `terms`)
2. Update user profile: `onboardingPhase = 'cv_building'`
3. Show transition message: "Awesome! Now let's build your profile so I can find the perfect opportunities for you. 🚀"
4. **Unlock sidebar** (but most features remain locked)
5. Transition to **Phase 2: CV Building Checklist**

---

## UI/UX Requirements

### Chat Interface
- Messages appear one at a time
- Agent avatar on left (Bidaaya logo)
- User responses on right (user initial/avatar)
- Smooth animations for message appearance
- Typing indicator when agent is "thinking"

### Multiple Choice Buttons
- Large, tappable buttons (mobile-friendly)
- Hover effects
- Selected state with checkmark
- Disabled state after selection
- Auto-scroll to next question after selection

### Sidebar State (Phase 1)
- **Locked:** Sidebar is hidden or shows "Complete setup first" message
- **No navigation available** until Phase 1 is complete

### Progress Indicator
- Linear progress bar at top: "Setup: 1/7" → "Setup: 7/7"
- Or circular progress: "14% Complete" → "100% Complete"

---

## Technical Implementation Notes

1. **State Management:** Store responses in React state, submit to API only after all questions answered
2. **Validation:** Real-time validation with error messages
3. **API Endpoint:** `PATCH /api/user/profile` (existing endpoint)
4. **Database:** Update existing user profile fields
5. **Session:** Update NextAuth session with `onboardingPhase: 'cv_building'`

