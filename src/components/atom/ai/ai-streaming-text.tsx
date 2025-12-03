'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AiStreamingTextProps {
  stream?: ReadableStream<string> | null;
  text?: string;
  className?: string;
  showCursor?: boolean;
  cursorChar?: string;
  onComplete?: (finalText: string) => void;
  speed?: 'instant' | 'fast' | 'normal' | 'slow';
}

export function AiStreamingText({
  stream,
  text: initialText = '',
  className,
  showCursor = true,
  cursorChar = '▊',
  onComplete,
  speed = 'normal'
}: AiStreamingTextProps) {
  const [displayText, setDisplayText] = useState(initialText);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Handle streaming from ReadableStream
  useEffect(() => {
    if (!stream) return;

    setIsStreaming(true);
    setDisplayText('');

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = '';

    async function read() {
      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            setIsStreaming(false);
            setIsComplete(true);
            onComplete?.(accumulatedText);
            break;
          }

          const chunk = decoder.decode(value as unknown as ArrayBuffer, { stream: true });
          accumulatedText += chunk;
          setDisplayText(accumulatedText);
        }
      } catch (error) {
        console.error('Stream reading error:', error);
        setIsStreaming(false);
        setIsComplete(true);
      }
    }

    read();

    return () => {
      reader.releaseLock();
    };
  }, [stream, onComplete]);

  // Handle static text with typing effect
  useEffect(() => {
    if (!initialText || stream) return;

    const speeds = {
      instant: 0,
      fast: 10,
      normal: 30,
      slow: 50
    };

    const delay = speeds[speed];

    if (delay === 0) {
      setDisplayText(initialText);
      setIsComplete(true);
      onComplete?.(initialText);
      return;
    }

    setIsStreaming(true);
    let currentIndex = 0;
    const text = initialText;
    setDisplayText('');

    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayText((prev) => prev + text[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsStreaming(false);
        setIsComplete(true);
        onComplete?.(text);
      }
    }, delay);

    return () => clearInterval(interval);
  }, [initialText, speed, stream, onComplete]);

  return (
    <div className={cn('relative', className)}>
      <span className="whitespace-pre-wrap">{displayText}</span>
      {showCursor && isStreaming && (
        <span className="animate-pulse text-primary">{cursorChar}</span>
      )}
    </div>
  );
}