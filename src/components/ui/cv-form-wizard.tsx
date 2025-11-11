"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { User, GraduationCap, Briefcase, FolderKanban, Award, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { StructuredCVEducationFormSimple } from "./structured-cv-education-form-simple";
import { StructuredCVProfileForm } from "./structured-cv-profile-form";
import { StructuredCVExperienceForm } from "./structured-cv-experience-form";
import { StructuredCVProjectsForm } from "./structured-cv-projects-form";
import { StructuredCVSkillsForm } from "./structured-cv-skills-form";
import { cn } from "@/lib/utils";

interface CVFormWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

type Section = "profile" | "education" | "experience" | "projects" | "skills" | "complete";

interface EducationFormData {
  level: string; // High_School, Foundation, Bachelor, Master, PhD, Other
  program: string; // e.g., "BSc Economics"
  majors: string[]; // max 3
  minors: string[]; // max 2
  institution: string;
  country: string; // ISO-2
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  gpaValue?: string;
  gpaScale?: string; // e.g., "4.0", "100"
  predictedGrade?: string;
  finalGrade?: string;
  modules: string[]; // max 6
  awards: string[];
}

export function CVFormWizard({ onComplete, onCancel }: CVFormWizardProps) {
  const [currentSection, setCurrentSection] = useState<Section>("profile"); // Start with profile to review Phase I data
  const [completedSections, setCompletedSections] = useState<Set<Section>>(new Set());
  const [savedItems, setSavedItems] = useState<Record<string, any[]>>({
    profile: [],
    education: [],
    experience: [],
    projects: [],
    skills: [],
  });
  const [userData, setUserData] = useState<any>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [educationFormKey, setEducationFormKey] = useState(0); // Used to reset education form

  // Fetch user data from Phase I
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log("📥 Fetching user profile data...");
        setIsLoadingUserData(true);
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          console.log("✅ User data fetched:", data.user);
          console.log("📋 Phase I data available:", {
            name: data.user?.name,
            dateOfBirth: data.user?.dateOfBirth,
            email: data.user?.email,
            whatsapp: data.user?.whatsapp,
            location: data.user?.location,
            linkedin: data.user?.linkedin
          });
          setUserData(data.user);
        } else {
          console.error("❌ Failed to fetch user data:", response.status);
        }
      } catch (error) {
        console.error("❌ Error fetching user data:", error);
      } finally {
        setIsLoadingUserData(false);
      }
    };
    fetchUserData();
  }, []);

  // Fetch saved CV data (education, experience, projects, skills)
  useEffect(() => {
    const fetchSavedCVData = async () => {
      try {
        // Fetch education
        const eduRes = await fetch("/api/cv/education");
        if (eduRes.ok) {
          const eduData = await eduRes.json();
          setSavedItems((prev) => ({ ...prev, education: eduData.education || [] }));
        }

        // Fetch experience
        const expRes = await fetch("/api/cv/experience");
        if (expRes.ok) {
          const expData = await expRes.json();
          setSavedItems((prev) => ({ ...prev, experience: expData.experiences || [] }));
        }

        // Fetch projects
        const projRes = await fetch("/api/cv/projects");
        if (projRes.ok) {
          const projData = await projRes.json();
          setSavedItems((prev) => ({ ...prev, projects: projData.projects || [] }));
        }

        // Fetch skills
        const skillsRes = await fetch("/api/cv/skills");
        if (skillsRes.ok) {
          const skillsData = await skillsRes.json();
          setSavedItems((prev) => ({ ...prev, skills: skillsData.skills || [] }));
        }

        console.log("✅ Saved CV data loaded");
      } catch (error) {
        console.error("❌ Error fetching saved CV data:", error);
      }
    };
    fetchSavedCVData();
  }, []);

  const sections: { id: Section; label: string; icon: any }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "experience", label: "Experience", icon: Briefcase },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "skills", label: "Skills", icon: Award },
  ];

  const handleProfileSave = async (data: any) => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      const result = await response.json();
      setCompletedSections((prev) => new Set([...prev, "profile"]));
      
      // Move to next section
      moveToNextSection();
    } catch (error) {
      console.error("Error saving profile:", error);
      throw error;
    }
  };

  const handleEducationSave = async (data: any) => {
    try {
      const response = await fetch("/api/cv/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save education");
      }

      const result = await response.json();
      setSavedItems((prev) => ({
        ...prev,
        education: [...prev.education, result.education]
      }));
      setCompletedSections((prev) => new Set([...prev, "education"]));
      
      // DON'T auto-move to next - allow adding more education entries
    } catch (error) {
      console.error("Error saving education:", error);
      throw error;
    }
  };

  const handleExperienceSave = async (data: any) => {
    try {
      const response = await fetch("/api/cv/experience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save experience");
      }

      const result = await response.json();
      setSavedItems((prev) => ({
        ...prev,
        experience: [...prev.experience, result.experience]
      }));
      setCompletedSections((prev) => new Set([...prev, "experience"]));
      
      // DON'T auto-move to next - allow adding more experiences
    } catch (error) {
      console.error("Error saving experience:", error);
      throw error;
    }
  };

  const handleProjectSave = async (data: any) => {
    try {
      const response = await fetch("/api/cv/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save project");
      }

      const result = await response.json();
      setSavedItems((prev) => ({
        ...prev,
        projects: [...prev.projects, result.project]
      }));
      setCompletedSections((prev) => new Set([...prev, "projects"]));
      
      // DON'T auto-move to next - allow adding more projects
    } catch (error) {
      console.error("Error saving project:", error);
      throw error;
    }
  };

  const handleSkillSave = async (data: any) => {
    try {
      const response = await fetch("/api/cv/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save skill");
      }

      const result = await response.json();
      setSavedItems((prev) => ({
        ...prev,
        skills: [...prev.skills, result.skill]
      }));
      setCompletedSections((prev) => new Set([...prev, "skills"]));
      
      // DON'T auto-move to next - allow adding more skills
    } catch (error) {
      console.error("Error saving skill:", error);
      throw error;
    }
  };

  const moveToNextSection = () => {
    const currentIndex = sections.findIndex((s) => s.id === currentSection);
    if (currentIndex < sections.length - 1) {
      setCurrentSection(sections[currentIndex + 1].id as Section);
    } else {
      setCurrentSection("complete");
    }
  };

  const moveToPreviousSection = () => {
    const currentIndex = sections.findIndex((s) => s.id === currentSection);
    if (currentIndex > 0) {
      setCurrentSection(sections[currentIndex - 1].id as Section);
    }
  };

  const handleSkip = () => {
    moveToNextSection();
  };

  const handleComplete = () => {
    onComplete();
  };

  const currentSectionIndex = sections.findIndex((s) => s.id === currentSection);

  return (
    <div className="flex flex-col h-full bg-bidaaya-dark">
      {/* Progress Header */}
      <div className="px-6 py-4 border-b border-bidaaya-light/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-bidaaya-light">Build Your CV</h2>
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-bidaaya-light/60 hover:text-bidaaya-light"
          >
            Cancel
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {sections.map((section, index) => {
            const Icon = section.icon;
            const isCompleted = completedSections.has(section.id);
            const isCurrent = currentSection === section.id;
            const isPast = currentSectionIndex > index;

            return (
              <div key={section.id} className="flex items-center flex-1">
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                      isCompleted
                        ? "bg-bidaaya-accent border-bidaaya-accent text-white"
                        : isCurrent
                        ? "border-bidaaya-accent text-bidaaya-accent bg-bidaaya-accent/10"
                        : isPast
                        ? "border-bidaaya-light/30 text-bidaaya-light/30"
                        : "border-bidaaya-light/20 text-bidaaya-light/40"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  {index < sections.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 mx-2 transition-all",
                        isPast || isCompleted
                          ? "bg-bidaaya-accent"
                          : "bg-bidaaya-light/10"
                      )}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {currentSection === "profile" && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-bidaaya-light">
                <strong>Review your contact information.</strong> This is what employers will use to reach you. 
                Make sure your <strong>email</strong>, <strong>phone (WhatsApp)</strong>, and <strong>LinkedIn</strong> are correct!
              </p>
            </div>
            {isLoadingUserData ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bidaaya-accent"></div>
              </div>
            ) : (
              <StructuredCVProfileForm
                onSave={handleProfileSave}
                onCancel={handleSkip}
                initialData={userData ? {
                  name: userData.name || '',
                  dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : '',
                  email: userData.email || '',
                  whatsapp: userData.whatsapp || '',
                  location: userData.location || '',
                  linkedinUrl: userData.linkedin || '',
                } : undefined}
              />
            )}
          </div>
        )}

        {currentSection === "education" && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-4 p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs sm:text-sm text-bidaaya-light">
                <strong>Add your education.</strong> High school, bachelor's, master's – add each one.
              </p>
            </div>
            
            {/* Show saved education items */}
            {savedItems.education.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-sm text-bidaaya-light font-semibold">Your Education:</p>
                {savedItems.education.map((edu: any, idx: number) => (
                  <div key={idx} className="p-3 bg-bidaaya-light/5 border border-bidaaya-light/10 rounded-lg">
                    <p className="text-sm text-bidaaya-light font-medium">{edu.degreeTitle || edu.program}</p>
                    <p className="text-xs text-bidaaya-light/60">{edu.institution}</p>
                  </div>
                ))}
              </div>
            )}

            <StructuredCVEducationFormSimple
              key={educationFormKey}
              onSave={handleEducationSave}
              onCancel={handleSkip}
            />
            {savedItems.education.length > 0 && (
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
                <p className="text-xs sm:text-sm text-bidaaya-light font-semibold">
                  ✓ Saved {savedItems.education.length}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => setEducationFormKey(prev => prev + 1)}
                    variant="outline"
                    className="border-bidaaya-accent text-bidaaya-accent hover:bg-bidaaya-accent/10 text-sm"
                  >
                    + Add Another
                  </Button>
                  <Button
                    onClick={moveToNextSection}
                    className="bg-bidaaya-accent hover:bg-bidaaya-accent/90 text-sm"
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentSection === "experience" && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-4 p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs sm:text-sm text-bidaaya-light">
                <strong>Add work experience.</strong> Internships, jobs, volunteering – we'll ask details later!
              </p>
            </div>
            
            {/* Show saved experience items */}
            {savedItems.experience.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-sm text-bidaaya-light font-semibold">Your Experience:</p>
                {savedItems.experience.map((exp: any, idx: number) => (
                  <div key={idx} className="p-3 bg-bidaaya-light/5 border border-bidaaya-light/10 rounded-lg">
                    <p className="text-sm text-bidaaya-light font-medium">{exp.title}</p>
                    <p className="text-xs text-bidaaya-light/60">{exp.employer}</p>
                  </div>
                ))}
              </div>
            )}

            <StructuredCVExperienceForm
              key={savedItems.experience.length}
              onSave={handleExperienceSave}
              onCancel={handleSkip}
            />
            {savedItems.experience.length > 0 && (
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
                <p className="text-xs sm:text-sm text-bidaaya-light font-semibold">
                  ✓ Saved {savedItems.experience.length}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={moveToNextSection}
                    className="bg-bidaaya-accent hover:bg-bidaaya-accent/90 text-sm"
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentSection === "projects" && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-4 p-3 sm:p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-xs sm:text-sm text-bidaaya-light">
                <strong>Add projects (optional).</strong> Personal projects, hackathons – skip if you don't have any yet!
              </p>
            </div>
            
            {/* Show saved projects */}
            {savedItems.projects.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-sm text-bidaaya-light font-semibold">Your Projects:</p>
                {savedItems.projects.map((proj: any, idx: number) => (
                  <div key={idx} className="p-3 bg-bidaaya-light/5 border border-bidaaya-light/10 rounded-lg">
                    <p className="text-sm text-bidaaya-light font-medium">{proj.name}</p>
                    {proj.techStack && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {proj.techStack.slice(0, 3).map((tech: string, i: number) => (
                          <span key={i} className="text-xs text-bidaaya-light/60 bg-bidaaya-light/5 px-2 py-0.5 rounded">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <StructuredCVProjectsForm
              key={savedItems.projects.length}
              onSave={handleProjectSave}
              onCancel={handleSkip}
            />
            {savedItems.projects.length > 0 && (
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
                <p className="text-xs sm:text-sm text-bidaaya-light font-semibold">
                  ✓ Saved {savedItems.projects.length}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={moveToNextSection}
                    className="bg-bidaaya-accent hover:bg-bidaaya-accent/90 text-sm"
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentSection === "skills" && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-4 p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs sm:text-sm text-bidaaya-light">
                <strong>Add skills.</strong> Python, Leadership, Excel – add at least 3 skills!
              </p>
            </div>
            
            {/* Show saved skills */}
            {savedItems.skills.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-bidaaya-light font-semibold mb-2">Your Skills:</p>
                <div className="flex flex-wrap gap-1.5">
                  {savedItems.skills.map((skill: any, idx: number) => (
                    <div
                      key={idx}
                      className="px-2 py-1 bg-bidaaya-accent/20 rounded-full text-xs text-bidaaya-light"
                    >
                      {skill.skillName}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <StructuredCVSkillsForm
              key={savedItems.skills.length}
              onSave={handleSkillSave}
              onCancel={handleSkip}
            />
            {savedItems.skills.length >= 3 && (
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
                <p className="text-xs sm:text-sm text-bidaaya-light font-semibold">
                  ✓ Saved {savedItems.skills.length} skills
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleComplete}
                    className="bg-green-500 hover:bg-green-600 text-sm"
                  >
                    Complete <CheckCircle2 className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentSection === "complete" && (
          <div className="max-w-2xl mx-auto text-center py-20">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-bidaaya-light mb-2">
              Great start! 🎉
            </h3>
            <p className="text-bidaaya-light/60 mb-6">
              You've added your education details. You can continue building your CV through the chat,
              or come back to add more structured information later.
            </p>
            <Button
              onClick={handleComplete}
              className="bg-bidaaya-accent hover:bg-bidaaya-accent/90"
            >
              Continue Building CV
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

