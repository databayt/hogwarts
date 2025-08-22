import { DebugConsole } from "@/components/debug/debug-console";

export default function DebugPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Debug Console Logs
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Monitor OAuth configuration and authentication flow in real-time
        </p>
      </div>
      
      <DebugConsole />
    </div>
  );
}
