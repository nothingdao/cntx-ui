// src/components/ApplicationContainer.tsx
import { DirectoryPanel } from "./DirectoryPanel";
import { MainContainer } from "./MainContainer";
import { useDirectory } from '@/contexts/DirectoryContext';
import { useProjectConfig } from '@/contexts/ProjectConfigContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, Zap, CheckCircle } from "lucide-react";

export const ApplicationContainer = () => {
  const { directoryHandle, selectDirectory } = useDirectory();
  const { isProjectInitialized } = useProjectConfig();

  // Show the main application if we have both a directory and it's initialized
  if (directoryHandle && isProjectInitialized) {
    return (
      <div className="grid grid-cols-[1fr,3fr] h-screen mx-auto gap-4">
        {/* Left Column - Directory Panel */}
        <div className="p-4 border-r">
          <DirectoryPanel />
        </div>

        {/* Main Column - App Interface */}
        <div className="flex flex-col h-full overflow-auto">
          <MainContainer />
        </div>
      </div>
    );
  }

  // Show the setup screen
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-4xl">cntx-ui</CardTitle>
          <CardDescription className="text-base">
            File bundling and tagging tool for AI development workflows
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-medium">Get Started</h3>
            <p className="text-muted-foreground">
              Select a directory to begin. If you've used Cntx before,
              previously initialized projects will be ready to use immediately.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="flex items-start space-x-3 p-4 rounded-lg border bg-card">
              <Zap className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-sm">New Projects</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Initialize any directory to start tracking files and creating bundles
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg border bg-card">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-sm">Existing Projects</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Projects with a <code className="text-xs bg-muted px-1 rounded">.cntx</code> folder load instantly
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col items-center space-y-4">
            <Button
              onClick={selectDirectory}
              size="lg"
              className="w-full max-w-sm"
            >
              <FolderOpen className="mr-2 h-5 w-5" />
              Select Directory
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Choose any directory to get started
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
