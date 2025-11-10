"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EducationFormData {
  level: string;
  program: string;
  institution: string;
  country: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  modules: string[];
}

interface StructuredCVEducationFormProps {
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

const EDUCATION_LEVELS = [
  { value: "High_School", label: "High School" },
  { value: "Foundation", label: "Foundation Year" },
  { value: "Bachelor", label: "Bachelor's Degree" },
  { value: "Master", label: "Master's Degree" },
  { value: "PhD", label: "PhD" },
];

const COMMON_COUNTRIES = [
  { code: "AE", name: "UAE" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "GB", name: "UK" },
  { code: "US", name: "USA" },
  { code: "CA", name: "Canada" },
  { code: "IN", name: "India" },
  { code: "EG", name: "Egypt" },
];

export function StructuredCVEducationFormSimple({
  onSave,
  onCancel,
}: StructuredCVEducationFormProps) {
  const [formData, setFormData] = useState<EducationFormData>({
    level: "",
    program: "",
    institution: "",
    country: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    modules: [],
  });

  const [newModule, setNewModule] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.level) newErrors.level = "Level required";
    if (!formData.program.trim()) newErrors.program = "Program/Degree required";
    if (!formData.institution.trim()) newErrors.institution = "Institution required";
    if (!formData.country) newErrors.country = "Country required";
    if (!formData.startDate) newErrors.startDate = "Start date required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addModule = () => {
    if (newModule.trim() && formData.modules.length < 6) {
      setFormData((prev) => ({
        ...prev,
        modules: [...prev.modules, newModule.trim()],
      }));
      setNewModule("");
    }
  };

  const removeModule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);
    try {
      // Map to match API expectations
      await onSave({
        level: formData.level,
        program: formData.program,
        majors: [], // Empty - we removed this
        minors: [], // Empty - we removed this
        institution: formData.institution,
        country: formData.country,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isCurrent: formData.isCurrent,
        modules: formData.modules,
        awards: [],
      });
    } catch (error) {
      console.error("Error saving education:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 sm:p-4 bg-bidaaya-dark rounded-lg max-h-[70vh] overflow-y-auto">
      <div className="flex items-center gap-2 mb-1">
        <GraduationCap className="w-4 h-4 text-bidaaya-accent" />
        <h3 className="text-base sm:text-lg font-semibold text-bidaaya-light">Add Education</h3>
      </div>

      {/* Level */}
      <div className="space-y-2">
        <Label className="text-bidaaya-light text-sm">
          Level <span className="text-red-400">*</span>
        </Label>
        <Select
          value={formData.level}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, level: value }))}
        >
          <SelectTrigger
            className={cn(
              "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
              errors.level && "border-red-400"
            )}
          >
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent className="bg-bidaaya-dark border-bidaaya-light/20">
            {EDUCATION_LEVELS.map((level) => (
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
        {errors.level && <p className="text-xs text-red-400">{errors.level}</p>}
      </div>

      {/* Program/Degree */}
      <div className="space-y-2">
        <Label htmlFor="program" className="text-bidaaya-light text-sm">
          Program/Degree <span className="text-red-400">*</span>
        </Label>
        <Input
          id="program"
          value={formData.program}
          onChange={(e) => setFormData((prev) => ({ ...prev, program: e.target.value }))}
          placeholder="e.g., BSc Economics, Computer Science"
          className={cn(
            "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
            errors.program && "border-red-400"
          )}
          required
        />
        {errors.program && <p className="text-xs text-red-400">{errors.program}</p>}
      </div>

      {/* Institution */}
      <div className="space-y-2">
        <Label htmlFor="institution" className="text-bidaaya-light text-sm">
          Institution <span className="text-red-400">*</span>
        </Label>
        <Input
          id="institution"
          value={formData.institution}
          onChange={(e) => setFormData((prev) => ({ ...prev, institution: e.target.value }))}
          placeholder="e.g., University of Dubai, AUD"
          className={cn(
            "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
            errors.institution && "border-red-400"
          )}
          required
        />
        {errors.institution && <p className="text-xs text-red-400">{errors.institution}</p>}
      </div>

      {/* Country */}
      <div className="space-y-2">
        <Label className="text-bidaaya-light text-sm">
          Country <span className="text-red-400">*</span>
        </Label>
        <Select
          value={formData.country}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, country: value }))}
        >
          <SelectTrigger
            className={cn(
              "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
              errors.country && "border-red-400"
            )}
          >
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent className="bg-bidaaya-dark border-bidaaya-light/20">
            {COMMON_COUNTRIES.map((country) => (
              <SelectItem
                key={country.code}
                value={country.code}
                className="text-bidaaya-light hover:bg-bidaaya-light/10"
              >
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.country && <p className="text-xs text-red-400">{errors.country}</p>}
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

      {/* Current Checkbox */}
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
          I'm currently studying here
        </Label>
      </div>

      {/* Key Modules (optional) */}
      <div className="space-y-2">
        <Label className="text-bidaaya-light text-sm">
          Key Courses/Modules <span className="text-bidaaya-light/60">(optional, max 4)</span>
        </Label>
        <div className="flex gap-2">
          <Input
            value={newModule}
            onChange={(e) => setNewModule(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addModule();
              }
            }}
            placeholder="Add course"
            disabled={formData.modules.length >= 4}
            className="flex-1 bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light text-sm"
          />
          <Button
            type="button"
            onClick={addModule}
            disabled={!newModule.trim() || formData.modules.length >= 4}
            className="bg-bidaaya-accent hover:bg-bidaaya-accent/90 px-3"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {formData.modules.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.modules.map((module, index) => (
              <div
                key={index}
                className="flex items-center gap-1 px-2 py-1 bg-bidaaya-accent/20 rounded-full text-xs text-bidaaya-light"
              >
                {module}
                <button
                  type="button"
                  onClick={() => removeModule(index)}
                  className="hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions - Sticky at bottom */}
      <div className="sticky bottom-0 bg-bidaaya-dark pt-3 pb-1 -mx-3 px-3 border-t border-bidaaya-light/10">
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

