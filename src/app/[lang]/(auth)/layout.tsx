const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="mx-auto flex h-screen max-w-sm items-center justify-center px-6">
      {children}
    </div>
  )
}

export default AuthLayout
