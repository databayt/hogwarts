
const AuthLayout = ({ 
  children
}: { 
  children: React.ReactNode
}) => {
  return ( 
    <div className="h-screen  max-w-sm mx-auto flex items-center justify-center px-6">
      {children}
    </div>
   );
}
 
export default AuthLayout;