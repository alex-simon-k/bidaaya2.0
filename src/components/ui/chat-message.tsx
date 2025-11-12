"use client"

import { motion } from 'framer-motion'
import { User, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VoicePoweredOrb } from '@/components/ui/voice-powered-orb'

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
  showAvatar?: boolean
}

export function ChatMessage({ role, content, timestamp, showAvatar = true }: ChatMessageProps) {
  const isUser = role === 'user'
  const isSystem = role === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-bidaaya-light/5 text-bidaaya-light/60 text-xs px-4 py-2 rounded-full border border-bidaaya-light/10">
          {content}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-3 mb-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      {showAvatar && (
        <div className={cn(
          "flex-shrink-0",
          isUser ? "ml-2" : "mr-2"
        )}>
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-bidaaya-accent/20 flex items-center justify-center border border-bidaaya-accent/30">
              <User className="h-4 w-4 text-bidaaya-accent" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-bidaaya-light/10 flex items-center justify-center border border-bidaaya-light/20">
              <Sparkles className="h-4 w-4 text-bidaaya-accent" />
            </div>
          )}
        </div>
      )}

      {/* Message Content */}
      <div className={cn(
        "flex flex-col max-w-[75%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "rounded-2xl px-4 py-2.5 shadow-sm",
          isUser 
            ? "bg-bidaaya-accent text-white rounded-tr-sm" 
            : "bg-bidaaya-light/10 text-bidaaya-light rounded-tl-sm border border-bidaaya-light/10"
        )}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </p>
        </div>

        {/* Timestamp */}
        {timestamp && (
          <span className="text-xs text-bidaaya-light/40 mt-1 px-2">
            {(() => {
              try {
                const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
                if (isNaN(date.getTime())) {
                  return new Date().toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });
                }
                return date.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                });
              } catch {
                return new Date().toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                });
              }
            })()}
          </span>
        )}
      </div>
    </motion.div>
  )
}

// Typing Indicator Component
export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 mb-4"
    >
      {/* AI Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-bidaaya-light/10 flex items-center justify-center border border-bidaaya-light/20">
          <Sparkles className="h-4 w-4 text-bidaaya-accent animate-pulse" />
        </div>
      </div>

      {/* Typing Animation */}
      <div className="flex items-center bg-bidaaya-light/10 text-bidaaya-light rounded-2xl rounded-tl-sm border border-bidaaya-light/10 px-4 py-3 shadow-sm">
        <div className="flex gap-1.5">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            className="w-2 h-2 rounded-full bg-bidaaya-light/60"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            className="w-2 h-2 rounded-full bg-bidaaya-light/60"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            className="w-2 h-2 rounded-full bg-bidaaya-light/60"
          />
        </div>
      </div>
    </motion.div>
  )
}

