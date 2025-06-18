// Updated SetupComponents.tsx with clearer CLI vs UI guidance

import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { CheckCircle, AlertTriangle, Settings, Play, Terminal, FileText, Monitor, Command } from 'lucide-react'

interface SetupStatus {
  hasConfig: boolean
  hasIgnoreFile: boolean
  bundleCount: number
  hasCursorRules: boolean
  isFirstTime: boolean
}

const fetchSetupStatus = async (): Promise<SetupStatus> => {
  try {
    const [configResponse, bundlesResponse, cursorResponse] = await Promise.all([
      fetch('http://localhost:3333/api/config'),
      fetch('http://localhost:3333/api/bundles'),
      fetch('http://localhost:3333/api/cursor-rules')
    ])

    const hasConfig = configResponse.ok
    const bundles = bundlesResponse.ok ? await bundlesResponse.json() : []
    const hasCursorRules = cursorResponse.ok

    return {
      hasConfig,
      hasIgnoreFile: true, // We can assume this exists if config exists
      bundleCount: bundles.length || 0,
      hasCursorRules,
      isFirstTime: !hasConfig || bundles.length === 0
    }
  } catch (error) {
    return {
      hasConfig: false,
      hasIgnoreFile: false,
      bundleCount: 0,
      hasCursorRules: false,
      isFirstTime: true
    }
  }
}

interface SetupBannerProps {
  onStartSetup: () => void
}

export function SetupBanner({ onStartSetup }: SetupBannerProps) {
  const { data: status, isLoading } = useQuery({
    queryKey: ['setup-status'],
    queryFn: fetchSetupStatus,
    refetchInterval: 5000,
  })

  if (isLoading || !status?.isFirstTime) {
    return null
  }

  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <Settings className="w-4 h-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <strong>Welcome to cntx-ui!</strong> This looks like your first time.
          The web interface is already running - let's help you get set up properly.
        </div>
        <Button onClick={onStartSetup} size="sm">
          Start Setup Guide
        </Button>
      </AlertDescription>
    </Alert>
  )
}

interface SetupChecklistProps {
  onOpenFullSetup: () => void
}

export function SetupChecklist({ onOpenFullSetup }: SetupChecklistProps) {
  const { data: status, isLoading } = useQuery({
    queryKey: ['setup-status'],
    queryFn: fetchSetupStatus,
    refetchInterval: 10000,
  })

  if (isLoading) {
    return <div>Checking setup status...</div>
  }

  const checks = [
    {
      label: 'Configuration file exists',
      passed: status?.hasConfig || false,
      description: '.cntx/config.json with bundle definitions'
    },
    {
      label: 'Ignore patterns configured',
      passed: status?.hasIgnoreFile || false,
      description: '.cntxignore file to exclude unnecessary files'
    },
    {
      label: 'Bundles generated',
      passed: (status?.bundleCount || 0) > 0,
      description: `${status?.bundleCount || 0} bundles currently configured`
    },
    {
      label: 'Cursor rules created',
      passed: status?.hasCursorRules || false,
      description: '.cursorrules file for AI assistant context'
    }
  ]

  const allPassed = checks.every(check => check.passed)

  return (
    <Card className={!allPassed ? 'border-yellow-200' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Setup Status
          {allPassed ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {checks.map((check, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {check.passed ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              <div className="flex-1">
                <div className={`font-medium ${check.passed ? 'text-green-700' : 'text-yellow-700'}`}>
                  {check.label}
                </div>
                <div className="text-sm text-gray-600">{check.description}</div>
              </div>
            </div>
          ))}
        </div>

        {!allPassed && (
          <div className="mt-4 pt-4 border-t">
            <Button onClick={onOpenFullSetup} variant="outline" className="w-full">
              <Play className="w-4 h-4 mr-2" />
              Complete Setup Guide
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// CLI vs UI guidance component
export function UsageGuidance() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          How to Use cntx-ui
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <Terminal className="w-4 h-4" />
          <AlertDescription>
            <strong>You're already running!</strong> The web interface provides full functionality.
            CLI commands are available for automation and advanced workflows.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Web Interface (Recommended)
            </h4>
            <div className="text-sm text-gray-600 space-y-2">
              <p>Perfect for interactive use and project management:</p>
              <div className="ml-4 space-y-1">
                <div>• <strong>Bundle Management:</strong> View, create, and manage bundles</div>
                <div>• <strong>Configuration:</strong> Edit bundle patterns visually</div>
                <div>• <strong>Hidden Files:</strong> Control file visibility per bundle</div>
                <div>• <strong>Cursor Rules:</strong> Manage AI assistant context</div>
                <div>• <strong>Real-time Updates:</strong> See changes immediately</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Command className="w-4 h-4" />
              Command Line Interface
            </h4>
            <div className="text-sm text-gray-600 space-y-2">
              <p>Great for automation, scripts, and CI/CD:</p>
              <div className="ml-4 space-y-1">
                <div>• <strong>Quick bundle generation:</strong> <code className="bg-gray-100 px-1 rounded">cntx-ui bundle master</code></div>
                <div>• <strong>Status checking:</strong> <code className="bg-gray-100 px-1 rounded">cntx-ui status</code></div>
                <div>• <strong>Scripting workflows:</strong> Integrate with build processes</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Quick CLI reference for advanced users
export function QuickCliReference() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="w-5 h-5" />
          CLI Reference
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm font-mono">
          <div className="flex items-center gap-2">
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">cntx-ui watch</code>
            <span className="text-gray-600 text-xs">Start server (already running)</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">cntx-ui status</code>
            <span className="text-gray-600 text-xs">Check configuration status</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">cntx-ui bundle [name]</code>
            <span className="text-gray-600 text-xs">Generate specific bundle</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Workflow instructions component
export function WorkflowInstructions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Common Workflows
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">🎯 For AI Development</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>1. Create focused bundles (api, ui, core)</div>
            <div>2. Hide debug/temp files from bundles</div>
            <div>3. Copy bundle XML for AI context</div>
            <div>4. Use Cursor Rules for project context</div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">📁 For Project Organization</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>1. Configure ignore patterns for unwanted files</div>
            <div>2. Create bundles by feature or responsibility</div>
            <div>3. Use hidden files to trim bundle scope</div>
            <div>4. Monitor bundle sizes and file counts</div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">🤖 For CI/CD Integration</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>1. Use CLI commands in build scripts</div>
            <div>2. Generate bundles for automated testing</div>
            <div>3. Export project context for deployment</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Installation reminder for new users
export function InstallationReminder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>First Time Setup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>
            <strong>You're all set!</strong> cntx-ui is installed and running.
            Use this web interface for full functionality.
          </AlertDescription>
        </Alert>

        <div className="text-sm text-gray-600">
          <p className="mb-2"><strong>For new projects:</strong></p>
          <div className="ml-4 space-y-1">
            <div>1. Install: <code className="bg-gray-100 px-1 rounded">npm install -g cntx-ui</code></div>
            <div>2. Initialize: <code className="bg-gray-100 px-1 rounded">cntx-ui init</code></div>
            <div>3. Start: <code className="bg-gray-100 px-1 rounded">cntx-ui watch</code></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Legacy components for backward compatibility
export const QuickSetupTips = QuickCliReference
export const UsageInstructions = WorkflowInstructions
