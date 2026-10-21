// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Three dots while the answer hasn't started — the gap between Send and the
 * first word, which used to show nothing at all. Still under reduced motion.
 */
export function TypingDots({ label }: { label: string }) {
  return (
    <div role="status" className="flex h-5 items-center gap-1 px-1">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          aria-hidden
          className="bg-muted-foreground/60 h-1.5 w-1.5 animate-bounce rounded-full motion-reduce:animate-none"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  )
}
