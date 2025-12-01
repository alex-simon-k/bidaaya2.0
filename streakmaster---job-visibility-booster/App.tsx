import React from 'react';
import StreakCard from './components/StreakCard';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans selection:bg-indigo-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-cyan-900/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative w-full max-w-md mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Student Dashboard</h1>
          <p className="text-sm text-slate-400">Manage your daily consistency and boost your visibility.</p>
        </header>

        <StreakCard />
        
        <footer className="mt-8 text-center text-[10px] text-slate-600 uppercase tracking-widest font-medium">
          Powered by StreakMaster AI
        </footer>
      </div>
    </div>
  );
};

export default App;