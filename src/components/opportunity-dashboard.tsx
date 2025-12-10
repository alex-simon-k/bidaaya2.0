"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Image from "next/image";
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
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OpportunityFeedbackModal } from "@/components/ui/opportunity-feedback-modal";
import { AgentControlsV2 } from "@/components/ui/agent-controls-v2";
import { OpportunityCardV2 } from "@/components/ui/opportunity-card-v2";
import { OpportunityCardCompact } from "@/components/ui/opportunity-card-compact";
import { OpportunityDetailModal } from "@/components/ui/opportunity-detail-modal";
import { EarlyAccessBanner } from "@/components/ui/early-access-banner";
import { StreakMasterCard } from "@/components/streak-master-card";
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
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [appliedOpportunities, setAppliedOpportunities] = useState<Set<string>>(new Set());
  const [agentActive, setAgentActive] = useState(false);
  const [agentExpanded, setAgentExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Add cache busting timestamp to force fresh data
      const timestamp = Date.now();

      // Load opportunities - USE SIMPLIFIED API
      const oppResponse = await fetch(`/api/opportunities/dashboard-simple?t=${timestamp}`, {
        cache: 'no-store' // Force no caching
      });
      if (oppResponse.ok) {
        const data = await oppResponse.json();
        console.log(`📊 Frontend: Received ${data.opportunities?.length || 0} opportunities`);
        setOpportunities(data.opportunities || []);
        setEarlyAccessUnlocksRemaining(data.earlyAccessUnlocksRemaining || 0);
        setUserCredits(data.userCredits || 0); // Also get credits from dashboard API
      }

      // Load credits again for confirmation
      const creditsResponse = await fetch(`/api/credits/balance?t=${timestamp}`, {
        cache: 'no-store'
      });
      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json();
        setUserCredits(creditsData.balance || 0);
      }

      // Load agent preferences
      const prefsResponse = await fetch(`/api/user/preferences?t=${timestamp}`, {
        cache: 'no-store'
      });
      if (prefsResponse.ok) {
        const prefsData = await prefsResponse.json();
        setAgentActive(prefsData.preferences?.agentActive || false);
      }

      console.log('✅ Dashboard refreshed successfully');
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockEarlyAccess = async (opportunityId: string, opportunityType: string = 'external') => {
    try {
      const response = await fetch('/api/opportunities/unlock-early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId, opportunityType }),
      });

      if (response.ok) {
        const data = await response.json();

        // Close the modal
        setDetailModalOpen(false);
        setSelectedOpportunity(null);

        // Refresh dashboard to get updated data
        await loadDashboardData();

        // Show success message
        alert(data.message || 'Opportunity unlocked! You can now view full details and apply.');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to unlock opportunity');
      }
    } catch (error) {
      console.error('Failed to unlock opportunity:', error);
      alert('Failed to unlock opportunity. Please try again.');
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

  const handleGenerateCV = () => {
    // Check if Phase II is completed
    if (!(session?.user as any)?.profileCompleted) {
      console.log('⚠️ Phase II not completed, redirecting to builder...');
      window.location.href = '/dashboard?cv_edit=true';
      return;
    }
    // TODO: Navigate to CV generation
    alert('Generating custom CV for this opportunity...');
  };

  const handleGenerateCoverLetter = () => {
    // Check if Phase II is completed
    if (!(session?.user as any)?.profileCompleted) {
      console.log('⚠️ Phase II not completed, redirecting to builder...');
      window.location.href = '/dashboard?cv_edit=true';
      return;
    }
    // TODO: Navigate to cover letter generation
    alert('Generating custom cover letter for this opportunity...');
  };

  const handleMarkAsApplied = async (opportunityId: string) => {
    // Check if Phase II is completed
    if (!(session?.user as any)?.profileCompleted) {
      console.log('⚠️ Phase II not completed, redirecting to builder...');
      window.location.href = '/dashboard?cv_edit=true';
      return;
    }

    const opportunity = opportunities.find(opp => opp.id === opportunityId);
    if (!opportunity) return;

    try {
      // For external opportunities, use the specific external opportunity application endpoint
      let response;
      if (opportunity.type === 'external' || opportunity.type === 'early_access') {
        response = await fetch(`/api/external-opportunities/${opportunityId}/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notes: `Match score: ${opportunity.matchScore || 0}%`,
          }),
        });
      } else {
        // For internal opportunities, use generic tracking
        response = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            opportunityTitle: opportunity.title,
            opportunityCompany: opportunity.company,
            opportunityUrl: opportunity.applicationUrl,
            opportunityLocation: opportunity.location,
            notes: `Match score: ${opportunity.matchScore || 0}%`,
          }),
        });
      }

      if (response.ok) {
        setAppliedOpportunities(prev => new Set(prev).add(opportunityId));

        // Close modal if it's open
        setDetailModalOpen(false);
        setSelectedOpportunity(null);

        // Refresh dashboard to show next early access opportunity
        await loadDashboardData();

        alert('Application tracked! View it in My Applications.');
      } else {
        const data = await response.json();
        if (data.alreadyApplied) {
          // Already applied - just close modal and refresh
          setAppliedOpportunities(prev => new Set(prev).add(opportunityId));
          setDetailModalOpen(false);
          setSelectedOpportunity(null);
          await loadDashboardData();
        } else {
          alert(data.error || 'Failed to mark as applied');
        }
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
  const earlyAccessOpportunities = opportunities.filter(opp => opp.type === 'early_access');
  const bidaayaOpportunities = opportunities.filter(opp => opp.type === 'internal');
  const externalOpportunities = opportunities.filter(opp => opp.type === 'external');

  console.log(`📊 Frontend Display: ${earlyAccessOpportunities.length} early access, ${bidaayaOpportunities.length} internal, ${externalOpportunities.length} external`);

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
            <button
              onClick={() => { window.location.href = '/dashboard'; setShowSidebar(false); }}
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
              onClick={() => { window.location.href = '/dashboard/profile'; setShowSidebar(false); }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-bidaaya-light hover:bg-bidaaya-light/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <User className="h-5 w-5" />
                <span className="font-medium">Profile</span>
              </div>
              <ChevronRight className="h-4 w-4 text-bidaaya-light/40" />
            </button>

            <button
              onClick={() => {
                alert('🔒 Jobless Meter feature coming soon! Compare your streaks and scores with friends, see who\'s leading, and stay motivated together.');
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-bidaaya-light/60 hover:bg-bidaaya-light/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5" />
                <span className="font-medium">Jobless Meter</span>
                <Lock className="h-3 w-3 ml-1" />
              </div>
              <ChevronRight className="h-4 w-4 text-bidaaya-light/40" />
            </button>

            <button
              onClick={() => { window.location.href = '/dashboard/applications'; setShowSidebar(false); }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-bidaaya-light hover:bg-bidaaya-light/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5" />
                <span className="font-medium">Applications</span>
              </div>
              <ChevronRight className="h-4 w-4 text-bidaaya-light/40" />
            </button>

            <button
              onClick={() => {
                setShowSidebar(false)
                alert('🔒 My CVs feature is currently locked. This feature will be available soon.')
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-bidaaya-light/60 hover:bg-bidaaya-light/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5" />
                <span className="font-medium">My CVs</span>
                <Lock className="h-3 w-3 ml-1" />
              </div>
              <ChevronRight className="h-4 w-4 text-bidaaya-light/40" />
            </button>

            <button
              onClick={() => { window.location.href = '/student/subscription'; setShowSidebar(false); }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-bidaaya-light hover:bg-bidaaya-light/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5" />
                <span className="font-medium">Land an Internship Faster</span>
              </div>
              <ChevronRight className="h-4 w-4 text-bidaaya-light/40" />
            </button>

            <button
              onClick={() => { window.location.href = '/student/settings'; setShowSidebar(false); }}
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
              onClick={() => window.location.href = '/api/auth/signout'}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-bidaaya-light/80 hover:bg-bidaaya-light/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sign out</span>
            </button>
          </div>
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
            if ('agentActive' in prefs) {
              setAgentActive(prefs.agentActive as boolean);
            }
            if ('isExpanded' in prefs) {
              setAgentExpanded(prefs.isExpanded as boolean);
            }
            // TODO: Refresh opportunities based on new preferences
          }} />
        </div>

        {/* StreakMaster Card - New 3D Design */}
        <div className="mb-6">
          <StreakMasterCard />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bidaaya-accent"></div>
          </div>
        ) : !agentActive ? (
          /* Agent Off - Show CV/Cover Letter Builders */
          <div className="space-y-3">
            {/* Turn On Agent Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-4 text-center"
            >
              <Zap className="h-8 w-8 text-bidaaya-light/40 mx-auto mb-2" />
              <h3 className="text-base font-semibold text-bidaaya-light mb-1">
                Turn on the agent to start seeing opportunities
              </h3>
              <p className="text-xs text-bidaaya-light/60">
                Enable the AI agent above to discover personalized opportunities
              </p>
            </motion.div>

            {/* CV and Cover Letter Builders - Compact */}
            <div className="grid grid-cols-2 gap-2.5">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onClick={async () => {
                  try {
                    setIsExporting(true)
                    setExportProgress(10)

                    // Simulate progress while waiting for response
                    const progressInterval = setInterval(() => {
                      setExportProgress(prev => {
                        if (prev >= 90) {
                          clearInterval(progressInterval)
                          return 90
                        }
                        return prev + 10
                      })
                    }, 500)

                    const response = await fetch('/api/cv/export/docx')

                    clearInterval(progressInterval)

                    if (response.ok) {
                      setExportProgress(100)
                      const blob = await response.blob()
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      // Use a generic name or fetch user name if available (session is available in scope)
                      a.download = `CV_Bidaaya.docx`
                      document.body.appendChild(a)
                      a.click()
                      window.URL.revokeObjectURL(url)
                      document.body.removeChild(a)

                      // Wait a bit to show 100% then show recommendations
                      setTimeout(() => {
                        setShowRecommendations(true)
                        // Refresh to update credits in background
                        loadDashboardData()
                      }, 1000)
                    } else {
                      setIsExporting(false)
                      if (response.status === 402) {
                        alert('Insufficient credits to generate CV.')
                      } else {
                        alert('Failed to generate CV. Please try again.')
                      }
                    }
                  } catch (error) {
                    console.error('Download error:', error)
                    setIsExporting(false)
                    alert('An error occurred while downloading the CV.')
                  }
                }}
                className="bg-gradient-to-br from-bidaaya-accent/10 to-purple-500/10 border border-bidaaya-accent/20 rounded-xl p-3 hover:bg-bidaaya-accent/20 transition-all duration-300 group cursor-pointer"
              >
                <FileText className="h-6 w-6 text-bidaaya-accent mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="text-xs font-semibold text-bidaaya-light">Build Custom CV</h3>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-3 hover:from-blue-500/30 hover:to-cyan-500/30 transition-all duration-300 group"
              >
                <FileText className="h-6 w-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="text-xs font-semibold text-bidaaya-light">Build Cover Letter</h3>
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Early Access Banner removed - now shown in StreakMasterCard above Daily Picks */}

            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <img
                  src="/icons/top-matches.svg"
                  alt="Other Opportunities"
                  className="h-6 w-6 sm:h-7 sm:w-7 object-contain"
                />
                <h2 className="text-lg sm:text-xl font-semibold text-bidaaya-light">Other Opportunities</h2>
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

            {/* Dynamic Grid - 3x4 when collapsed, 2x3 when expanded */}
            <div className={cn(
              "grid gap-2.5 sm:gap-4 transition-all duration-300",
              agentExpanded ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"
            )}>
              {[...bidaayaOpportunities, ...externalOpportunities]
                .slice(0, agentExpanded ? 12 : 50)
                .map((opp) => (
                  <OpportunityCardCompact
                    key={opp.id}
                    opportunity={opp}
                    onClick={() => handleOpportunityClick(opp)}
                  />
                ))}

              {/* Fill empty slots */}
              {[...bidaayaOpportunities, ...externalOpportunities].length < (agentExpanded ? 4 : 6) && (
                Array.from({
                  length: (agentExpanded ? 4 : 6) - [...bidaayaOpportunities, ...externalOpportunities].length
                }).map((_, i) => (
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

            {/* Empty State - Removed to prevent unwanted scrolling */}
          </div>
        )}
      </div>

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
          onUnlock={handleUnlockEarlyAccess}
          userPlan={userPlan}
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

      {/* Export Progress Modal */}
      {isExporting && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-bidaaya-dark border border-bidaaya-light/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            {!showRecommendations ? (
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 relative">
                  <div className="w-16 h-16 rounded-full bg-bidaaya-accent/20 flex items-center justify-center animate-pulse">
                    <FileText className="h-8 w-8 text-bidaaya-accent" />
                  </div>
                  {exportProgress === 100 && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-white mb-2">
                  {exportProgress === 100 ? 'Download Complete!' : 'Generating your CV...'}
                </h3>
                <p className="text-bidaaya-light/60 text-sm mb-6">
                  {exportProgress === 100
                    ? 'Your custom CV is ready.'
                    : 'Formatting specific to standard guidelines...'}
                </p>

                <div className="w-full bg-bidaaya-light/10 rounded-full h-2 mb-2 overflow-hidden">
                  <div
                    className="bg-bidaaya-accent h-full transition-all duration-300 ease-out"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
                <div className="w-full flex justify-between text-xs text-bidaaya-light/40">
                  <span>{exportProgress}%</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-green-500" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">Success!</h3>
                <p className="text-bidaaya-light/60 text-sm mb-6">
                  We recommend opening your CV with:
                </p>

                <div className="grid grid-cols-2 gap-3 w-full mb-6">
                  {/* Google Drive/Docs Recommendation */}
                  <div className="bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors cursor-default group">
                    <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                      <Image
                        src="/icons/google-docs.png"
                        alt="Google Docs"
                        width={32}
                        height={32}
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <span className="text-xs font-medium text-bidaaya-light">Google Docs</span>
                  </div>

                  {/* Microsoft Word Recommendation */}
                  <div className="bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors cursor-default group">
                    <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                      <Image
                        src="/icons/word.png"
                        alt="Microsoft Word"
                        width={32}
                        height={32}
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <span className="text-xs font-medium text-bidaaya-light">Microsoft Word</span>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setIsExporting(false)
                    setExportProgress(0)
                    setShowRecommendations(false)
                  }}
                  className="w-full bg-white text-black hover:bg-white/90"
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        </div>
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
                <Button
                  variant="outline"
                  disabled
                  className="border-bidaaya-light/10 text-bidaaya-light/40 hover:bg-bidaaya-light/5 cursor-not-allowed opacity-60"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate CV
                  <span className="ml-1 text-xs opacity-75">(Soon)</span>
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

