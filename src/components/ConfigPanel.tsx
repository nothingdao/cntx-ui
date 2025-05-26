// Updated src/components/ConfigPanel.tsx
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Settings, Plus, X, FolderOpen, FileText, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProjectConfig } from '@/contexts/ProjectConfigContext';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useDirectory } from '@/contexts/DirectoryContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CursorRulesPanel } from './CursorRulesPanel';

export function ConfigPanel() {
  const { ignorePatterns, updateIgnorePatterns, projectMetadata, updateProjectMetadata } = useProjectConfig();
  const { currentDirectory } = useDirectory();

  const [patterns, setPatterns] = useState<string[]>([]);
  const [newPattern, setNewPattern] = useState('');

  // Project metadata state
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectVersion, setProjectVersion] = useState('');
  const [projectAuthor, setProjectAuthor] = useState('');

  useEffect(() => {
    setPatterns(ignorePatterns);
  }, [ignorePatterns]);

  useEffect(() => {
    if (projectMetadata) {
      setProjectName(projectMetadata.name || '');
      setProjectDescription(projectMetadata.description || '');
      setProjectVersion(projectMetadata.version || '1.0.0');
      setProjectAuthor(projectMetadata.author || '');
    }
  }, [projectMetadata]);

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

  const handleUpdateProjectMetadata = async () => {
    const metadata = {
      name: projectName.trim() || currentDirectory || 'Untitled Project',
      description: projectDescription.trim() || '',
      version: projectVersion.trim() || '1.0.0',
      author: projectAuthor.trim() || '',
      lastUpdated: new Date().toISOString(),
    };

    await updateProjectMetadata(metadata);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Project Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="project" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="project" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Project Info
              </TabsTrigger>
              <TabsTrigger value="ignore" className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Ignore Patterns
              </TabsTrigger>
              <TabsTrigger value="cursor" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Cursor Rules
              </TabsTrigger>
            </TabsList>

            {/* Project Information Tab */}
            <TabsContent value="project" className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-4">Project Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder={currentDirectory || "Enter project name"}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project-version">Version</Label>
                    <Input
                      id="project-version"
                      value={projectVersion}
                      onChange={(e) => setProjectVersion(e.target.value)}
                      placeholder="1.0.0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project-author">Author</Label>
                    <Input
                      id="project-author"
                      value={projectAuthor}
                      onChange={(e) => setProjectAuthor(e.target.value)}
                      placeholder="Your name or organization"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="project-description">Description</Label>
                    <Textarea
                      id="project-description"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="Brief description of your project"
                      className="min-h-[80px]"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Button onClick={handleUpdateProjectMetadata}>
                    <FileText className="mr-2 h-4 w-4" />
                    Update Project Info
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Ignore Patterns Tab */}
            <TabsContent value="ignore" className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-4">Ignore Patterns</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Files and directories matching these patterns will be excluded from bundles and file tracking.
                </p>

                <div className="flex gap-2 mb-4">
                  <Input
                    value={newPattern}
                    onChange={(e) => setNewPattern(e.target.value)}
                    placeholder="Add new pattern (e.g., *.log, node_modules)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddPattern();
                      }
                    }}
                  />
                  <Button onClick={handleAddPattern} disabled={!newPattern.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {patterns.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <X className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No ignore patterns configured</p>
                        <p className="text-xs">Add patterns to exclude files from bundles</p>
                      </div>
                    ) : (
                      patterns.map((pattern, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between px-3 py-2 rounded-md border bg-muted/40 hover:bg-muted/60 transition-colors"
                        >
                          <code className="text-xs font-mono">{pattern}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePattern(index)}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            {/* Cursor Rules Tab - SIMPLIFIED */}
            <TabsContent value="cursor">
              <CursorRulesPanel />
            </TabsContent>
          </Tabs>

          {/* Summary */}
          <Separator className="my-6" />
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-2">Configuration Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Project:</span>
                <span className="ml-2 font-medium">
                  {projectName || currentDirectory || 'Untitled'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Ignore Patterns:</span>
                <span className="ml-2 font-medium">{patterns.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Version:</span>
                <span className="ml-2 font-medium">{projectVersion || '1.0.0'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Author:</span>
                <span className="ml-2 font-medium">{projectAuthor || 'Not set'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
