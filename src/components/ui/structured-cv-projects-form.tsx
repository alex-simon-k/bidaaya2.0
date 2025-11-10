"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FolderKanban, Plus, X, Link as LinkIcon, Github } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectFormData {
  name: string; // Project name
  role?: string; // Your role in the project
  summary?: string; // Brief description
  techStack: string[]; // Technologies used (max 10)
  startDate?: string; // YYYY-MM format
  endDate?: string; // YYYY-MM format
  isCurrent: boolean; // Still working on it
  projectUrl?: string; // Live project URL
  githubUrl?: string; // GitHub repository
}

interface StructuredCVProjectsFormProps {
  onSave: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<ProjectFormData>;
}

export function StructuredCVProjectsForm({
  onSave,
  onCancel,
  initialData,
}: StructuredCVProjectsFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: initialData?.name || "",
    role: initialData?.role || "",
    summary: initialData?.summary || "",
    techStack: initialData?.techStack || [],
    startDate: initialData?.startDate || "",
    endDate: initialData?.endDate || "",
    isCurrent: initialData?.isCurrent || false,
    projectUrl: initialData?.projectUrl || "",
    githubUrl: initialData?.githubUrl || "",
  });

  const [newTech, setNewTech] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        role: initialData.role || "",
        summary: initialData.summary || "",
        techStack: initialData.techStack || [],
        startDate: initialData.startDate || "",
        endDate: initialData.endDate || "",
        isCurrent: initialData.isCurrent || false,
        projectUrl: initialData.projectUrl || "",
        githubUrl: initialData.githubUrl || "",
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Project name is required";
    
    if (formData.techStack.length === 0) {
      newErrors.techStack = "Add at least 1 technology used";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTech = () => {
    if (newTech.trim() && formData.techStack.length < 10) {
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
      await onSave(formData);
    } catch (error) {
      console.error("Error saving project:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-bidaaya-dark rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <FolderKanban className="w-5 h-5 text-bidaaya-accent" />
        <h3 className="text-xl font-semibold text-bidaaya-light">Add Project</h3>
      </div>

      {/* Project Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-bidaaya-light">
          Project Name <span className="text-red-400">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Bidaaya - Student Opportunity Platform"
          className={cn(
            "bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light",
            errors.name && "border-red-400"
          )}
          required
        />
        {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
      </div>

      {/* Your Role */}
      <div className="space-y-2">
        <Label htmlFor="role" className="text-bidaaya-light">
          Your Role
        </Label>
        <Input
          id="role"
          value={formData.role}
          onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
          placeholder="e.g., Co-Founder & Lead Developer"
          className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
        />
        <p className="text-xs text-bidaaya-light/60">What was your specific role or contribution?</p>
      </div>

      {/* Summary */}
      <div className="space-y-2">
        <Label htmlFor="summary" className="text-bidaaya-light">
          Project Description
        </Label>
        <Textarea
          id="summary"
          value={formData.summary}
          onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
          placeholder="Briefly describe what this project does and its impact (2-3 sentences)"
          rows={4}
          className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light resize-none"
        />
        <p className="text-xs text-bidaaya-light/60">
          Focus on the problem solved and the impact created
        </p>
      </div>

      {/* Tech Stack */}
      <div className="space-y-2">
        <Label className="text-bidaaya-light">
          Technologies Used <span className="text-red-400">*</span>
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
            placeholder="e.g., Next.js, Python, React"
            className="flex-1 bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
            disabled={formData.techStack.length >= 10}
          />
          <Button
            type="button"
            onClick={handleAddTech}
            disabled={!newTech.trim() || formData.techStack.length >= 10}
            className="bg-bidaaya-accent hover:bg-bidaaya-accent/90"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.techStack.map((tech, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-3 py-1 bg-bidaaya-accent/20 border border-bidaaya-accent/30 rounded-full text-sm text-bidaaya-light"
            >
              <span>{tech}</span>
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
        <p className="text-xs text-bidaaya-light/60">
          Add up to 10 technologies (languages, frameworks, tools)
        </p>
        {errors.techStack && <p className="text-xs text-red-400">{errors.techStack}</p>}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-bidaaya-light">
            Start Date
          </Label>
          <Input
            id="startDate"
            type="month"
            value={formData.startDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
            className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-bidaaya-light">
            End Date
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

      {/* Current Project Checkbox */}
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
          className="w-4 h-4 rounded border-bidaaya-light/20 bg-bidaaya-light/10 text-bidaaya-accent focus:ring-bidaaya-accent"
        />
        <Label htmlFor="isCurrent" className="text-bidaaya-light cursor-pointer">
          I'm currently working on this project
        </Label>
      </div>

      {/* URLs */}
      <div className="space-y-4 pt-4 border-t border-bidaaya-light/10">
        <h4 className="text-sm font-medium text-bidaaya-light/80">Project Links</h4>

        {/* Project URL */}
        <div className="space-y-2">
          <Label htmlFor="projectUrl" className="text-bidaaya-light flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            Live Project URL
          </Label>
          <Input
            id="projectUrl"
            type="url"
            value={formData.projectUrl}
            onChange={(e) => setFormData((prev) => ({ ...prev, projectUrl: e.target.value }))}
            placeholder="https://yourproject.com"
            className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
          />
        </div>

        {/* GitHub URL */}
        <div className="space-y-2">
          <Label htmlFor="githubUrl" className="text-bidaaya-light flex items-center gap-2">
            <Github className="w-4 h-4" />
            GitHub Repository
          </Label>
          <Input
            id="githubUrl"
            type="url"
            value={formData.githubUrl}
            onChange={(e) => setFormData((prev) => ({ ...prev, githubUrl: e.target.value }))}
            placeholder="https://github.com/yourusername/project"
            className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSaving}
          className="flex-1 bg-bidaaya-accent hover:bg-bidaaya-accent/90 text-white"
        >
          {isSaving ? "Saving..." : "Save Project"}
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
