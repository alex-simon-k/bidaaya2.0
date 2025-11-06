"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, MapPin, Globe, Linkedin, Github } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileFormData {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  country: string; // ISO-2
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
    firstName: initialData?.firstName || "",
    middleName: initialData?.middleName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    city: initialData?.city || "",
    country: initialData?.country || "",
    linkedinUrl: initialData?.linkedinUrl || "",
    portfolioUrl: initialData?.portfolioUrl || "",
    githubUrl: initialData?.githubUrl || "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Phone validation (E.164)
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    } else if (!formData.phone.startsWith("+")) {
      newErrors.phone = "Phone must start with + (e.g., +971501234567)";
    }

    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.country) newErrors.country = "Country is required";

    // LinkedIn validation
    if (formData.linkedinUrl && !formData.linkedinUrl.includes("linkedin.com")) {
      newErrors.linkedinUrl = "Must be a LinkedIn URL";
    }

    // GitHub validation
    if (formData.githubUrl && !formData.githubUrl.includes("github.com")) {
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

      {/* Name Fields */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-bidaaya-light">
            First Name <span className="text-red-400">*</span>
          </Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
            placeholder="John"
            className={cn(
              "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
              errors.firstName && "border-red-400"
            )}
            required
          />
          {errors.firstName && <p className="text-xs text-red-400">{errors.firstName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="middleName" className="text-bidaaya-light">
            Middle Name
          </Label>
          <Input
            id="middleName"
            value={formData.middleName}
            onChange={(e) => setFormData((prev) => ({ ...prev, middleName: e.target.value }))}
            placeholder="Optional"
            className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-bidaaya-light">
            Last Name <span className="text-red-400">*</span>
          </Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
            placeholder="Doe"
            className={cn(
              "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
              errors.lastName && "border-red-400"
            )}
            required
          />
          {errors.lastName && <p className="text-xs text-red-400">{errors.lastName}</p>}
        </div>
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

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-bidaaya-light flex items-center gap-2">
          <Phone className="w-4 h-4" />
          Phone (E.164 format) <span className="text-red-400">*</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
          placeholder="+971501234567"
          className={cn(
            "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
            errors.phone && "border-red-400"
          )}
          required
        />
        <p className="text-xs text-bidaaya-light/60">Format: +[country code][number]</p>
        {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
      </div>

      {/* Location */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city" className="text-bidaaya-light flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            City <span className="text-red-400">*</span>
          </Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
            placeholder="Dubai"
            className={cn(
              "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
              errors.city && "border-red-400"
            )}
            required
          />
          {errors.city && <p className="text-xs text-red-400">{errors.city}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="country" className="text-bidaaya-light flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Country <span className="text-red-400">*</span>
          </Label>
          <Select
            value={formData.country}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, country: value }))}
          >
            <SelectTrigger className={cn(
              "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
              errors.country && "border-red-400"
            )}>
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
          {errors.country && <p className="text-xs text-red-400">{errors.country}</p>}
        </div>
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

