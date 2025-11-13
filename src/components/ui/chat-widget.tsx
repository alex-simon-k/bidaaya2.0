"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage, TypingIndicator } from "@/components/ui/chat-message";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

interface ChatWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
  onSendMessage?: (message: string) => Promise<void>;
  className?: string;
}

export function ChatWidget({ isOpen, onToggle, onSendMessage, className }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: inputValue,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/cv-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      setMessages((prev) => [...prev, {
        id: data.message.id,
        role: data.message.role,
        content: data.message.content,
        createdAt: new Date(data.message.createdAt),
      }]);

      if (onSendMessage) {
        await onSendMessage(inputValue);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, there was an error. Please try again.',
        createdAt: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className={cn(
          "fixed bottom-6 right-6 w-14 h-14 bg-bidaaya-accent hover:bg-bidaaya-accent/90 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 z-50 safe-bottom",
          className
        )}
      >
        <img 
          src="/icons/chatbot.png" 
          alt="Chat"
          className="h-8 w-8 object-contain"
          style={{ imageRendering: 'crisp-edges' }}
        />
        {messages.length > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-bidaaya-dark flex items-center justify-center">
            <span className="text-xs text-white font-bold">{messages.length}</span>
          </div>
        )}
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-6 right-6 w-96 h-[600px] bg-bidaaya-dark border border-bidaaya-light/10 rounded-2xl shadow-2xl flex flex-col z-50 safe-bottom",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-bidaaya-light/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <img 
              src="/android-chrome-192x192.png" 
              alt="Bidaaya" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-bidaaya-light">Bidaaya Assistant</h3>
            <p className="text-xs text-bidaaya-light/60">Always here to help</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-bidaaya-light hover:bg-bidaaya-light/10"
            onClick={onToggle}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-bidaaya-light/10 flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-bidaaya-accent" />
            </div>
            <h4 className="text-bidaaya-light font-medium mb-2">Need help?</h4>
            <p className="text-sm text-bidaaya-light/60 max-w-[250px]">
              Ask me anything about opportunities, your profile, or how to use Bidaaya
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                timestamp={message.createdAt}
                showAvatar={false}
              />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-bidaaya-light/10">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            className="flex-1 bg-bidaaya-light/5 border border-bidaaya-light/10 rounded-lg px-4 py-2 text-sm text-bidaaya-light placeholder:text-bidaaya-light/40 focus:outline-none focus:border-bidaaya-accent"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="bg-bidaaya-accent hover:bg-bidaaya-accent/90 h-10 w-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-bidaaya-light/40 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

