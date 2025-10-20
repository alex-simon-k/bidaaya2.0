"use client";

import { Check, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  inProgress?: boolean;
}

interface ProfileCompletionChecklistProps {
  items: ChecklistItem[];
  className?: string;
}

export function ProfileCompletionChecklist({ items, className }: ProfileCompletionChecklistProps) {
  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className={cn("bg-bidaaya-light/5 rounded-xl p-6 border border-bidaaya-light/10", className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-bidaaya-light">Profile Completion</h3>
          <span className="text-sm font-bold text-bidaaya-accent">
            {completedCount}/{totalCount}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-bidaaya-light/10 rounded-full h-2 mb-2">
          <div 
            className="bg-gradient-to-r from-bidaaya-accent to-green-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        
        <p className="text-xs text-bidaaya-light/60">
          Tell me about yourself to complete your profile
        </p>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg transition-all",
              item.completed && "bg-green-500/10",
              item.inProgress && "bg-bidaaya-accent/10",
              !item.completed && !item.inProgress && "bg-bidaaya-light/5"
            )}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {item.completed ? (
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              ) : item.inProgress ? (
                <Loader2 className="w-5 h-5 text-bidaaya-accent animate-spin" />
              ) : (
                <Circle className="w-5 h-5 text-bidaaya-light/30" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium transition-colors",
                item.completed ? "text-green-400" : "text-bidaaya-light"
              )}>
                {item.label}
              </p>
              <p className="text-xs text-bidaaya-light/60 mt-0.5">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Completion Message */}
      {completedCount === totalCount && (
        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-sm font-medium text-green-400 text-center">
            🎉 Profile Complete! You're all set to discover opportunities.
          </p>
        </div>
      )}
    </div>
  );
}

// Default checklist items
export const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "personal_info",
    label: "Personal Information",
    description: "Name, university, major, year of study",
    completed: false,
  },
  {
    id: "work_experience",
    label: "Work Experience",
    description: "Previous jobs, internships, responsibilities",
    completed: false,
  },
  {
    id: "projects",
    label: "Projects",
    description: "Academic or personal projects you've worked on",
    completed: false,
  },
  {
    id: "skills",
    label: "Skills & Competencies",
    description: "Technical skills, languages, tools you know",
    completed: false,
  },
  {
    id: "volunteering",
    label: "Volunteering & Extracurriculars",
    description: "Volunteer work, clubs, leadership roles",
    completed: false,
  },
  {
    id: "hobbies",
    label: "Hobbies & Interests",
    description: "Personal interests that make you unique",
    completed: false,
  },
  {
    id: "career_goals",
    label: "Career Goals",
    description: "What kind of opportunities you're looking for",
    completed: false,
  },
  {
    id: "availability",
    label: "Availability & Preferences",
    description: "When you're available, preferred locations, work type",
    completed: false,
  },
];

