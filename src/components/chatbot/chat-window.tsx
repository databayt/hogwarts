'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CHAT_WINDOW_POSITIONS, CHAT_WINDOW_SIZE } from './constant';
import type { ChatWindowProps } from './type';
import { SendIcon, PriceIcon, TimeIcon, ServicesIcon, InfoIcon, VoiceIcon } from './icons';

export const ChatWindow = memo(function ChatWindow({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isLoading,
  error,
  locale,
}: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isRTL = locale === 'ar';

  // Auto focus input when chat opens on desktop
  useEffect(() => {
    if (isOpen && !isMobile && inputRef.current) {
      // Small delay to ensure the window is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isMobile]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle keyboard visibility on mobile
  useEffect(() => {
    if (!isMobile) return;

    let initialViewportHeight = window.visualViewport?.height || window.innerHeight;

    const handleViewportChange = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      setKeyboardOpen(heightDifference > 150);
    };

    const handleFocus = () => {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 300);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    } else {
      window.addEventListener('resize', handleViewportChange);
    }

    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener('focus', handleFocus);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleViewportChange);
      }
      if (inputElement) {
        inputElement.removeEventListener('focus', handleFocus);
      }
    };
  }, [isMobile]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      // Use smooth scrolling for better UX
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatWindowRef.current && !chatWindowRef.current.contains(event.target as Node) && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  }, [input, isLoading, onSendMessage]);


  const handleVoiceInput = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as unknown as any).webkitSpeechRecognition || (window as unknown as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = locale === 'ar' ? 'ar-SA' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    recognition.start();
    setIsListening(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const speechResult = event.results[0][0].transcript;
      setInput(speechResult);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      alert('Speech recognition error. Please try again.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  }, [isListening, locale]);

  return (
    <div
      ref={chatWindowRef}
      className={cn(
        // Mobile: Full screen overlay, Desktop: Bottom right position
        isMobile
          ? 'fixed inset-0 z-[10000] bg-background flex flex-col'
          : cn(
              CHAT_WINDOW_POSITIONS['bottom-right'],
              CHAT_WINDOW_SIZE.width,
              CHAT_WINDOW_SIZE.height,
              'z-[9999] bg-background border rounded-lg shadow-2xl flex flex-col',
              'max-h-[80vh]'
            ),
        'transform transition-all duration-700 ease-in-out',
        'sm:origin-bottom-right',
        isOpen
          ? 'opacity-100 scale-100 visible'
          : 'opacity-0 scale-0 invisible pointer-events-none'
      )}
      style={{
        transformOrigin: isMobile ? 'center' : 'bottom right',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        ...(isMobile && isOpen ? {
          height: keyboardOpen ? '100vh' : '100dvh',
          minHeight: '100vh'
        } : {})
      }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Mobile Back Arrow Header */}
      {isMobile && (
        <div className="flex items-center justify-start p-4">
          <button
            onClick={onClose}
            className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-accent transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(isRTL && "rotate-180")}
            >
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
        </div>
      )}

      <ScrollArea className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden",
        isMobile ? "px-4 pt-2 pb-1" : "px-4 pt-2 pb-1"
      )} ref={scrollAreaRef}>
        <div className="h-full flex flex-col">
            {messages.length === 0 ? (
              <div className="flex flex-col h-full">
                {isMobile ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <p className="mb-6 text-center text-muted-foreground text-sm font-medium">
                      <span>Choose a question or type your message</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2 w-full px-2 max-w-sm">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onSendMessage("How do I check grades?")}
                        className="text-xs h-auto py-2.5 px-3 flex items-center gap-2 bg-muted hover:bg-muted/80 border-0"
                      >
                        <PriceIcon size={16} />
                        <span>Grades</span>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onSendMessage("How do I mark attendance?")}
                        className="text-xs h-auto py-2.5 px-3 flex items-center gap-2 bg-muted hover:bg-muted/80 border-0"
                      >
                        <ServicesIcon size={16} />
                        <span>Attendance</span>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onSendMessage("Where is the timetable?")}
                        className="text-xs h-auto py-2.5 px-3 flex items-center gap-2 bg-muted hover:bg-muted/80 border-0"
                      >
                        <TimeIcon size={16} />
                        <span>Timetable</span>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onSendMessage("How do I pay fees?")}
                        className="text-xs h-auto py-2.5 px-3 flex items-center gap-2 bg-muted hover:bg-muted/80 border-0"
                      >
                        <InfoIcon size={16} />
                        <span>Finance</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            ) : (
              <div className="space-y-4 pb-2">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex gap-2',
                      message.role === 'user' ? (isRTL ? 'flex-row' : 'flex-row-reverse') : ''
                    )}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          AI
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'rounded-lg px-3 py-2 max-w-[80%] break-words',
                        message.role === 'user'
                          ? 'bg-primary text-white ml-auto'
                          : 'bg-muted'
                      )}
                    >
                      <p className={cn("text-sm whitespace-pre-wrap", message.role === 'user' && "text-white")}>{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </ScrollArea>

      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div
        className={cn(
          "bg-background",
          isMobile ? "px-3 py-3" : "px-3 pb-2 pt-2",
          isMobile && keyboardOpen && "pb-1"
        )}
        style={{
          ...(isMobile && keyboardOpen ? {
            position: 'fixed',
            bottom: '0',
            left: '0',
            right: '0',
            zIndex: 10001
          } : {})
        }}
      >
          {/* Desktop preconfigured questions */}
          {!isMobile && messages.length === 0 && (
            <div className="mb-3">
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onSendMessage("How do I check grades?")}
                  className="text-xs h-auto py-2 px-3 flex items-center gap-2 bg-muted hover:bg-muted/80 border-0"
                >
                  <PriceIcon size={14} />
                  <span>Grades</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onSendMessage("How do I mark attendance?")}
                  className="text-xs h-auto py-2 px-3 flex items-center gap-2 bg-muted hover:bg-muted/80 border-0"
                >
                  <ServicesIcon size={14} />
                  <span>Attendance</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onSendMessage("Where is the timetable?")}
                  className="text-xs h-auto py-2 px-3 flex items-center gap-2 bg-muted hover:bg-muted/80 border-0"
                >
                  <TimeIcon size={14} />
                  <span>Timetable</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onSendMessage("How do I pay fees?")}
                  className="text-xs h-auto py-2 px-3 flex items-center gap-2 bg-muted hover:bg-muted/80 border-0"
                >
                  <InfoIcon size={14} />
                  <span>Finance</span>
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className={cn(
              "flex items-center border border-muted-foreground rounded-lg px-3 bg-background relative",
              isMobile ? "flex-[0.8]" : "w-[70%]"
            )}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                placeholder={isMobile ? "" : ""}
                className={cn(
                  "w-full bg-transparent border-none outline-none",
                  isMobile ? "text-[16px] h-10 py-2" : "text-sm py-2 h-8"
                )}
                dir={isRTL ? 'rtl' : 'ltr'}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                inputMode="text"
              />
            </div>

            <div className="flex items-center gap-1 w-[30%] justify-center">
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={cn(
                  "hover:scale-110 transition-transform shrink-0 disabled:opacity-50 disabled:hover:scale-100",
                  isMobile ? "h-12 w-12" : "h-10 w-10"
                )}
                title="Send message"
              >
                <SendIcon size={isMobile ? 32 : 20} className={cn(isRTL && "scale-x-[-1]")} />
              </button>

              <button
                type="button"
                onClick={handleVoiceInput}
                className={cn(
                  "hover:scale-110 transition-transform shrink-0",
                  isMobile ? "h-12 w-12" : "h-10 w-10",
                  isListening && "text-red-500 animate-pulse"
                )}
                title="Voice input"
              >
                <VoiceIcon size={isMobile ? 32 : 20} />
              </button>
            </div>
          </form>
      </div>
    </div>
  );
});
