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
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AIInputWithSearch } from "@/components/ui/ai-input-with-search";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface AIAssistantCardProps {
  onSubmit?: (message: string, withSearch: boolean) => void;
  onFileSelect?: (file: File) => void;
  className?: string;
}

export function AIAssistantCard({ onSubmit, onFileSelect, className }: AIAssistantCardProps) {
  const { data: session } = useSession();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);

  const handleQuickPrompt = (prompt: string) => {
    onSubmit?.(prompt, true);
  };

  const handleVoiceClick = () => {
    setShowVoiceInput(!showVoiceInput);
  };

  return (
    <div className="flex flex-col h-full w-full bg-bidaaya-dark overflow-hidden">
      {/* Sidebar Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/60 z-40"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 h-full w-80 bg-bidaaya-dark border-r border-bidaaya-light/10 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl",
        showSidebar ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 h-full flex flex-col safe-top">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-bidaaya-accent flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="text-bidaaya-light font-semibold">Bidaaya</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-bidaaya-light hover:bg-bidaaya-light/10"
              onClick={() => setShowSidebar(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Credit Balance */}
          <div className="bg-bidaaya-light/5 rounded-lg p-3 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-bidaaya-light/60">Available Credits</p>
                <p className="text-lg font-bold text-bidaaya-light">20</p>
              </div>
              <CreditCard className="h-4 w-4 text-bidaaya-accent" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            <Button variant="ghost" className="w-full justify-start text-bidaaya-light hover:bg-bidaaya-light/10">
              <Briefcase className="h-4 w-4 mr-3" />
              Internships
            </Button>
            <Button variant="ghost" className="w-full justify-start text-bidaaya-light hover:bg-bidaaya-light/10">
              <Target className="h-4 w-4 mr-3" />
              Companies
            </Button>
            <Button variant="ghost" className="w-full justify-start text-bidaaya-light hover:bg-bidaaya-light/10">
              <User className="h-4 w-4 mr-3" />
              Profile
            </Button>
            <Button variant="ghost" className="w-full justify-start text-bidaaya-light hover:bg-bidaaya-light/10">
              <Settings className="h-4 w-4 mr-3" />
              Settings
            </Button>
          </nav>

          {/* User Profile */}
          <div className="border-t border-bidaaya-light/10 pt-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-bidaaya-accent flex items-center justify-center">
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
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-bidaaya-light/80 hover:bg-bidaaya-light/10"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {/* Top Bar - Integrated into dark background */}
      <div className="flex items-center justify-between px-4 pt-2 pb-3 bg-bidaaya-dark safe-top">
        <Button
          variant="ghost"
          size="icon"
          className="text-bidaaya-light hover:bg-bidaaya-light/10"
          onClick={() => setShowSidebar(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="text-bidaaya-light font-semibold text-sm">Bidaaya AI</div>
        
        <div className="w-10 h-10"></div>
      </div>

        {/* Chat Interface */}
        <div className={cn(
          "flex-1 flex flex-col bg-bidaaya-dark overflow-hidden",
          className
        )}>
          <div className="flex-1 flex flex-col px-4 pb-4 overflow-y-auto">
            {/* AI Assistant Header */}
            <div className="flex flex-col items-center justify-center space-y-8 flex-1">
              {/* AI Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-bidaaya-accent to-blue-600 flex items-center justify-center shadow-lg">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <SparklesIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-bidaaya-dark flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="flex flex-col space-y-2.5 text-center max-w-md">
                <div className="flex flex-col">
                  <h2 className="text-xl font-medium tracking-tight text-bidaaya-light/80">
                    Hi {session?.user?.name?.split(' ')[0] || 'there'},
                  </h2>
                  <h3 className="text-2xl font-bold tracking-[-0.006em] text-bidaaya-light">
                    Welcome back! How can I help?
                  </h3>
                </div>
                <p className="text-sm text-bidaaya-light/60">
                  I'm here to help you find internships, build your career, and create custom CVs. 
                  Choose from the prompts below or just tell me what you need!
                </p>
              </div>

              {/* Quick Action Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
                <Badge
                  variant="secondary"
                  className="h-8 cursor-pointer gap-2 text-sm rounded-full bg-bidaaya-light/10 text-bidaaya-light hover:bg-bidaaya-light/20 border-bidaaya-light/20"
                  onClick={() => handleQuickPrompt("Find internships that match my profile")}
                >
                  <Briefcase className="h-4 w-4 text-blue-400" />
                  Find Internships
                </Badge>
                <Badge
                  variant="secondary"
                  className="h-8 cursor-pointer gap-2 text-sm rounded-full bg-bidaaya-light/10 text-bidaaya-light hover:bg-bidaaya-light/20 border-bidaaya-light/20"
                  onClick={() => handleQuickPrompt("Help me build a custom CV")}
                >
                  <FileText className="h-4 w-4 text-green-400" />
                  Build CV
                </Badge>
                <Badge
                  variant="secondary"
                  className="h-8 cursor-pointer gap-2 text-sm rounded-full bg-bidaaya-light/10 text-bidaaya-light hover:bg-bidaaya-light/20 border-bidaaya-light/20"
                  onClick={() => handleQuickPrompt("Create a career development plan")}
                >
                  <MapIcon className="h-4 w-4 text-purple-400" />
                  Career Plan
                </Badge>
                <Badge
                  variant="secondary"
                  className="h-8 cursor-pointer gap-2 text-sm rounded-full bg-bidaaya-light/10 text-bidaaya-light hover:bg-bidaaya-light/20 border-bidaaya-light/20"
                  onClick={() => handleQuickPrompt("Give me career advice and tips")}
                >
                  <PenToolIcon className="h-4 w-4 text-yellow-400" />
                  Career Advice
                </Badge>
                <Badge
                  variant="secondary"
                  className="h-8 cursor-pointer gap-2 text-sm rounded-full bg-bidaaya-light/10 text-bidaaya-light hover:bg-bidaaya-light/20 border-bidaaya-light/20"
                  onClick={() => handleQuickPrompt("Help me with interview preparation")}
                >
                  <Target className="h-4 w-4 text-red-400" />
                  Interview Prep
                </Badge>
                <Badge
                  variant="secondary"
                  className="h-8 cursor-pointer gap-2 text-sm rounded-full bg-bidaaya-light/10 text-bidaaya-light hover:bg-bidaaya-light/20 border-bidaaya-light/20"
                  onClick={() => handleQuickPrompt("Show me more options")}
                >
                  <SparklesIcon className="h-4 w-4 text-pink-400" />
                  More
                </Badge>
              </div>

              {/* Voice Input Toggle */}
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleVoiceClick}
                  className="text-bidaaya-light/60 hover:text-bidaaya-light hover:bg-bidaaya-light/10"
                >
                  🎤 {showVoiceInput ? 'Hide Voice' : 'Use Voice'}
                </Button>
              </div>

              {/* Voice Input */}
              {showVoiceInput && (
                <AIVoiceInput
                  onStart={() => console.log('Voice recording started')}
                  onStop={(duration) => console.log('Voice recording stopped, duration:', duration)}
                  className="w-full"
                />
              )}
            </div>

            {/* Input Area */}
            <div className="mt-auto pt-4">
              <AIInputWithSearch
                placeholder="Ask me anything about internships, career advice, or CV building..."
                onSubmit={onSubmit}
                onFileSelect={onFileSelect}
              />
            </div>
          </div>

      {/* Integrated Bottom Navigation - Part of dark interface */}
      <div className="bg-bidaaya-dark border-t border-bidaaya-light/10 safe-bottom">
        <div className="flex items-center justify-around py-2 px-4">
          <button className="flex flex-col items-center justify-center py-2 px-3 rounded-lg text-bidaaya-light/60 hover:text-bidaaya-light hover:bg-bidaaya-light/5 transition-colors">
            <User className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Profile</span>
          </button>
          <button className="flex flex-col items-center justify-center py-2 px-3 rounded-lg text-bidaaya-accent bg-bidaaya-accent/10 transition-colors">
            <Briefcase className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Internships</span>
          </button>
          <button className="flex flex-col items-center justify-center py-2 px-3 rounded-lg text-bidaaya-light/60 hover:text-bidaaya-light hover:bg-bidaaya-light/5 transition-colors">
            <Target className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Companies</span>
          </button>
        </div>
      </div>
    </div>
  );
}
