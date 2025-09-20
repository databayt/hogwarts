import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <WifiOff className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">You're Offline</h1>
          <p className="text-muted-foreground">
            It looks like you've lost your internet connection.
            Some features may not be available until you're back online.
          </p>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>While offline, you can:</p>
            <ul className="mt-2 space-y-1 text-left inline-block">
              <li>• View previously cached pages</li>
              <li>• Access downloaded documents</li>
              <li>• Review saved student data</li>
            </ul>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>

        <div className="text-xs text-muted-foreground">
          Your data will sync automatically when you reconnect
        </div>
      </div>
    </div>
  );
}