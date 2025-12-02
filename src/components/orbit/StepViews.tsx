import React, { useState } from 'react';
import { 
  Input, Select, Textarea, TagInput, Checkbox, ItemCard, SectionHeader 
} from './UI';
import { 
  UserData, Profile, Education, Experience, Project, Skill,
  EDUCATION_LEVELS, COUNTRIES, EMPLOYMENT_TYPES, SKILL_TYPES, PROFICIENCY_LEVELS 
} from './orbit-types';
import { Plus, Trash2, ArrowRight, Loader2 } from 'lucide-react';

// --- PERSONAL STEP ---
export const PersonalStep: React.FC<{ data: Profile; update: (d: Profile) => void; errors: any }> = ({ data, update, errors }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    update({ ...data, [e.target.name]: e.target.value });
  };

  return (
    <div className="animate-fade-in pb-32">
      <SectionHeader title="Your Details" description="Let's start with the basics." />
      
      <Input label="Full Name" name="fullName" value={data.fullName || ''} onChange={handleChange} placeholder="e.g. Ahmed Al Zarooni" required error={errors.fullName} />
      <Input label="Location" name="location" value={data.location || ''} onChange={handleChange} placeholder="City, Country" required error={errors.location} />
      
      <Input label="Date of Birth" name="dob" type="date" value={data.dob || ''} onChange={handleChange} required error={errors.dob} />

      <div className="h-px bg-white/10 my-6"></div>
      <h3 className="text-sm font-semibold mb-4 text-white uppercase tracking-wider">Contact</h3>

      <Input label="Email" name="email" type="email" value={data.email || ''} onChange={handleChange} placeholder="john@example.com" required error={errors.email} />
      <Input label="WhatsApp Number" name="whatsapp" type="tel" value={data.whatsapp || ''} onChange={handleChange} placeholder="+971 50 123 4567" required error={errors.whatsapp} />
    </div>
  );
};

// --- LINKS STEP ---
export const LinksStep: React.FC<{ data: Profile; update: (d: Profile) => void; errors: any }> = ({ data, update, errors }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    update({ ...data, [e.target.name]: e.target.value });
  };

  return (
    <div className="animate-fade-in pb-10">
      <SectionHeader title="Online Presence" description="Where can we find your work?" />
      
      <Input label="LinkedIn" name="linkedinUrl" value={data.linkedinUrl || ''} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
      <Input label="Portfolio" name="portfolioUrl" value={data.portfolioUrl || ''} onChange={handleChange} placeholder="https://yourportfolio.com" />
      <Input label="GitHub" name="githubUrl" value={data.githubUrl || ''} onChange={handleChange} placeholder="https://github.com/username" error={errors.githubUrl} />
    </div>
  );
};

// --- EDUCATION STEP ---
export const EducationStep: React.FC<{ 
  data: Education[]; 
  update: (d: Education[]) => void;
  onAdd?: (item: Education) => Promise<Education>;
  onUpdate?: (id: string, item: Education) => Promise<Education>;
  onDelete?: (id: string) => Promise<void>;
}> = ({ data, update, onAdd, onUpdate, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [current, setCurrent] = useState<Education>({
    id: crypto.randomUUID(),
    level: '', program: '', institution: '', country: '', startDate: '', isCurrent: false, courses: []
  });

  const handleEdit = (edu: Education) => {
    setCurrent(edu);
    setIsEditing(edu.id);
    setIsAdding(false);
  };

  const handleSave = async () => {
    // Validation with user-friendly alerts
    if (!current.level) {
      alert('Please select an education level');
      return;
    }
    if (!current.program) {
      alert('Please enter your program/degree name');
      return;
    }
    if (!current.institution) {
      alert('Please enter your institution name');
      return;
    }
    if (!current.country) {
      alert('Please select a country');
      return;
    }
    if (!current.startDate) {
      alert('Please select a start date');
      return;
    }
    if (current.courses.length < 3) {
      alert('Please add at least 3 relevant modules/courses. This helps us match you to opportunities.');
      return;
    }
    
    setIsSaving(true);
    try {
      if (isEditing) {
        // Update existing education
        if (onUpdate) {
          const updatedItem = await onUpdate(isEditing, current);
          const updatedData = data.map(edu => edu.id === isEditing ? updatedItem : edu);
          update(updatedData);
        } else {
          const updatedData = data.map(edu => edu.id === isEditing ? current : edu);
          update(updatedData);
        }
        setIsEditing(null);
      } else {
        // Add new education
        if (onAdd) {
          const savedItem = await onAdd(current);
          update([...data, savedItem]);
        } else {
          update([...data, current]);
        }
      }
      
      setCurrent({ id: crypto.randomUUID(), level: '', program: '', institution: '', country: '', startDate: '', isCurrent: false, courses: [] });
      setIsAdding(false);
    } catch (error: any) {
      console.error("Failed to save education", error);
      // Show the backend error message to the user
      const errorMsg = error?.message || 'Failed to save education. Please check all required fields.';
      alert(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setCurrent({ id: crypto.randomUUID(), level: '', program: '', institution: '', country: '', startDate: '', isCurrent: false, courses: [] });
    setIsAdding(false);
    setIsEditing(null);
  };

  const handleRemove = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        if (onDelete) {
          await onDelete(id);
        }
        update(data.filter(i => i.id !== id));
      } catch (error) {
        console.error("Failed to delete education", error);
      }
    }
  };

  if (isAdding || isEditing) {
    return (
      <div className="animate-fade-in pb-32">
        <h2 className="text-2xl font-bold mb-5">{isEditing ? 'Edit Education' : 'Add Education'}</h2>
        <div className="space-y-1">
          <Select label="Level" value={current.level} onChange={e => setCurrent({...current, level: e.target.value})} options={EDUCATION_LEVELS} required />
          <Input label="Program / Degree" value={current.program} onChange={e => setCurrent({...current, program: e.target.value})} placeholder="e.g. BSc Computer Science" required />
          <Input label="Institution" value={current.institution} onChange={e => setCurrent({...current, institution: e.target.value})} placeholder="e.g. University of Dubai" required />
          <Select label="Country" value={current.country} onChange={e => setCurrent({...current, country: e.target.value})} options={COUNTRIES} required />
          
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start" type="month" value={current.startDate} onChange={e => setCurrent({...current, startDate: e.target.value})} required />
            {!current.isCurrent && (
              <Input label="End" type="month" value={current.endDate || ''} onChange={e => setCurrent({...current, endDate: e.target.value})} />
            )}
          </div>
          <Checkbox label="Currently studying here" checked={current.isCurrent} onChange={c => setCurrent({...current, isCurrent: c})} />
          
          <TagInput 
            label={`Relevant Modules (${current.courses.length}/3 minimum required)`}
            tags={current.courses} 
            onAddTag={t => setCurrent({...current, courses: [...current.courses, t]})}
            onRemoveTag={t => setCurrent({...current, courses: current.courses.filter(x => x !== t)})}
            minTags={3} maxTags={6} placeholder="e.g. Financial Accounting, Data Analysis, Marketing..." required
          />
          
          <div className="flex gap-3 mt-6">
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex-1 bg-white text-black font-bold py-3.5 rounded-2xl hover:bg-gray-200 transition-colors shadow-lg shadow-white/10 flex justify-center items-center gap-2"
            >
              {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : 'Save'}
            </button>
            <button onClick={handleCancel} className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-10">
      <SectionHeader title="Education" description="Your academic background." />
      
      {/* Minimum Requirement Indicator */}
      {data.length === 0 && (
        <div className="mb-6 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 text-lg">✗</span>
            <p className="text-xs text-blue-300">
              Add at least 1 Education <strong>OR</strong> Experience entry to complete your profile
            </p>
          </div>
        </div>
      )}
      {data.length > 0 && (
        <div className="mb-6 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-lg">✓</span>
            <p className="text-xs text-green-300">
              Education requirement met ({data.length} entr{data.length !== 1 ? 'ies' : 'y'} added)
            </p>
          </div>
        </div>
      )}
      
      {data.length > 0 && (
        <div className="space-y-3 mb-6">
          <p className="text-sm text-gray-400 mb-4 px-1">Your education entries ({data.length})</p>
          {data.map(edu => {
            const displayProgram = edu.program || 'Program not specified';
            const displayInstitution = edu.institution || 'Institution not specified';
            const displayLevel = edu.level || '';
            const subtitle = displayLevel 
              ? `${displayInstitution} • ${displayLevel}` 
              : displayInstitution;
            
            return (
              <ItemCard 
                key={edu.id} 
                title={displayProgram}
                subtitle={subtitle}
                onDelete={() => handleRemove(edu.id)}
                onClick={() => handleEdit(edu)}
              />
            );
          })}
        </div>
      )}
      
      <button 
        onClick={() => setIsAdding(true)} 
        className="w-full py-4 border border-dashed border-white/20 rounded-2xl text-gray-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all flex items-center justify-center gap-3 active:scale-95"
      >
        <Plus className="w-5 h-5" /> 
        <span className="font-medium text-base">{data.length > 0 ? 'Add Another Education' : 'Add Education'}</span>
      </button>
    </div>
  );
};

// --- EXPERIENCE STEP ---
export const ExperienceStep: React.FC<{ 
  data: Experience[]; 
  update: (d: Experience[]) => void;
  onAdd?: (item: Experience) => Promise<Experience>;
  onDelete?: (id: string) => Promise<void>;
}> = ({ data, update, onAdd, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [current, setCurrent] = useState<Experience>({
    id: crypto.randomUUID(),
    jobTitle: '', company: '', employmentType: '', startDate: '', isCurrent: false, description: ''
  });

  const handleSave = async () => {
    // Validation
    if (!current.jobTitle) {
      alert('Please enter your job title');
      return;
    }
    if (!current.company) {
      alert('Please enter the company name');
      return;
    }
    if (!current.employmentType) {
      alert('Please select an employment type');
      return;
    }
    if (!current.startDate) {
      alert('Please select a start date');
      return;
    }
    if (!current.description) {
      alert('Please add a brief description of your role');
      return;
    }
    
    setIsSaving(true);
    try {
      if (onAdd) {
        const savedItem = await onAdd(current);
        update([...data, savedItem]);
      } else {
        update([...data, current]);
      }
      
      setCurrent({ id: crypto.randomUUID(), jobTitle: '', company: '', employmentType: '', startDate: '', isCurrent: false, description: '' });
      setIsAdding(false);
    } catch (error: any) {
      console.error("Failed to save experience", error);
      alert(error?.message || 'Failed to save experience. Please check all required fields.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        if (onDelete) {
          await onDelete(id);
        }
        update(data.filter(i => i.id !== id));
      } catch (error) {
        console.error("Failed to delete experience", error);
      }
    }
  };

  if (isAdding) {
    return (
      <div className="animate-fade-in pb-20">
        <h2 className="text-2xl font-bold mb-5">Add Experience</h2>
        <div className="space-y-1">
          <Input label="Job Title" value={current.jobTitle} onChange={e => setCurrent({...current, jobTitle: e.target.value})} placeholder="e.g. Intern" required />
          <Input label="Company" value={current.company} onChange={e => setCurrent({...current, company: e.target.value})} placeholder="e.g. Google" required />
          <Select label="Type" value={current.employmentType} onChange={e => setCurrent({...current, employmentType: e.target.value})} options={EMPLOYMENT_TYPES} required />
          
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start" type="date" value={current.startDate} onChange={e => setCurrent({...current, startDate: e.target.value})} required />
            {!current.isCurrent && (
              <Input label="End" type="date" value={current.endDate || ''} onChange={e => setCurrent({...current, endDate: e.target.value})} />
            )}
          </div>
          <Checkbox label="Currently working here" checked={current.isCurrent} onChange={c => setCurrent({...current, isCurrent: c})} />
          
          <Textarea 
            label="Role Description" 
            value={current.description} 
            onChange={e => setCurrent({...current, description: e.target.value})}
            placeholder="What did you achieve?"
            required
          />
          
          <div className="flex gap-3 mt-6">
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex-1 bg-white text-black font-bold py-3.5 rounded-2xl hover:bg-gray-200 transition-colors shadow-lg shadow-white/10 flex justify-center items-center gap-2"
            >
              {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : 'Save'}
            </button>
            <button onClick={() => setIsAdding(false)} className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-10">
      <SectionHeader title="Experience" description="Internships & jobs." />
      
      {/* Minimum Requirement Indicator */}
      {data.length === 0 && (
        <div className="mb-6 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 text-lg">✗</span>
            <p className="text-xs text-blue-300">
              Add at least 1 Education <strong>OR</strong> Experience entry to complete your profile
            </p>
          </div>
        </div>
      )}
      {data.length > 0 && (
        <div className="mb-6 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-lg">✓</span>
            <p className="text-xs text-green-300">
              Experience requirement met ({data.length} entr{data.length !== 1 ? 'ies' : 'y'} added)
            </p>
          </div>
        </div>
      )}
      
      {data.length > 0 ? (
        <div className="space-y-3 mb-8">
          {data.map(exp => (
            <ItemCard 
              key={exp.id} 
              title={exp.jobTitle || 'Untitled Role'} 
              subtitle={`${exp.company || 'undefined'} • ${exp.employmentType || 'undefined'}`} 
              onDelete={() => handleRemove(exp.id)} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-white/5 rounded-3xl mb-6 border border-white/5 mx-2">
          <p className="text-sm">No experience added yet.</p>
        </div>
      )}
      <button onClick={() => setIsAdding(true)} className="w-full py-4 border border-dashed border-white/20 rounded-2xl text-gray-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all flex items-center justify-center gap-3 active:scale-95">
        <Plus className="w-5 h-5" /> <span className="font-medium text-base">Add Experience</span>
      </button>
    </div>
  );
};

// --- PROJECTS STEP ---
export const ProjectsStep: React.FC<{ 
  data: Project[]; 
  update: (d: Project[]) => void;
  onAdd?: (item: Project) => Promise<Project>;
  onDelete?: (id: string) => Promise<void>;
}> = ({ data, update, onAdd, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [current, setCurrent] = useState<Project>({
    id: crypto.randomUUID(), name: '', skills: []
  });

  const handleSave = async () => {
    // Validation
    if (!current.name) {
      alert('Please enter your project name');
      return;
    }
    if (current.skills.length === 0) {
      alert('Please add at least 1 tool/skill used in this project');
      return;
    }
    
    setIsSaving(true);
    try {
      if (onAdd) {
        const savedItem = await onAdd(current);
        update([...data, savedItem]);
      } else {
        update([...data, current]);
      }
      
      setCurrent({ id: crypto.randomUUID(), name: '', skills: [] });
      setIsAdding(false);
    } catch (error: any) {
      console.error("Failed to save project", error);
      alert(error?.message || 'Failed to save project. Please check all required fields.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        if (onDelete) {
          await onDelete(id);
        }
        update(data.filter(i => i.id !== id));
      } catch (error) {
        console.error("Failed to delete project", error);
      }
    }
  };

  if (isAdding) {
    return (
      <div className="animate-fade-in pb-20">
        <h2 className="text-2xl font-bold mb-5">Add Project</h2>
        <div className="glass-panel p-5 rounded-3xl mb-6 border-white/10">
          <Input label="Project Name" value={current.name} onChange={e => setCurrent({...current, name: e.target.value})} placeholder="e.g. Finance App" required />
          <TagInput 
            label="Tools Used" 
            tags={current.skills} 
            onAddTag={t => setCurrent({...current, skills: [...current.skills, t]})}
            onRemoveTag={t => setCurrent({...current, skills: current.skills.filter(x => x !== t)})}
            minTags={1} maxTags={6} placeholder="Add tool..." required
          />
          <Input label="Project Link" value={current.link || ''} onChange={e => setCurrent({...current, link: e.target.value})} placeholder="https://..." />
          <Input label="GitHub URL" value={current.githubUrl || ''} onChange={e => setCurrent({...current, githubUrl: e.target.value})} placeholder="https://..." />
          
          <div className="flex gap-3 mt-6">
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex-1 bg-white text-black font-bold py-3.5 rounded-2xl hover:bg-gray-200 transition-colors flex justify-center items-center gap-2"
            >
              {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : 'Save'}
            </button>
            <button onClick={() => setIsAdding(false)} className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-10">
      <SectionHeader title="Projects" description="Showcase your best work." />
      
      {/* Optional Indicator */}
      <div className="mb-6 p-3 rounded-xl bg-gray-500/10 border border-gray-500/20">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-lg">○</span>
          <p className="text-xs text-gray-300">
            <strong>Optional:</strong> Projects help you stand out
          </p>
        </div>
      </div>
      
      <div className="space-y-3 mb-8">
        {data.map(proj => (
          <ItemCard 
            key={proj.id} 
            title={proj.name || 'Untitled Project'} 
            subtitle={`${proj.skills.join(', ')}`} 
            onDelete={() => handleRemove(proj.id)} 
          />
        ))}
      </div>
      <button onClick={() => setIsAdding(true)} className="w-full py-4 border border-dashed border-white/20 rounded-2xl text-gray-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all flex items-center justify-center gap-3 active:scale-95">
        <Plus className="w-5 h-5" /> <span className="font-medium text-base">Add Project</span>
      </button>
    </div>
  );
};

// --- SKILLS STEP ---
export const SkillsStep: React.FC<{ 
  data: Skill[]; 
  update: (d: Skill[]) => void;
  onAdd?: (item: Skill) => Promise<Skill>;
  onDelete?: (id: string) => Promise<void>;
}> = ({ data, update, onAdd, onDelete }) => {
  const [current, setCurrent] = useState<Skill>({
    id: crypto.randomUUID(), name: '', type: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    // Validation with user feedback
    if (!current.name) {
      alert('Please enter a skill name');
      return;
    }
    if (!current.type) {
      alert('Please select a skill type');
      return;
    }
    
    setIsSaving(true);
    try {
      if (onAdd) {
        const savedItem = await onAdd(current);
        update([...data, savedItem]);
      } else {
        update([...data, current]);
      }
      setCurrent({ id: crypto.randomUUID(), name: '', type: '' });
    } catch (error: any) {
      console.error("Failed to save skill", error);
      const errorMessage = error?.message || error?.error || 'Failed to save skill. Please check all required fields.';
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (confirm('Are you sure you want to delete this skill?')) {
      try {
        if (onDelete) {
          await onDelete(id);
        }
        update(data.filter(i => i.id !== id));
      } catch (error) {
        console.error("Failed to delete skill", error);
      }
    }
  };

  return (
    <div className="animate-fade-in pb-10">
      <SectionHeader title="Skills" description="What are your top strengths?" />
      
      {/* Minimum Requirement Indicator */}
      {data.length === 0 && (
        <div className="mb-6 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-lg">✗</span>
            <p className="text-xs text-yellow-300">
              Add at least 1 Skill <strong>(Required to apply to opportunities)</strong>
            </p>
          </div>
        </div>
      )}
      {data.length > 0 && (
        <div className="mb-6 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-lg">✓</span>
            <p className="text-xs text-green-300">
              Skills requirement met ({data.length} skill{data.length !== 1 ? 's' : ''} added)
            </p>
          </div>
        </div>
      )}
      
      <div className="glass-panel p-5 rounded-3xl mb-8 bg-white/5">
        <div className="space-y-1">
           <Input label="Skill Name" value={current.name} onChange={e => setCurrent({...current, name: e.target.value})} placeholder="e.g. Leadership" className="mb-4" />
           <div className="grid grid-cols-2 gap-4 mb-4">
              <Select label="Type" value={current.type} onChange={e => setCurrent({...current, type: e.target.value})} options={SKILL_TYPES} className="mb-0" />
              <Select label="Level" value={current.level || ''} onChange={e => setCurrent({...current, level: e.target.value})} options={PROFICIENCY_LEVELS} className="mb-0" />
           </div>
           
           <button 
            onClick={handleAdd} 
            disabled={isSaving}
            className="w-full bg-white text-black font-bold py-3.5 rounded-2xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mt-2"
           >
            {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <><Plus className="w-5 h-5" /> Add Skill</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {data.map(skill => (
           <div key={skill.id} className="bg-white/5 rounded-2xl p-4 border border-white/10 flex justify-between items-center group">
              <div>
                <div className="text-white font-medium text-base">{skill.name}</div>
                <div className="text-xs text-blue-400 uppercase tracking-wider mt-1">{skill.type} • {skill.level || 'Unspecified'}</div>
              </div>
              <button onClick={() => handleRemove(skill.id)} className="text-gray-500 hover:text-red-400 p-2">
                <Trash2 className="w-5 h-5" />
              </button>
           </div>
        ))}
      </div>
    </div>
  );
};

