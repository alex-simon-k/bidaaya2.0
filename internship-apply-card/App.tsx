import React, { useState } from 'react';
import { GlassFrame } from './components/GlassFrame';
import { ActionRow } from './components/ActionRow';
import { ButtonVariant, Internship } from './types';
import { generateCoverLetter } from './services/geminiService';
import { 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  ChevronLeft, 
  MoreHorizontal,
  Briefcase,
  Lock,
  Zap,
  Check
} from 'lucide-react';

// Mock Data simulates a database entry
const MOCK_INTERNSHIP: Internship = {
  id: '1',
  companyName: 'Spotify',
  role: 'Frontend Engineering Intern',
  location: 'Stockholm, Sweden (Remote)',
  logoUrl: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=1000&auto=format&fit=crop', 
  color: '#1DB954', 
  postedAt: 'Joined 9/24/24'
};

const App: React.FC = () => {
  // State for Credits & Unlocks
  const [credits, setCredits] = useState(12); // Starting credits
  const [isCVUnlocked, setIsCVUnlocked] = useState(false);
  const [isCoverLetterUnlocked, setIsCoverLetterUnlocked] = useState(false);
  
  // App Logic State
  const [isApplying, setIsApplying] = useState(false);
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);
  const [isApplied, setIsApplied] = useState(false);
  
  // "Mark as Applied" toggle state
  const [markedAsApplied, setMarkedAsApplied] = useState(false);

  // --- Handlers ---

  const handleUnlockCV = () => {
    if (isCVUnlocked) return;
    if (credits < 1) {
      alert("Not enough credits!");
      return;
    }
    const confirmUnlock = window.confirm("Spend 1 Credit to unlock Custom CV?");
    if (confirmUnlock) {
      setCredits(prev => prev - 1);
      setIsCVUnlocked(true);
    }
  };

  const handleUnlockCoverLetter = async () => {
    if (generatedLetter) return; // Already done
    
    if (!isCoverLetterUnlocked) {
      if (credits < 2) {
        alert("Not enough credits!");
        return;
      }
      const confirmUnlock = window.confirm("Spend 2 Credits to generate a Cover Letter?");
      if (!confirmUnlock) return;
      
      setCredits(prev => prev - 2);
      setIsCoverLetterUnlocked(true);
    }

    // Generate content
    setIsGeneratingLetter(true);
    try {
      const letter = await generateCoverLetter(MOCK_INTERNSHIP.companyName, MOCK_INTERNSHIP.role);
      setGeneratedLetter(letter);
    } catch (e) {
      alert("Failed to generate cover letter. Please try again.");
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const handleToggleApplied = () => {
    if (markedAsApplied) {
      // Logic: "Are you sure you want to undo?"
      const confirmUndo = window.confirm("Are you sure you haven't applied to this? This will remove it from your tracked applications.");
      if (confirmUndo) {
        setMarkedAsApplied(false);
      }
    } else {
      setMarkedAsApplied(true);
    }
  };

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setIsApplied(true);
      setMarkedAsApplied(true); // Automatically mark as applied if they apply through the app
    }, 1500);
  };

  // --- Helper Components for the "Right Action" slot ---

  const UnlockButton = ({ cost, onClick, label = "Unlock" }: { cost: number, onClick: () => void, label?: string }) => (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-gray-800 transition-transform active:scale-95"
    >
      <Zap className="w-3 h-3 fill-yellow-400 text-yellow-400" />
      <span>{label}</span>
      <span className="opacity-70 border-l border-white/20 pl-1.5 ml-0.5">{cost}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      
      {/* Mobile-sized Card Container */}
      <div className="w-full max-w-[400px] bg-[#F2F2F7] sm:bg-white sm:rounded-[40px] sm:shadow-2xl overflow-hidden min-h-[850px] sm:min-h-0 sm:h-auto relative flex flex-col">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between px-6 pt-14 pb-4 bg-[#F2F2F7] sm:bg-transparent z-10">
          <button className="p-2 -ml-2 rounded-full hover:bg-gray-200/50 transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
          
          {/* Credit Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-100">
            <Zap className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-bold text-gray-800">{credits}</span>
          </div>

          <button className="p-2 -mr-2 rounded-full hover:bg-gray-200/50 transition-colors">
             <MoreHorizontal className="w-6 h-6 text-gray-900" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 px-6 pb-32 overflow-y-auto no-scrollbar">
          
          {/* Dynamic Image Holder */}
          <GlassFrame 
            logoUrl={MOCK_INTERNSHIP.logoUrl} 
            color={MOCK_INTERNSHIP.color}
          />

          {/* Title Section */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
              {MOCK_INTERNSHIP.role}
            </h1>
            <p className="text-gray-500 font-medium">
              {MOCK_INTERNSHIP.companyName} • {MOCK_INTERNSHIP.location}
            </p>
          </div>

          {/* Main Action Group */}
          <div className="flex flex-col rounded-3xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] bg-white mb-6">
            
            {/* 1. Custom CV (Unlockable) */}
            <ActionRow 
              icon={<FileText className="w-5 h-5" />}
              label="Custom CV"
              subLabel={isCVUnlocked ? "Ready to submit" : "Tailored for this role"}
              isToggled={isCVUnlocked} // Shows green highlight on icon
              // Logic: If locked, show button. If unlocked, show checkmark.
              rightAction={
                !isCVUnlocked ? (
                  <UnlockButton cost={1} onClick={handleUnlockCV} />
                ) : (
                  <div className="flex items-center gap-2 text-green-600 pr-2">
                    <span className="text-xs font-semibold">Attached</span>
                    <CheckCircle2 className="w-5 h-5 fill-green-100" />
                  </div>
                )
              }
            />
            
            {/* 2. Cover Letter (Unlockable + AI Gen) */}
            <ActionRow 
              icon={<Sparkles className="w-5 h-5" />}
              label={generatedLetter ? "View Cover Letter" : "Create Cover Letter"}
              subLabel={isCoverLetterUnlocked ? "Generated by Gemini" : "Generate with AI"}
              isLoading={isGeneratingLetter}
              isToggled={!!generatedLetter}
              rightAction={
                !generatedLetter ? (
                  <UnlockButton cost={2} onClick={handleUnlockCoverLetter} label="Generate" />
                ) : (
                  <button 
                    onClick={() => setGeneratedLetter(null)} 
                    className="text-xs font-semibold text-gray-400 hover:text-gray-600 px-2"
                  >
                    View
                  </button>
                )
              }
            />

             {/* 3. Mark as Applied (Toggle with Logic) */}
             <ActionRow 
              icon={<Briefcase className="w-5 h-5" />}
              label="Mark as applied"
              subLabel="Manually track this role"
              variant={ButtonVariant.TOGGLE}
              isToggled={markedAsApplied}
              onClick={handleToggleApplied}
            />

          </div>

          {/* Gemini Result Preview (Conditional) */}
          {generatedLetter && (
            <div className="bg-white p-5 rounded-3xl shadow-sm mb-6 border border-purple-100 animate-in fade-in slide-in-from-bottom-4 relative group">
                <div className="absolute top-4 right-4 text-purple-200">
                    <Sparkles className="w-10 h-10 opacity-20" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"/>
                    <span className="text-xs font-bold text-purple-600 uppercase tracking-wide">Gemini Draft</span>
                </div>
                <p className="text-[15px] text-gray-600 leading-relaxed whitespace-pre-line font-medium">
                    "{generatedLetter}"
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                    <button className="flex-1 py-2 rounded-xl bg-gray-50 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors">Copy</button>
                    <button className="flex-1 py-2 rounded-xl bg-purple-50 text-xs font-semibold text-purple-600 hover:bg-purple-100 transition-colors">Edit</button>
                </div>
            </div>
          )}

        </div>

        {/* Sticky Bottom Action Button */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F2F2F7] via-[#F2F2F7] to-transparent">
          <button 
            onClick={handleApply}
            disabled={isApplying || isApplied}
            className={`w-full h-14 rounded-full font-bold text-[17px] shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 border border-white/10
              ${isApplied 
                ? 'bg-green-500 text-white shadow-green-200/50' 
                : 'bg-[#1C1C1E] text-white shadow-xl hover:shadow-2xl'
              }`}
          >
            {isApplying ? (
              <>Applying...</>
            ) : isApplied ? (
              <>
                <Check className="w-5 h-5 stroke-[3]" />
                Application Sent
              </>
            ) : (
              'Finish Application'
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default App;