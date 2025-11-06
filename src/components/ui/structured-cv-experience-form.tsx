"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Briefcase, MapPin, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExperienceFormData {
  organization: string;
  roleTitle: string;
  employmentType: string; // Internship, Part_time, Voluntary, Project, Freelance
  locationMode: string; // On_site, Hybrid, Remote
  city?: string;
  country?: string; // ISO-2
  startDate: string; // YYYY-MM
  endDate?: string; // YYYY-MM
  isCurrent: boolean;
  hoursPerWeek?: number;
}

interface StructuredCVExperienceFormProps {
  onSave: (data: ExperienceFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<ExperienceFormData>;
}

const EMPLOYMENT_TYPES = [
  { value: "Internship", label: "Internship" },
  { value: "Part_time", label: "Part-time" },
  { value: "Voluntary", label: "Voluntary" },
  { value: "Project", label: "Project-based" },
  { value: "Freelance", label: "Freelance" },
];

const LOCATION_MODES = [
  { value: "On_site", label: "On-site" },
  { value: "Hybrid", label: "Hybrid" },
  { value: "Remote", label: "Remote" },
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
];

export function StructuredCVExperienceForm({
  onSave,
  onCancel,
  initialData,
}: StructuredCVExperienceFormProps) {
  const [formData, setFormData] = useState<ExperienceFormData>({
    organization: initialData?.organization || "",
    roleTitle: initialData?.roleTitle || "",
    employmentType: initialData?.employmentType || "",
    locationMode: initialData?.locationMode || "",
    city: initialData?.city || "",
    country: initialData?.country || "",
    startDate: initialData?.startDate || "",
    endDate: initialData?.endDate || "",
    isCurrent: initialData?.isCurrent || false,
    hoursPerWeek: initialData?.hoursPerWeek,
  });

  const [isSaving, setIsSaving] = useState(false);
  const isRemote = formData.locationMode === "Remote";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving experience:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.organization &&
      formData.roleTitle &&
      formData.employmentType &&
      formData.locationMode &&
      formData.startDate &&
      (isRemote || formData.country) // Country required unless Remote
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-bidaaya-dark rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="w-5 h-5 text-bidaaya-accent" />
        <h3 className="text-xl font-semibold text-bidaaya-light">Work Experience</h3>
      </div>

      {/* Organization */}
      <div className="space-y-2">
        <Label htmlFor="organization" className="text-bidaaya-light">
          Organization / Company <span className="text-red-400">*</span>
        </Label>
        <Input
          id="organization"
          value={formData.organization}
          onChange={(e) => setFormData((prev) => ({ ...prev, organization: e.target.value }))}
          placeholder="e.g., Goldman Sachs, Google"
          className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
          required
        />
      </div>

      {/* Role Title */}
      <div className="space-y-2">
        <Label htmlFor="roleTitle" className="text-bidaaya-light">
          Role / Job Title <span className="text-red-400">*</span>
        </Label>
        <Input
          id="roleTitle"
          value={formData.roleTitle}
          onChange={(e) => setFormData((prev) => ({ ...prev, roleTitle: e.target.value }))}
          placeholder="e.g., Software Engineering Intern"
          className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
          required
        />
      </div>

      {/* Employment Type & Location Mode */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employmentType" className="text-bidaaya-light">
            Employment Type <span className="text-red-400">*</span>
          </Label>
          <Select
            value={formData.employmentType}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, employmentType: value }))}
          >
            <SelectTrigger className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="locationMode" className="text-bidaaya-light">
            Location Mode <span className="text-red-400">*</span>
          </Label>
          <Select
            value={formData.locationMode}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, locationMode: value }))}
          >
            <SelectTrigger className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              {LOCATION_MODES.map((mode) => (
                <SelectItem key={mode.value} value={mode.value}>
                  {mode.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* City & Country (conditional) */}
      {!isRemote && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city" className="text-bidaaya-light flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              City
            </Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="e.g., Dubai"
              className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country" className="text-bidaaya-light">
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
        </div>
      )}

      {isRemote && (
        <p className="text-sm text-bidaaya-light/60">
          📍 Location not required for remote positions
        </p>
      )}

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
            End Date {formData.isCurrent && "(Current)"}
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

      {/* Currently Working */}
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
          I currently work here
        </Label>
      </div>

      {/* Hours per Week */}
      <div className="space-y-2">
        <Label htmlFor="hoursPerWeek" className="text-bidaaya-light flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Hours per Week (Optional)
        </Label>
        <Input
          id="hoursPerWeek"
          type="number"
          min="1"
          max="168"
          value={formData.hoursPerWeek || ""}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              hoursPerWeek: e.target.value ? parseInt(e.target.value) : undefined,
            }))
          }
          placeholder="e.g., 40"
          className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={!isFormValid() || isSaving}
          className="flex-1 bg-bidaaya-accent hover:bg-bidaaya-accent/90 text-white"
        >
          {isSaving ? "Saving..." : "Save Experience"}
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

