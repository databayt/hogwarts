interface HeaderSectionProps {
  label?: string;
  title: string;
  subtitle?: string;
}

export function HeaderSection({ label, title, subtitle }: HeaderSectionProps) {
  return (
    <div className="flex flex-col items-center text-center">
      {label ? (
        <div className="text-gradient_indigo-purple mb-4">
          {label}
        </div>
      ) : null}
      <h1 className="text-4xl md:text-5xl font-heading font-extrabold">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-6 muted">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
