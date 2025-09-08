import React from "react";

interface LoadingProps {
  onComplete?: () => void;
}

const Loading: React.FC<LoadingProps> = ({ onComplete }) => {
  React.useEffect(() => {
    if (onComplete) {
      // Simulate loading completion after a short delay
      const timer = setTimeout(() => {
        onComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

export default Loading; 