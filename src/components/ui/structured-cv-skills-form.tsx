"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface SkillFormData {
  skillName: string;
  category: string;
  proficiency?: string;
}

interface StructuredCVSkillsFormProps {
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

const SKILL_CATEGORIES = [
  { value: "hard_skill", label: "Technical" },
  { value: "soft_skill", label: "Soft Skill" },
  { value: "tool", label: "Tool" },
];

const PROFICIENCY_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

export function StructuredCVSkillsForm({
  onSave,
  onCancel,
}: StructuredCVSkillsFormProps) {
  const [formData, setFormData] = useState<SkillFormData>({
    skillName: "",
    category: "",
    proficiency: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.skillName.trim()) newErrors.skillName = "Skill name required";
    if (!formData.category) newErrors.category = "Category required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        yearsOfExperience: null,
        evidenceUrl: null,
      });
    } catch (error) {
      console.error("Error saving skill:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-bidaaya-dark rounded-lg flex flex-col max-h-[75vh]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 sm:px-4 sm:pt-4">
        <Award className="w-4 h-4 text-bidaaya-accent" />
        <h3 className="text-base sm:text-lg font-semibold text-bidaaya-light">Add Skill</h3>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 space-y-3 pb-3">

      {/* Skill Name */}
      <div className="space-y-2">
        <Label htmlFor="skillName" className="text-bidaaya-light text-sm">
          Skill <span className="text-red-400">*</span>
        </Label>
        <Input
          id="skillName"
          value={formData.skillName}
          onChange={(e) => setFormData((prev) => ({ ...prev, skillName: e.target.value }))}
          placeholder="e.g., Python, Leadership, Excel"
          className={cn(
            "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
            errors.skillName && "border-red-400"
          )}
          required
        />
        {errors.skillName && <p className="text-xs text-red-400">{errors.skillName}</p>}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category" className="text-bidaaya-light text-sm">
          Type <span className="text-red-400">*</span>
        </Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
        >
          <SelectTrigger
            className={cn(
              "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
              errors.category && "border-red-400"
            )}
          >
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="bg-bidaaya-dark border-bidaaya-light/20">
            {SKILL_CATEGORIES.map((cat) => (
              <SelectItem
                key={cat.value}
                value={cat.value}
                className="text-bidaaya-light hover:bg-bidaaya-light/10"
              >
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-xs text-red-400">{errors.category}</p>}
      </div>

      {/* Proficiency */}
      <div className="space-y-2">
        <Label htmlFor="proficiency" className="text-bidaaya-light text-sm">
          Level (optional)
        </Label>
        <Select
          value={formData.proficiency}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, proficiency: value }))}
        >
          <SelectTrigger className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light">
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent className="bg-bidaaya-dark border-bidaaya-light/20">
            {PROFICIENCY_LEVELS.map((level) => (
              <SelectItem
                key={level.value}
                value={level.value}
                className="text-bidaaya-light hover:bg-bidaaya-light/10"
              >
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      </div>

      {/* Actions - Fixed at bottom */}
      <div className="border-t border-bidaaya-light/10 px-3 py-3 sm:px-4 bg-bidaaya-dark">
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="flex-1 bg-bidaaya-accent hover:bg-bidaaya-accent/90 text-white text-sm h-10"
          >
            {isSaving ? "Saving..." : "Add"}
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="border-bidaaya-light/20 text-bidaaya-light hover:bg-bidaaya-light/10 text-sm h-10"
          >
            Skip
          </Button>
        </div>
      </div>
    </form>
  );
}
