'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AiPromptInputProps {
  onSubmit: (prompt: string) => void | Promise<void>;
  placeholder?: string;
  suggestions?: string[];
  templates?: { label: string; prompt: string }[];
  maxLength?: number;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  showModelSelector?: boolean;
  model?: string;
  onModelChange?: (model: string) => void;
}

export function AiPromptInput({
  onSubmit,
  placeholder = 'Enter your prompt...',
  suggestions = [],
  templates = [],
  maxLength = 2000,
  disabled = false,
  loading = false,
  className,
  showModelSelector = false,
  model,
  onModelChange
}: AiPromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || loading || disabled) return;

    await onSubmit(prompt);
    setPrompt('');
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const handleTemplateClick = (template: string) => {
    setPrompt(template);
    setShowTemplates(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn('relative w-full space-y-2', className)}>
      {/* Templates */}
      {templates.length > 0 && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowTemplates(!showTemplates)}
            className="text-xs"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Templates
          </Button>
        </div>
      )}

      {showTemplates && templates.length > 0 && (
        <Card className="absolute bottom-full mb-2 w-full p-2 z-10 max-h-48 overflow-y-auto">
          <div className="space-y-1">
            {templates.map((template, i) => (
              <button
                key={i}
                onClick={() => handleTemplateClick(template.prompt)}
                className="w-full text-left p-2 rounded hover:bg-muted transition-colors text-sm"
              >
                <div className="font-medium">{template.label}</div>
                <div className="text-muted-foreground text-xs truncate">
                  {template.prompt}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Main Input Area */}
      <form onSubmit={handleSubmit} className="relative">
        <Textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled || loading}
          className={cn(
            'min-h-[80px] pr-12 resize-none',
            'focus:ring-2 focus:ring-primary/20',
            loading && 'opacity-50'
          )}
        />

        {/* Character count */}
        {maxLength && (
          <div className="absolute bottom-2 left-2 text-xs text-muted-foreground">
            {prompt.length}/{maxLength}
          </div>
        )}

        {/* Submit button */}
        <Button
          type="submit"
          size="icon"
          disabled={!prompt.trim() || loading || disabled}
          className="absolute bottom-2 right-2 h-8 w-8"
        >
          {loading ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full mt-2 w-full p-2 z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Suggestions
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-4 w-4"
              onClick={() => setShowSuggestions(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80 transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Model indicator */}
      {showModelSelector && model && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Model: {model}</span>
        </div>
      )}
    </div>
  );
}