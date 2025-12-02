import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserData, Profile, Education, Experience, Project, Skill } from './orbit-types';
import { PersonalStep, LinksStep, EducationStep, ExperienceStep, ProjectsStep, SkillsStep } from './StepViews';
import { ChevronLeft, Sparkles, Loader2, ArrowRight, Wallet, MapPin, Mail, Phone } from 'lucide-react';

const INITIAL_DATA: UserData = {
  profile: { 
    fullName: '', 
    dob: '', 
    email: '', 
    whatsapp: '', 
    location: '',
    linkedinUrl: '',
    portfolioUrl: '',
    githubUrl: ''
  },
  education: [],
  experience: [],
  projects: [],
  skills: []
};

const STEPS = [
  { id: 1, title: 'Identity' },
  { id: 2, title: 'Links' },
  { id: 3, title: 'Education' },
  { id: 4, title: 'Experience' },
  { id: 5, title: 'Projects' },
  { id: 6, title: 'Skills' },
  { id: 7, title: 'Review' }
];

interface OrbitProfileBuilderProps {
  onComplete?: () => void;
  initialStep?: number;
}

export default function OrbitProfileBuilder({ onComplete, initialStep = 1 }: OrbitProfileBuilderProps) {
  const [step, setStep] = useState(initialStep);
  const [data, setData] = useState<UserData>(INITIAL_DATA);
  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  // Set initial step when prop changes
  useEffect(() => {
    if (initialStep) {
      setStep(initialStep);
      console.log('🎯 OrbitProfileBuilder: Setting initial step to', initialStep);
    }
  }, [initialStep]);

  // Reset scroll position on mount and step change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [step]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch Profile
        const profileRes = await fetch('/api/user/profile');
        const profileData = await profileRes.json();
        
        // Fetch CV Data
        const [eduRes, expRes, projRes, skillsRes] = await Promise.all([
          fetch('/api/cv/education'),
          fetch('/api/cv/experience'),
          fetch('/api/cv/projects'),
          fetch('/api/cv/skills')
        ]);

        const eduData = await eduRes.json();
        const expData = await expRes.json();
        const projData = await projRes.json();
        const skillsData = await skillsRes.json();

        // Map education data - API returns degreeTitle but Orbit expects program
        const mappedEducation = (eduData.education || eduData.educations || []).map((edu: any) => ({
          id: edu.id,
          level: edu.degreeType || edu.level || '',
          program: edu.degreeTitle || edu.program || '',
          institution: edu.institution || '',
          country: edu.institutionLocation || edu.country || '',
          startDate: edu.startDate ? new Date(edu.startDate).toISOString().split('T')[0].slice(0, 7) : '',
          endDate: edu.endDate ? new Date(edu.endDate).toISOString().split('T')[0].slice(0, 7) : '',
          isCurrent: edu.isCurrent || false,
          courses: edu.modules || []
        }));

        // Map experience data
        const mappedExperience = (expData.experiences || []).map((exp: any) => ({
          id: exp.id,
          jobTitle: exp.title || '',
          company: exp.employer || '',
          employmentType: exp.employmentType || '',
          startDate: exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : '',
          endDate: exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : '',
          isCurrent: exp.isCurrent || false,
          description: exp.summary || ''
        }));

        // Map projects data
        const mappedProjects = (projData.projects || []).map((proj: any) => ({
          id: proj.id,
          name: proj.name || '',
          skills: proj.techStack || [],
          link: proj.projectUrl || '',
          githubUrl: proj.githubUrl || ''
        }));

        // Map skills data
        const mappedSkills = (skillsData.skills || []).map((skill: any) => ({
          id: skill.id,
          name: skill.skillName || skill.name || '',
          type: skill.category || skill.type || '',
          level: skill.proficiencyLevel || skill.level || ''
        }));

        const loadedData = {
          profile: {
            fullName: profileData.user?.name || '',
            dob: profileData.user?.dateOfBirth ? new Date(profileData.user.dateOfBirth).toISOString().split('T')[0] : '',
            email: profileData.user?.email || '',
            whatsapp: profileData.user?.whatsapp || '',
            location: profileData.user?.location || '',
            linkedinUrl: profileData.user?.linkedin || '',
            portfolioUrl: profileData.user?.portfolio || '',
            githubUrl: profileData.user?.github || ''
          },
          education: mappedEducation,
          experience: mappedExperience,
          projects: mappedProjects,
          skills: mappedSkills
        };
        
        console.log('✅ OrbitProfileBuilder: Loaded data:', {
          education: mappedEducation.length,
          experience: mappedExperience.length,
          projects: mappedProjects.length,
          skills: mappedSkills.length
        });
        
        setData(loadedData);
      } catch (error) {
        console.error("❌ Failed to load profile data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Validation Logic (Visual Only)
  const validateProfile = (profile: Profile) => {
    const errs: any = {};
    if (!profile.fullName) errs.fullName = "Required";
    if (!profile.dob) errs.dob = "Required";
    if (!profile.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) errs.email = "Invalid email";
    if (!profile.whatsapp || !/^\+/.test(profile.whatsapp)) errs.whatsapp = "Must start with +";
    if (!profile.location) errs.location = "Required";
    if (profile.githubUrl && !profile.githubUrl.includes('github.com') && profile.githubUrl !== '') errs.githubUrl = "Check URL";
    return errs;
  };

  const handleNext = async () => {
    let currentErrors = {};
    
    // Profile steps validation
    if (step === 1 || step === 2) {
      currentErrors = validateProfile(data.profile);
      // Sync profile data
      try {
        await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.profile.fullName,
            dateOfBirth: data.profile.dob,
            email: data.profile.email,
            whatsapp: data.profile.whatsapp,
            location: data.profile.location,
            linkedin: data.profile.linkedinUrl,
            portfolio: data.profile.portfolioUrl,
            github: data.profile.githubUrl
          })
        });
      } catch (error) {
        console.error("Failed to save profile step", error);
      }
    }
    
    // Phase II Minimum Requirements Check (on final review step or when completing)
    if (step === 7) {
      const hasEducationOrExperience = data.education.length > 0 || data.experience.length > 0;
      const hasSkills = data.skills.length > 0;
      
      if (!hasEducationOrExperience || !hasSkills) {
        const missingItems = [];
        if (!hasEducationOrExperience) {
          missingItems.push('at least 1 Education or Experience entry');
        }
        if (!hasSkills) {
          missingItems.push('at least 1 Skill');
        }
        
        alert(`To complete your profile and apply to opportunities, you need:\n\n• ${missingItems.join('\n• ')}\n\nPlease go back and add the missing information.`);
        setErrors({ phaseII: missingItems });
        return; // Don't proceed
      }
    }

    // Update error state for UI feedback
    setErrors(currentErrors);

    // Proceed to next step or submit
    if (step < STEPS.length) {
      setStep(s => s + 1);
      window.scrollTo(0, 0);
    } else {
      submitData();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(s => s - 1);
      window.scrollTo(0, 0);
    }
  };

  const submitData = async () => {
    setIsSubmitting(true);
    try {
      // Final update to mark profile as completed
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            onboardingPhase: 'complete',
            profileCompleted: true
        })
      });
      
      setIsSuccess(true);
      setTimeout(() => {
        if (onComplete) {
            onComplete();
        } else {
            window.location.reload();
        }
      }, 2000);
    } catch (error) {
      console.error("Failed to complete profile", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // API Handlers for individual items
  const handleAddEducation = async (item: Education) => {
    const res = await fetch('/api/cv/education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            level: item.level,
            program: item.program,
            institution: item.institution,
            country: item.country,
            startDate: item.startDate,
            endDate: item.endDate,
            isCurrent: item.isCurrent,
            modules: item.courses
        })
    });
    const json = await res.json();
    return json.education;
  };

  const handleUpdateEducation = async (id: string, item: Education) => {
    const res = await fetch(`/api/cv/education/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            level: item.level,
            program: item.program,
            institution: item.institution,
            country: item.country,
            startDate: item.startDate,
            endDate: item.endDate,
            isCurrent: item.isCurrent,
            modules: item.courses
        })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update education');
    }
    const json = await res.json();
    return json.education;
  };

  const handleDeleteEducation = async (id: string) => {
    await fetch(`/api/cv/education/${id}`, { method: 'DELETE' });
  };

  const handleAddExperience = async (item: Experience) => {
    const res = await fetch('/api/cv/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
    });
    const json = await res.json();
    return json.experience;
  };

  const handleDeleteExperience = async (id: string) => {
    await fetch(`/api/cv/experience/${id}`, { method: 'DELETE' });
  };

  const handleAddProject = async (item: Project) => {
    const res = await fetch('/api/cv/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: item.name,
            skills: item.skills,
            link: item.link,
            githubUrl: item.githubUrl,
            techStack: item.skills // Mapping skills to techStack as per API likely expectation
        })
    });
    const json = await res.json();
    return json.project;
  };

  const handleDeleteProject = async (id: string) => {
    await fetch(`/api/cv/projects/${id}`, { method: 'DELETE' });
  };

  const handleAddSkill = async (item: Skill) => {
    const res = await fetch('/api/cv/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: item.name,
            type: item.type,
            level: item.level
        })
    });
    const json = await res.json();
    return json.skill;
  };

  const handleDeleteSkill = async (id: string) => {
    await fetch(`/api/cv/skills/${id}`, { method: 'DELETE' });
  };

  if (isLoading) {
      return (
        <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center gap-4 z-50">
            <Loader2 className="animate-spin w-12 h-12 text-blue-500" />
            <p className="text-gray-400 text-sm">Loading your profile...</p>
        </div>
      );
  }

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden z-50">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.15),transparent_70%)] pointer-events-none" />
        
        <div className="glass-panel p-8 rounded-[2.5rem] max-w-sm w-full mx-auto text-center border-blue-500/20 shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)] animate-scale-in relative z-10">
          <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-400">
             <Sparkles className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold mb-3 tracking-tight">Profile Ready</h1>
          <p className="text-gray-400 mb-8 leading-relaxed">Your profile has been created. Our AI agents are now scanning for matches.</p>
          <button onClick={() => window.location.href = '/dashboard'} className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-200 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-white flex justify-center items-start selection:bg-blue-500/30 overflow-y-auto overflow-x-hidden">
      
      {/* Background Ambience */}
      <div className="fixed top-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-indigo-900/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-20%] w-[80vw] h-[80vw] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md mx-auto px-5 pb-32 pt-6 relative z-10 flex flex-col min-h-full">
        
        {/* Navigation & Progress */}
        <div className="flex flex-col gap-4 mb-6 sticky top-0 pt-2 bg-black/80 backdrop-blur-xl z-20 -mx-5 px-5 pb-4 border-b border-white/5">
           {/* Segmented Progress Bar */}
           <div className="flex gap-1.5 w-full">
              {STEPS.map((s, i) => (
                <div 
                  key={s.id} 
                  className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                    i < step ? 'bg-blue-500' : 'bg-white/10'
                  } ${i === step - 1 ? 'opacity-100 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'opacity-70'}`} 
                />
              ))}
           </div>

           <div className="flex items-center justify-between">
             <button 
                onClick={handleBack} 
                className={`p-2 -ml-2 rounded-full text-gray-400 hover:text-white transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
             >
               <ChevronLeft className="w-7 h-7" />
             </button>
             {/* Optional: Current Step Title centered if desired, or keep minimal */}
             <div className="w-7" /> 
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 animate-fade-in">
          {step === 1 && <PersonalStep data={data.profile} update={p => setData({...data, profile: p})} errors={errors} />}
          {step === 2 && <LinksStep data={data.profile} update={p => setData({...data, profile: p})} errors={errors} />}
          {step === 3 && <EducationStep data={data.education} update={e => setData({...data, education: e})} onAdd={handleAddEducation} onUpdate={handleUpdateEducation} onDelete={handleDeleteEducation} />}
          {step === 4 && <ExperienceStep data={data.experience} update={e => setData({...data, experience: e})} onAdd={handleAddExperience} onDelete={handleDeleteExperience} />}
          {step === 5 && <ProjectsStep data={data.projects} update={p => setData({...data, projects: p})} onAdd={handleAddProject} onDelete={handleDeleteProject} />}
          {step === 6 && <SkillsStep data={data.skills} update={s => setData({...data, skills: s})} onAdd={handleAddSkill} onDelete={handleDeleteSkill} />}
          
          {step === 7 && (
            <div className="animate-fade-in pb-10">
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Review</h2>
              <p className="text-gray-400 mb-4 text-sm">Preview your Orbit profile card.</p>
              
              {/* Phase II Requirements Check */}
              <div className={`p-4 rounded-2xl mb-6 border ${
                (data.education.length > 0 || data.experience.length > 0) && data.skills.length > 0
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-yellow-500/10 border-yellow-500/30'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {(data.education.length > 0 || data.experience.length > 0) && data.skills.length > 0 ? '✅' : '⚠️'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-sm mb-2">
                      {(data.education.length > 0 || data.experience.length > 0) && data.skills.length > 0
                        ? 'Profile Complete!'
                        : 'Complete Your Profile'}
                    </h3>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        {data.education.length > 0 || data.experience.length > 0 ? (
                          <span className="text-green-400">✓</span>
                        ) : (
                          <span className="text-yellow-400">○</span>
                        )}
                        <span className="text-gray-300">
                          At least 1 Education <strong>OR</strong> Experience
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {data.skills.length > 0 ? (
                          <span className="text-green-400">✓</span>
                        ) : (
                          <span className="text-yellow-400">○</span>
                        )}
                        <span className="text-gray-300">
                          At least 1 Skill <strong>(Required)</strong>
                        </span>
                      </div>
                    </div>
                    {!((data.education.length > 0 || data.experience.length > 0) && data.skills.length > 0) && (
                      <p className="text-xs text-yellow-400/80 mt-2">
                        Complete these to apply to opportunities
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="relative group perspective-1000">
                {/* ID Card Look */}
                <div className="glass-panel p-6 rounded-[2rem] border-white/10 bg-gradient-to-br from-white/10 to-white/5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[50px] rounded-full pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start mb-6 relative">
                    <div>
                      <h3 className="text-2xl font-bold text-white leading-tight">{data.profile.fullName || 'Your Name'}</h3>
                      <p className="text-blue-400 font-medium text-sm mt-1">{data.education[0]?.program || 'Student'} @ {data.education[0]?.institution || 'University'}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <div className="space-y-3 mb-8 relative">
                    <div className="flex items-center gap-3 text-gray-300 text-sm">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      {data.profile.location}
                    </div>
                    <div className="flex items-center gap-3 text-gray-300 text-sm">
                      <Mail className="w-4 h-4 text-gray-500" />
                      {data.profile.email}
                    </div>
                     <div className="flex items-center gap-3 text-gray-300 text-sm">
                      <Phone className="w-4 h-4 text-gray-500" />
                      {data.profile.whatsapp}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-black/40 rounded-xl p-3 text-center backdrop-blur-md">
                      <div className="text-xl font-bold text-white">{data.education.length}</div>
                      <div className="text-[9px] text-gray-400 uppercase tracking-wider mt-0.5">Edu</div>
                    </div>
                    <div className="bg-black/40 rounded-xl p-3 text-center backdrop-blur-md">
                      <div className="text-xl font-bold text-white">{data.experience.length}</div>
                      <div className="text-[9px] text-gray-400 uppercase tracking-wider mt-0.5">Jobs</div>
                    </div>
                    <div className="bg-black/40 rounded-xl p-3 text-center backdrop-blur-md">
                      <div className="text-xl font-bold text-white">{data.projects.length}</div>
                      <div className="text-[9px] text-gray-400 uppercase tracking-wider mt-0.5">Projs</div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <div className="flex justify-between items-center px-2">
                     <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">Top Skills</span>
                     <button onClick={() => setStep(6)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.skills.slice(0, 5).map(skill => (
                      <span key={skill.id} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300">
                        {skill.name}
                      </span>
                    ))}
                    {data.skills.length === 0 && <span className="text-gray-600 text-sm italic">No skills added</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Persistent Bottom Bar with Blur Fade */}
        <div className="fixed bottom-0 left-0 w-full p-5 z-30 flex justify-center pointer-events-none">
          {/* Gradient backdrop for the button area */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black via-black/95 to-transparent -z-10" />
          
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="pointer-events-auto w-full max-w-md bg-white hover:bg-gray-100 text-black font-bold text-lg py-4 rounded-[20px] shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? <Loader2 className="animate-spin w-6 h-6" /> : (
              <>
                {step === 7 ? 'Complete Profile' : 'Continue'} 
                {step < 7 && <ArrowRight className="w-5 h-5" />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

