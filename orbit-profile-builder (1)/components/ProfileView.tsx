
import React from 'react';
import { UserData } from '../types';
import { 
  MapPin, Mail, Phone, ExternalLink, Briefcase, GraduationCap, 
  Code, FolderGit2, Edit3, Github, Linkedin, Globe, Calendar
} from 'lucide-react';

interface ProfileViewProps {
  data: UserData;
  onEditSection: (stepIndex: number) => void;
  className?: string;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ data, onEditSection, className = '' }) => {
  const { profile, education, experience, projects, skills } = data;

  // Helper to determine primary role/title
  const currentRole = experience.find(e => e.isCurrent)?.jobTitle 
    || education.find(e => e.isCurrent)?.program 
    || (experience.length > 0 ? experience[0].jobTitle : null)
    || (education.length > 0 ? education[0].program : 'Student');

  const currentOrg = experience.find(e => e.isCurrent)?.company
    || education.find(e => e.isCurrent)?.institution
    || (experience.length > 0 ? experience[0].company : null)
    || (education.length > 0 ? education[0].institution : '');

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      
      {/* --- HEADER SECTION --- */}
      <div className="glass-panel rounded-[2.5rem] p-6 mb-4 relative overflow-hidden border-white/10 shadow-2xl group">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none -z-10" />
        
        <div className="flex justify-between items-start mb-4">
          <div>
             <h1 className="text-2xl font-bold text-white leading-tight tracking-tight">{profile.fullName || 'Your Name'}</h1>
             <p className="text-emerald-400 font-medium text-sm mt-1">{currentRole} {currentOrg && <span className="text-gray-400">at {currentOrg}</span>}</p>
          </div>
          <button 
            onClick={() => onEditSection(1)}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Edit3 className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="space-y-2.5 mb-6">
          <div className="flex items-center gap-2.5 text-gray-300 text-sm">
            <MapPin className="w-3.5 h-3.5 text-gray-500" />
            {profile.location || 'Location not set'}
          </div>
          <div className="flex items-center gap-2.5 text-gray-300 text-sm">
            <Mail className="w-3.5 h-3.5 text-gray-500" />
            {profile.email || 'Email not set'}
          </div>
          <div className="flex items-center gap-2.5 text-gray-300 text-sm">
            <Phone className="w-3.5 h-3.5 text-gray-500" />
            {profile.whatsapp || 'Phone not set'}
          </div>
        </div>

        {/* Social Links Row */}
        <div className="flex gap-3 pt-4 border-t border-white/5">
          {profile.linkedinUrl && (
            <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-xl text-blue-400 hover:bg-white/10 transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
          )}
          {profile.githubUrl && (
            <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-xl text-gray-300 hover:bg-white/10 transition-colors">
              <Github className="w-5 h-5" />
            </a>
          )}
          {profile.portfolioUrl && (
            <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-xl text-emerald-400 hover:bg-white/10 transition-colors">
              <Globe className="w-5 h-5" />
            </a>
          )}
          {!profile.linkedinUrl && !profile.githubUrl && !profile.portfolioUrl && (
             <span className="text-xs text-gray-500 py-2">No links added</span>
          )}
           <div className="flex-1" />
           <button onClick={() => onEditSection(2)} className="text-xs font-medium text-gray-500 hover:text-white transition-colors">Edit Links</button>
        </div>
      </div>

      {/* --- SKILLS SECTION --- */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 px-2">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Skills</h3>
          <button onClick={() => onEditSection(6)} className="text-xs text-emerald-500 hover:text-emerald-400 font-medium">Edit</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.length > 0 ? skills.map(skill => (
            <span key={skill.id} className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-200 font-medium shadow-sm">
              {skill.name}
            </span>
          )) : (
            <div className="w-full p-4 rounded-2xl border border-dashed border-white/10 text-center text-sm text-gray-500">
              No skills listed
            </div>
          )}
        </div>
      </div>

      {/* --- EXPERIENCE SECTION --- */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 px-2">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Experience</h3>
          <button onClick={() => onEditSection(4)} className="text-xs text-emerald-500 hover:text-emerald-400 font-medium">Edit</button>
        </div>
        <div className="space-y-3">
          {experience.length > 0 ? experience.map((exp, idx) => (
            <div key={exp.id} className="relative pl-4 border-l-2 border-white/10 pb-1 last:pb-0">
               <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-gray-600 ring-4 ring-black" />
               <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <h4 className="font-bold text-white text-base">{exp.jobTitle}</h4>
                  <p className="text-emerald-400 text-sm font-medium mb-1">{exp.company}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Calendar className="w-3 h-3" />
                    <span>{exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}</span>
                    <span>•</span>
                    <span>{exp.employmentType}</span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">{exp.description}</p>
               </div>
            </div>
          )) : (
            <div className="w-full p-6 rounded-2xl border border-dashed border-white/10 text-center text-sm text-gray-500">
              No experience added yet
            </div>
          )}
        </div>
      </div>

      {/* --- EDUCATION SECTION --- */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 px-2">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Education</h3>
          <button onClick={() => onEditSection(3)} className="text-xs text-emerald-500 hover:text-emerald-400 font-medium">Edit</button>
        </div>
        <div className="space-y-3">
          {education.length > 0 ? education.map(edu => (
            <div key={edu.id} className="glass-panel p-4 rounded-2xl flex items-start gap-4 border-white/5">
               <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400">
                  <GraduationCap className="w-5 h-5" />
               </div>
               <div>
                  <h4 className="font-bold text-white text-base">{edu.institution}</h4>
                  <p className="text-sm text-gray-300 mb-0.5">{edu.program}</p>
                  <p className="text-xs text-gray-500">{edu.startDate.split('-')[0]} — {edu.isCurrent ? 'Present' : (edu.endDate?.split('-')[0] || 'Now')}</p>
                  
                  {edu.courses.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {edu.courses.slice(0, 3).map(course => (
                        <span key={course} className="text-[10px] px-2 py-0.5 bg-white/5 rounded text-gray-400 border border-white/5">
                          {course}
                        </span>
                      ))}
                      {edu.courses.length > 3 && <span className="text-[10px] px-2 py-0.5 text-gray-500">+{edu.courses.length - 3} more</span>}
                    </div>
                  )}
               </div>
            </div>
          )) : (
            <div className="w-full p-6 rounded-2xl border border-dashed border-white/10 text-center text-sm text-gray-500">
              No education added yet
            </div>
          )}
        </div>
      </div>

       {/* --- PROJECTS SECTION --- */}
      <div className="mb-24">
        <div className="flex items-center justify-between mb-3 px-2">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Projects</h3>
          <button onClick={() => onEditSection(5)} className="text-xs text-emerald-500 hover:text-emerald-400 font-medium">Edit</button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {projects.length > 0 ? projects.map(proj => (
            <div key={proj.id} className="glass-panel p-4 rounded-2xl border-white/5 group hover:bg-white/10 transition-colors">
               <div className="flex justify-between items-start">
                 <div>
                    <h4 className="font-bold text-white text-base mb-1 flex items-center gap-2">
                      {proj.name}
                      {proj.link && <ExternalLink className="w-3 h-3 text-gray-500" />}
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {proj.skills.map(skill => (
                        <span key={skill} className="text-xs text-emerald-400/80">#{skill}</span>
                      ))}
                    </div>
                 </div>
                 <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <FolderGit2 className="w-4 h-4 text-gray-400" />
                 </div>
               </div>
            </div>
          )) : (
            <div className="w-full p-6 rounded-2xl border border-dashed border-white/10 text-center text-sm text-gray-500">
              No projects added yet
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
