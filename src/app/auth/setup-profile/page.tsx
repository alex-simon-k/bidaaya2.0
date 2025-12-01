'use client'

import { useState, ChangeEvent, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, 
  Check
} from 'lucide-react'
import { useOnboardingSession } from '@/lib/onboarding-session-manager'
import { OnboardingSessionManager } from '@/lib/onboarding-session-manager'

interface StudentProfileFormData {
  name: string;
  dateOfBirth: string;
  educationStatus: string;
  whatsapp: string;
  linkedin: string;
  mena: string;
  terms: boolean;
  [key: string]: string | string[] | boolean;
}

// Custom ScrollPicker Component for Birthday
const ScrollPicker: React.FC<{
  items: (string | number)[];
  value: string | number;
  onChange: (value: string | number) => void;
}> = ({ items, value, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 48;

  useEffect(() => {
    if (containerRef.current) {
      const index = items.indexOf(value);
      if (index !== -1) {
        containerRef.current.scrollTop = index * itemHeight;
      }
    }
  }, [value, items]);

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      const index = Math.round(scrollTop / itemHeight);
      if (items[index] !== undefined && items[index] !== value) {
        onChange(items[index]);
      }
    }
  };

  return (
    <div className="relative h-48 w-full flex flex-col items-center justify-center">
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-12 bg-blue-500/10 rounded-xl pointer-events-none z-10 border-y border-blue-500/20" />
      <div 
        ref={containerRef}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory scrollbar-hide py-[84px]"
        onScroll={handleScroll}
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {items.map((item, i) => (
          <div 
            key={i} 
            className={`h-12 flex items-center justify-center transition-all duration-200 ${
              item === value ? 'text-white font-semibold scale-110' : 'text-gray-600'
            }`}
            style={{ scrollSnapAlign: 'center' }}
          >
            <span className="text-xl">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - 16 - i);

const EDUCATION_OPTIONS = ['High School', 'Gap Year', 'University', 'Graduated'];
const MENA_OPTIONS = [
      'I live there',
      'I go back for holidays',
      'I study abroad and go back as much as possible',
  "No, I don't live there. I'm a tourist."
];

const TOTAL_STEPS = 5;

export default function SetupProfilePage() {
  const { data: session, status, update } = useSession({
    required: false,
  })
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [formData, setFormData] = useState<StudentProfileFormData>({
    name: '',
    dateOfBirth: '',
    educationStatus: '',
    whatsapp: '',
    linkedin: '',
    mena: '',
    terms: false,
  })
  
  // Birthday picker state
  const initialDate = formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date(2002, 0, 1);
  const [day, setDay] = useState(formData.dateOfBirth ? initialDate.getDate() : 1);
  const [month, setMonth] = useState(formData.dateOfBirth ? MONTHS[initialDate.getMonth()] : MONTHS[0]);
  const [year, setYear] = useState(formData.dateOfBirth ? initialDate.getFullYear() : 2002);
  
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
      setTimeout(() => {
        OnboardingSessionManager.safeUpdateActivity()
      }, 100)
    }
  }, [session?.user?.email, isInOnboarding])

  // Update activity on user interaction
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

  // Handle authentication
  useEffect(() => {
    if (status === 'loading') return

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

  // Pre-fill name from session
  useEffect(() => {
    if (session?.user?.name && currentStep === 0 && !formData.name) {
      setFormData(prev => ({...prev, name: session.user!.name as string}))
    }
  }, [session, currentStep, formData.name])

  // Update dateOfBirth when birthday picker changes
  useEffect(() => {
    const monthIndex = MONTHS.indexOf(month);
    const dateString = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setFormData(prev => ({ ...prev, dateOfBirth: dateString }));
  }, [day, month, year])

  if (status === 'loading') {
    return (
      <div className="relative min-h-screen w-full bg-[#050505] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"
        />
      </div>
    )
  }

  if (!session && !shouldProtect) {
    return null
  }

  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100

  const updateData = (fields: Partial<StudentProfileFormData>) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, canProceed: boolean) => {
    if (e.key === 'Enter' && canProceed) {
      nextStep();
    }
  };

  const handleSubmit = async () => {
    // Validate terms are accepted
    if (!formData.terms) {
      return;
    }
    
    if (!session?.user?.email) {
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
      
      await update({ profileCompleted: true });
      markProfileCompleted()
      updateStep('complete')

      // Send welcome emails
      if (formData.terms && session?.user?.email) {
        try {
          console.log('🎯 Student completed profile with terms accepted, triggering welcome emails');
          await fetch('/api/auth/send-student-welcome-emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: session.user.email,
              name: formData.name
            }),
          });
          console.log('✅ Welcome emails triggered successfully');
        } catch (emailError) {
          console.error('Failed to send welcome emails (non-blocking):', emailError);
        }
      }
      
      await update({ profileCompleted: true });
      await new Promise(resolve => setTimeout(resolve, 500));
      completeOnboarding();
      
      console.log('🧹 Clearing onboarding state');
      sessionStorage.removeItem('bidaaya_onboarding_state');
      
      setIsProfileComplete(true);
      
      setTimeout(() => {
        console.log('🚀 Redirecting to profile completion');
        window.location.href = '/dashboard/profile?guided=true&welcome=true&onboarding_complete=true';
      }, 2500);
      
    } catch (err) {
      console.error('Profile submission error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Show success screen when profile is complete
  if (isProfileComplete) {
    return (
      <div className="relative min-h-screen w-full bg-[#050505] overflow-hidden flex flex-col items-center justify-center p-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="flex flex-col items-center justify-center h-full text-center space-y-6 relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.5)]"
          >
            <CheckCircle className="text-white" size={48} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-white">You're all set!</h2>
            <p className="text-gray-400 mt-2 max-w-xs mx-auto">
              Thanks for completing your profile. We'll be in touch with opportunities soon.
            </p>
          </motion.div>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-8"
          >
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm">Taking you to your dashboard...</span>
          </div>
        </motion.div>
        </div>
      </div>
    );
  }

  // Render individual steps
  const renderStep = () => {
    switch (currentStep) {
      case 0: // Name
  return (
          <div className="w-full flex flex-col items-center space-y-8">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-semibold text-white">What is your full name?</h1>
              <p className="text-sm text-gray-500">This is how you'll appear to recruiters.</p>
            </div>
            <div className="w-full max-w-xs">
              <input
                autoFocus
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => updateData({ name: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, formData.name.length > 2)}
                className="w-full bg-gray-900/50 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder-gray-600 text-lg outline-none text-center focus:border-white/30 focus:bg-gray-900 transition-all duration-300"
              />
            </div>
            <div className="w-full max-w-xs pt-4">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                disabled={formData.name.length <= 2}
                className="w-full bg-white text-black hover:bg-gray-200 font-medium py-4 px-8 rounded-full transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                Continue
              </motion.button>
            </div>
          </div>
        );

      case 1: // Birthday
        return (
          <div className="w-full flex flex-col items-center space-y-8">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-semibold text-white">What is your date of birth?</h1>
              <p className="text-sm text-gray-500">We use this to verify your age.</p>
            </div>
            <div className="flex gap-2 w-full justify-center h-48 max-w-sm">
              <div className="w-1/4">
                <ScrollPicker items={DAYS} value={day} onChange={(v) => setDay(v as number)} />
              </div>
              <div className="w-2/4">
                <ScrollPicker items={MONTHS} value={month} onChange={(v) => setMonth(v as string)} />
              </div>
              <div className="w-1/3">
                <ScrollPicker items={YEARS} value={year} onChange={(v) => setYear(v as number)} />
              </div>
            </div>
            <div className="w-full max-w-xs space-y-3 pt-4">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                className="w-full bg-white text-black hover:bg-gray-200 font-medium py-4 px-8 rounded-full transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                Continue
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={prevStep}
                className="w-full bg-transparent hover:bg-white/5 text-gray-500 hover:text-white font-medium py-4 px-8 rounded-full transition-all duration-300"
              >
                Back
              </motion.button>
            </div>
          </div>
        );

      case 2: // Education
        return (
          <div className="w-full flex flex-col items-center space-y-8">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-semibold text-white">Current education status?</h1>
              <p className="text-sm text-gray-500">Choose the option that describes you best.</p>
          </div>
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              {EDUCATION_OPTIONS.map((option) => {
                const isSelected = formData.educationStatus === option;
                return (
                  <motion.button
                    key={option}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => updateData({ educationStatus: option })}
                    className={`h-14 rounded-full font-medium text-sm transition-all duration-300 ${
                      isSelected 
                        ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                        : 'bg-gray-900 border border-white/10 text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    {option}
                  </motion.button>
                );
              })}
        </div>
            <div className="w-full max-w-xs space-y-3 pt-4">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                disabled={!formData.educationStatus}
                className="w-full bg-white text-black hover:bg-gray-200 font-medium py-4 px-8 rounded-full transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                Continue
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={prevStep}
                className="w-full bg-transparent hover:bg-white/5 text-gray-500 hover:text-white font-medium py-4 px-8 rounded-full transition-all duration-300"
              >
                Back
              </motion.button>
            </div>
                  </div>
        );

      case 3: // MENA
        return (
          <div className="w-full flex flex-col items-center space-y-8">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-semibold text-white">How frequently are you in MENA?</h1>
              <p className="text-sm text-gray-500">We match you with local opportunities.</p>
                  </div>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              {MENA_OPTIONS.map((option) => {
                const isSelected = formData.mena === option;
                return (
                      <motion.button
                    key={option}
                        whileTap={{ scale: 0.98 }}
                    onClick={() => updateData({ mena: option })}
                    className={`w-full py-4 px-6 rounded-2xl text-center font-medium text-sm transition-all duration-300 border ${
                      isSelected 
                        ? 'bg-blue-900/30 border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                        : 'bg-gray-900/50 border-white/5 text-gray-400 hover:bg-gray-900 hover:border-white/10'
                    }`}
                  >
                    {option}
                      </motion.button>
                );
              })}
                  </div>
            <div className="w-full max-w-xs space-y-3 pt-4">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                disabled={!formData.mena}
                className="w-full bg-white text-black hover:bg-gray-200 font-medium py-4 px-8 rounded-full transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                Continue
              </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                onClick={prevStep}
                className="w-full bg-transparent hover:bg-white/5 text-gray-500 hover:text-white font-medium py-4 px-8 rounded-full transition-all duration-300"
              >
                Back
                      </motion.button>
            </div>
                  </div>
        );

      case 4: // Contact & Terms (WhatsApp and LinkedIn now OPTIONAL)
        return (
          <div className="w-full flex flex-col items-center space-y-8">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-semibold text-white">Help companies contact you</h1>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Students who provide contact details receive <span className="text-blue-400 font-medium">50% more</span> opportunities.
                      </p>
                    </div>
            <div className="w-full max-w-xs space-y-4">
              <div className="w-full space-y-3">
                <label className="block text-sm font-medium text-gray-400 text-center">WhatsApp Number (Optional)</label>
                      <input
                        type="tel"
                  placeholder="+971 50 123 4567"
                        value={formData.whatsapp}
                  onChange={(e) => updateData({ whatsapp: e.target.value })}
                  className="w-full bg-gray-900/50 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder-gray-600 text-lg outline-none text-center focus:border-white/30 focus:bg-gray-900 transition-all duration-300"
                      />
                    </div>
              <div className="w-full space-y-3">
                <label className="block text-sm font-medium text-gray-400 text-center">LinkedIn URL (Optional)</label>
                      <input
                        type="url"
                  placeholder="linkedin.com/in/yourname"
                        value={formData.linkedin}
                  onChange={(e) => updateData({ linkedin: e.target.value })}
                  className="w-full bg-gray-900/50 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder-gray-600 text-lg outline-none text-center focus:border-white/30 focus:bg-gray-900 transition-all duration-300"
                      />
                    </div>
              <div 
                className="flex items-center justify-center gap-3 pt-2 cursor-pointer group"
                onClick={() => updateData({ terms: !formData.terms })}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 ${
                  formData.terms 
                    ? 'bg-blue-500 border-blue-500' 
                    : 'bg-transparent border-gray-700 group-hover:border-gray-500'
                }`}>
                  {formData.terms && <Check size={12} className="text-white" />}
                </div>
                <p className="text-xs text-gray-500 select-none">
                  I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">Terms & Conditions</a>
                </p>
              </div>
            </div>
            <div className="w-full max-w-xs space-y-3 pt-2">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!formData.terms || isLoading}
                className="w-full bg-white text-black hover:bg-gray-200 font-medium py-4 px-8 rounded-full transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Finishing...
                  </>
                ) : (
                  'Finish'
                )}
              </motion.button>
                    <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={prevStep}
                className="w-full bg-transparent hover:bg-white/5 text-gray-500 hover:text-white font-medium py-4 px-8 rounded-full transition-all duration-300"
              >
                      Back
                    </motion.button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050505] overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Subtle Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Card Container */}
      <div className="w-full max-w-sm relative z-10 flex flex-col items-center">
        
        {/* Small Progress Bar */}
        {currentStep < TOTAL_STEPS && (
          <div className="w-24 h-1 bg-gray-800 rounded-full mb-8 overflow-hidden">
            <motion.div 
              className="h-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        )}

        {/* Content Area */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(5px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, scale: 0.95, filter: 'blur(5px)' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center w-full"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
        
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
} 
