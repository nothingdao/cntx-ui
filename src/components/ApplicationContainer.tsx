// src/components/ApplicationContainer.tsx
import { DirectoryPanel } from "./DirectoryPanel";
import { MainContainer } from "./MainContainer";
import { useDirectory } from '@/contexts/DirectoryContext';
import { useProjectConfig } from '@/contexts/ProjectConfigContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, Zap, CheckCircle, FileText, Tag, Archive, BarChart, Settings } from "lucide-react";

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
  // Show the setup screen with big brain wojak
  return (
    <div className="h-screen bg-gradient-to-br from-background to-muted/20 relative overflow-hidden">
      {/* Big Brain Wojak Background */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-96 h-96 opacity-50 bg-no-repeat bg-contain"
        style={{
          backgroundImage: `url("/wojak.png")`

        }}
      />

      <div className="relative z-10 h-full flex items-center justify-center px-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          {/* Floating Demo Box - Top Left */}
          <Card className="absolute top-12 left-0 w-72 bg-background/75 backdrop-blur border-2 transform rotate-1 shadow-xl opacity-90 hover:opacity-95 transition-opacity hidden lg:block">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-500" />
                Project Config
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-muted/40 rounded">
                <span>Ignore Patterns</span>
                <span className="text-muted-foreground">12 rules</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/40 rounded">
                <span>AI Instructions</span>
                <span className="text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/40 rounded">
                <span>File Tracking</span>
                <span className="text-blue-600">247 files</span>
              </div>
            </CardContent>
          </Card>

          {/* Floating Demo Box - Top Right */}
          <Card className="absolute top-20 right-4 w-80 bg-background/70 backdrop-blur border-2 transform rotate-2 shadow-xl opacity-60 hover:opacity-90 transition-opacity hidden lg:block">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Archive className="w-4 h-4 text-purple-500" />
                Bundle Manager
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span className="font-mono">master-2025-01-15.txt</span>
                <span className="text-green-600 text-xs">Fresh</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span className="font-mono">ui-components-bundle.txt</span>
                <span className="text-amber-600 text-xs">Stale</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span className="font-mono">core-logic-bundle.txt</span>
                <span className="text-green-600 text-xs">Fresh</span>
              </div>
            </CardContent>
          </Card>

          {/* Floating Demo Box - Bottom Left */}
          <Card className="absolute bottom-20 left-5 w-64 bg-background/80 backdrop-blur border-2 transform -rotate-2 shadow-xl  hover:opacity-95 transition-opacity hidden lg:block">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart className="w-4 h-4 text-orange-500" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Bundle Freshness</span>
                <span className="text-green-600 font-medium">87%</span>
              </div>
              <div className="w-full bg-muted/40 rounded-full h-1.5">
                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '87%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>12 Fresh</span>
                <span>2 Stale</span>
              </div>
            </CardContent>
          </Card>

          {/* Floating Demo Box - Bottom Right */}
          <Card className="absolute bottom-14 right-12 w-72 bg-background/70 backdrop-blur border-2 transform rotate-1 shadow-xl opacity-60 hover:opacity-90 transition-opacity hidden lg:block">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-500" />
                File Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-1">
                <div className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  core
                </div>
                <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  ui-components
                </div>
                <div className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  utilities
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3" />
                  <span>src/App.tsx</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3" />
                  <span>src/components/Button.tsx</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Left side - overlaps with wojak */}
          <div className="space-y-8 lg:pl-32 relative z-20">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                cntx-ui
              </h1>
              <p className="text-lg text-muted-foreground">
                File bundling and tagging tool for AI development workflows
              </p>
            </div>

            <Card className="bg-background/80 backdrop-blur border-2 shadow-2xl">
              <CardHeader className="text-center lg:text-left pb-4">
                <CardTitle className="text-2xl">Get Started</CardTitle>
                <CardDescription>
                  Select a directory to begin. Previously initialized projects load instantly.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-start space-x-3 p-4 rounded-lg border bg-card/50 backdrop-blur">
                    <Zap className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm">New Projects</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Initialize any directory to start tracking files and creating bundles
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 rounded-lg border bg-card/50 backdrop-blur">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm">Existing Projects</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Projects with a <code className="text-xs bg-muted px-1 rounded">.cntx</code> folder load instantly
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                  <Button
                    onClick={selectDirectory}
                    size="lg"
                    className="w-full text-lg py-6"
                  >
                    <FolderOpen className="mr-3 h-6 w-6" />
                    Select Directory
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    Choose any directory to get started
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side - empty space for visual balance */}
          <div className="hidden lg:block" />
        </div>
      </div>
    </div>
  );
}
