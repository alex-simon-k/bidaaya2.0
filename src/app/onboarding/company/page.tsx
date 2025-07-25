'use client'

import { useState, ChangeEvent, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Building2, 
  Users, 
  Briefcase, 
  Target, 
  MessageSquare, 
  Phone, 
  Mail, 
  Globe, 
  CheckCircle, 
  ArrowLeft,
  ArrowRight,
  Rocket
} from 'lucide-react'
import { OnboardingSessionManager, useOnboardingSession } from '@/lib/onboarding-session-manager'

interface Step {
  key: keyof CompanyProfileFormData | 'contactPerson';
  label: string;
  type: 'text' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'url' | 'email' | 'tel' | 'contactPerson';
  required: boolean;
  placeholder?: string;
  options?: string[];
  icon: JSX.Element;
  maxLength?: number;
  description?: string;
}

interface CompanyProfileFormData {
  fullName: string;
  jobTitle: string;
  companyName: string;
  companySize: string;
  industry: string;
  companyOneLiner: string;
  goals: string[];
  contactPersonType: string;
  contactPersonName: string;
  contactEmail: string;
  contactWhatsapp: string;
  companyWebsite: string;
  [key: string]: string | string[];
}

const steps: Step[] = [
  {
    key: 'fullName',
    label: 'What is your full name?',
    type: 'text',
    required: true,
    placeholder: 'Enter your full name',
    icon: <User className="w-8 h-8 text-purple-600" />,
    description: 'Please enter your full name.'
  },
  {
    key: 'jobTitle',
    label: 'What is your role at the company?',
    type: 'text',
    required: true,
    placeholder: 'e.g. CEO, CTO, HR Manager, Recruiter',
    icon: <Briefcase className="w-8 h-8 text-purple-600" />,
    description: 'Your role / job title'
  },
  {
    key: 'companyName',
    label: 'What is your company name?',
    type: 'text',
    required: true,
    placeholder: 'Enter the legal name of your organization',
    icon: <Building2 className="w-8 h-8 text-purple-600" />,
    description: 'Legal name of your organization.'
  },
  {
    key: 'companySize',
    label: 'What is your company size?',
    type: 'select',
    required: true,
    options: ['1–10', '11–50', '51–200', '201–500', '501–1,000', '1,001+'],
    icon: <Users className="w-8 h-8 text-purple-600" />,
    description: 'Select the range that best describes your total headcount:'
  },
  {
    key: 'industry',
    label: 'Which industry does your company operate in?',
    type: 'select',
    required: true,
    options: ['Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Manufacturing', 'Consulting', 'Media', 'Other'],
    icon: <Target className="w-8 h-8 text-purple-600" />,
    description: 'Which industry does your company operate in?'
  },
  {
    key: 'companyOneLiner',
    label: 'Tell us about your company in one sentence',
    type: 'textarea',
    required: true,
    placeholder: 'e.g. "We\'re a fintech startup building AI-powered payment tools for small businesses."',
    icon: <MessageSquare className="w-8 h-8 text-purple-600" />,
    maxLength: 200,
    description: 'Company One-Liner'
  },
  {
    key: 'goals',
    label: 'What are you here for?',
    type: 'checkbox',
    required: true,
    options: ['Growing our team', 'Exploring extra hands / contractors', 'Generating new ideas / innovation support', 'Actively hiring right now'],
    icon: <Target className="w-8 h-8 text-purple-600" />,
    description: 'Select all that apply'
  },
  {
    key: 'contactPerson',
    label: 'Who should we coordinate with?',
    type: 'contactPerson',
    required: true,
    icon: <User className="w-8 h-8 text-purple-600" />,
    description: 'Point of Contact'
  },
  {
    key: 'contactEmail',
    label: 'What is the point of contact email?',
    type: 'email',
    required: true,
    placeholder: 'contact@yourcompany.com',
    icon: <Mail className="w-8 h-8 text-purple-600" />,
    description: 'Email address for all platform notifications.'
  },
  {
    key: 'contactWhatsapp',
    label: 'What is the point of contact WhatsApp?',
    type: 'tel',
    required: true,
    placeholder: '+971 50 123 4567',
    icon: <Phone className="w-8 h-8 text-purple-600" />,
    description: 'Mobile/WhatsApp number for urgent updates.'
  },
  {
    key: 'companyWebsite',
    label: 'What is your company website URL?',
    type: 'text',
    required: true,
    placeholder: 'yourcompany.com or https://www.yourcompany.com',
    icon: <Globe className="w-8 h-8 text-purple-600" />,
    description: 'Company website URL'
  },
]

export default function CompanyOnboardingPage() {
  const { data: session, status, update } = useSession({
    required: false, // Don't auto-redirect, we'll handle it manually
  })
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [formData, setFormData] = useState<CompanyProfileFormData>({
    fullName: '',
    jobTitle: '',
    companyName: '',
    companySize: '',
    industry: '',
    companyOneLiner: '',
    goals: [],
    contactPersonType: '',
    contactPersonName: '',
    contactEmail: '',
    contactWhatsapp: '',
    companyWebsite: '',
  })
  const [error, setError] = useState<string | null>(null)

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
      OnboardingSessionManager.startOnboarding(session.user.email, 'company-setup')
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

  useEffect(() => {
    if (session?.user?.name && step === 0 && !formData.fullName) {
      setFormData(prev => ({...prev, fullName: session.user!.name as string}))
    }
  }, [session, step, formData.fullName])

  // Clear any stale Calendly state on mount
  useEffect(() => {
    console.log('🧹 Clearing stale Calendly state - fresh onboarding start')
    sessionStorage.removeItem('bidaaya_calendly_flow')
    sessionStorage.removeItem('bidaaya_company_setup_complete')
    sessionStorage.removeItem('bidaaya_company_name')
  }, [])

  // Handle authentication - only redirect if not in onboarding
  useEffect(() => {
    if (status === 'loading') {
      return // Still loading, wait
    }
    
    // Don't redirect if we're in the process of signing out
    if (isSigningOut) {
      console.log('🛡️ Sign out in progress - preventing redirect');
      return;
    }
    
    if (status === 'unauthenticated' || !session) {
      if (shouldProtect) {
        console.log('🛡️ User not authenticated but in onboarding - protecting from redirect')
      } else {
        console.log('🔐 Company Onboarding - Not authenticated, redirecting to login')
        router.push('/auth/login')
      }
      return
    }
  }, [status, session, router, shouldProtect, isSigningOut])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"
        />
      </div>
    )
  }

  // Return null if unauthenticated and not in onboarding
  if ((status === 'unauthenticated' || !session) && !shouldProtect) {
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
        const arr = Array.isArray(prev.goals) ? prev.goals : [];
        if (checked) {
          return { ...prev, goals: [...arr, value] };
        } else {
          return { ...prev, goals: arr.filter((g: string) => g !== value) };
        }
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError(null);
  };

  const validateStep = () => {
    if (!currentStep.required) return true;
    
    const value = formData[currentStep.key as keyof CompanyProfileFormData];
    
    if (currentStep.type === 'checkbox') {
      return Array.isArray(value) && value.length > 0;
    }
    
    if (currentStep.type === 'contactPerson') {
      return formData.contactPersonType && 
             (formData.contactPersonType === 'me' || formData.contactPersonName);
    }
    
    return value && value.toString().trim() !== '';
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    } else {
      setError('Please fill in all required fields');
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    console.log('🚀 Company onboarding handleSubmit called');
    if (!validateStep()) return
    setIsLoading(true)
    try {
      console.log('🔐 Company setup - Submitting with email:', session?.user?.email);
      
      const response = await fetch('/api/user/convert-to-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName,
          companySize: formData.companySize,
          industry: formData.industry,
          role: formData.jobTitle,
          firstName: formData.fullName.split(' ')[0],
          lastName: formData.fullName.split(' ').slice(1).join(' '),
          companyOneLiner: formData.companyOneLiner,
          goals: formData.goals,
          contactPersonType: formData.contactPersonType,
          contactPersonName: formData.contactPersonType === 'me' 
            ? formData.fullName 
            : formData.contactPersonName,
          contactEmail: formData.contactEmail,
          contactWhatsapp: formData.contactWhatsapp,
          companyWebsite: formData.companyWebsite,
          email: session?.user?.email, // Add email to request body
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to complete company setup');
      }
      
      // Update the session to include the new role
      await update({ role: 'COMPANY' });
      
      // Update onboarding session
      markProfileCompleted()
      completeOnboarding()
      
      // Clear onboarding state immediately to prevent dashboard layout from redirecting
      console.log('🧹 Clearing onboarding state before sign out');
      sessionStorage.removeItem('bidaaya_onboarding_state');
      
      // Small delay to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Send welcome email in the background
      try {
        await fetch('/api/auth/send-company-welcome-emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: session?.user?.email,
            companyName: formData.companyName,
            contactPersonName: formData.contactPersonType === 'me' 
              ? formData.fullName 
              : formData.contactPersonName,
            industry: formData.industry
          }),
        });
        console.log('✅ Company welcome email sent');
      } catch (emailError) {
        console.error('Failed to send welcome email (non-blocking):', emailError);
        // Don't block the user's flow if email fails
      }
      
      console.log('🎯 Company setup completed, redirecting to dashboard...');
      
      // Update session to reflect completed profile
      console.log('🔄 Updating session with completed company profile');
      await update({ role: 'COMPANY', profileCompleted: true });
      
      // Complete onboarding session
      completeOnboarding();
      
      // Clear onboarding state
      console.log('🧹 Clearing onboarding state');
      sessionStorage.removeItem('bidaaya_onboarding_state');
      
      // Small delay to show any success UI, then redirect to dashboard
      setTimeout(() => {
        console.log('🚀 Redirecting to dashboard');
        router.push('/dashboard');
      }, 1000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Progress Header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Rocket className="text-white h-5 w-5" />
              </div>
              <div>
                <h1 className="text-white font-semibold text-lg">Company Setup</h1>
                <p className="text-purple-100 text-sm">Step {step + 1} of {steps.length}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-semibold">{Math.round(progress)}%</p>
              <p className="text-purple-100 text-sm">Complete</p>
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
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  {currentStep.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentStep.label}</h2>
                  {currentStep.description && (
                    <p className="text-gray-600">{currentStep.description}</p>
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
                {/* Text/Email/URL/Tel Input */}
                {(['text', 'email', 'url', 'tel'].includes(currentStep.type)) && (
                  <div>
                    <input
                      type={currentStep.type}
                      name={currentStep.key as string}
                      value={formData[currentStep.key] as string}
                      onChange={handleChange}
                      placeholder={currentStep.placeholder}
                      className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-6 py-4 text-lg text-gray-800 placeholder-gray-400 focus:border-purple-500 focus:bg-white focus:outline-none transition-all duration-300"
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
                      className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-6 py-4 text-lg text-gray-800 placeholder-gray-400 focus:border-purple-500 focus:bg-white focus:outline-none transition-all duration-300 resize-none h-32"
                      required={currentStep.required}
                      maxLength={currentStep.maxLength}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm text-gray-500">Describe your company briefly</p>
                      <p className="text-sm text-gray-400">
                        {(formData[currentStep.key] as string || '').length} / {currentStep.maxLength}
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
                          formData[currentStep.key as keyof CompanyProfileFormData] === opt 
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-purple-500 shadow-lg shadow-purple-200' 
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                        }`}
                      >
                        {opt}
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Checkbox Options */}
                {currentStep.type === 'checkbox' && (
                  <div className="space-y-3">
                    {currentStep.options?.map((opt: string) => (
                      <label key={opt} className="flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 cursor-pointer">
                        <input
                          type="checkbox"
                          name={currentStep.key as string}
                          value={opt}
                          checked={(formData.goals as string[]).includes(opt)}
                          onChange={handleChange}
                          className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-lg text-gray-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Contact Person Special Field */}
                {currentStep.type === 'contactPerson' && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 cursor-pointer">
                        <input
                          type="radio"
                          name="contactPersonType"
                          value="me"
                          checked={formData.contactPersonType === 'me'}
                          onChange={handleChange}
                          className="w-5 h-5 text-purple-600 border-gray-300 focus:ring-purple-500"
                        />
                        <span className="text-lg text-gray-700">Me (I'm the main point of contact)</span>
                      </label>
                      
                      <label className="flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 cursor-pointer">
                        <input
                          type="radio"
                          name="contactPersonType"
                          value="other"
                          checked={formData.contactPersonType === 'other'}
                          onChange={handleChange}
                          className="w-5 h-5 text-purple-600 border-gray-300 focus:ring-purple-500"
                        />
                        <span className="text-lg text-gray-700">Other:</span>
                      </label>
                    </div>
                    
                    {formData.contactPersonType === 'other' && (
                      <input
                        type="text"
                        name="contactPersonName"
                        value={formData.contactPersonName}
                        onChange={handleChange}
                        placeholder="Enter contact person's name"
                        className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-6 py-4 text-lg text-gray-800 placeholder-gray-400 focus:border-purple-500 focus:bg-white focus:outline-none transition-all duration-300"
                        required={formData.contactPersonType === 'other'}
                      />
                    )}
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-6">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isFirstStep}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      isFirstStep 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Setting up...
                      </>
                    ) : isLastStep ? (
                      <>
                        Complete Setup
                        <CheckCircle className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
      
      {/* Calendly Prompt Modal */}
      {/* This section is no longer needed as Calendly is removed */}
    </div>
  )
} 