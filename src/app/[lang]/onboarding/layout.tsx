interface OnboardingLayoutProps {
  children: React.ReactNode
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex w-full flex-1 items-center justify-center px-4 sm:px-6 md:px-12">
        {children}
      </main>
    </div>
  )
}
