"use client";

import {
  Briefcase,
  FileText,
  MapIcon,
  PenToolIcon,
  SparklesIcon,
  Target,
  Menu,
  X,
  User,
  Settings,
  CreditCard,
  LogOut,
  Building,
  ChevronRight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AIInputWithSearch } from "@/components/ui/ai-input-with-search";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { VoicePoweredOrb } from "@/components/ui/voice-powered-orb";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface AIAssistantCardProps {
  onSubmit?: (message: string, withSearch: boolean) => void;
  onFileSelect?: (file: File) => void;
  className?: string;
}

export function AIAssistantCard({ onSubmit, onFileSelect, className }: AIAssistantCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);

  const handleQuickPrompt = (prompt: string) => {
    onSubmit?.(prompt, true);
  };

  const handleVoiceClick = () => {
    setShowVoiceInput(!showVoiceInput);
  };

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

          {/* Navigation Links - Ordered: Dashboard, Internships, Companies, Profile, Upgrade, Settings */}
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
              onClick={() => router.push('/dashboard/projects')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-bidaaya-light hover:bg-bidaaya-light/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5" />
                <span className="font-medium">Internships</span>
              </div>
              <ChevronRight className="h-4 w-4 text-bidaaya-light/40" />
            </button>

            <button 
              onClick={() => router.push('/dashboard/companies')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-bidaaya-light hover:bg-bidaaya-light/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5" />
                <span className="font-medium">Companies</span>
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
              onClick={() => router.push('/pricing')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-bidaaya-light hover:bg-bidaaya-light/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5" />
                <span className="font-medium">Upgrade</span>
              </div>
              <ChevronRight className="h-4 w-4 text-bidaaya-light/40" />
            </button>

            <button 
              onClick={() => router.push('/dashboard/settings')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-bidaaya-light hover:bg-bidaaya-light/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5" />
                <span className="font-medium">Settings</span>
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
          <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-full py-4">
            {/* AI Avatar - Voice Powered Orb */}
            <div className="relative mb-8">
              <div className="w-32 h-32 rounded-full overflow-hidden shadow-2xl">
                <VoicePoweredOrb
                  hue={0}
                  enableVoiceControl={showVoiceInput}
                  className="w-full h-full"
                  onVoiceDetected={(detected) => {
                    // Could add visual feedback when voice is detected
                    console.log('Voice detected:', detected);
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-bidaaya-dark flex items-center justify-center shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-medium text-bidaaya-light/80 mb-2">
                Hi {session?.user?.name?.split(' ')[0] || 'there'},
              </h2>
              <h3 className="text-2xl font-bold text-bidaaya-light mb-4">
                Welcome back! How can I help?
              </h3>
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
                className="h-10 cursor-pointer gap-2 text-sm rounded-full bg-bidaaya-light/10 text-bidaaya-light hover:bg-bidaaya-light/20 border-bidaaya-light/20 px-5"
                onClick={() => handleQuickPrompt("Help me build a custom CV and cover letter")}
              >
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

            {/* Voice Input */}
            {showVoiceInput && (
              <AIVoiceInput
                onStart={() => console.log('Voice recording started')}
                onStop={(duration) => console.log('Voice recording stopped, duration:', duration)}
                className="w-full mb-6"
              />
            )}
          </div>
        </div>

        {/* Fixed Input at Bottom */}
        <div className="px-4 pb-3 safe-bottom bg-bidaaya-dark">
          <div className="max-w-3xl mx-auto">
            <AIInputWithSearch
              placeholder="Ask me anything..."
              onSubmit={onSubmit}
              onFileSelect={onFileSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}