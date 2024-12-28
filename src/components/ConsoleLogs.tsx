import React, { useState, useEffect } from "react";
import { Console, Hook, Unhook } from "console-feed";
import { Card, CardHeader, CardContent } from "@/components/ui/card"; // Replace with your actual Card component path

const ConsoleLogsFeed: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]); // No type constraints, raw logs

  useEffect(() => {
    // Hook into the console
    const hookedConsole = Hook(
      window.console,
      (log) => setLogs((currentLogs) => [...currentLogs, log]),
      false // Disable serialization for performance
    );

    // Cleanup when the component unmounts
    return () => Unhook(hookedConsole);
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <h2 className="text-lg font-bold">Console Logs</h2>
      </CardHeader>
      <CardContent>
        <div className="overflow-y-auto max-h-96 p-4 rounded-md">
          <Console logs={logs} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsoleLogsFeed;
