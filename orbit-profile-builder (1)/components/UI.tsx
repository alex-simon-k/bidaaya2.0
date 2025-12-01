import React from 'react';
import { ChevronRight, X, Plus, Calendar, Check } from 'lucide-react';

// --- Input Field ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => (
  <div className="mb-5">
    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider pl-1">
      {label} {props.required && <span className="text-emerald-500">*</span>}
    </label>
    <input
      className={`glass-input w-full rounded-2xl px-4 py-3.5 text-base transition-all placeholder:text-gray-600 ${
        error ? 'border-red-500/50 focus:border-red-500' : ''
      } ${className}`}
      {...props}
    />
    {error && <p className="mt-1.5 text-xs text-red-400 pl-1 font-medium">{error}</p>}
  </div>
);

// --- Textarea ---
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, className = '', ...props }) => (
  <div className="mb-5">
    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider pl-1">
      {label} {props.required && <span className="text-emerald-500">*</span>}
    </label>
    <textarea
      className={`glass-input w-full rounded-2xl px-4 py-3.5 text-base transition-all placeholder:text-gray-600 min-h-[120px] resize-none ${
        error ? 'border-red-500/50 focus:border-red-500' : ''
      } ${className}`}
      {...props}
    />
    {error && <p className="mt-1.5 text-xs text-red-400 pl-1 font-medium">{error}</p>}
  </div>
);

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, options, error, className = '', ...props }) => (
  <div className="mb-5">
    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider pl-1">
      {label} {props.required && <span className="text-emerald-500">*</span>}
    </label>
    <div className="relative">
      <select
        className={`glass-input w-full rounded-2xl px-4 py-3.5 text-base transition-all appearance-none cursor-pointer bg-black/80 ${
          error ? 'border-red-500/50 focus:border-red-500' : ''
        } ${className}`}
        {...props}
      >
        <option value="" disabled>Select an option</option>
        {options.map(opt => (
          <option key={opt} value={opt} className="bg-gray-900 text-white py-2">{opt}</option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
        <ChevronRight className="w-5 h-5 rotate-90" />
      </div>
    </div>
    {error && <p className="mt-1.5 text-xs text-red-400 pl-1 font-medium">{error}</p>}
  </div>
);

// --- Tag Input ---
interface TagInputProps {
  label: string;
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  placeholder?: string;
  minTags?: number;
  maxTags?: number;
  error?: string;
  required?: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({ 
  label, tags, onAddTag, onRemoveTag, placeholder, minTags, maxTags, error, required 
}) => {
  const [input, setInput] = React.useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      if (maxTags && tags.length >= maxTags) return;
      onAddTag(trimmed);
      setInput('');
    }
  };

  return (
    <div className="mb-5">
       <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider pl-1">
        {label} {required && <span className="text-emerald-500">*</span>}
        {minTags && <span className="normal-case font-normal text-gray-600 ml-2">(Min: {minTags})</span>}
      </label>
      <div className={`glass-input w-full rounded-2xl px-3 py-3 min-h-[56px] flex flex-wrap gap-2 items-center ${
         error ? 'border-red-500/50' : ''
      }`}>
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1.5 bg-white/10 text-white text-sm px-3 py-1.5 rounded-xl border border-white/5 animate-scale-in">
            {tag}
            <button 
              type="button"
              onClick={() => onRemoveTag(tag)}
              className="hover:text-red-400 transition-colors p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="bg-transparent border-none outline-none text-base text-white placeholder:text-gray-600 flex-grow min-w-[120px] px-2 py-1"
          disabled={maxTags ? tags.length >= maxTags : false}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400 pl-1 font-medium">{error}</p>}
    </div>
  );
};

// --- Checkbox ---
interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-4 cursor-pointer group mb-6 p-1">
    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
      checked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600 group-hover:border-gray-500 bg-white/5'
    }`}>
      {checked && <Check className="w-4 h-4 text-white" />}
    </div>
    <span className="text-sm text-gray-300 group-hover:text-white transition-colors select-none">{label}</span>
    <input type="checkbox" className="hidden" checked={checked} onChange={(e) => onChange(e.target.checked)} />
  </label>
);

// --- Card for lists ---
export const ItemCard = ({ title, subtitle, onDelete, onClick }: { title: string, subtitle: string, onDelete: () => void, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className="group relative bg-white/5 border border-white/10 rounded-2xl p-4 mb-3 hover:bg-white/10 transition-all cursor-pointer active:scale-[0.99]"
  >
    <div className="flex justify-between items-start">
      <div className="pr-8">
        <h4 className="text-white font-medium text-base mb-1 truncate">{title}</h4>
        <p className="text-gray-400 text-sm leading-snug truncate">{subtitle}</p>
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-4 right-4 text-gray-500 hover:text-red-400 p-1.5 rounded-full hover:bg-white/10 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  </div>
);

// --- Section Header ---
export const SectionHeader = ({ title, description }: { title: string, description: string }) => (
  <div className="mb-6 px-1">
    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">{title}</h2>
    <p className="text-gray-400 text-base leading-relaxed">{description}</p>
  </div>
);