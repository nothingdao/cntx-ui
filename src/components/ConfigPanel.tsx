// src/components/ConfigPanel.tsx
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Settings, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useProjectConfig } from '@/contexts/ProjectConfigContext';
import { ScrollArea } from "@/components/ui/scroll-area";

export function ConfigPanel() {
  const { ignorePatterns, updateIgnorePatterns } = useProjectConfig();
  const [patterns, setPatterns] = useState<string[]>([]);
  const [newPattern, setNewPattern] = useState('');

  useEffect(() => {
    setPatterns(ignorePatterns);
  }, [ignorePatterns]);

  const handleAddPattern = async () => {
    if (newPattern.trim()) {
      const updatedPatterns = [...patterns, newPattern.trim()];
      setPatterns(updatedPatterns);
      await updateIgnorePatterns(updatedPatterns);
      setNewPattern('');
    }
  };

  const handleRemovePattern = async (index: number) => {
    const updatedPatterns = patterns.filter((_, i) => i !== index);
    setPatterns(updatedPatterns);
    await updateIgnorePatterns(updatedPatterns);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Project Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Ignore Patterns</h3>
            <div className="flex gap-2 mb-4">
              <Input
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
                placeholder="Add new pattern (e.g., *.log)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddPattern();
                  }
                }}
              />
              <Button onClick={handleAddPattern} disabled={!newPattern.trim()}>
                <Plus />
              </Button>
            </div>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {patterns.map((pattern, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-2 rounded-md border bg-muted/40"
                  >
                    <code className="text-xs">{pattern}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePattern(index)}
                    >
                      <X />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
