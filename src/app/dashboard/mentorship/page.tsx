'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { 
  Calendar,
  Clock,
  Video,
  Star,
  Users,
  Target,
  Briefcase,
  MessageCircle,
  CheckCircle,
  ArrowRight,
  Award,
  Zap,
  Coffee,
  Building,
  TrendingUp,
  BookOpen,
  Rocket,
  CreditCard,
  Lock
} from 'lucide-react'

export default function MentorshipPage() {
  const { data: session } = useSession()

  // Stripe payment link for the mentorship session
  const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/28E14p0ITdJJ7oraor5wI04'

  const mentorshipService = {
    id: 'career-mentorship',
    title: '🎯 Career Mentorship Session',
    duration: '30 minutes',
    price: '$35',
    description: 'Get personalized career guidance from an experienced professional who has worked at HSBC, Revolut, and launched multiple startups.',
    features: [
      'Career path strategy & planning',
      'Industry insights from banking & fintech',
      'Startup & entrepreneurship guidance', 
      'Resume & interview preparation',
      'Networking & job search strategies',
      'Personalized action plan'
    ],
    stripeUrl: STRIPE_PAYMENT_LINK
  }

  const mentorExperience = [
    {
      company: 'HSBC',
      role: 'Investment Banking',
      icon: <Building className="h-6 w-6" />,
      color: 'from-red-500 to-red-600'
    },
    {
      company: 'Revolut',
      role: 'Fintech Innovation',
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'from-blue-500 to-purple-600'
    },
    {
      company: 'Startups',
      role: 'Founder & Advisor',
      icon: <Rocket className="h-6 w-6" />,
      color: 'from-green-500 to-emerald-600'
    }
  ]

  const testimonials = [
    {
      name: 'Sarah Ahmed',
      role: 'Software Engineer at Meta',
      text: 'Alex helped me transition from finance to tech. His startup insights were invaluable - I got my dream job within 6 weeks!',
      rating: 5
    },
    {
      name: 'Mohammed Al-Rashid',
      role: 'Product Manager at Noon',
      text: 'Having worked at both HSBC and Revolut, Alex understands what top companies look for. Best career investment I made.',
      rating: 5
    },
    {
      name: 'Fatima Hassan',
      role: 'Startup Founder',
      text: 'Alex\'s entrepreneurship guidance was game-changing. He helped me avoid major pitfalls and focus on what matters.',
      rating: 5
    }
  ]

  const handleBookSession = () => {
    // Open Stripe payment link in a new tab
    window.open(mentorshipService.stripeUrl, '_blank')
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            1-on-1 Career Mentorship with Alex
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Accelerate Your Career with{' '}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Expert Mentorship
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Get personalized career guidance from an experienced professional who has worked at HSBC, Revolut, launched startups, and mentored 100+ students to land their dream jobs.
          </p>

          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600 mb-8">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>100+ Students Mentored</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>HSBC & Revolut Experience</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Startup Founder & Advisor</span>
            </div>
          </div>
        </motion.div>

        {/* Mentor Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-12"
        >
          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Professional Profile Picture */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden shadow-2xl ring-4 ring-purple-200">
                  <Image
                    src="/alex-profile.png"
                    alt="Alex Simon - Career Mentor"
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                    priority
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-2">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>

              <div className="text-center md:text-left flex-1">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Alex Simon</h2>
                <p className="text-xl text-purple-600 font-semibold mb-4">Career Mentor & Startup Advisor</p>
                
                <p className="text-gray-600 leading-relaxed mb-6">
                  With experience at top-tier financial institutions like HSBC and innovative fintech companies like Revolut, 
                  plus hands-on startup founding experience, I bring a unique perspective to career development. I've mentored 
                  100+ students and professionals, helping them navigate career transitions, land dream jobs, and build successful careers.
                </p>

                {/* Experience Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {mentorExperience.map((exp, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-4 text-center">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${exp.color} flex items-center justify-center text-white mx-auto mb-2`}>
                        {exp.icon}
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm">{exp.company}</h4>
                      <p className="text-xs text-gray-600">{exp.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Single Mentorship Service */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Book Your Mentorship Session
          </h2>
          
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-purple-200 ring-2 ring-purple-100"
            >
              <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>

              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {mentorshipService.title}
                  </h3>
                  
                  <div className="flex items-center justify-center gap-6 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {mentorshipService.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Video className="h-4 w-4" />
                      Video Call
                    </div>
                  </div>

                  <div className="text-4xl font-bold text-purple-600 mb-2">{mentorshipService.price}</div>
                  <div className="text-sm text-gray-500 mb-6">per session</div>
                </div>

                <p className="text-gray-600 mb-8 leading-relaxed text-center">
                  {mentorshipService.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                  {mentorshipService.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleBookSession}
                  className="w-full py-4 px-6 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg transform hover:scale-105"
                >
                  <CreditCard className="h-5 w-5" />
                  Pay & Book Session Now
                  <ArrowRight className="h-5 w-5" />
                </button>

                <p className="text-center text-xs text-gray-500 mt-4">
                  <Lock className="h-3 w-3 inline mr-1" />
                  Secure payment with Stripe • Instant confirmation • Easy scheduling
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Success Stories */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Success Stories from Mentees
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                className="bg-white rounded-2xl p-6 shadow-lg"
              >
                <div className="flex items-center gap-1 mb-4">
                  {renderStars(testimonial.rating)}
                </div>
                
                <p className="text-gray-700 mb-4 italic">
                  "{testimonial.text}"
                </p>
                
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                q: "What happens after I make the payment?",
                a: "After payment, you'll receive an email with instructions to schedule your session. I'll reach out within 24 hours to coordinate a convenient time for our video call."
              },
              {
                q: "What can I expect from our 30-minute session?",
                a: "We'll focus on your most pressing career questions. Whether it's transitioning between industries, landing your first role, or scaling a startup, I'll provide actionable advice based on my experience at HSBC, Revolut, and as a startup founder."
              },
              {
                q: "How do I prepare for our session?",
                a: "Come with specific questions and goals. If you have a resume, LinkedIn profile, or business idea to discuss, have them ready. The more specific your questions, the more targeted my advice can be."
              },
              {
                q: "Can you help with both corporate careers and entrepreneurship?",
                a: "Absolutely! Having worked in traditional finance (HSBC), innovative fintech (Revolut), and founded startups, I can guide you on both corporate career paths and entrepreneurial ventures."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg text-left">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to accelerate your career?</h3>
            <p className="text-purple-100 mb-6">
              Join 100+ students and professionals who have transformed their careers with personalized mentorship.
            </p>
            <button
              onClick={handleBookSession}
              className="bg-white text-purple-600 px-8 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-colors transform hover:scale-105 flex items-center gap-2 mx-auto"
            >
              <CreditCard className="h-5 w-5" />
              Pay & Book Your $35 Session Now
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 