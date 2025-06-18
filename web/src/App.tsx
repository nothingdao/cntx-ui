// web/src/App.tsx - Properly Fixed Layout Version
import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BundleList } from './components/BundleList'
import { FileTree } from './components/FileTree'
import { BundleConfig } from './components/BundleConfig'
import { CursorRulesManager } from './components/CursorRulesManager'
import { HiddenFilesManager } from './components/HiddenFilesManager'
import { SetupBanner, SetupChecklist, UsageGuidance, WorkflowInstructions, QuickCliReference } from './components/SetupComponents'
import SetupScreen from './components/SetupScreen'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card'
import { Button } from './components/ui/button'
import { Toaster } from 'sonner'
import { X, HelpCircle, Sparkles, EyeOff } from 'lucide-react'

const queryClient = new QueryClient()

function App() {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [showSetupScreen, setShowSetupScreen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    // WebSocket connection for real-time updates
    const ws = new WebSocket('ws://localhost:3333')

    ws.onopen = () => setConnectionStatus('connected')
    ws.onclose = () => setConnectionStatus('disconnected')

    return () => ws.close()
  }, [])

  // If setup screen is open, show it full screen
  if (showSetupScreen) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSetupScreen(false)}
            className="absolute top-4 right-4 z-10"
          >
            <X className="w-4 h-4" />
          </Button>
          <SetupScreen />
        </div>
      </QueryClientProvider>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">cntx-ui</h1>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(!showHelp)}
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                Help
              </Button>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                <span className="text-sm text-muted-foreground">
                  {connectionStatus === 'connected' ? 'Connected • Watching files' :
                    connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          {/* Setup Banner - shows for first-time users */}
          <SetupBanner onStartSetup={() => setShowSetupScreen(true)} />

          {/* Fixed Layout using Flexbox instead of Grid */}
          <div className="flex flex-col lg:flex-row gap-6">
            <Toaster position="top-right" />

            {/* Main Content - Flexible width */}
            <div className="flex-1 min-w-0">
              <Tabs defaultValue="bundles" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="bundles">Bundles</TabsTrigger>
                  <TabsTrigger value="files">Files</TabsTrigger>
                  <TabsTrigger value="config">Config</TabsTrigger>
                  <TabsTrigger value="hidden" className="flex items-center gap-1">
                    <EyeOff className="w-3 h-3" />
                    <span className="hidden sm:inline">Hidden</span>
                  </TabsTrigger>
                  <TabsTrigger value="cursor" className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span className="hidden sm:inline">Cursor</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="bundles">
                  <Card>
                    <CardHeader>
                      <CardTitle>Bundle Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BundleList />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="files">
                  <Card>
                    <CardHeader>
                      <CardTitle>File Explorer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FileTree />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="config">
                  <BundleConfig />
                </TabsContent>

                <TabsContent value="hidden">
                  <HiddenFilesManager />
                </TabsContent>

                <TabsContent value="cursor">
                  <CursorRulesManager />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar - Fixed width on large screens */}
            <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-6">
              {/* Setup Status */}
              <SetupChecklist onOpenFullSetup={() => setShowSetupScreen(true)} />

              {/* Help Panel */}
              {showHelp && (
                <div className="space-y-4">
                  <UsageGuidance />
                  <WorkflowInstructions />
                  <QuickCliReference />

                  {/* Hidden Files Quick Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <EyeOff className="w-4 h-4" />
                        File Visibility
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Control which files appear in your bundles without changing ignore patterns.
                      </p>
                      <div className="text-xs space-y-1">
                        <div>• Hide debug/temp files from AI context</div>
                        <div>• Create focused bundles for specific tasks</div>
                        <div>• Bundle-specific or global hiding</div>
                        <div>• Easy restore when needed</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cursor Rules Quick Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        AI Assistant
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Cursor rules help AI assistants understand your project context and coding preferences.
                      </p>
                      <div className="text-xs space-y-1">
                        <div>• Project structure & bundles</div>
                        <div>• Coding standards & style</div>
                        <div>• Framework preferences</div>
                        <div>• Team conventions</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Need More Help?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowSetupScreen(true)}
                        className="w-full"
                      >
                        Open Setup Guide
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        For detailed setup instructions and troubleshooting.
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </QueryClientProvider>
  )
}

export default App
