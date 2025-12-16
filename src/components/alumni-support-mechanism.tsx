'use client'

import { motion } from 'framer-motion'
import { Users, Handshake, MessageCircle, Sparkles } from 'lucide-react'

export function AlumniSupportMechanism() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-panel rounded-xl p-12 border border-slate-800 text-center relative overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-bidaaya-accent/5 via-transparent to-purple-500/5" />
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 opacity-20">
        <Handshake className="h-24 w-24 text-bidaaya-accent" />
      </div>
      <div className="absolute bottom-10 right-10 opacity-20">
        <Users className="h-24 w-24 text-purple-500" />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10">
        <Sparkles className="h-32 w-32 text-bidaaya-accent" />
      </div>

      <div className="relative z-10">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center mb-6"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-bidaaya-accent/20 blur-xl rounded-full" />
            <div className="relative bg-bidaaya-accent/10 rounded-full p-4 border border-bidaaya-accent/30">
              <Handshake className="h-12 w-12 text-bidaaya-accent" />
            </div>
          </div>
        </motion.div>

        <h2 className="text-3xl font-light text-white mb-4 tracking-tight">
          Alumni-to-Students Support
        </h2>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-bidaaya-accent/20 text-bidaaya-accent text-sm rounded-full mb-6">
          <Sparkles className="h-4 w-4" />
          <span className="font-medium">Coming Soon</span>
        </div>

        <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
          Connect with alumni who have graduated from your institution. Get personalized advice, 
          application guidance, and referral opportunities from professionals who understand your journey.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50"
          >
            <MessageCircle className="h-8 w-8 text-bidaaya-accent mb-3 mx-auto" />
            <h3 className="text-white font-medium mb-2">Mentorship</h3>
            <p className="text-slate-400 text-sm">
              Get advice from alumni in your field of interest
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50"
          >
            <Handshake className="h-8 w-8 text-purple-500 mb-3 mx-auto" />
            <h3 className="text-white font-medium mb-2">Referrals</h3>
            <p className="text-slate-400 text-sm">
              Access referral opportunities at top companies
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50"
          >
            <Users className="h-8 w-8 text-blue-500 mb-3 mx-auto" />
            <h3 className="text-white font-medium mb-2">Networking</h3>
            <p className="text-slate-400 text-sm">
              Build connections with successful graduates
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

