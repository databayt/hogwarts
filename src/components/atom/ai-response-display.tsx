// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';
import { Response } from './response';
import { Reasoning, ReasoningTrigger, ReasoningContent } from './reasoning';
import { cn } from '@/lib/utils';

interface AIResponseDisplayProps {
  response?: string;
  reasoning?: string;
  isStreaming?: boolean;
  className?: string;
  showReasoning?: boolean;
  streamDelay?: number;
  onStreamComplete?: () => void;
}

export function AIResponseDisplay({
  response = '',
  reasoning = '',
  isStreaming = false,
  className,
  showReasoning = true,
  streamDelay = 8, // Faster for letter-by-letter effect
  onStreamComplete,
}: AIResponseDisplayProps) {
  const [duration] = useState(Math.floor(Math.random() * 3) + 2); // Simulate 2-5 seconds thinking
  const [responseStatus, setResponseStatus] = useState<'streaming' | 'done' | 'failed' | 'rejected' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isStreaming && response) {
      setResponseStatus('streaming');
    } else if (!isStreaming && response) {
      // Delay setting to 'done' to ensure streaming completes
      const timer = setTimeout(() => {
        setResponseStatus('done');
        onStreamComplete?.();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isStreaming, response, onStreamComplete]);

  return (
    <div className={cn('space-y-4', className)}>
      {showReasoning && reasoning && (
        <Reasoning
          isStreaming={isStreaming}
          duration={duration}
          defaultOpen={isStreaming}
        >
          <ReasoningTrigger />
          <ReasoningContent>{reasoning}</ReasoningContent>
        </Reasoning>
      )}

      {response && (
        <div className="p-4 rounded-lg border bg-card" ref={containerRef}>
          <Response
            status={responseStatus}
            streamDelay={streamDelay}
            onStatusChange={(status) => {
              setResponseStatus(status);
              if (status === 'done') {
                onStreamComplete?.();
              }
            }}
          >
            {response}
          </Response>
        </div>
      )}
    </div>
  );
}

// Enhanced hook for using AI responses with streaming
export function useAIResponse() {
  const [response, setResponse] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [status, setStatus] = useState<'idle' | 'streaming' | 'done' | 'failed'>('idle');

  const generateResponse = async (
    prompt: string,
    options?: {
      includeReasoning?: boolean;
      simulateStream?: boolean;
      onChunk?: (chunk: string) => void;
    }
  ) => {
    setStatus('streaming');
    setIsStreaming(true);
    setResponse(''); // Clear previous response

    // Simulate AI reasoning
    if (options?.includeReasoning) {
      setReasoning(`## Analysis Process

1. **Understanding the request**: Parsing the user's input to identify key requirements
2. **Data extraction**: Identifying relevant information from the context
3. **Pattern matching**: Applying appropriate patterns and best practices
4. **Validation**: Ensuring the response meets quality standards
5. **Optimization**: Refining the output for clarity and usefulness`);
    }

    try {
      // Simulate streaming response
      const fullResponse = `## AI Generated Response

Based on the analysis, here's the generated content tailored to your requirements:

- **Key Point 1**: Detailed explanation of the first important aspect
- **Key Point 2**: Additional insights and recommendations
- **Key Point 3**: Actionable steps and best practices

### Next Steps
1. Review the generated content
2. Make any necessary adjustments
3. Implement the recommendations

### Summary
The process has been completed successfully with all requirements met.`;

      if (options?.simulateStream) {
        // Simulate chunked streaming
        const words = fullResponse.split(' ');
        let currentResponse = '';

        for (let i = 0; i < words.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 50)); // Delay between words
          currentResponse += (i === 0 ? '' : ' ') + words[i];
          setResponse(currentResponse);
          options?.onChunk?.(words[i]);
        }
      } else {
        // Set full response at once
        await new Promise(resolve => setTimeout(resolve, 1500));
        setResponse(fullResponse);
      }

      setStatus('done');
    } catch (error) {
      setStatus('failed');
      setResponse('Failed to generate response. Please try again.');
    } finally {
      setIsStreaming(false);
    }
  };

  const reset = () => {
    setResponse('');
    setReasoning('');
    setIsStreaming(false);
    setStatus('idle');
  };

  return {
    response,
    reasoning,
    isStreaming,
    status,
    generateResponse,
    setResponse,
    setReasoning,
    reset,
  };
}