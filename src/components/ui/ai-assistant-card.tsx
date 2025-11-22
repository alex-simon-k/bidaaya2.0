"use client";

import {
  Briefcase,
  FileText,
  MapIcon,
  Menu,
  X,
  User,
  Settings,
  CreditCard,
  LogOut,
  Building,
  ChevronRight,
  Send,
  Mic,
  Lock,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AIInputWithSearch } from "@/components/ui/ai-input-with-search";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { VoicePoweredOrb } from "@/components/ui/voice-powered-orb";
import { ChatMessage, TypingIndicator } from "@/components/ui/chat-message";
import { OpportunityCard } from "@/components/ui/opportunity-card";
import { ConversationLevelTracker } from "@/components/ui/conversation-level-tracker";
import { ProfileCompletionChecklist, DEFAULT_CHECKLIST_ITEMS, ChecklistItem } from "@/components/ui/profile-completion-checklist";
import { CVFormWizard } from "@/components/ui/cv-form-wizard";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  opportunityType?: string;
  opportunityIds?: string[];
  extractedData?: {
    type: string;
    success: boolean;
  };
}

interface CVProgress {
  overallScore: number;
  isMinimumViable: boolean;
  nextSection: string;
  educationCount: number;
  experienceCount: number;
  projectsCount: number;
  skillsCount?: number;
}

interface AIAssistantCardProps {
  className?: string;
}

export function AIAssistantCard({ className }: AIAssistantCardProps) {
  const { data: session, update } = useSession();
  const router = useRouter();
  
  const [showSidebar, setShowSidebar] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationLevel, setConversationLevel] = useState<number>(1);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [cvProgress, setCvProgress] = useState<CVProgress | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST_ITEMS);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  
  // Check if user is coming from CV page to edit - ALWAYS show form, skip welcome
  const [showStructuredForm, setShowStructuredForm] = useState(true); // Always show form in Phase 2

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Fetch CV progress on mount
  useEffect(() => {
    const fetchCVProgress = async () => {
      try {
        const response = await fetch('/api/cv/progress');
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Initial CV Progress loaded:', data);
          setCvProgress({
            overallScore: data.overallScore || 0,
            isMinimumViable: data.isMinimumViable || false,
            nextSection: data.nextSection || '',
            educationCount: data.educationCount || 0,
            experienceCount: data.experienceCount || 0,
            projectsCount: data.projectsCount || 0,
            skillsCount: data.skillsCount || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching CV progress:', error);
      }
    };

    fetchCVProgress();
  }, []); // Run once on mount

  // Update checklist based on CV progress
  useEffect(() => {
    if (!cvProgress) return;

    console.log('🔄 Updating checklist from CV progress:', cvProgress);

    setChecklistItems((prev) => prev.map((item) => {
      switch (item.id) {
        case "profile":
          // Profile completed in Phase I (always true if they're in Phase II)
          return { ...item, completed: true };
        case "education":
          return { ...item, completed: cvProgress.educationCount > 0 };
        case "experience":
          return { ...item, completed: cvProgress.experienceCount > 0 };
        case "projects":
          return { ...item, completed: cvProgress.projectsCount > 0 };
        case "skills":
          return { ...item, completed: (cvProgress.skillsCount || 0) >= 3 };
        default:
          return item;
      }
    }));
  }, [cvProgress, session]);

  // Auto-progress to Phase 3 when profile reaches 60%
  useEffect(() => {
    if (cvProgress && cvProgress.overallScore >= 60) {
      // Update user's onboarding phase to 'complete'
      fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingPhase: 'complete' })
      }).then(() => {
        // Redirect to dashboard (will now show OpportunityDashboard)
        window.location.href = '/dashboard'
      }).catch((err) => {
        console.error('Failed to update onboarding phase:', err)
      })
    }
  }, [cvProgress]);

  // Initialize speech recognition for voice input
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        if (transcript) {
          // Set transcript in state so it appears in the text box
          setVoiceTranscript(transcript)
          setIsListening(false)
        }
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

  // Send message to AI
  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    // Add user message to UI
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageText,
      createdAt: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/cv-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Update conversation ID
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }
      
      // Update conversation level if changed
      if (data.conversationLevel && data.conversationLevel !== conversationLevel) {
        setConversationLevel(data.conversationLevel);
        console.log(`📊 Conversation level updated to ${data.conversationLevel}`);
      }

      // Update CV progress
      if (data.cvProgress) {
        setCvProgress(data.cvProgress);
        console.log(`📊 CV Progress: ${data.cvProgress.overallScore}%`);
      }

      // Add AI response to messages
      setMessages((prev) => [...prev, {
        id: data.message.id,
        role: data.message.role,
        content: data.message.content,
        createdAt: data.message.createdAt ? new Date(data.message.createdAt) : new Date(),
        opportunityType: data.message.opportunityType,
        opportunityIds: data.message.opportunityIds,
        extractedData: data.extractedData,
      }]);

      // If AI recommended opportunities, fetch them
      if (data.message.opportunityIds && data.message.opportunityIds.length > 0) {
        await fetchOpportunities(data.message.opportunityIds, data.message.opportunityType);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`,
        role: 'system',
        content: 'Sorry, there was an error processing your message. Please try again.',
        createdAt: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch opportunities by IDs
  const fetchOpportunities = async (ids: string[], type: string) => {
    try {
      const endpoint = type === 'internal' ? '/api/projects' : '/api/external-opportunities';
      const response = await fetch(`${endpoint}?ids=${ids.join(',')}`);
      if (response.ok) {
        const data = await response.json();
        // Transform opportunities to ensure company is a string
        const transformedOpportunities = (data.opportunities || []).map((opp: any) => ({
          ...opp,
          company: opp.company?.companyName || opp.company?.name || opp.company || 'Unknown Company',
        }));
        setOpportunities(transformedOpportunities);
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleVoiceClick = () => {
    setShowVoiceInput(!showVoiceInput);
  };

  // Setup voice recognition when user wants to use it
  const startVoiceRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in your browser');
      return;
    }

    // Check if already listening
    if (isListening) {
      console.log('Already listening, stopping first...');
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        // Wait a bit before restarting
        setTimeout(() => {
          startVoiceRecognition();
        }, 100);
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
      return;
    }

    try {
      setIsListening(true);
      recognitionRef.current.start();
    } catch (error: any) {
      console.error('Failed to start speech recognition:', error);
      setIsListening(false);
      if (error.name === 'InvalidStateError' || error.message?.includes('already started')) {
        // Try to stop and restart
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            setIsListening(true);
            recognitionRef.current.start();
          }, 100);
        } catch (e) {
          console.error('Error restarting recognition:', e);
          setIsListening(false);
        }
      } else {
        alert('Speech recognition not supported in your browser');
      }
    }
  };

  // Show welcome screen if no messages
  const showWelcome = messages.length === 0;

  // Show structured form wizard if enabled
  if (showStructuredForm) {
    return (
      <CVFormWizard
        onComplete={async () => {
          setShowStructuredForm(false);
          
          // Update onboarding phase to 'complete' to show the opportunity dashboard
          try {
            const response = await fetch('/api/user/profile', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                onboardingPhase: 'complete',
              }),
            });

            if (response.ok) {
              // Update the session with new onboarding phase
              await update({ onboardingPhase: 'complete' });
              
              // Force page reload to show the opportunity dashboard
              window.location.href = '/dashboard';
            }
          } catch (error) {
            console.error('Error updating onboarding phase:', error);
          }
          
          // Refresh CV progress
          fetch('/api/cv/progress')
            .then(res => res.json())
            .then(data => {
              setCvProgress({
                overallScore: data.overallScore || 0,
                isMinimumViable: data.isMinimumViable || false,
                nextSection: data.nextSection || '',
                educationCount: data.educationCount || 0,
                experienceCount: data.experienceCount || 0,
                projectsCount: data.projectsCount || 0,
                skillsCount: data.skillsCount || 0,
              });
            });
        }}
        onCancel={() => {
          // Redirect to dashboard instead of showing welcome screen
          window.location.href = '/dashboard';
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-bidaaya-dark overflow-hidden">
      {/* Sidebar Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/60 z-40"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar Panel - Like ChatGPT */}
      <div className={cn(
        "fixed top-0 left-0 h-full w-80 bg-bidaaya-dark/95 backdrop-blur-xl border-r border-bidaaya-light/10 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl",
        showSidebar ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 h-full flex flex-col safe-top">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <img 
                  src="/android-chrome-192x192.png" 
                  alt="Bidaaya Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-bidaaya-light font-semibold">Bidaaya</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-bidaaya-light hover:bg-bidaaya-light/10"
              onClick={() => setShowSidebar(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Credit Balance */}
          <div className="bg-bidaaya-light/5 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-bidaaya-light/60">Available Credits</p>
                <p className="text-2xl font-bold text-bidaaya-light">20</p>
              </div>
              <CreditCard className="h-5 w-5 text-bidaaya-accent" />
            </div>
          </div>

          {/* Navigation Links - Ordered: Dashboard, Companies, Profile, Upgrade, Settings */}
          <nav className="flex-1 space-y-1">
            <button 
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-bidaaya-light hover:bg-bidaaya-light/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <User className="h-5 w-5" />
                <span className="font-medium">Dashboard</span>
              </div>
              <ChevronRight className="h-4 w-4 text-bidaaya-light/40" />
            </button>

            <button 
              onClick={() => {
                alert('🔒 Companies feature coming soon! Send personalized proposals to Bidaaya partner companies using credits.');
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-bidaaya-light/60 hover:bg-bidaaya-light/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5" />
                <span className="font-medium">Companies</span>
                <Lock className="h-3 w-3 ml-1" />
              </div>
              <ChevronRight className="h-4 w-4 text-bidaaya-light/40" />
            </button>

            <button 
              onClick={() => router.push('/dashboard/profile')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-bidaaya-light hover:bg-bidaaya-light/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <User className="h-5 w-5" />
                <span className="font-medium">Profile</span>
              </div>
              <ChevronRight className="h-4 w-4 text-bidaaya-light/40" />
            </button>

            <button 
              onClick={() => router.push('/student/subscription')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-bidaaya-light hover:bg-bidaaya-light/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5" />
                <span className="font-medium">Land an Internship Faster</span>
              </div>
              <ChevronRight className="h-4 w-4 text-bidaaya-light/40" />
            </button>

            <button 
              onClick={() => router.push('/student/settings')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-bidaaya-light hover:bg-bidaaya-light/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5" />
                <span className="font-medium">Settings & Credits</span>
              </div>
              <ChevronRight className="h-4 w-4 text-bidaaya-light/40" />
            </button>
          </nav>

          {/* User Profile Footer */}
          <div className="border-t border-bidaaya-light/10 pt-4 mt-4">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-bidaaya-accent flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {session?.user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-bidaaya-light truncate">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs text-bidaaya-light/60 truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-bidaaya-light/80 hover:bg-bidaaya-light/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Interface - PURE DARK */}
      <div className="flex flex-col h-full w-full">
        {/* Top-left menu button - ChatGPT style */}
        <div className="absolute top-3 left-3 z-30 safe-top">
          <Button
            variant="ghost"
            size="icon"
            className="text-bidaaya-light hover:bg-bidaaya-light/10 rounded-lg h-10 w-10"
            onClick={() => setShowSidebar(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-4 pt-16 pb-2 safe-top safe-bottom">
          <div className="max-w-3xl mx-auto">
            {/* Welcome screen removed - users go directly to structured form or chat */}
            {false ? (
              /* Old Welcome Screen - REMOVED */
              <div className="flex flex-col items-center justify-center min-h-full py-4">
                {/* AI Avatar - Voice Powered Orb */}
                <div className="relative mb-8">
                  <div className="w-32 h-32 rounded-full overflow-hidden shadow-2xl">
                    <VoicePoweredOrb
                      hue={0}
                      enableVoiceControl={false}
                      className="w-full h-full"
                      onVoiceDetected={(detected) => {
                        // Voice handled by SpeechRecognition, not VoicePoweredOrb
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-bidaaya-dark flex items-center justify-center shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>

                {/* Welcome Message */}
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold text-bidaaya-light mb-2">
                    Let's land you an internship! 🚀
                  </h3>
                  <p className="text-sm text-bidaaya-light/60">
                    Reach 60% to unlock personalized opportunities
                  </p>
                </div>

              {/* Start Building Button */}
              <div className="mb-8 w-full max-w-md mx-auto">
                <button
                  onClick={() => setShowStructuredForm(true)}
                  className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3"
                >
                  <span className="text-lg">Start Building Your Profile</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>

                {/* Profile Completion Checklist */}
                <div className="mb-8 max-w-md mx-auto">
                  <ProfileCompletionChecklist items={checklistItems} />
                </div>

                {/* Quick Action Badges */}
                <div className="flex flex-wrap items-center justify-center gap-3 mb-8 max-w-lg">
                  <Badge
                    variant="secondary"
                    className="h-10 cursor-pointer gap-2 text-sm rounded-full bg-bidaaya-light/10 text-bidaaya-light hover:bg-bidaaya-light/20 border-bidaaya-light/20 px-5"
                    onClick={() => handleQuickPrompt("Find opportunities that match my profile")}
                  >
                    <Briefcase className="h-4 w-4 text-blue-400" />
                    Find Opportunities
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "h-10 gap-2 text-sm rounded-full px-5 relative",
                      cvProgress?.overallScore && cvProgress?.overallScore >= 60
                        ? "cursor-pointer bg-bidaaya-light/10 text-bidaaya-light hover:bg-bidaaya-light/20 border-bidaaya-light/20"
                        : "cursor-not-allowed bg-bidaaya-light/5 text-bidaaya-light/40 border-bidaaya-light/10 opacity-60"
                    )}
                    onClick={() => {
                      if (cvProgress?.overallScore && cvProgress?.overallScore >= 60) {
                        handleQuickPrompt("Help me build a custom CV and cover letter")
                      } else {
                        alert("🔒 Complete your profile to 60% to unlock custom CV generation!")
                      }
                    }}
                  >
                    {cvProgress?.overallScore && cvProgress?.overallScore < 60 && (
                      <span className="text-xs">🔒</span>
                    )}
                    <FileText className="h-4 w-4 text-green-400" />
                    Build Custom CV
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="h-10 cursor-pointer gap-2 text-sm rounded-full bg-bidaaya-light/10 text-bidaaya-light hover:bg-bidaaya-light/20 border-bidaaya-light/20 px-5"
                    onClick={() => handleQuickPrompt("Create my career journey plan")}
                  >
                    <MapIcon className="h-4 w-4 text-purple-400" />
                    Create Career Journey
                  </Badge>
                </div>

                {/* Voice Input Toggle */}
                <button
                  onClick={handleVoiceClick}
                  className="text-sm text-bidaaya-light/60 hover:text-bidaaya-light mb-4 flex items-center gap-2"
                >
                  🎤 {showVoiceInput ? 'Hide Voice' : 'Use Voice'}
                </button>

                {/* Voice Input Toggle Button */}
                {showVoiceInput && (
                  <div className="w-full mb-6 flex flex-col items-center gap-2">
                    <button
                      onClick={startVoiceRecognition}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      🎤 Start Voice Input
                    </button>
                    <p className="text-xs text-bidaaya-light/60">Click to speak</p>
                  </div>
                )}
              </div>
            ) : (
              /* Chat Messages */
              <div className="py-4">
                {messages.map((message, index) => (
                  <div key={message.id}>
                    <ChatMessage
                      role={message.role}
                      content={message.content}
                      timestamp={message.createdAt}
                      showAvatar={true}
                    />
                    
                    {/* Show extracted data feedback */}
                    {message.extractedData && message.extractedData.success && (
                      <div className="ml-11 mb-4 text-sm italic text-bidaaya-light/60 bg-bidaaya-light/5 rounded-lg px-3 py-2 border border-bidaaya-light/10">
                        <span className="text-green-400">✓</span> Saved {message.extractedData.type === 'experience' ? 'work experience' : 
                          message.extractedData.type === 'education' ? 'education details' : 
                          message.extractedData.type === 'project' ? 'project information' :
                          message.extractedData.type === 'skill' ? 'skills' :
                          'information'} to your CV
                      </div>
                    )}
                    
                    {/* Show opportunities if this message has them */}
                    {message.opportunityIds && message.opportunityIds.length > 0 && (
                      <div className="ml-11 mb-4 space-y-3">
                        {opportunities
                          .filter(opp => message.opportunityIds?.includes(opp.id))
                          .map(opp => (
                            <OpportunityCard
                              key={opp.id}
                              opportunity={opp}
                              type={message.opportunityType as 'internal' | 'external'}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* CV Progress Indicator */}
                {cvProgress && cvProgress.overallScore > 0 && (
                  <div className="sticky bottom-0 bg-bidaaya-dark/95 backdrop-blur-sm border-t border-bidaaya-light/10 p-4 mb-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-bidaaya-light">CV Completeness</span>
                      <span className="text-sm font-bold text-bidaaya-accent">{cvProgress.overallScore}%</span>
                    </div>
                    <div className="w-full bg-bidaaya-light/10 rounded-full h-2 mb-2">
                      <div 
                        className="bg-gradient-to-r from-bidaaya-accent to-green-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${cvProgress.overallScore}%` }}
                      />
                    </div>
                    <div className="flex gap-4 text-xs text-bidaaya-light/60">
                      <span>📚 Education: {cvProgress.educationCount}</span>
                      <span>💼 Experience: {cvProgress.experienceCount}</span>
                      <span>🚀 Projects: {cvProgress.projectsCount}</span>
                    </div>
                    {cvProgress.isMinimumViable && cvProgress.overallScore >= 60 && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/cv/export/docx')
                              if (response.ok) {
                                const blob = await response.blob()
                                const url = window.URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `CV_${session?.user?.name?.replace(/\s+/g, '_')}.docx`
                                document.body.appendChild(a)
                                a.click()
                                window.URL.revokeObjectURL(url)
                                document.body.removeChild(a)
                              }
                            } catch (error) {
                              console.error('Download error:', error)
                            }
                          }}
                          className="flex-1 bg-bidaaya-accent hover:bg-bidaaya-accent/90 text-white"
                          size="sm"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Download CV
                        </Button>
                        <Button
                          onClick={() => router.push('/dashboard/cv')}
                          variant="outline"
                          className="flex-1 border-bidaaya-light/20 text-bidaaya-light hover:bg-bidaaya-light/10"
                          size="sm"
                        >
                          Preview
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Typing Indicator */}
                {isLoading && <TypingIndicator />}
                
                {/* Auto-scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Fixed Input at Bottom */}
        <div className="px-4 pb-3 safe-bottom bg-bidaaya-dark">
          <div className="max-w-3xl mx-auto relative">
            <AIInputWithSearch
              placeholder="Ask me anything..."
              onSubmit={(message) => handleSendMessage(message)}
              externalValue={voiceTranscript}
              onExternalValueSet={() => setVoiceTranscript('')}
            />
            <button
              type="button"
              onClick={startVoiceRecognition}
              className={cn(
                "absolute right-[60px] top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors z-10",
                isListening 
                  ? "bg-red-500/20 hover:bg-red-500/30" 
                  : "hover:bg-bidaaya-light/10"
              )}
            >
              <Mic className={cn(
                "w-5 h-5",
                isListening ? "text-red-400 animate-pulse" : "text-bidaaya-light/60 hover:text-bidaaya-light"
              )} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}