"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Briefcase,
  Globe,
  FileText,
  Lock,
  Unlock,
  TrendingUp,
  MessageCircle,
  Menu,
  ChevronRight,
  Flag,
  X,
  User,
  Settings,
  CreditCard,
  LogOut,
  Building,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OpportunityFeedbackModal } from "@/components/ui/opportunity-feedback-modal";
import { AgentControls } from "@/components/ui/agent-controls";
import { cn } from "@/lib/utils";

interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'internal' | 'external' | 'early_access';
  matchScore: number;
  matchReasons: {
    positive: string[];
    warnings: string[];
  };
  postedAt?: Date;
  earlyAccessUntil?: Date;
  isLocked?: boolean;
  unlockCredits?: number;
}

interface OpportunityDashboardProps {
  onChatClick?: () => void;
  onSidebarClick?: () => void;
}

export function OpportunityDashboard({ onChatClick, onSidebarClick }: OpportunityDashboardProps) {
  const { data: session } = useSession();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [earlyAccessUnlocksRemaining, setEarlyAccessUnlocksRemaining] = useState(0);
  const [userCredits, setUserCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load opportunities
      const oppResponse = await fetch('/api/opportunities/dashboard');
      if (oppResponse.ok) {
        const data = await oppResponse.json();
        setOpportunities(data.opportunities || []);
        setEarlyAccessUnlocksRemaining(data.earlyAccessUnlocksRemaining || 0);
      }

      // Load credits
      const creditsResponse = await fetch('/api/credits/balance');
      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json();
        setUserCredits(creditsData.remaining || 0);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockEarlyAccess = async (opportunityId: string) => {
    try {
      const response = await fetch('/api/opportunities/unlock-early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId }),
      });

      if (response.ok) {
        loadDashboardData(); // Refresh
      }
    } catch (error) {
      console.error('Failed to unlock opportunity:', error);
    }
  };

  const handleReportMismatch = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setFeedbackModalOpen(true);
  };

  const getTimeRemaining = (earlyAccessUntil: Date) => {
    const now = new Date();
    const diff = earlyAccessUntil.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return hours > 0 ? `${hours}h remaining` : 'Ending soon';
  };

  const userPlan = (session?.user as any)?.subscriptionPlan || 'FREE';
  const earlyAccessOpportunity = opportunities.find(opp => opp.type === 'early_access');
  const bidaayaOpportunities = opportunities.filter(opp => opp.type === 'internal').slice(0, 2);
  const externalOpportunities = opportunities.filter(opp => opp.type === 'external').slice(0, 2);

  return (
    <div className="min-h-screen bg-bidaaya-dark">
      {/* Sidebar Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/60 z-40"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div className={cn(
        "fixed top-0 left-0 h-full w-80 bg-bidaaya-dark/95 backdrop-blur-xl border-r border-bidaaya-light/10 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl",
        showSidebar ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 h-full flex flex-col safe-top overflow-y-auto">
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
                <p className="text-2xl font-bold text-bidaaya-light">{userCredits}</p>
              </div>
              <CreditCard className="h-5 w-5 text-bidaaya-accent" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            <a
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-bidaaya-accent/10 text-bidaaya-accent"
            >
              <Home className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </a>
            <a
              href="/dashboard/projects"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-bidaaya-light/60 hover:bg-bidaaya-light/5"
            >
              <Briefcase className="h-5 w-5" />
              <span>Internships</span>
            </a>
            <a
              href="/dashboard/companies"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-bidaaya-light/60 hover:bg-bidaaya-light/5"
            >
              <Building className="h-5 w-5" />
              <span>Companies</span>
            </a>
            <a
              href="/dashboard/cv"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-bidaaya-light/60 hover:bg-bidaaya-light/5"
            >
              <User className="h-5 w-5" />
              <span>My Profile</span>
            </a>
            <a
              href="/dashboard/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-bidaaya-light/60 hover:bg-bidaaya-light/5"
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </a>
          </nav>

          {/* Sign Out */}
          <button
            onClick={() => window.location.href = '/api/auth/signout'}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 mt-4"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Top Navigation */}
      <div className="bg-bidaaya-dark/95 backdrop-blur-xl border-b border-bidaaya-light/10 safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="text-bidaaya-light hover:bg-bidaaya-light/10"
              onClick={() => setShowSidebar(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-bidaaya-light/60">Credits</p>
                <p className="text-sm font-bold text-bidaaya-accent">{userCredits}</p>
              </div>
              {userPlan !== 'FREE' && (
                <div className="text-right">
                  <p className="text-xs text-bidaaya-light/60">Early Access</p>
                  <p className="text-sm font-bold text-green-400">{earlyAccessUnlocksRemaining} left</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-bidaaya-light mb-2">
            Welcome back, {session?.user?.name?.split(' ')[0]}
          </h1>
          <p className="text-bidaaya-light/60">
            Set your preferences and let our AI agent find opportunities for you
          </p>
        </motion.div>

        {/* Agent Controls */}
        <AgentControls onPreferencesChange={(prefs) => {
          console.log('Preferences updated:', prefs);
          // TODO: Refresh opportunities based on new preferences
        }} />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bidaaya-accent"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Today's Pick - Early Access */}
            {earlyAccessOpportunity && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-bidaaya-accent" />
                  <h2 className="text-xl font-semibold text-bidaaya-light">Today's Pick</h2>
                  <Badge className="bg-bidaaya-accent/20 text-bidaaya-accent border-bidaaya-accent/30">
                    Early Access
                  </Badge>
                </div>

                <OpportunityCard
                  opportunity={earlyAccessOpportunity}
                  onUnlock={handleUnlockEarlyAccess}
                  onReportMismatch={handleReportMismatch}
                  earlyAccessUnlocksRemaining={earlyAccessUnlocksRemaining}
                  userPlan={userPlan}
                />
              </motion.div>
            )}

            {/* Bidaaya Exclusive Internships */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="h-5 w-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-bidaaya-light">Bidaaya Exclusive</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {bidaayaOpportunities.map((opp, index) => (
                  <motion.div
                    key={opp.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <OpportunityCard opportunity={opp} onReportMismatch={handleReportMismatch} />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* External Opportunities */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Globe className="h-5 w-5 text-purple-400" />
                <h2 className="text-xl font-semibold text-bidaaya-light">External Opportunities</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {externalOpportunities.map((opp, index) => (
                  <motion.div
                    key={opp.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <OpportunityCard opportunity={opp} isExternal onReportMismatch={handleReportMismatch} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={onChatClick}
        className="fixed bottom-6 right-6 w-14 h-14 bg-bidaaya-accent hover:bg-bidaaya-accent/90 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 z-50 safe-bottom"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </button>

      {/* Feedback Modal */}
      {selectedOpportunity && (
        <OpportunityFeedbackModal
          isOpen={feedbackModalOpen}
          onClose={() => {
            setFeedbackModalOpen(false);
            setSelectedOpportunity(null);
          }}
          opportunityId={selectedOpportunity.id}
          opportunityType={selectedOpportunity.type === 'internal' ? 'internal' : 'external'}
          opportunityTitle={selectedOpportunity.title}
        />
      )}
    </div>
  );
}

// Opportunity Card Component
interface OpportunityCardProps {
  opportunity: Opportunity;
  isExternal?: boolean;
  onUnlock?: (opportunityId: string) => void;
  onReportMismatch?: (opportunity: Opportunity) => void;
  earlyAccessUnlocksRemaining?: number;
  userPlan?: string;
}

function OpportunityCard({ 
  opportunity, 
  isExternal = false,
  onUnlock,
  onReportMismatch,
  earlyAccessUnlocksRemaining = 0,
  userPlan = 'FREE'
}: OpportunityCardProps) {
  const isLocked = opportunity.isLocked && userPlan !== 'STUDENT_PRO';
  const hasPro = userPlan === 'STUDENT_PRO';
  const hasPremium = userPlan === 'STUDENT_PREMIUM';
  const hasFreeUnlocks = hasPremium && earlyAccessUnlocksRemaining > 0;
  
  // STUDENT_PRO: Unlimited early access (free)
  // STUDENT_PREMIUM: 5 free unlocks/month, then credits
  // FREE: Credits only

  return (
    <div className={cn(
      "bg-bidaaya-light/5 border border-bidaaya-light/10 rounded-xl p-6 transition-all hover:border-bidaaya-light/20 relative overflow-hidden",
      isLocked && "opacity-75"
    )}>
      {/* Early Access Badge */}
      {opportunity.earlyAccessUntil && (
        <div className="absolute top-4 right-4">
          <Badge className="bg-bidaaya-accent/20 text-bidaaya-accent border-bidaaya-accent/30 text-xs">
            🌟 {opportunity.earlyAccessUntil && getTimeRemaining(opportunity.earlyAccessUntil)}
          </Badge>
        </div>
      )}

      {/* Lock Overlay */}
      {isLocked && (
        <div className="absolute top-0 right-0 w-24 h-24 flex items-center justify-center">
          <Lock className="h-8 w-8 text-bidaaya-light/30" />
        </div>
      )}

      {/* Content */}
      <div className="space-y-4">
        {/* Title & Company */}
        <div>
          <h3 className="text-lg font-semibold text-bidaaya-light mb-1">
            {opportunity.title}
          </h3>
          <p className="text-sm text-bidaaya-light/60">{opportunity.company}</p>
        </div>

        {/* Location & Type */}
        <div className="flex items-center gap-4 text-sm text-bidaaya-light/60">
          <span>📍 {opportunity.location}</span>
        </div>

        {/* Match Score */}
        <div className="bg-bidaaya-light/5 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-bidaaya-light">Match Score</span>
            <span className="text-2xl font-bold text-bidaaya-accent">{opportunity.matchScore}%</span>
          </div>
          <div className="w-full bg-bidaaya-light/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-bidaaya-accent to-green-400 h-2 rounded-full transition-all"
              style={{ width: `${opportunity.matchScore}%` }}
            />
          </div>
        </div>

        {/* Match Reasons */}
        <div className="space-y-2">
          {opportunity.matchReasons.positive.slice(0, 2).map((reason, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              <span className="text-green-400 flex-shrink-0">✓</span>
              <span className="text-bidaaya-light/80">{reason}</span>
            </div>
          ))}
          {opportunity.matchReasons.warnings.slice(0, 1).map((warning, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              <span className="text-yellow-400 flex-shrink-0">⚠</span>
              <span className="text-bidaaya-light/60">{warning}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {isLocked ? (
            <>
              {hasPro ? (
                <Button
                  onClick={() => onUnlock?.(opportunity.id)}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  🔥 View Now (Pro Early Access)
                </Button>
              ) : hasFreeUnlocks ? (
                <Button
                  onClick={() => onUnlock?.(opportunity.id)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  Use Free Unlock ({earlyAccessUnlocksRemaining} left)
                </Button>
              ) : (
                <Button
                  onClick={() => onUnlock?.(opportunity.id)}
                  className="flex-1 bg-bidaaya-accent hover:bg-bidaaya-accent/90"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Unlock for {opportunity.unlockCredits} credits
                </Button>
              )}
            </>
          ) : (
            <>
              <Button className="flex-1 bg-bidaaya-accent hover:bg-bidaaya-accent/90">
                View Details
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
              {isExternal && (
                <Button variant="outline" className="border-bidaaya-light/20 text-bidaaya-light hover:bg-bidaaya-light/10">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate CV
                </Button>
              )}
            </>
          )}
        </div>

        {/* Report Mismatch Button */}
        {!isLocked && onReportMismatch && (
          <button
            onClick={() => onReportMismatch(opportunity)}
            className="flex items-center gap-2 text-xs text-bidaaya-light/60 hover:text-bidaaya-light transition-colors mt-3"
          >
            <Flag className="h-3 w-3" />
            <span>This doesn't match my profile</span>
          </button>
        )}
      </div>
    </div>
  );
}

function getTimeRemaining(earlyAccessUntil: Date): string {
  const now = new Date();
  const diff = earlyAccessUntil.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  return hours > 0 ? `${hours}h remaining` : 'Ending soon';
}

