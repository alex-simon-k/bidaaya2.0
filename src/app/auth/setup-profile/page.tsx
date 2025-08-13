'use client'

import { useState, ChangeEvent, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  GraduationCap, 
  MessageSquare, 
  Phone, 
  Linkedin, 
  CheckCircle, 
  Book, 
  Target, 
  Info, 
  Calendar,
  ArrowLeft,
  ArrowRight,
  Rocket,
  MapPin
} from 'lucide-react'
import { useOnboardingSession } from '@/lib/onboarding-session-manager'
import { OnboardingSessionManager } from '@/lib/onboarding-session-manager'

interface Step {
  key: keyof StudentProfileFormData | 'institutions' | 'contact-and-terms';
  label: string;
  type: 'text' | 'date' | 'select' | 'checkbox' | 'checkbox-single' | 'radio' | 'institutions' | 'textarea' | 'contact-with-terms';
  required: boolean;
  placeholder?: string;
  options?: string[];
  icon: JSX.Element;
  maxLength?: number;
  description?: string;
}

interface StudentProfileFormData {
  name: string;
  dateOfBirth: string;
  educationStatus: string;
  highSchool: string;
  university: string;
  subjects: string;
  goal: string[];
  interests: string[];
  bio: string;
  whatsapp: string;
  linkedin: string;
  mena: string;
  terms: boolean;
  [key: string]: string | string[] | boolean;
}

const steps: Step[] = [
  {
    key: 'name',
    label: 'What is your full name?',
    type: 'text',
    required: true,
    placeholder: 'Enter your full name',
    icon: <User className="w-8 h-8 text-emerald-600" />,
  },
  {
    key: 'dateOfBirth',
    label: 'What is your date of birth?',
    type: 'date',
    required: true,
    icon: <Calendar className="w-8 h-8 text-emerald-600" />,
  },
  {
    key: 'educationStatus',
    label: 'What is your current education status?',
    type: 'select',
    required: true,
    options: ['High School', 'Gap Year', 'University', 'Graduated'],
    placeholder: 'Select your status',
    icon: <GraduationCap className="w-8 h-8 text-emerald-600" />,
  },
  {
    key: 'institutions',
    label: 'What are your educational institutions?',
    type: 'institutions',
    required: true,
    icon: <GraduationCap className="w-8 h-8 text-emerald-600" />,
  },
  {
    key: 'subjects',
    label: 'What subjects have you pursued most recently?',
    type: 'text',
    required: true,
    placeholder: 'E.g. Computer Science, Business...',
    icon: <Book className="w-8 h-8 text-emerald-600" />,
  },
  {
    key: 'goal',
    label: 'What is your main goal with Bidaaya?',
    type: 'checkbox',
    required: true,
    options: ['Get Hired', 'Get Experience', 'Try New Things'],
    icon: <Target className="w-8 h-8 text-emerald-600" />,
  },
  {
    key: 'interests',
    label: 'What types of programs or industries interest you most?',
    type: 'checkbox',
    required: true,
    options: [
      'Technology & Software Development',
      'Marketing & Digital Media',
      'Finance & Banking',
      'Healthcare & Medical',
      'Education & Training',
      'Consulting & Strategy',
      'Design & Creative Arts',
      'Engineering & Manufacturing',
      'Sales & Business Development',
      'Non-profit & Social Impact',
      'Startups & Entrepreneurship',
      'Government & Public Sector'
    ],
    icon: <Rocket className="w-8 h-8 text-emerald-600" />,
  },
  {
    key: 'bio',
    label: 'Tell us something interesting about yourself.',
    type: 'textarea',
    required: true,
    placeholder: 'Something you are proud of, or a fun fact!',
    icon: <Info className="w-8 h-8 text-emerald-600" />,
    maxLength: 100,
  },
  {
    key: 'mena',
    label: 'How frequently are you in MENA?',
    type: 'radio',
    required: true,
    options: [
      'I live there',
      'I go back for holidays',
      'I study abroad and go back as much as possible',
      'No, I don\'t live there. I\'m a tourist.'
    ],
    icon: <MapPin className="w-8 h-8 text-emerald-600" />,
  },
  {
    key: 'contact-and-terms',
    label: 'Help companies contact you faster',
    type: 'contact-with-terms',
    required: true,
    icon: <Phone className="w-8 h-8 text-emerald-600" />,
    description: 'Students who provide contact details receive 50% more interview opportunities',
  },
]

export default function SetupProfilePage() {
  const { data: session, status, update } = useSession({
    required: false, // Don't auto-redirect, we'll handle it manually
  })
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [formData, setFormData] = useState<StudentProfileFormData>({
    name: '',
    dateOfBirth: '',
    educationStatus: '',
    highSchool: '',
    university: '',
    subjects: '',
    goal: [],
    interests: [],
    bio: '',
    whatsapp: '',
    linkedin: '',
    mena: '',
    terms: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [isProfileComplete, setIsProfileComplete] = useState(false)

  // Use onboarding session manager
  const { 
    isInOnboarding, 
    currentState, 
    shouldProtect, 
    updateStep, 
    markProfileCompleted, 
    completeOnboarding
  } = useOnboardingSession()

  // Start onboarding session if not already started
  useEffect(() => {
    if (session?.user?.email && !isInOnboarding) {
      OnboardingSessionManager.startOnboarding(session.user.email, 'profile-setup')
      // Use safe update activity after session is started
      setTimeout(() => {
        OnboardingSessionManager.safeUpdateActivity()
      }, 100)
    }
  }, [session?.user?.email, isInOnboarding])

  // Update activity on user interaction - only when in onboarding
  useEffect(() => {
    if (!isInOnboarding) return

    const handleActivity = () => {
      OnboardingSessionManager.safeUpdateActivity()
    }

    window.addEventListener('click', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('scroll', handleActivity)

    return () => {
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('scroll', handleActivity)
    }
  }, [isInOnboarding])

  // Handle authentication - only redirect if not in onboarding
  useEffect(() => {
    if (status === 'loading') return

    // Don't redirect if we're in the process of signing out
    if (isSigningOut) {
      console.log('🛡️ Sign out in progress - preventing redirect');
      return;
    }

    if (!session && !shouldProtect) {
      console.log('🔐 User not authenticated and not in onboarding, redirecting to login')
      router.push('/auth/login')
      return
    } else if (!session && shouldProtect) {
      console.log('🛡️ User not authenticated but in onboarding - protecting from redirect')
    }
  }, [session, status, router, shouldProtect, isSigningOut])

  useEffect(() => {
    if (session?.user?.name && step === 0 && !formData.name) {
      setFormData(prev => ({...prev, name: session.user!.name as string}))
    }
  }, [session, step, formData.name, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"
        />
      </div>
    )
  }

  // Return null if unauthenticated and not in onboarding
  if (!session && !shouldProtect) {
    return null
  }

  const currentStep = steps[step]
  const isLastStep = step === steps.length - 1
  const isFirstStep = step === 0
  const progress = ((step + 1) / steps.length) * 100

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (currentStep.type === 'checkbox' && type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => {
        const fieldName = currentStep.key === 'goal' ? 'goal' : 'interests';
        const arr = Array.isArray(prev[fieldName]) ? prev[fieldName] as string[] : [];
        if (checked) {
          return { ...prev, [fieldName]: [...arr, value] };
        } else {
          return { ...prev, [fieldName]: arr.filter((item: string) => item !== value) };
        }
      });
    } else if (currentStep.type === 'checkbox-single' && type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError(null);
  };

  const validateStep = () => {
    if (currentStep.required) {
      if (currentStep.type === 'institutions') {
        if (!formData.highSchool && !formData.university) {
          setError('Please enter at least one educational institution.');
          return false;
        }
      } else if (currentStep.type === 'checkbox') {
        const fieldName = currentStep.key === 'goal' ? 'goal' : 'interests';
        const fieldValue = formData[fieldName];
        if (!fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0)) {
          setError(`Please select at least one ${currentStep.key === 'goal' ? 'goal' : 'interest'}.`);
          return false;
        }
      } else if (currentStep.type === 'checkbox-single') {
        if (!formData.terms) {
          setError('You must agree to the Terms & Conditions.');
          return false;
        }
      } else if (currentStep.type === 'contact-with-terms') {
        if (!formData.terms) {
          setError('You must agree to the Terms & Conditions to continue.');
          return false;
        }
      } else if (!formData[currentStep.key as keyof StudentProfileFormData]) {
        setError('This field is required.');
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return
    setStep(s => s + 1)
  }

  const handleBack = () => {
    setStep(s => s - 1)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!validateStep()) return
    
    if (!session?.user?.email) {
      setError('User email not found. Please try signing in again.');
      return;
    }

    setIsLoading(true)
    try {
      console.log('🔐 Submitting profile with email:', session.user.email);
      
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          email: session.user.email
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      console.log('✅ Profile updated successfully');
      
      // Update the session to include the new profileCompleted status
      console.log('🔄 Updating session with profileCompleted: true');
      await update({ profileCompleted: true });

      // Update onboarding session
      markProfileCompleted()
      updateStep('complete')

      // Send welcome emails for students who have completed their profile and accepted terms
      if (formData.terms && session?.user?.email) {
        try {
          console.log('🎯 Student completed profile with terms accepted, triggering welcome emails');
          await fetch('/api/auth/send-student-welcome-emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: session.user.email,
              name: formData.name,
              university: formData.university,
              major: formData.subjects
            }),
          });
          console.log('✅ Welcome emails triggered successfully');
        } catch (emailError) {
          console.error('Failed to send welcome emails (non-blocking):', emailError);
          // Don't block the user's flow if email fails
        }
      }
      
      // Update session to reflect completed profile
      console.log('🔄 Updating session with completed profile data');
      await update({ profileCompleted: true });
      
      // Complete onboarding session
      completeOnboarding();
      
      // Clear onboarding state
      console.log('🧹 Clearing onboarding state');
      sessionStorage.removeItem('bidaaya_onboarding_state');
      
      // Show success message briefly before redirecting
      setIsProfileComplete(true);
      
      // Small delay to show success message, then redirect to dashboard
      setTimeout(() => {
        console.log('🚀 Redirecting to dashboard');
        router.push('/dashboard');
      }, 1500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show success screen when profile is complete
  if (isProfileComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden text-center p-8"
        >
          <div className="h-16 w-16 mx-auto bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="text-white h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Profile Complete!</h2>
          <p className="text-gray-600 mb-6">Welcome to Bidaaya! You're all set to start exploring opportunities.</p>
          <div className="flex items-center justify-center gap-2 text-emerald-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                            <span>Taking you to your dashboard...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Progress Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Rocket className="text-white h-5 w-5" />
              </div>
              <div>
                <h1 className="text-white font-semibold text-lg">Profile Setup</h1>
                <p className="text-emerald-100 text-sm">Step {step + 1} of {steps.length}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-semibold">{Math.round(progress)}%</p>
              <p className="text-emerald-100 text-sm">Complete</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="bg-white rounded-full h-2"
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="px-8 py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step Header */}
              <div className="flex items-start gap-4 mb-8">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  {currentStep.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentStep.label}</h2>
                  {currentStep.type === 'institutions' && (
                    <p className="text-gray-600">Enter at least one educational institution</p>
                  )}
                  {currentStep.type === 'checkbox' && (
                    <p className="text-gray-600">Select all that apply</p>
                  )}
                  {!currentStep.required && (
                    <p className="text-gray-500 text-sm">Optional</p>
                  )}
                </div>
              </div>

              {/* Form Content */}
              <form
                className="space-y-6"
                onSubmit={e => {
                  e.preventDefault()
                  if (isLastStep) {
                    handleSubmit()
                  } else {
                    handleNext()
                  }
                }}
              >
                {/* Text Input */}
                {currentStep.type === 'text' && (
                  <div>
                    <input
                      type="text"
                      name={currentStep.key as string}
                      value={formData[currentStep.key] as string}
                      onChange={handleChange}
                      placeholder={currentStep.placeholder}
                      className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-6 py-4 text-lg text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all duration-300"
                      required={currentStep.required}
                    />
                  </div>
                )}

                {/* Date Input */}
                {currentStep.type === 'date' && (
                  <div>
                    <input
                      type="date"
                      name={currentStep.key as string}
                      value={formData[currentStep.key] as string}
                      onChange={handleChange}
                      className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-6 py-4 text-lg text-gray-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all duration-300"
                      required={currentStep.required}
                    />
                  </div>
                )}

                {/* Textarea */}
                {currentStep.type === 'textarea' && (
                  <div>
                    <textarea
                      name={currentStep.key as string}
                      value={formData[currentStep.key] as string}
                      onChange={handleChange}
                      placeholder={currentStep.placeholder}
                      className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-6 py-4 text-lg text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all duration-300 resize-none h-32"
                      required={currentStep.required}
                      maxLength={currentStep.maxLength}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm text-gray-500">Share something that makes you unique!</p>
                      <p className="text-sm text-gray-400">
                        {(formData.bio || '').length} / {currentStep.maxLength}
                      </p>
                    </div>
                  </div>
                )}

                {/* Select Options */}
                {currentStep.type === 'select' && (
                  <div className="grid gap-3">
                    {currentStep.options?.map((opt: string) => (
                      <motion.button
                        key={opt}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setFormData(prev => ({ ...prev, [currentStep.key]: opt }))}
                        className={`w-full py-4 px-6 rounded-xl text-lg font-semibold border-2 transition-all duration-300 ${
                          formData[currentStep.key as keyof StudentProfileFormData] === opt 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-500 shadow-lg shadow-emerald-200' 
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        {opt}
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Institutions */}
                {currentStep.type === 'institutions' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">High School</label>
                      <input
                        type="text"
                        name="highSchool"
                        value={formData.highSchool}
                        onChange={handleChange}
                        placeholder="E.g., International School of Choueifat"
                        className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-6 py-4 text-lg text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">University</label>
                      <input
                        type="text"
                        name="university"
                        value={formData.university}
                        onChange={handleChange}
                        placeholder="E.g., American University of Sharjah"
                        className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-6 py-4 text-lg text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all duration-300"
                      />
                    </div>
                  </div>
                )}

                {/* Checkbox Multiple */}
                {currentStep.type === 'checkbox' && (
                  <div className="grid gap-3">
                    {currentStep.options?.map((opt: string) => {
                      const fieldName = currentStep.key === 'goal' ? 'goal' : 'interests';
                      const isChecked = Array.isArray(formData[fieldName]) && 
                        (formData[fieldName] as string[]).includes(opt);
                      
                      return (
                        <label
                          key={opt}
                          className="flex items-start gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            name={currentStep.key as string}
                            value={opt}
                            checked={isChecked}
                            onChange={handleChange}
                            className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500 mt-0.5"
                          />
                          <div className="flex-1">
                            <span className="text-lg font-medium text-gray-800">{opt}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Checkbox Single */}
                {currentStep.type === 'checkbox-single' && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData(prev => ({ ...prev, terms: !prev.terms }))}
                    className={`w-full py-4 px-6 rounded-xl text-lg font-semibold border-2 transition-all duration-300 flex items-center justify-center gap-3 ${
                      formData.terms
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-500 shadow-lg shadow-emerald-200'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    <span>I agree to the <a href="/terms" className="underline" target="_blank" rel="noopener noreferrer">Terms & Conditions</a></span>
                    {formData.terms && <CheckCircle className="h-5 w-5" />}
                  </motion.button>
                )}

                {/* Radio Options */}
                {currentStep.type === 'radio' && (
                  <div className="grid gap-3">
                    {currentStep.options?.map((opt: string) => (
                      <motion.button
                        key={opt}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setFormData(prev => ({ ...prev, [currentStep.key]: opt }))}
                        className={`w-full py-4 px-6 rounded-xl text-lg font-semibold border-2 transition-all duration-300 ${
                          formData[currentStep.key as keyof StudentProfileFormData] === opt
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-500 shadow-lg shadow-emerald-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        {opt}
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Contact with Terms */}
                {currentStep.type === 'contact-with-terms' && (
                  <div className="space-y-6">
                    {/* Motivational Text */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
                      <p className="text-sm text-emerald-700 font-medium text-center">
                        📊 Students who provide contact details receive 50% more interview opportunities
                      </p>
                    </div>

                    {/* WhatsApp Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        WhatsApp Number (This helps companies verify and contact you faster)
                      </label>
                      <input
                        type="tel"
                        name="whatsapp"
                        placeholder="Enter your WhatsApp number"
                        value={formData.whatsapp}
                        onChange={handleChange}
                        className="w-full py-4 px-6 text-lg border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300"
                      />
                    </div>

                    {/* LinkedIn Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        LinkedIn URL (This helps companies verify and contact you faster)
                      </label>
                      <input
                        type="url"
                        name="linkedin"
                        placeholder="Paste your LinkedIn profile URL"
                        value={formData.linkedin}
                        onChange={handleChange}
                        className="w-full py-4 px-6 text-lg border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300"
                      />
                    </div>

                    {/* Terms and Conditions Checkbox */}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFormData(prev => ({ ...prev, terms: !prev.terms }))}
                      className={`w-full py-4 px-6 rounded-xl text-lg font-semibold border-2 transition-all duration-300 flex items-center justify-center gap-3 ${
                        formData.terms
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-500 shadow-lg shadow-emerald-200'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      <span>I agree to the <a href="/terms" className="underline" target="_blank" rel="noopener noreferrer">Terms & Conditions</a></span>
                      {formData.terms && <CheckCircle className="h-5 w-5" />}
                    </motion.button>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center"
                  >
                    <p className="text-red-700 font-medium">{error}</p>
                  </motion.div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-6">
                  {!isFirstStep ? (
                    <motion.button
                      type="button"
                      onClick={handleBack}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all duration-300"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </motion.button>
                  ) : <div />}
                  
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        {isLastStep ? 'Complete Setup' : 'Next'}
                        {!isLastStep && <ArrowRight className="h-4 w-4" />}
                        {isLastStep && <CheckCircle className="h-4 w-4" />}
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
} 