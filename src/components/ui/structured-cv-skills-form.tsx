"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SkillFormData {
  skillName: string;
  category: string; // "hard_skill", "soft_skill", "tool"
  proficiency?: string; // "beginner", "intermediate", "advanced", "expert"
  yearsOfExperience?: number;
  evidenceUrl?: string;
}

interface StructuredCVSkillsFormProps {
  onSave: (data: SkillFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<SkillFormData>;
}

const SKILL_CATEGORIES = [
  { value: "hard_skill", label: "Technical/Hard Skill" },
  { value: "soft_skill", label: "Soft Skill" },
  { value: "tool", label: "Tool/Software" },
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
  initialData,
}: StructuredCVSkillsFormProps) {
  const [formData, setFormData] = useState<SkillFormData>({
    skillName: initialData?.skillName || "",
    category: initialData?.category || "",
    proficiency: initialData?.proficiency || "",
    yearsOfExperience: initialData?.yearsOfExperience || undefined,
    evidenceUrl: initialData?.evidenceUrl || "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        skillName: initialData.skillName || "",
        category: initialData.category || "",
        proficiency: initialData.proficiency || "",
        yearsOfExperience: initialData.yearsOfExperience || undefined,
        evidenceUrl: initialData.evidenceUrl || "",
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.skillName.trim()) newErrors.skillName = "Skill name is required";
    if (!formData.category) newErrors.category = "Category is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving skill:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-bidaaya-dark rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-bidaaya-accent" />
        <h3 className="text-xl font-semibold text-bidaaya-light">Add Skill</h3>
      </div>

      {/* Skill Name */}
      <div className="space-y-2">
        <Label htmlFor="skillName" className="text-bidaaya-light">
          Skill Name <span className="text-red-400">*</span>
        </Label>
        <Input
          id="skillName"
          value={formData.skillName}
          onChange={(e) => setFormData((prev) => ({ ...prev, skillName: e.target.value }))}
          placeholder="e.g., Python, Leadership, Figma, Data Analysis"
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
        <Label htmlFor="category" className="text-bidaaya-light">
          Category <span className="text-red-400">*</span>
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
            <SelectValue placeholder="Select category" />
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
        <p className="text-xs text-bidaaya-light/60">
          Hard skills: Programming, Accounting | Soft skills: Leadership, Communication | Tools: Figma, Excel
        </p>
      </div>

      {/* Proficiency */}
      <div className="space-y-2">
        <Label htmlFor="proficiency" className="text-bidaaya-light">
          Proficiency Level
        </Label>
        <Select
          value={formData.proficiency}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, proficiency: value }))}
        >
          <SelectTrigger className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light">
            <SelectValue placeholder="Select proficiency (optional)" />
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

      {/* Years of Experience */}
      <div className="space-y-2">
        <Label htmlFor="yearsOfExperience" className="text-bidaaya-light">
          Years of Experience
        </Label>
        <Input
          id="yearsOfExperience"
          type="number"
          step="0.5"
          min="0"
          max="50"
          value={formData.yearsOfExperience || ""}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              yearsOfExperience: e.target.value ? parseFloat(e.target.value) : undefined,
            }))
          }
          placeholder="e.g., 2.5"
          className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
        />
        <p className="text-xs text-bidaaya-light/60">How long have you been using this skill? (optional)</p>
      </div>

      {/* Evidence URL */}
      <div className="space-y-2">
        <Label htmlFor="evidenceUrl" className="text-bidaaya-light">
          Portfolio/Evidence Link
        </Label>
        <Input
          id="evidenceUrl"
          type="url"
          value={formData.evidenceUrl}
          onChange={(e) => setFormData((prev) => ({ ...prev, evidenceUrl: e.target.value }))}
          placeholder="https://github.com/yourproject or portfolio link"
          className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
        />
        <p className="text-xs text-bidaaya-light/60">
          Link to a project, GitHub repo, or portfolio demonstrating this skill (optional)
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSaving}
          className="flex-1 bg-bidaaya-accent hover:bg-bidaaya-accent/90 text-white"
        >
          {isSaving ? "Saving..." : "Add Skill"}
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
