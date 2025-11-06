"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { User, GraduationCap, Briefcase, FolderKanban, Award, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { StructuredCVEducationForm } from "./structured-cv-education-form";
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
  const [currentSection, setCurrentSection] = useState<Section>("profile");
  const [completedSections, setCompletedSections] = useState<Set<Section>>(new Set());
  const [savedItems, setSavedItems] = useState<Record<string, any[]>>({
    profile: [],
    education: [],
    experience: [],
    projects: [],
    skills: [],
  });

  const sections: { id: Section; label: string; icon: any }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "experience", label: "Experience", icon: Briefcase },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "skills", label: "Skills", icon: Award },
  ];

  const handleEducationSave = async (data: EducationFormData) => {
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
      
      // Move to next section
      moveToNextSection();
    } catch (error) {
      console.error("Error saving education:", error);
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
        {currentSection === "education" && (
          <div className="max-w-2xl mx-auto">
            <StructuredCVEducationForm
              onSave={handleEducationSave}
              onCancel={handleSkip}
            />
            {savedItems.education.length > 0 && (
              <div className="mt-4 p-4 bg-bidaaya-accent/10 rounded-lg">
                <p className="text-sm text-bidaaya-light/80">
                  ✓ Saved {savedItems.education.length} education entr{savedItems.education.length > 1 ? "ies" : "y"}
                </p>
                <Button
                  onClick={moveToNextSection}
                  className="mt-2 bg-bidaaya-accent hover:bg-bidaaya-accent/90"
                >
                  Continue to Work Experience <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}

        {currentSection === "experience" && (
          <div className="max-w-2xl mx-auto text-center py-20">
            <Briefcase className="w-16 h-16 text-bidaaya-accent mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-bidaaya-light mb-2">Work Experience</h3>
            <p className="text-bidaaya-light/60 mb-6">
              Coming soon! For now, you can add experience through the chat.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={moveToPreviousSection}
                variant="outline"
                className="border-bidaaya-light/20 text-bidaaya-light"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleSkip}
                className="bg-bidaaya-accent hover:bg-bidaaya-accent/90"
              >
                Skip for Now
              </Button>
            </div>
          </div>
        )}

        {currentSection === "projects" && (
          <div className="max-w-2xl mx-auto text-center py-20">
            <FolderKanban className="w-16 h-16 text-bidaaya-accent mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-bidaaya-light mb-2">Projects</h3>
            <p className="text-bidaaya-light/60 mb-6">
              Coming soon! For now, you can add projects through the chat.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={moveToPreviousSection}
                variant="outline"
                className="border-bidaaya-light/20 text-bidaaya-light"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleSkip}
                className="bg-bidaaya-accent hover:bg-bidaaya-accent/90"
              >
                Skip for Now
              </Button>
            </div>
          </div>
        )}

        {currentSection === "skills" && (
          <div className="max-w-2xl mx-auto text-center py-20">
            <Award className="w-16 h-16 text-bidaaya-accent mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-bidaaya-light mb-2">Skills</h3>
            <p className="text-bidaaya-light/60 mb-6">
              Coming soon! For now, you can add skills through the chat.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={moveToPreviousSection}
                variant="outline"
                className="border-bidaaya-light/20 text-bidaaya-light"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleComplete}
                className="bg-bidaaya-accent hover:bg-bidaaya-accent/90"
              >
                Complete
              </Button>
            </div>
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

