"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderKanban, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectFormData {
  name: string;
  techStack: string[];
  projectUrl?: string;
  githubUrl?: string;
}

interface StructuredCVProjectsFormProps {
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function StructuredCVProjectsForm({
  onSave,
  onCancel,
}: StructuredCVProjectsFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    techStack: [],
    projectUrl: "",
    githubUrl: "",
  });

  const [newTech, setNewTech] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Project name required";
    if (formData.techStack.length === 0) newErrors.techStack = "Add at least 1 tech";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTech = () => {
    if (newTech.trim() && formData.techStack.length < 6) {
      setFormData((prev) => ({
        ...prev,
        techStack: [...prev.techStack, newTech.trim()],
      }));
      setNewTech("");
      setErrors((prev) => ({ ...prev, techStack: "" }));
    }
  };

  const handleRemoveTech = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      techStack: prev.techStack.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);
    try {
      // Map to API format
      await onSave({
        name: formData.name,
        techStack: formData.techStack,
        projectUrl: formData.projectUrl || null,
        githubUrl: formData.githubUrl || null,
        role: null,
        summary: null,
        startDate: null,
        endDate: null,
        isCurrent: false,
      });
    } catch (error) {
      console.error("Error saving project:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-bidaaya-dark rounded-lg flex flex-col max-h-[75vh]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 sm:px-4 sm:pt-4">
        <FolderKanban className="w-4 h-4 text-bidaaya-accent" />
        <h3 className="text-base sm:text-lg font-semibold text-bidaaya-light">Add Project</h3>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 space-y-3 pb-3">

      {/* Project Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-bidaaya-light text-sm">
          Project Name <span className="text-red-400">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Bidaaya Platform"
          className={cn(
            "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
            errors.name && "border-red-400"
          )}
          required
        />
        {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
      </div>

      {/* Tech Stack */}
      <div className="space-y-2">
        <Label className="text-bidaaya-light text-sm">
          Technologies <span className="text-red-400">*</span> <span className="text-bidaaya-light/60">(max 6)</span>
        </Label>
        <div className="flex gap-2">
          <Input
            value={newTech}
            onChange={(e) => setNewTech(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTech();
              }
            }}
            placeholder="Add tech"
            className="flex-1 bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light text-sm"
            disabled={formData.techStack.length >= 6}
          />
          <Button
            type="button"
            onClick={handleAddTech}
            disabled={!newTech.trim() || formData.techStack.length >= 6}
            className="bg-bidaaya-accent hover:bg-bidaaya-accent/90 px-3"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {formData.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {formData.techStack.map((tech, index) => (
              <div
                key={index}
                className="flex items-center gap-1 px-2 py-1 bg-bidaaya-accent/20 rounded-full text-xs text-bidaaya-light"
              >
                {tech}
                <button
                  type="button"
                  onClick={() => handleRemoveTech(index)}
                  className="hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {errors.techStack && <p className="text-xs text-red-400">{errors.techStack}</p>}
      </div>

      {/* Links (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="projectUrl" className="text-bidaaya-light text-sm">
          Project Link (optional)
        </Label>
        <Input
          id="projectUrl"
          type="url"
          value={formData.projectUrl}
          onChange={(e) => setFormData((prev) => ({ ...prev, projectUrl: e.target.value }))}
          placeholder="https://..."
          className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="githubUrl" className="text-bidaaya-light text-sm">
          GitHub (optional)
        </Label>
        <Input
          id="githubUrl"
          type="url"
          value={formData.githubUrl}
          onChange={(e) => setFormData((prev) => ({ ...prev, githubUrl: e.target.value }))}
          placeholder="https://github.com/..."
          className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light text-sm"
        />
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
