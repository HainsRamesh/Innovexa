import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LiveRobot3D } from './LiveRobot3D';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useAuth } from '@/contexts/AuthContext';
import { ROBOT_LANGUAGES, RobotLanguage } from '@/lib/robotLanguages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Send, 
  Mic, 
  MicOff, 
  Paperclip,
  X,
  Globe,
  Bot,
  User,
  Loader2,
  FileText,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: FileAttachment[];
}

interface FileAttachment {
  name: string;
  type: string;
  size: number;
  url?: string;
}

interface ChatAssistantProps {
  className?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`;

export function ChatAssistant({ className }: ChatAssistantProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "👋 Hello! I'm your ZyNoveXa AI Assistant. Here's what I can help with:\n\n🚀 **Explore innovations**\n➕ **Submit a new innovation**\n💡 **Help me improve my idea**\n\nYou can also ask me to navigate anywhere, or just chat!",
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<RobotLanguage>(ROBOT_LANGUAGES[0]);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isListening,
    transcript,
    isSupported: isSpeechSupported,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition(selectedLanguage.code);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle speech transcript
  useEffect(() => {
    if (transcript && !isListening) {
      // User stopped speaking, send the transcript
      handleSendMessage(transcript);
      resetTranscript();
    }
  }, [isListening, transcript]);

  // Show speech errors
  useEffect(() => {
    if (speechError) {
      toast.error(speechError);
    }
  }, [speechError]);

  const handleNavigationAction = useCallback((path: string, message: string) => {
    toast.success(message);
    setTimeout(() => {
      navigate(path);
    }, 500);
  }, [navigate]);

  const parseAssistantResponse = useCallback((content: string) => {
    // Try to parse as JSON for navigation commands
    try {
      const trimmed = content.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const action = JSON.parse(trimmed);
        if (action.action === 'navigate' && action.path) {
          handleNavigationAction(action.path, action.message || 'Navigating...');
          return action.message || `Opening ${action.path}...`;
        }
      }
    } catch {
      // Not JSON, return as-is
    }
    return content;
  }, [handleNavigationAction]);

  const streamChat = async (userMessages: { role: string; content: string }[]) => {
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ 
        messages: userMessages,
        language: selectedLanguage.code,
        page: location.pathname,
        userRole: role || '',
        userName: profile?.full_name || '',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed: ${response.status}`);
    }

    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let assistantContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setIsSpeaking(true);
            
            // Update the last assistant message
            setMessages(prev => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg?.role === 'assistant' && lastMsg.id.startsWith('stream-')) {
                return prev.map((m, i) => 
                  i === prev.length - 1 
                    ? { ...m, content: assistantContent } 
                    : m
                );
              }
              return [
                ...prev,
                {
                  id: `stream-${Date.now()}`,
                  role: 'assistant',
                  content: assistantContent,
                  timestamp: new Date(),
                }
              ];
            });
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    setIsSpeaking(false);
    
    // Parse final response for navigation
    const finalContent = parseAssistantResponse(assistantContent);
    if (finalContent !== assistantContent) {
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === 'assistant') {
          updated[lastIdx] = { ...updated[lastIdx], content: finalContent };
        }
        return updated;
      });
    }

    return assistantContent;
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText && attachments.length === 0) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setAttachments([]);
    setIsLoading(true);

    try {
      // Build message history for API
      const apiMessages = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));
      
      // Add user message with attachment info if present
      let userContent = messageText;
      if (userMessage.attachments?.length) {
        const fileInfo = userMessage.attachments.map(a => `[Attached: ${a.name}]`).join(' ');
        userContent = `${fileInfo}\n${messageText}`;
      }
      apiMessages.push({ role: 'user', content: userContent });

      await streamChat(apiMessages);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
      
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: "I'm sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const allowedTypes = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png', 'image/jpeg', 'image/jpg', 'text/plain'];
    
    const maxSize = 10 * 1024 * 1024; // 10MB

    const newAttachments: FileAttachment[] = [];
    
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File type not supported: ${file.name}`);
        continue;
      }
      if (file.size > maxSize) {
        toast.error(`File too large: ${file.name} (max 10MB)`);
        continue;
      }
      newAttachments.push({
        name: file.name,
        type: file.type,
        size: file.size,
      });
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    event.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    return FileText;
  };

  return (
    <div className={cn("flex flex-col h-full bg-card", className)}>
      {/* Header with Language Selector */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium text-sm">AI Assistant</span>
        </div>
        
        <Select
          value={selectedLanguage.code}
          onValueChange={(code) => {
            const lang = ROBOT_LANGUAGES.find(l => l.code === code);
            if (lang) setSelectedLanguage(lang);
          }}
        >
          <SelectTrigger className="w-[120px] h-8 text-xs pointer-events-auto">
            <Globe className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[300]" position="popper" sideOffset={5}>
            {ROBOT_LANGUAGES.map(lang => (
              <SelectItem key={lang.code} value={lang.code} className="text-xs">
                {lang.nativeName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mini Robot Avatar */}
      <div className="h-24 w-full relative shrink-0 bg-gradient-to-b from-background/50 to-transparent">
        <LiveRobot3D isSpeaking={isSpeaking} mood={isListening ? 'thinking' : 'idle'} />
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-2",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
              )}
              
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                )}
              >
                {message.attachments?.map((att, i) => {
                  const Icon = getFileIcon(att.type);
                  return (
                    <div key={i} className="flex items-center gap-1.5 text-xs opacity-80 mb-1">
                      <Icon className="h-3 w-3" />
                      <span className="truncate max-w-[150px]">{att.name}</span>
                    </div>
                  );
                })}
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>

              {message.role === 'user' && (
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                  <User className="h-3 w-3" />
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-2 justify-start">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Bot className="h-3 w-3 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Listening Indicator */}
      {isListening && (
        <div className="px-3 py-2 bg-primary/10 border-t border-primary/20 flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-xs text-primary font-medium">
            Listening... {transcript && `"${transcript}"`}
          </span>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-3 py-2 border-t border-border flex flex-wrap gap-2">
          {attachments.map((att, i) => {
            const Icon = getFileIcon(att.type);
            return (
              <div
                key={i}
                className="flex items-center gap-1.5 bg-muted rounded-full px-2 py-1 text-xs"
              >
                <Icon className="h-3 w-3" />
                <span className="max-w-[100px] truncate">{att.name}</span>
                <button
                  onClick={() => removeAttachment(i)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 border-t border-border bg-background/50">
        <div className="flex items-center gap-2">
          {/* File Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Text Input */}
          <Input
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="flex-1 h-9"
            disabled={isLoading || isListening}
          />

          {/* Microphone */}
          {isSpeechSupported && (
            <Button
              type="button"
              variant={isListening ? 'destructive' : 'ghost'}
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleMicClick}
              disabled={isLoading}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Send */}
          <Button
            type="button"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => handleSendMessage()}
            disabled={isLoading || (!inputText.trim() && attachments.length === 0)}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Speech not supported warning */}
        {!isSpeechSupported && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Voice input not supported in this browser
          </p>
        )}
      </div>
    </div>
  );
}
