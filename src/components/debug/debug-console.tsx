"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
  source: 'console' | 'server' | 'auth';
}

export const DebugConsole = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const originalConsole = useRef<Console>();

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Start capturing console logs
  const startCapturing = () => {
    if (isCapturing) return;

    // Store original console methods
    originalConsole.current = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
    };

    // Override console methods
    const addLog = (level: LogEntry['level'], ...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      const logEntry: LogEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        level,
        message,
        data: args.length > 1 ? args : undefined,
        source: 'console'
      };

      setLogs(prev => [...prev, logEntry]);
      
      // Call original console method
      if (originalConsole.current) {
        originalConsole.current[level](...args);
      }
    };

    // Override console methods
    console.log = (...args) => addLog('log', ...args);
    console.info = (...args) => addLog('info', ...args);
    console.warn = (...args) => addLog('warn', ...args);
    console.error = (...args) => addLog('error', ...args);

    // Test log to verify it's working
    console.log('Debug console started - logging is now active');
    console.info('This is a test info message');
    console.warn('This is a test warning message');

    setIsCapturing(true);
    toast.success("Console logging started");
  };

  // Stop capturing console logs
  const stopCapturing = () => {
    if (!isCapturing || !originalConsole.current) return;

    // Restore original console methods
    console.log = originalConsole.current.log;
    console.info = originalConsole.current.info;
    console.warn = originalConsole.current.warn;
    console.error = originalConsole.current.error;

    setIsCapturing(false);
    toast.success("Console logging stopped");
  };

  // Clear all logs
  const clearLogs = () => {
    setLogs([]);
    toast.success("Logs cleared");
  };

  // Copy all logs to clipboard
  const copyLogs = async () => {
    const logText = logs.map(log => 
      `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');

    try {
      await navigator.clipboard.writeText(logText);
      toast.success("Logs copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy logs");
    }
  };

  // Download logs as text file
  const downloadLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Logs downloaded");
  };

  // Get log level color
  const getLogLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'warn': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Get source color
  const getSourceColor = (source: LogEntry['source']) => {
    switch (source) {
      case 'auth': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'server': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Console Capture Controls</span>
            <div className="flex items-center space-x-2">
              <Badge variant={isCapturing ? "default" : "secondary"}>
                {isCapturing ? "Capturing" : "Stopped"}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {!isCapturing ? (
              <Button onClick={startCapturing} className="bg-green-600 hover:bg-green-700">
                Start Capturing
              </Button>
            ) : (
              <Button onClick={stopCapturing} variant="destructive">
                Stop Capturing
              </Button>
            )}
            
            <Button onClick={clearLogs} variant="outline">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Logs
            </Button>
            
            <Button onClick={copyLogs} variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Copy All
            </Button>
            
            <Button onClick={downloadLogs} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            
            <Button 
              onClick={() => {
                console.log('Test log message');
                console.info('Test info message');
                console.warn('Test warning message');
                console.error('Test error message');
              }} 
              variant="outline"
            >
              Test Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Console Logs ({logs.length})</span>
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded"
                />
                <span>Auto-scroll</span>
              </label>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No logs captured yet. Start capturing to see console output.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="mb-2 border-b border-gray-800 pb-2">
                  <div className="flex items-start space-x-2">
                    <span className="text-gray-500 text-xs">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <Badge className={`text-xs ${getLogLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </Badge>
                    <Badge className={`text-xs ${getSourceColor(log.source)}`}>
                      {log.source}
                    </Badge>
                  </div>
                  <div className="mt-1 text-green-300 break-words">
                    {log.message}
                  </div>
                  {log.data && log.data.length > 1 && (
                    <details className="mt-2">
                      <summary className="text-gray-400 cursor-pointer text-xs">
                        Show data ({log.data.length} items)
                      </summary>
                      <pre className="mt-2 text-xs text-gray-400 overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>1. <strong>Start Capturing</strong> to begin monitoring console logs</p>
          <p>2. Navigate to your OAuth flow (e.g., <code>portsudan.localhost:3000/login</code>)</p>
          <p>3. Click Facebook/Google login button to trigger OAuth</p>
          <p>4. Watch the logs here to see what's happening</p>
          <p>5. Use <strong>Copy All</strong> to copy logs for debugging</p>
          <p>6. <strong>Stop Capturing</strong> when done to restore normal console</p>
        </CardContent>
      </Card>
    </div>
  );
};
