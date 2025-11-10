"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, MapPin, Globe, Linkedin, Github } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileFormData {
  name: string; // Full name (matching Phase I)
  dateOfBirth: string; // YYYY-MM-DD
  email: string;
  whatsapp: string; // Phone/WhatsApp (matching Phase I field name)
  location: string; // City, Country (matching Phase I)
  linkedinUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
}

interface StructuredCVProfileFormProps {
  onSave: (data: ProfileFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<ProfileFormData>;
}

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

export function StructuredCVProfileForm({
  onSave,
  onCancel,
  initialData,
}: StructuredCVProfileFormProps) {
  const [formData, setFormData] = useState<ProfileFormData>({
    name: initialData?.name || "",
    dateOfBirth: initialData?.dateOfBirth || "",
    email: initialData?.email || "",
    whatsapp: initialData?.whatsapp || "",
    location: initialData?.location || "",
    linkedinUrl: initialData?.linkedinUrl || "",
    portfolioUrl: initialData?.portfolioUrl || "",
    githubUrl: initialData?.githubUrl || "",
  });

  // Update form when initialData changes (when API data loads)
  useEffect(() => {
    if (initialData) {
      console.log("🔄 ProfileForm: Updating with initialData:", initialData);
      setFormData({
        name: initialData.name || "",
        dateOfBirth: initialData.dateOfBirth || "",
        email: initialData.email || "",
        whatsapp: initialData.whatsapp || "",
        location: initialData.location || "",
        linkedinUrl: initialData.linkedinUrl || "",
        portfolioUrl: initialData.portfolioUrl || "",
        githubUrl: initialData.githubUrl || "",
      });
    }
  }, [initialData]);

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // WhatsApp validation (E.164)
    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = "WhatsApp number is required";
    } else if (!formData.whatsapp.startsWith("+")) {
      newErrors.whatsapp = "WhatsApp must start with + (e.g., +971501234567)";
    }

    if (!formData.location.trim()) newErrors.location = "Location is required";

    // Date of birth validation
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    }

    // LinkedIn validation
    if (formData.linkedinUrl && formData.linkedinUrl.trim() && !formData.linkedinUrl.includes("linkedin.com")) {
      newErrors.linkedinUrl = "Must be a LinkedIn URL";
    }

    // GitHub validation
    if (formData.githubUrl && formData.githubUrl.trim() && !formData.githubUrl.includes("github.com")) {
      newErrors.githubUrl = "Must be a GitHub URL";
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
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-bidaaya-dark rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-bidaaya-accent" />
        <h3 className="text-xl font-semibold text-bidaaya-light">Identity & Contact</h3>
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-bidaaya-light">
          Full Name <span className="text-red-400">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Ahmed Mohammed Al Zarooni"
          className={cn(
            "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
            errors.name && "border-red-400"
          )}
          required
        />
        {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
        <p className="text-xs text-bidaaya-light/60">Enter your full name as it appears on official documents</p>
      </div>

      {/* Date of Birth */}
      <div className="space-y-2">
        <Label htmlFor="dateOfBirth" className="text-bidaaya-light">
          Date of Birth <span className="text-red-400">*</span>
        </Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
          className={cn(
            "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
            errors.dateOfBirth && "border-red-400"
          )}
          required
        />
        {errors.dateOfBirth && <p className="text-xs text-red-400">{errors.dateOfBirth}</p>}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-bidaaya-light flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Email <span className="text-red-400">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="john.doe@example.com"
          className={cn(
            "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
            errors.email && "border-red-400"
          )}
          required
        />
        {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
      </div>

      {/* WhatsApp */}
      <div className="space-y-2">
        <Label htmlFor="whatsapp" className="text-bidaaya-light flex items-center gap-2">
          <Phone className="w-4 h-4" />
          WhatsApp Number <span className="text-red-400">*</span>
        </Label>
        <Input
          id="whatsapp"
          type="tel"
          value={formData.whatsapp}
          onChange={(e) => setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))}
          placeholder="+971501234567"
          className={cn(
            "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
            errors.whatsapp && "border-red-400"
          )}
          required
        />
        <p className="text-xs text-bidaaya-light/60">Format: +[country code][number] (e.g., +971501234567)</p>
        {errors.whatsapp && <p className="text-xs text-red-400">{errors.whatsapp}</p>}
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location" className="text-bidaaya-light flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Location <span className="text-red-400">*</span>
        </Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
          placeholder="e.g., Dubai, UAE"
          className={cn(
            "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
            errors.location && "border-red-400"
          )}
          required
        />
        <p className="text-xs text-bidaaya-light/60">City and country (e.g., "Dubai, UAE" or "London, UK")</p>
        {errors.location && <p className="text-xs text-red-400">{errors.location}</p>}
      </div>

      {/* Optional URLs */}
      <div className="space-y-4 pt-4 border-t border-bidaaya-light/10">
        <h4 className="text-sm font-medium text-bidaaya-light/80">Optional Links</h4>
        
        {/* LinkedIn */}
        <div className="space-y-2">
          <Label htmlFor="linkedinUrl" className="text-bidaaya-light flex items-center gap-2">
            <Linkedin className="w-4 h-4" />
            LinkedIn URL
          </Label>
          <Input
            id="linkedinUrl"
            type="url"
            value={formData.linkedinUrl}
            onChange={(e) => setFormData((prev) => ({ ...prev, linkedinUrl: e.target.value }))}
            placeholder="https://linkedin.com/in/yourprofile"
            className={cn(
              "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
              errors.linkedinUrl && "border-red-400"
            )}
          />
          {errors.linkedinUrl && <p className="text-xs text-red-400">{errors.linkedinUrl}</p>}
        </div>

        {/* Portfolio */}
        <div className="space-y-2">
          <Label htmlFor="portfolioUrl" className="text-bidaaya-light flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Portfolio/Website URL
          </Label>
          <Input
            id="portfolioUrl"
            type="url"
            value={formData.portfolioUrl}
            onChange={(e) => setFormData((prev) => ({ ...prev, portfolioUrl: e.target.value }))}
            placeholder="https://yourportfolio.com"
            className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
          />
        </div>

        {/* GitHub */}
        <div className="space-y-2">
          <Label htmlFor="githubUrl" className="text-bidaaya-light flex items-center gap-2">
            <Github className="w-4 h-4" />
            GitHub URL
          </Label>
          <Input
            id="githubUrl"
            type="url"
            value={formData.githubUrl}
            onChange={(e) => setFormData((prev) => ({ ...prev, githubUrl: e.target.value }))}
            placeholder="https://github.com/yourusername"
            className={cn(
              "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
              errors.githubUrl && "border-red-400"
            )}
          />
          {errors.githubUrl && <p className="text-xs text-red-400">{errors.githubUrl}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSaving}
          className="flex-1 bg-bidaaya-accent hover:bg-bidaaya-accent/90 text-white"
        >
          {isSaving ? "Saving..." : "Save Profile"}
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

