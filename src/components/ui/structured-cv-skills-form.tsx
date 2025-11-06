"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, X, Code, Wrench, BarChart3, Palette, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface Skill {
  name: string;
  category: string;
  proficiency: string; // Basic, Intermediate, Advanced
}

interface SkillsFormData {
  skills: Skill[];
}

interface StructuredCVSkillsFormProps {
  onSave: (data: SkillsFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<SkillsFormData>;
}

const SKILL_CATEGORIES = [
  { value: "programming", label: "Programming Languages", icon: Code },
  { value: "tools", label: "Tools & Frameworks", icon: Wrench },
  { value: "data", label: "Data & Analytics", icon: BarChart3 },
  { value: "design", label: "Design & Productivity", icon: Palette },
  { value: "business", label: "Business & Finance", icon: Briefcase },
];

const PROFICIENCY_LEVELS = [
  { value: "Basic", label: "Basic" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
];

const COMMON_SKILLS: Record<string, string[]> = {
  programming: [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust",
    "PHP", "Ruby", "Swift", "Kotlin", "R", "MATLAB", "SQL"
  ],
  tools: [
    "React", "Node.js", "Next.js", "Vue.js", "Angular", "Django", "Flask",
    "Spring", "TensorFlow", "PyTorch", "Docker", "Kubernetes", "Git", "AWS", "Azure"
  ],
  data: [
    "Excel", "SQL", "Python", "R", "Tableau", "Power BI", "Google Analytics",
    "Pandas", "NumPy", "Scikit-learn", "Jupyter", "SPSS", "SAS"
  ],
  design: [
    "Figma", "Adobe XD", "Photoshop", "Illustrator", "Sketch", "InVision",
    "Canva", "Notion", "Miro", "Jira", "Trello", "Asana"
  ],
  business: [
    "Financial Modeling", "DCF Valuation", "M&A Analysis", "Market Research",
    "Business Strategy", "Project Management", "Agile", "Scrum", "Excel VBA"
  ],
};

export function StructuredCVSkillsForm({
  onSave,
  onCancel,
  initialData,
}: StructuredCVSkillsFormProps) {
  const [formData, setFormData] = useState<SkillsFormData>({
    skills: initialData?.skills || [],
  });

  const [currentCategory, setCurrentCategory] = useState("");
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillProficiency, setNewSkillProficiency] = useState("Intermediate");
  const [isSaving, setIsSaving] = useState(false);

  const addSkill = () => {
    if (!newSkillName.trim() || !currentCategory) return;

    const skill: Skill = {
      name: newSkillName.trim(),
      category: currentCategory,
      proficiency: newSkillProficiency,
    };

    setFormData((prev) => ({
      skills: [...prev.skills, skill],
    }));

    setNewSkillName("");
  };

  const removeSkill = (index: number) => {
    setFormData((prev) => ({
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const quickAddSkill = (skillName: string) => {
    if (!currentCategory) return;

    const skill: Skill = {
      name: skillName,
      category: currentCategory,
      proficiency: "Intermediate",
    };

    setFormData((prev) => ({
      skills: [...prev.skills, skill],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving skills:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const skillsByCategory = formData.skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-bidaaya-dark rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-bidaaya-accent" />
        <h3 className="text-xl font-semibold text-bidaaya-light">Skills & Tools</h3>
      </div>

      {/* Category Selection */}
      <div className="space-y-2">
        <Label className="text-bidaaya-light">Select Category</Label>
        <div className="grid grid-cols-2 gap-2">
          {SKILL_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCurrentCategory(cat.value)}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border-2 transition-all",
                  currentCategory === cat.value
                    ? "border-bidaaya-accent bg-bidaaya-accent/20 text-bidaaya-light"
                    : "border-bidaaya-light/20 text-bidaaya-light/60 hover:border-bidaaya-light/40"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Skill */}
      {currentCategory && (
        <div className="space-y-3 p-4 bg-bidaaya-light/5 rounded-lg">
          <Label className="text-bidaaya-light">Add Skill</Label>
          <div className="grid grid-cols-3 gap-2">
            <Input
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="Skill name"
              className="col-span-1 bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
            />
            <Select
              value={newSkillProficiency}
              onValueChange={setNewSkillProficiency}
            >
              <SelectTrigger className="col-span-1 bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROFICIENCY_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={addSkill}
              className="bg-bidaaya-accent hover:bg-bidaaya-accent/90"
            >
              Add
            </Button>
          </div>

          {/* Quick Add Common Skills */}
          <div className="space-y-2">
            <p className="text-xs text-bidaaya-light/60">Quick add:</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_SKILLS[currentCategory]?.slice(0, 8).map((skillName) => {
                const alreadyAdded = formData.skills.some((s) => s.name === skillName);
                return (
                  <button
                    key={skillName}
                    type="button"
                    onClick={() => quickAddSkill(skillName)}
                    disabled={alreadyAdded}
                    className={cn(
                      "px-2 py-1 text-xs rounded-full transition-all",
                      alreadyAdded
                        ? "bg-bidaaya-light/10 text-bidaaya-light/40 cursor-not-allowed"
                        : "bg-bidaaya-light/20 text-bidaaya-light hover:bg-bidaaya-accent/30"
                    )}
                  >
                    {skillName}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Skills Display by Category */}
      <div className="space-y-4">
        <Label className="text-bidaaya-light">Your Skills ({formData.skills.length})</Label>
        {SKILL_CATEGORIES.map((cat) => {
          const categorySkills = skillsByCategory[cat.value] || [];
          if (categorySkills.length === 0) return null;

          return (
            <div key={cat.value} className="space-y-2">
              <p className="text-sm font-medium text-bidaaya-light/80">{cat.label}</p>
              <div className="flex flex-wrap gap-2">
                {categorySkills.map((skill, index) => {
                  const globalIndex = formData.skills.findIndex(
                    (s) => s.name === skill.name && s.category === skill.category
                  );
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1.5 bg-bidaaya-accent/20 rounded-full text-sm text-bidaaya-light"
                    >
                      <span className="font-medium">{skill.name}</span>
                      <span className="text-xs text-bidaaya-light/60">({skill.proficiency})</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(globalIndex)}
                        className="ml-1 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {formData.skills.length === 0 && (
          <p className="text-sm text-bidaaya-light/60 text-center py-8">
            Select a category above to start adding skills
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={formData.skills.length === 0 || isSaving}
          className="flex-1 bg-bidaaya-accent hover:bg-bidaaya-accent/90 text-white"
        >
          {isSaving ? "Saving..." : `Save ${formData.skills.length} Skills`}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="border-bidaaya-light/20 text-bidaaya-light hover:bg-bidaaya-light/10"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

