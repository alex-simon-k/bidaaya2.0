"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { GraduationCap, MapPin, Calendar, Award, BookOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface StructuredCVEducationFormProps {
  onSave: (data: EducationFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<EducationFormData>;
}

const EDUCATION_LEVELS = [
  { value: "High_School", label: "High School" },
  { value: "Foundation", label: "Foundation" },
  { value: "Bachelor", label: "Bachelor's Degree" },
  { value: "Master", label: "Master's Degree" },
  { value: "PhD", label: "PhD / Doctorate" },
  { value: "Other", label: "Other" },
];

const COMMON_COUNTRIES = [
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "IN", name: "India" },
  { code: "PK", name: "Pakistan" },
  { code: "EG", name: "Egypt" },
  { code: "JO", name: "Jordan" },
  { code: "LB", name: "Lebanon" },
  { code: "Other", name: "Other" },
];

const COMMON_UNIVERSITIES = [
  "American University of Dubai (AUD)",
  "American University of Sharjah (AUS)",
  "Canadian University Dubai (CUD)",
  "Heriot-Watt University Dubai",
  "Zayed University",
  "Khalifa University",
  "United Arab Emirates University (UAEU)",
  "Ajman University",
  "University of Sharjah",
  "BITS Pilani Dubai",
  "Middlesex University Dubai",
  "University of Birmingham Dubai",
  "Other (Enter manually)",
];

export function StructuredCVEducationForm({
  onSave,
  onCancel,
  initialData,
}: StructuredCVEducationFormProps) {
  const [formData, setFormData] = useState<EducationFormData>({
    level: initialData?.level || "",
    program: initialData?.program || "",
    majors: initialData?.majors || [],
    minors: initialData?.minors || [],
    institution: initialData?.institution || "",
    country: initialData?.country || "",
    startDate: initialData?.startDate || "",
    endDate: initialData?.endDate || "",
    isCurrent: initialData?.isCurrent || false,
    gpaValue: initialData?.gpaValue || "",
    gpaScale: initialData?.gpaScale || "4.0",
    predictedGrade: initialData?.predictedGrade || "",
    finalGrade: initialData?.finalGrade || "",
    modules: initialData?.modules || [],
    awards: initialData?.awards || [],
  });

  const [customInstitution, setCustomInstitution] = useState("");
  const [showCustomInstitution, setShowCustomInstitution] = useState(false);
  const [newModule, setNewModule] = useState("");
  const [newMajor, setNewMajor] = useState("");
  const [newMinor, setNewMinor] = useState("");
  const [newAward, setNewAward] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (formData.institution && !COMMON_UNIVERSITIES.includes(formData.institution)) {
      setCustomInstitution(formData.institution);
      setShowCustomInstitution(true);
    }
  }, []);

  const handleInstitutionChange = (value: string) => {
    if (value === "Other (Enter manually)") {
      setShowCustomInstitution(true);
      setFormData((prev) => ({ ...prev, institution: "" }));
    } else {
      setShowCustomInstitution(false);
      setCustomInstitution("");
      setFormData((prev) => ({ ...prev, institution: value }));
    }
  };

  const addItem = (field: "modules" | "majors" | "minors" | "awards", value: string, maxLength?: number) => {
    if (!value.trim()) return;
    if (maxLength && formData[field].length >= maxLength) {
      alert(`Maximum ${maxLength} items allowed`);
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], value.trim()],
    }));
    if (field === "modules") setNewModule("");
    if (field === "majors") setNewMajor("");
    if (field === "minors") setNewMinor("");
    if (field === "awards") setNewAward("");
  };

  const removeItem = (field: "modules" | "majors" | "minors" | "awards", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const finalData = {
      ...formData,
      institution: showCustomInstitution ? customInstitution : formData.institution,
    };

    try {
      await onSave(finalData);
    } catch (error) {
      console.error("Error saving education:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.level &&
      formData.program &&
      (showCustomInstitution ? customInstitution : formData.institution) &&
      formData.country &&
      formData.startDate
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-bidaaya-dark rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="w-5 h-5 text-bidaaya-accent" />
        <h3 className="text-xl font-semibold text-bidaaya-light">Education Details</h3>
      </div>

      {/* Education Level */}
      <div className="space-y-2">
        <Label htmlFor="level" className="text-bidaaya-light">
          Education Level <span className="text-red-400">*</span>
        </Label>
        <Select
          value={formData.level}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, level: value }))}
        >
          <SelectTrigger className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light">
            <SelectValue placeholder="Select education level" />
          </SelectTrigger>
          <SelectContent>
            {EDUCATION_LEVELS.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Program/Degree Name */}
      <div className="space-y-2">
        <Label htmlFor="program" className="text-bidaaya-light">
          Program / Degree Name <span className="text-red-400">*</span>
        </Label>
        <Input
          id="program"
          value={formData.program}
          onChange={(e) => setFormData((prev) => ({ ...prev, program: e.target.value }))}
          placeholder="e.g., BSc Economics, A-Levels"
          className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
          required
        />
      </div>

      {/* Majors */}
      <div className="space-y-2">
        <Label className="text-bidaaya-light">
          Major(s) <span className="text-sm text-bidaaya-light/60">(max 3)</span>
        </Label>
        <div className="flex gap-2">
          <Input
            value={newMajor}
            onChange={(e) => setNewMajor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem("majors", newMajor, 3);
              }
            }}
            placeholder="Add major (press Enter)"
            className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
          />
          <Button
            type="button"
            onClick={() => addItem("majors", newMajor, 3)}
            className="bg-bidaaya-accent hover:bg-bidaaya-accent/90"
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.majors.map((major, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-3 py-1 bg-bidaaya-accent/20 rounded-full text-sm text-bidaaya-light"
            >
              {major}
              <button
                type="button"
                onClick={() => removeItem("majors", index)}
                className="ml-1 hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Minors */}
      <div className="space-y-2">
        <Label className="text-bidaaya-light">
          Minor(s) <span className="text-sm text-bidaaya-light/60">(max 2, optional)</span>
        </Label>
        <div className="flex gap-2">
          <Input
            value={newMinor}
            onChange={(e) => setNewMinor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem("minors", newMinor, 2);
              }
            }}
            placeholder="Add minor (press Enter)"
            className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
          />
          <Button
            type="button"
            onClick={() => addItem("minors", newMinor, 2)}
            className="bg-bidaaya-accent hover:bg-bidaaya-accent/90"
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.minors.map((minor, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 rounded-full text-sm text-bidaaya-light"
            >
              {minor}
              <button
                type="button"
                onClick={() => removeItem("minors", index)}
                className="ml-1 hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Institution */}
      <div className="space-y-2">
        <Label htmlFor="institution" className="text-bidaaya-light">
          Institution <span className="text-red-400">*</span>
        </Label>
        {!showCustomInstitution ? (
          <Select value={formData.institution} onValueChange={handleInstitutionChange}>
            <SelectTrigger className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light">
              <SelectValue placeholder="Select or search institution" />
            </SelectTrigger>
            <SelectContent>
              {COMMON_UNIVERSITIES.map((uni) => (
                <SelectItem key={uni} value={uni}>
                  {uni}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="space-y-2">
            <Input
              value={customInstitution}
              onChange={(e) => setCustomInstitution(e.target.value)}
              placeholder="Enter institution name"
              className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCustomInstitution(false);
                setCustomInstitution("");
              }}
              className="text-bidaaya-light/60 hover:text-bidaaya-light"
            >
              Use dropdown instead
            </Button>
          </div>
        )}
      </div>

      {/* Country */}
      <div className="space-y-2">
        <Label htmlFor="country" className="text-bidaaya-light flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Country <span className="text-red-400">*</span>
        </Label>
        <Select
          value={formData.country}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, country: value }))}
        >
          <SelectTrigger className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {COMMON_COUNTRIES.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-bidaaya-light flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Start Date <span className="text-red-400">*</span>
          </Label>
          <Input
            id="startDate"
            type="month"
            value={formData.startDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
            className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-bidaaya-light flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            End Date {formData.isCurrent ? "(Current)" : ""}
          </Label>
          <Input
            id="endDate"
            type="month"
            value={formData.endDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
            disabled={formData.isCurrent}
            className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
          />
        </div>
      </div>

      {/* Currently Studying */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isCurrent"
          checked={formData.isCurrent}
          onCheckedChange={(checked) => {
            setFormData((prev) => ({
              ...prev,
              isCurrent: checked as boolean,
              endDate: checked ? "" : prev.endDate,
            }));
          }}
        />
        <Label htmlFor="isCurrent" className="text-bidaaya-light cursor-pointer">
          I am currently studying here
        </Label>
      </div>

      {/* GPA */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="gpaValue" className="text-bidaaya-light">
            GPA Value
          </Label>
          <Input
            id="gpaValue"
            value={formData.gpaValue || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, gpaValue: e.target.value }))}
            placeholder="e.g., 3.8"
            className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gpaScale" className="text-bidaaya-light">
            GPA Scale
          </Label>
          <Input
            id="gpaScale"
            value={formData.gpaScale || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, gpaScale: e.target.value }))}
            placeholder="e.g., 4.0, 100"
            className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
          />
        </div>
      </div>

      {/* Grades */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="predictedGrade" className="text-bidaaya-light flex items-center gap-2">
            <Award className="w-4 h-4" />
            Predicted Grade
          </Label>
          <Input
            id="predictedGrade"
            value={formData.predictedGrade || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, predictedGrade: e.target.value }))}
            placeholder="e.g., First Class Honours"
            className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="finalGrade" className="text-bidaaya-light">
            Final Grade
          </Label>
          <Input
            id="finalGrade"
            value={formData.finalGrade || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, finalGrade: e.target.value }))}
            placeholder="e.g., A*"
            className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
          />
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-2">
        <Label className="text-bidaaya-light flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Modules / Courses <span className="text-sm text-bidaaya-light/60">(max 6)</span>
        </Label>
        <div className="flex gap-2">
          <Input
            value={newModule}
            onChange={(e) => setNewModule(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem("modules", newModule, 6);
              }
            }}
            placeholder="Add module (press Enter)"
            className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
          />
          <Button
            type="button"
            onClick={() => addItem("modules", newModule, 6)}
            className="bg-bidaaya-accent hover:bg-bidaaya-accent/90"
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.modules.map((module, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-3 py-1 bg-bidaaya-accent/20 rounded-full text-sm text-bidaaya-light"
            >
              {module}
              <button
                type="button"
                onClick={() => removeItem("modules", index)}
                className="ml-1 hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Awards */}
      <div className="space-y-2">
        <Label className="text-bidaaya-light flex items-center gap-2">
          <Award className="w-4 h-4" />
          Honors & Awards
        </Label>
        <div className="flex gap-2">
          <Input
            value={newAward}
            onChange={(e) => setNewAward(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem("awards", newAward);
              }
            }}
            placeholder="e.g., Dean's List 2023"
            className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
          />
          <Button
            type="button"
            onClick={() => addItem("awards", newAward)}
            className="bg-bidaaya-accent hover:bg-bidaaya-accent/90"
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.awards.map((award, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-3 py-1 bg-bidaaya-accent/20 rounded-full text-sm text-bidaaya-light"
            >
              {award}
              <button
                type="button"
                onClick={() => removeItem("awards", index)}
                className="ml-1 hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={!isFormValid() || isSaving}
          className="flex-1 bg-bidaaya-accent hover:bg-bidaaya-accent/90 text-white"
        >
          {isSaving ? "Saving..." : "Save Education"}
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
