'use client'

import { useState, useRef, useEffect } from 'react'
import { MainContainer, ChatContainer, MessageList, Message, MessageInput } from '@chatscope/chat-ui-kit-react'
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css'

interface ChatMessage {
  message: string
  sender: 'user' | 'ai'
  direction: 'incoming' | 'outgoing'
}

export default function AIChatBot() {
  const [isListening, setIsListening] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        handleSendMessage(transcript)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }
    }
  }, [])

  const startVoiceInput = () => {
    if (recognitionRef.current) {
      setIsListening(true)
      setShowChat(true)
      recognitionRef.current.start()
    } else {
      // Fallback: show chat input for typing
      setShowChat(true)
    }
  }

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return

    const userMessage: ChatMessage = {
      message: text,
      sender: 'user',
      direction: 'outgoing'
    }

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          conversationHistory: messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.message }))
        })
      })

      if (response.ok) {
        const data = await response.json()
        const aiMessage: ChatMessage = {
          message: data.message || 'I apologize, but I encountered an error. Please try again.',
          sender: 'ai',
          direction: 'incoming'
        }
        setMessages(prev => [...prev, aiMessage])
      } else {
        throw new Error('Failed to get AI response')
      }
    } catch (error) {
      console.error('AI chat error:', error)
      const errorMessage: ChatMessage = {
        message: 'Sorry, I encountered an error. Please try again later.',
        sender: 'ai',
        direction: 'incoming'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="flex flex-col items-center py-12 px-4">
      {/* AI Bot Avatar */}
      <div className="relative mb-6">
        <div 
          className={`w-32 h-32 rounded-full cursor-pointer transition-all duration-300 flex items-center justify-center text-6xl ${
            isListening 
              ? 'bg-bidaaya-accent animate-pulse shadow-lg shadow-bidaaya-accent/50' 
              : 'bg-bidaaya-accent hover:bg-blue-600 hover:scale-105'
          }`}
          onClick={startVoiceInput}
        >
          🤖
        </div>
        {isListening && (
          <div className="absolute inset-0 rounded-full border-4 border-bidaaya-accent animate-ping" />
        )}
      </div>

      {/* Instructions */}
      <div className="text-center max-w-md mb-8">
        <h2 className="text-2xl font-bold text-bidaaya-light mb-2">Bidaaya AI Assistant</h2>
        <p className="text-bidaaya-light/80 text-sm">
          {isListening 
            ? 'Listening... Speak now!' 
            : 'Click the bot to speak or type below to ask for internship advice, get personalized recommendations, or build a custom CV'
          }
        </p>
      </div>

      {/* Chat Interface */}
      {showChat && (
        <div className="w-full max-w-4xl">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden" style={{ height: '500px' }}>
            <MainContainer>
              <ChatContainer>
                <MessageList
                  scrollBehavior="smooth"
                  typingIndicator={isTyping ? <div className="text-gray-500 italic">AI is thinking...</div> : undefined}
                >
                  {messages.map((msg, i) => (
                    <Message 
                      key={i} 
                      model={{
                        message: msg.message,
                        sender: msg.sender,
                        direction: msg.direction,
                        position: 'single'
                      }}
                    />
                  ))}
                </MessageList>
                <MessageInput 
                  placeholder="Type your message here..." 
                  onSend={handleSendMessage}
                  disabled={isTyping}
                />
              </ChatContainer>
            </MainContainer>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            <button
              onClick={() => handleSendMessage("What internships match my profile?")}
              className="px-4 py-2 bg-bidaaya-accent text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              Find Internships
            </button>
            <button
              onClick={() => handleSendMessage("Help me build a custom CV")}
              className="px-4 py-2 bg-bidaaya-accent text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              Build CV
            </button>
            <button
              onClick={() => handleSendMessage("Give me career advice")}
              className="px-4 py-2 bg-bidaaya-accent text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              Career Advice
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
