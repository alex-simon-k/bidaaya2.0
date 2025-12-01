export interface Profile {
  fullName: string;
  dob: string;
  email: string;
  whatsapp: string;
  location: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
}

export interface Education {
  id: string;
  level: string;
  program: string;
  institution: string;
  country: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  courses: string[];
}

export interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  employmentType: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  skills: string[];
  link?: string;
  githubUrl?: string;
}

export interface Skill {
  id: string;
  name: string;
  type: string;
  level?: string;
}

export interface UserData {
  profile: Profile;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: Skill[];
}

export type SectionType = 'profile' | 'education' | 'experience' | 'projects' | 'skills' | 'summary';

export const EDUCATION_LEVELS = [
  'High School',
  'Foundation Year',
  "Bachelor's Degree",
  "Master's Degree",
  'PhD'
];

export const COUNTRIES = [
  'UAE', 'Saudi Arabia', 'UK', 'USA', 'Canada', 'India', 'Egypt'
];

export const EMPLOYMENT_TYPES = [
  'Internship',
  'Full-time',
  'Part-time',
  'Contract',
  'Freelance',
  'Volunteer'
];

export const SKILL_TYPES = [
  'Technical',
  'Soft Skill',
  'Tool'
];

export const PROFICIENCY_LEVELS = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert'
];

