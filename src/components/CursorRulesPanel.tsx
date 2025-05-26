// src/components/CursorRulesPanel.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  FileText,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Plus,
  FolderOpen
} from 'lucide-react';
import { useCursorRules } from '@/contexts/CursorRulesContext';
import { getExampleCursorRules } from '@/utils/cursor-rules';

export function CursorRulesPanel() {
  const {
    rulesContent,
    rulesLocation,
    filePath,
    hasExistingRules,
    isLoading,
    error,
    saveRules,
    createNewRules,
    clearError
  } = useCursorRules();

  const [editableContent, setEditableContent] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLocationChoice, setShowLocationChoice] = useState(false);

  // Initialize editable content when rules load
  useEffect(() => {
    setEditableContent(rulesContent);
    setHasChanges(false);
  }, [rulesContent]);

  const handleContentChange = (value: string) => {
    setEditableContent(value);
    setHasChanges(value !== rulesContent);
    clearError();
  };

  const handleSave = async () => {
    try {
      await saveRules(editableContent);
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving rules:', err);
    }
  };

  const handleCreateNew = async (location: 'cursorrules-file' | 'cursor-directory') => {
    try {
      await createNewRules(editableContent, location);
      setHasChanges(false);
      setSaveSuccess(true);
      setShowLocationChoice(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error creating rules:', err);
    }
  };

  const handleLoadExample = () => {
    const exampleRules = getExampleCursorRules();
    setEditableContent(exampleRules.rules.join('\n'));
    setHasChanges(true);
  };

  const getLocationDisplayName = (location: string) => {
    switch (location) {
      case 'cursorrules-file':
        return '.cursorrules file';
      case 'cursor-directory':
        return '.cursor directory';
      default:
        return 'Unknown location';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Cursor Rules
          </CardTitle>
          <CardDescription>
            Manage your Cursor AI rules directly. Changes are saved to your actual Cursor configuration files.
          </CardDescription>
        </CardHeader>
        <CardContent>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {saveSuccess && (
            <Alert className="border-green-600 bg-green-50 dark:bg-green-950/20 mb-4">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                Cursor rules saved successfully to {filePath}
              </AlertDescription>
            </Alert>
          )}

          {/* Status Section */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30 mb-4">
            <div className="flex items-center gap-2">
              {hasExistingRules ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <span className="font-medium">Cursor rules found</span>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span>Location: </span>
                      <code className="bg-muted px-1 rounded text-xs">{filePath}</code>
                      <span className="ml-2 text-xs opacity-75">
                        ({getLocationDisplayName(rulesLocation)})
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <div>
                    <span className="font-medium">No Cursor rules found</span>
                    <div className="text-sm text-muted-foreground mt-1">
                      Create new rules to get started
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Rules Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                {hasExistingRules ? `Edit ${filePath}` : 'Create Cursor Rules'}
              </label>

              {!hasExistingRules && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadExample}
                  className="text-xs"
                  disabled={isLoading}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Load Example
                </Button>
              )}
            </div>

            <Textarea
              value={editableContent}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder={hasExistingRules
                ? "Loading your Cursor rules..."
                : "Enter your Cursor rules here, or click 'Load Example' to get started..."
              }
              className="min-h-[400px] font-mono text-sm"
              disabled={isLoading}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasExistingRules ? (
                  <Button
                    onClick={handleSave}
                    disabled={!hasChanges || !editableContent.trim() || isLoading}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowLocationChoice(true)}
                    disabled={!editableContent.trim() || isLoading}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Create Rules
                  </Button>
                )}
              </div>

              {hasChanges && (
                <div className="text-sm text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Unsaved changes
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-muted/30 rounded-lg p-4 mt-6">
            <h4 className="text-sm font-medium mb-2">Direct Management</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Cntx edits your actual Cursor configuration files</p>
              <p>• Changes immediately affect both Cursor and cntx</p>
              <p>• No import/export needed - just direct editing</p>
              <p>• Supports both .cursorrules and .cursor/rules formats</p>
              <p>• Files are saved exactly where Cursor expects them</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Choice Dialog for New Rules */}
      <Dialog open={showLocationChoice} onOpenChange={setShowLocationChoice}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Rules Location</DialogTitle>
            <DialogDescription>
              Where would you like to store your Cursor rules?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Button
              onClick={() => handleCreateNew('cursorrules-file')}
              className="w-full justify-start h-auto p-4"
              variant="outline"
              disabled={isLoading}
            >
              <FileText className="h-5 w-5 mr-3 flex-shrink-0" />
              <div className="text-left flex-1">
                <div className="font-medium">.cursorrules</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Single file in project root (most common)
                </div>
              </div>
            </Button>

            <Button
              onClick={() => handleCreateNew('cursor-directory')}
              className="w-full justify-start h-auto p-4"
              variant="outline"
              disabled={isLoading}
            >
              <FolderOpen className="h-5 w-5 mr-3 flex-shrink-0" />
              <div className="text-left flex-1">
                <div className="font-medium">.cursor/rules</div>
                <div className="text-xs text-muted-foreground mt-1">
                  File in .cursor directory (allows multiple config files)
                </div>
              </div>
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLocationChoice(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
