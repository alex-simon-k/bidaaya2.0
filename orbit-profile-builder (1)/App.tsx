
import React from 'react';
import { UserData } from './types';
import { ProfileView } from './components/ProfileView';

// Rich Mock Data for Preview
const TEST_DATA: UserData = {
  profile: { 
    fullName: 'Ahmed Mohammed Al Zarooni', 
    dob: '2000-05-15', 
    email: 'ahmed.zarooni@example.com', 
    whatsapp: '+971 50 123 4567', 
    location: 'Dubai, UAE',
    linkedinUrl: 'https://linkedin.com/in/ahmed',
    portfolioUrl: 'https://ahmed.dev',
    githubUrl: 'https://github.com/ahmed'
  },
  education: [
    {
        id: '1',
        level: "Bachelor's Degree",
        program: 'BSc Computer Science',
        institution: 'University of Dubai',
        country: 'UAE',
        startDate: '2019-09',
        endDate: '2023-06',
        isCurrent: false,
        courses: ['Algorithms', 'Data Structures', 'AI Fundamentals', 'Cloud Computing']
    },
    {
        id: '2',
        level: "High School",
        program: 'Science Stream',
        institution: 'Al Mawakeb School',
        country: 'UAE',
        startDate: '2015-09',
        endDate: '2019-06',
        isCurrent: false,
        courses: []
    }
  ],
  experience: [
    {
        id: '1',
        jobTitle: 'Software Engineer Intern',
        company: 'Careem',
        employmentType: 'Internship',
        startDate: '2023-06-01',
        endDate: '2023-08-31',
        isCurrent: false,
        description: 'Developed new features for the super-app using React Native. Collaborated with the backend team to optimize API latency by 15%. Participated in daily standups and agile sprint planning.'
    }
  ],
  projects: [
    {
        id: '1',
        name: 'Orbit AI Profile Builder',
        skills: ['React', 'TypeScript', 'Tailwind', 'Figma'],
        link: 'https://orbit.ai',
        githubUrl: 'https://github.com/orbit/profile'
    },
    {
        id: '2',
        name: 'Smart Home Dashboard',
        skills: ['IoT', 'Python', 'Raspberry Pi'],
        githubUrl: 'https://github.com/ahmed/smart-home'
    }
  ],
  skills: [
    { id: '1', name: 'React', type: 'Technical' },
    { id: '2', name: 'TypeScript', type: 'Technical' },
    { id: '3', name: 'Node.js', type: 'Technical' },
    { id: '4', name: 'UI/UX Design', type: 'Soft Skill' },
    { id: '5', name: 'Public Speaking', type: 'Soft Skill' }
  ]
};

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white flex justify-center selection:bg-emerald-500/30">
      
      {/* Background Ambience */}
      <div className="fixed top-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-purple-900/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-20%] w-[80vw] h-[80vw] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md px-5 py-10 relative z-10 flex flex-col">
        
        {/* Header (Optional) */}
        <div className="text-center mb-8">
            <h2 className="text-sm font-semibold text-emerald-500 uppercase tracking-widest mb-2">Preview Mode</h2>
            <p className="text-gray-500 text-xs">Viewing component: ProfileView.tsx</p>
        </div>

        {/* The Isolated Component */}
        <ProfileView 
            data={TEST_DATA} 
            onEditSection={(sectionId) => console.log(`Edit request for section: ${sectionId}`)} 
        />

      </div>
    </div>
  );
}
