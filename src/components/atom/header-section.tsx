interface HeaderSectionProps {
  label?: string
  title: string
  subtitle?: string
}

export function HeaderSection({ label, title, subtitle }: HeaderSectionProps) {
  return (
    <div className="flex flex-col items-center text-center">
      {label ? (
        <div className="text-gradient_indigo-purple mb-4">{label}</div>
      ) : null}
      <h1 className="font-heading text-4xl font-extrabold md:text-5xl">
        {title}
      </h1>
      {subtitle ? <p className="muted mt-6">{subtitle}</p> : null}
    </div>
  )
}
