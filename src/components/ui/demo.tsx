import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { useState } from "react";

const DemoOne = () => {
  const [mode, setMode] = useState<'create-project' | 'find-talent'>('create-project');
  
  const handleSendMessage = (message: string, files?: File[]) => {
    console.log('Message:', message);
    console.log('Files:', files);
  };

  return (
    <div className="flex w-full h-screen justify-center items-center bg-[radial-gradient(125%_125%_at_50%_101%,rgba(59,130,246,1)_10.5%,rgba(99,102,241,1)_16%,rgba(139,92,246,1)_17.5%,rgba(168,85,247,1)_25%,rgba(219,39,119,1)_40%,rgba(236,72,153,1)_65%,rgba(244,114,182,1)_100%)]">
      <div className="p-4 w-[500px]">
        <h1 className="text-white text-2xl font-bold mb-6 text-center">
          AI Recruitment Assistant
        </h1>
        <PromptInputBox 
          onSend={handleSendMessage} 
          mode={mode}
          onModeChange={setMode}
        />
      </div>
    </div>
  );
};

export { DemoOne }; 