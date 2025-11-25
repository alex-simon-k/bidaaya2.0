"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExperienceFormData {
  title: string; // Job title
  employer: string; // Company name
  employmentType: string; // internship, full_time, part_time, etc.
  startDate: string; // YYYY-MM
  endDate: string; // YYYY-MM
  isCurrent: boolean;
  summary?: string; // Brief description (optional)
}

interface StructuredCVExperienceFormProps {
  onSave: (data: ExperienceFormData) => Promise<void>;
  onCancel: () => void;
}

const EMPLOYMENT_TYPES = [
  { value: "internship", label: "Internship" },
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "volunteer", label: "Volunteer" },
];

export function StructuredCVExperienceForm({
  onSave,
  onCancel,
}: StructuredCVExperienceFormProps) {
  const [formData, setFormData] = useState<ExperienceFormData>({
    title: "",
    employer: "",
    employmentType: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    summary: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Job title is required";
    if (!formData.employer.trim()) newErrors.employer = "Company name is required";
    if (!formData.employmentType) newErrors.employmentType = "Type is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    
    // Require a meaningful description (minimum 50 characters)
    if (!formData.summary || formData.summary.trim().length < 50) {
      newErrors.summary = "Add a description of your role and achievements (at least 50 characters)";
    }

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
      console.error("Error saving experience:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-bidaaya-dark rounded-lg flex flex-col max-h-[75vh]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 sm:px-4 sm:pt-4">
        <Briefcase className="w-4 h-4 text-bidaaya-accent" />
        <h3 className="text-base sm:text-lg font-semibold text-bidaaya-light">Add Work Experience</h3>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 space-y-3 pb-3">

      {/* Job Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-bidaaya-light text-sm">
          Job Title <span className="text-red-400">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., Marketing Intern"
          className={cn(
            "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
            errors.title && "border-red-400"
          )}
          required
        />
        {errors.title && <p className="text-xs text-red-400">{errors.title}</p>}
      </div>

      {/* Company */}
      <div className="space-y-2">
        <Label htmlFor="employer" className="text-bidaaya-light text-sm">
          Company <span className="text-red-400">*</span>
        </Label>
        <Input
          id="employer"
          value={formData.employer}
          onChange={(e) => setFormData((prev) => ({ ...prev, employer: e.target.value }))}
          placeholder="e.g., Google, Local Startup"
          className={cn(
            "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
            errors.employer && "border-red-400"
          )}
          required
        />
        {errors.employer && <p className="text-xs text-red-400">{errors.employer}</p>}
      </div>

      {/* Employment Type */}
      <div className="space-y-2">
        <Label htmlFor="employmentType" className="text-bidaaya-light text-sm">
          Type <span className="text-red-400">*</span>
        </Label>
        <Select
          value={formData.employmentType}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, employmentType: value }))}
        >
          <SelectTrigger
            className={cn(
              "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
              errors.employmentType && "border-red-400"
            )}
          >
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="bg-bidaaya-dark border-bidaaya-light/20">
            {EMPLOYMENT_TYPES.map((type) => (
              <SelectItem
                key={type.value}
                value={type.value}
                className="text-bidaaya-light hover:bg-bidaaya-light/10"
              >
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.employmentType && <p className="text-xs text-red-400">{errors.employmentType}</p>}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-bidaaya-light text-sm">
            Start <span className="text-red-400">*</span>
          </Label>
          <Input
            id="startDate"
            type="month"
            value={formData.startDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
            className={cn(
              "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
              errors.startDate && "border-red-400"
            )}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-bidaaya-light text-sm">
            End
          </Label>
          <Input
            id="endDate"
            type="month"
            value={formData.endDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
            disabled={formData.isCurrent}
            className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light disabled:opacity-50"
          />
        </div>
      </div>

      {/* Current Job Checkbox */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isCurrent"
          checked={formData.isCurrent}
          onChange={(e) => {
            setFormData((prev) => ({
              ...prev,
              isCurrent: e.target.checked,
              endDate: e.target.checked ? "" : prev.endDate,
            }));
          }}
          className="w-4 h-4 rounded border-bidaaya-light/20 bg-bidaaya-light/10 text-bidaaya-accent"
        />
        <Label htmlFor="isCurrent" className="text-bidaaya-light text-sm cursor-pointer">
          I currently work here
        </Label>
      </div>

      {/* Summary (REQUIRED for quality CVs) */}
      <div className="space-y-2">
        <Label htmlFor="summary" className="text-bidaaya-light text-sm">
          Role Description <span className="text-red-400">*</span>
        </Label>
        <Textarea
          id="summary"
          value={formData.summary}
          onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
          placeholder="Describe what you did in this role (min. 50 characters for a quality CV)"
          rows={3}
          className={cn(
            "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light resize-none text-sm",
            errors.summary && "border-red-400"
          )}
          required
        />
        {formData.summary && (
          <p className={cn(
            "text-xs",
            formData.summary.length >= 50 ? "text-green-400" : "text-bidaaya-light/60"
          )}>
            {formData.summary.length}/50 characters
          </p>
        )}
        {errors.summary && <p className="text-xs text-red-400">{errors.summary}</p>}
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
            {isSaving ? "Saving..." : "Save"}
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
