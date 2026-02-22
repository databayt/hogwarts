export default function JoinLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-24 sm:px-6 lg:px-8">
      {children}
    </div>
  )
}
