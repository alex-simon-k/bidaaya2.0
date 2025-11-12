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
  Zap,
  CreditCard,
  LogOut,
  Building,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OpportunityFeedbackModal } from "@/components/ui/opportunity-feedback-modal";
import { AgentControlsV2 } from "@/components/ui/agent-controls-v2";
import { OpportunityCardV2 } from "@/components/ui/opportunity-card-v2";
import { OpportunityCardCompact } from "@/components/ui/opportunity-card-compact";
import { OpportunityDetailModal } from "@/components/ui/opportunity-detail-modal";
import { EarlyAccessBanner } from "@/components/ui/early-access-banner";
import { cn } from "@/lib/utils";

interface Opportunity {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  type: 'internal' | 'external' | 'early_access';
  matchScore: number;
  matchReasons: {
    positive: string[];
    warnings: string[];
  };
  postedAt?: Date;
  postedDate?: Date | string;
  earlyAccessUntil?: Date;
  isLocked?: boolean;
  unlockCredits?: number;
  applicationUrl?: string;
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
  const [earlyAccessDismissed, setEarlyAccessDismissed] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [appliedOpportunities, setAppliedOpportunities] = useState<Set<string>>(new Set());

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
        setUserCredits(creditsData.balance || 0);
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

  const handleOpportunityClick = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setDetailModalOpen(true);
  };

  const handleMarkAsApplied = (opportunityId: string) => {
    setAppliedOpportunities(prev => new Set(prev).add(opportunityId));
    // TODO: Persist to backend
    console.log('Marked as applied:', opportunityId);
  };

  const handleGenerateCV = () => {
    // TODO: Navigate to CV generation
    alert('Generating custom CV for this opportunity...');
  };

  const handleGenerateCoverLetter = () => {
    // TODO: Navigate to cover letter generation
    alert('Generating custom cover letter for this opportunity...');
  };

  const handleMarkAsApplied = async (opportunityId: string) => {
    const opportunity = opportunities.find(opp => opp.id === opportunityId);
    if (!opportunity) return;

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: opportunity.id,
          opportunityType: opportunity.type === 'internal' ? 'internal' : 'external',
          matchScore: opportunity.matchScore,
        }),
      });

      if (response.ok) {
        setAppliedOpportunities(prev => new Set(prev).add(opportunityId));
        alert('Application tracked! View it in My Applications.');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to mark as applied');
      }
    } catch (error) {
      console.error('Error marking as applied:', error);
      alert('Failed to mark as applied');
    }
  };

  const getTimeRemaining = (earlyAccessUntil: Date) => {
    try {
      const date = earlyAccessUntil instanceof Date ? earlyAccessUntil : new Date(earlyAccessUntil);
      if (isNaN(date.getTime())) {
        return 'Ending soon';
      }
      const now = new Date();
      const diff = date.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      return hours > 0 ? `${hours}h remaining` : 'Ending soon';
    } catch (error) {
      return 'Ending soon';
    }
  };

  const userPlan = (session?.user as any)?.subscriptionPlan || 'FREE';
  const earlyAccessOpportunity = opportunities.find(opp => opp.type === 'early_access');
  const bidaayaOpportunities = opportunities.filter(opp => opp.type === 'internal').slice(0, 2);
  const externalOpportunities = opportunities.filter(opp => opp.type === 'external').slice(0, 2);

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
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
              href="/dashboard/applications"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-bidaaya-light/60 hover:bg-bidaaya-light/5"
            >
              <FileText className="h-5 w-5" />
              <span>My Applications</span>
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 sm:pb-24">
        {/* AI Agent Controls V2 */}
        <div className="mb-4">
          <AgentControlsV2 onPreferencesChange={(prefs) => {
            console.log('Preferences updated:', prefs);
            // TODO: Refresh opportunities based on new preferences
          }} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bidaaya-accent"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Early Access Banner - Compact & Dismissable */}
            {earlyAccessOpportunity && !earlyAccessDismissed && (
              <EarlyAccessBanner
                opportunity={earlyAccessOpportunity}
                onDismiss={() => setEarlyAccessDismissed(true)}
                onClick={() => handleOpportunityClick(earlyAccessOpportunity)}
              />
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-bidaaya-accent" />
                <h2 className="text-lg sm:text-xl font-semibold text-bidaaya-light">Top Matches</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadDashboardData}
                className="border-bidaaya-light/20 text-bidaaya-light/70 hover:bg-bidaaya-light/10 text-xs sm:text-sm h-8"
              >
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>

            {/* 2x2 Grid of Opportunities */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
              {[...bidaayaOpportunities, ...externalOpportunities]
                .slice(0, 4)
                .map((opp) => (
                  <OpportunityCardCompact
                    key={opp.id}
                    opportunity={opp}
                    onClick={() => handleOpportunityClick(opp)}
                  />
                ))}
              
              {/* Fill empty slots if less than 4 opportunities */}
              {[...bidaayaOpportunities, ...externalOpportunities].length < 4 && (
                Array.from({ length: 4 - [...bidaayaOpportunities, ...externalOpportunities].length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="rounded-lg sm:rounded-xl border border-dashed border-bidaaya-light/10 bg-bidaaya-light/5 p-3 sm:p-4 flex items-center justify-center min-h-[120px] sm:min-h-[140px]"
                  >
                    <p className="text-[10px] sm:text-xs text-bidaaya-light/40 text-center">
                      No more opportunities<br />at this time
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Empty State */}
            {[...bidaayaOpportunities, ...externalOpportunities].length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-bidaaya-light/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-bidaaya-light mb-2">
                  No opportunities yet
                </h3>
                <p className="text-bidaaya-light/60 text-sm">
                  We're finding the best matches for your profile. Check back soon!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={onChatClick}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-bidaaya-accent hover:bg-bidaaya-accent/90 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 z-50"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
      </button>

      {/* Opportunity Detail Modal */}
      {selectedOpportunity && (
        <OpportunityDetailModal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedOpportunity(null);
          }}
          opportunity={selectedOpportunity}
          hasApplied={appliedOpportunities.has(selectedOpportunity.id)}
          onMarkAsApplied={() => handleMarkAsApplied(selectedOpportunity.id)}
          onGenerateCV={handleGenerateCV}
          onGenerateCoverLetter={handleGenerateCoverLetter}
        />
      )}

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
  try {
    const date = earlyAccessUntil instanceof Date ? earlyAccessUntil : new Date(earlyAccessUntil);
    if (isNaN(date.getTime())) {
      return 'Ending soon';
    }
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return hours > 0 ? `${hours}h remaining` : 'Ending soon';
  } catch (error) {
    return 'Ending soon';
  }
}

