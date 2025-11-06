"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FolderKanban, Calendar, Code, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectFormData {
  title: string;
  context: string; // Course, Personal, Competition, Research
  tools: string[]; // Tech stack
  startDate: string; // YYYY-MM
  endDate?: string; // YYYY-MM
  isOngoing: boolean;
}

interface StructuredCVProjectsFormProps {
  onSave: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<ProjectFormData>;
}

const PROJECT_CONTEXTS = [
  { value: "Course", label: "Course / Academic Project" },
  { value: "Personal", label: "Personal Project" },
  { value: "Competition", label: "Competition / Hackathon" },
  { value: "Research", label: "Research Project" },
];

export function StructuredCVProjectsForm({
  onSave,
  onCancel,
  initialData,
}: StructuredCVProjectsFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    title: initialData?.title || "",
    context: initialData?.context || "",
    tools: initialData?.tools || [],
    startDate: initialData?.startDate || "",
    endDate: initialData?.endDate || "",
    isOngoing: initialData?.isOngoing || false,
  });

  const [newTool, setNewTool] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const addTool = () => {
    if (!newTool.trim()) return;
    setFormData((prev) => ({
      ...prev,
      tools: [...prev.tools, newTool.trim()],
    }));
    setNewTool("");
  };

  const removeTool = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tools: prev.tools.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving project:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = () => {
    return formData.title && formData.context && formData.startDate;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-bidaaya-dark rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <FolderKanban className="w-5 h-5 text-bidaaya-accent" />
        <h3 className="text-xl font-semibold text-bidaaya-light">Project Details</h3>
      </div>

      {/* Project Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-bidaaya-light">
          Project Title <span className="text-red-400">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., E-commerce Platform, AI Chatbot"
          className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
          required
        />
      </div>

      {/* Context */}
      <div className="space-y-2">
        <Label htmlFor="context" className="text-bidaaya-light">
          Project Context <span className="text-red-400">*</span>
        </Label>
        <Select
          value={formData.context}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, context: value }))}
        >
          <SelectTrigger className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light">
            <SelectValue placeholder="Select context" />
          </SelectTrigger>
          <SelectContent>
            {PROJECT_CONTEXTS.map((ctx) => (
              <SelectItem key={ctx.value} value={ctx.value}>
                {ctx.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tools / Tech Stack */}
      <div className="space-y-2">
        <Label className="text-bidaaya-light flex items-center gap-2">
          <Code className="w-4 h-4" />
          Tools / Technologies
        </Label>
        <div className="flex gap-2">
          <Input
            value={newTool}
            onChange={(e) => setNewTool(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTool();
              }
            }}
            placeholder="e.g., React, Python, Figma (press Enter)"
            className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
          />
          <Button
            type="button"
            onClick={addTool}
            className="bg-bidaaya-accent hover:bg-bidaaya-accent/90"
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.tools.map((tool, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-3 py-1 bg-bidaaya-accent/20 rounded-full text-sm text-bidaaya-light"
            >
              {tool}
              <button
                type="button"
                onClick={() => removeTool(index)}
                className="ml-1 hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
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
            End Date {formData.isOngoing && "(Ongoing)"}
          </Label>
          <Input
            id="endDate"
            type="month"
            value={formData.endDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
            disabled={formData.isOngoing}
            className="bg-bidaaya-light/10 border-bidaaya-light/20 text-bidaaya-light"
          />
        </div>
      </div>

      {/* Ongoing */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isOngoing"
          checked={formData.isOngoing}
          onCheckedChange={(checked) => {
            setFormData((prev) => ({
              ...prev,
              isOngoing: checked as boolean,
              endDate: checked ? "" : prev.endDate,
            }));
          }}
        />
        <Label htmlFor="isOngoing" className="text-bidaaya-light cursor-pointer">
          This project is ongoing
        </Label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={!isFormValid() || isSaving}
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

