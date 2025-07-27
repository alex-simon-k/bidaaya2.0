'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Crown, 
  Rocket, 
  Building2, 
  Users, 
  Star, 
  CheckCircle,
  ArrowRight,
  Zap,
  TrendingUp,
  Target,
  Award,
  Clock,
  Shield
} from 'lucide-react'
import { CompanyUpgradePrompt, getPaidCompanyTiers, SubscriptionTier } from '@/lib/subscription'

interface CompanyPaywallModalProps {
  isOpen: boolean
  onClose: () => void
  promptConfig: CompanyUpgradePrompt
  trigger?: 'project_activation' | 'project_limit' | 'custom_projects'
}

export function CompanyPaywallModal({ 
  isOpen, 
  onClose, 
  promptConfig,
  trigger = 'project_activation'
}: CompanyPaywallModalProps) {
  const router = useRouter()
  const [isAnimating, setIsAnimating] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(promptConfig.recommendedPlan.id)

  const handleUpgrade = async () => {
    setIsAnimating(true)
    // Add slight delay for better UX
    setTimeout(() => {
      router.push(`/pricing?source=company_modal&trigger=${trigger}&plan=${selectedPlan}`)
    }, 300)
  }

  const getTriggerIcon = () => {
    switch (trigger) {
      case 'project_limit':
        return <TrendingUp className="h-10 w-10 text-blue-600" />
      case 'custom_projects':
        return <Target className="h-10 w-10 text-purple-600" />
      default:
        return <Rocket className="h-10 w-10 text-orange-600" />
    }
  }

  const getTriggerGradient = () => {
    switch (trigger) {
      case 'project_limit':
        return 'from-blue-600 to-blue-700'
      case 'custom_projects':
        return 'from-purple-600 to-purple-700'
      default:
        return 'from-orange-500 to-red-600'
    }
  }

  const getSuccessStories = () => {
    return [
      {
        company: "Tech Startup",
        result: "Found skilled developers quickly",
        plan: "HR Agent"
      },
      {
        company: "Growing Agency",
        result: "Streamlined hiring process", 
        plan: "HR Booster"
      },
      {
        company: "Local Business",
        result: "Connected with talented interns",
        plan: "Company Basic"
      }
    ]
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Header with gradient */}
            <div className={`relative px-8 py-12 bg-gradient-to-br ${getTriggerGradient()} text-white text-center`}>
              <button
                onClick={onClose}
                className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
              
      <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-6"
              >
                {getTriggerIcon()}
              </motion.div>
              
              <h1 className="text-3xl font-bold mb-4">{promptConfig.title}</h1>
              <p className="text-white/90 text-xl leading-relaxed max-w-2xl mx-auto">
                {promptConfig.description}
              </p>
              
              {promptConfig.urgency && (
                <div className="mt-6 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-sm font-medium">
                  <Award className="h-4 w-4" />
                  {promptConfig.urgency}
          </div>
        )}
            </div>

            {/* Content */}
            <div className="px-8 py-8">
              {/* Two-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Column - Benefits & Social Proof */}
                <div className="space-y-6">
                  
                  {/* Benefits List */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Crown className="h-6 w-6 text-yellow-500" />
                      What You'll Unlock
                    </h3>
                    
                    <div className="space-y-3">
                      {promptConfig.benefits.map((benefit, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          className="flex items-center gap-3"
                        >
                          <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="text-gray-700 font-medium">{benefit}</span>
                        </motion.div>
                      ))}
          </div>
          </div>
          
                  {/* Success Stories */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 font-medium">Trusted by companies</span>
        </div>

                    <h4 className="font-semibold text-gray-900 mb-3">Recent Success Stories:</h4>
                    
                    <div className="space-y-2">
                      {getSuccessStories().map((story, index) => (
                        <div key={index} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                          <div>
                            <span className="font-medium text-gray-800">{story.company}</span>
                            <span className="text-sm text-gray-600 ml-2">• {story.result}</span>
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {story.plan}
            </span>
          </div>
                      ))}
                    </div>
                  </motion.div>
                  
                </div>

                {/* Right Column - Plan Selection */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-blue-500" />
                    Choose Your Plan
                  </h3>
                  
                  <div className="space-y-4">
                    {getPaidCompanyTiers().map((tier, index) => (
                      <motion.div
                        key={tier.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        onClick={() => setSelectedPlan(tier.id)}
                        className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                          selectedPlan === tier.id 
                            ? 'border-blue-500 bg-blue-50 shadow-lg' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        } ${tier.id === promptConfig.recommendedPlan.id ? 'ring-2 ring-orange-200' : ''}`}
                      >
                        {tier.id === promptConfig.recommendedPlan.id && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                              RECOMMENDED
                            </span>
            </div>
          )}
                        
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-bold text-gray-900">{tier.name}</h4>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">£{tier.price}</div>
                            <div className="text-sm text-gray-500">/month</div>
                          </div>
        </div>

                        <p className="text-gray-600 text-sm mb-4">{tier.description}</p>
                        
                        <div className="space-y-2">
                          {tier.features.slice(0, 3).map((feature, featureIndex) => (
                            <div key={featureIndex} className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
                          {tier.features.length > 3 && (
                            <div className="text-sm text-blue-600 font-medium">
                              +{tier.features.length - 3} more features
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
        </div>

              {/* Action Buttons */}
              <div className="mt-8 space-y-4">
        <motion.button
                  onClick={handleUpgrade}
                  disabled={isAnimating}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full bg-gradient-to-r ${getTriggerGradient()} text-white font-bold py-5 px-8 rounded-2xl transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50 shadow-lg hover:shadow-xl`}
        >
                  {isAnimating ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Crown className="h-6 w-6" />
                      {promptConfig.ctaText}
                      <ArrowRight className="h-6 w-6" />
                    </>
          )}
        </motion.button>
                
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-green-600">
                    <Shield className="h-4 w-4" />
                    <span>30-day money back</span>
            </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <Clock className="h-4 w-4" />
                    <span>Cancel anytime</span>
          </div>
        </div>

                <button
                  onClick={onClose}
                  className="w-full text-gray-600 font-medium py-3 px-6 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  I'll Upgrade Later
                </button>
              </div>

              {/* Fine print */}
              <p className="text-xs text-gray-500 text-center mt-6">
                ✨ All plans include onboarding support • 30-day money back guarantee
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
} 