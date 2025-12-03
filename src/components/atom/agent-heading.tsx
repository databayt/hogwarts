'use client';

interface AgentHeadingProps {
  title: string;
  scrollTarget?: string;
  scrollText?: string;
}

export default function AgentHeading({
  title,
  scrollTarget = 'content',
  scrollText = 'explore existing data'
}: AgentHeadingProps) {
  return (
    <div className="space-y-4">
      <h1>
        {title}
      </h1>
      <p className="text-lg text-muted-foreground">
        Process data, or{' '}
        <button
          onClick={() => {
            document.getElementById(scrollTarget)?.scrollIntoView({
              behavior: 'smooth'
            });
          }}
          className="text-primary hover:underline inline"
        >
          {scrollText} →
        </button>
      </p>
    </div>
  );
}