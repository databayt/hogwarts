import { cn } from "@/lib/utils";

interface SectionContainerProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function SectionContainer({ children, className, id }: SectionContainerProps) {
  return (
    <section
      id={id}
      className={cn(
        "py-16 md:py-24 lg:py-32",
        "px-[clamp(1rem,5vw,3rem)]",
        className
      )}
    >
      <div className="mx-auto max-w-7xl">
        {children}
      </div>
    </section>
  );
}
