import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDirectoryWatcher } from '@/hooks/useDirectoryWatcher';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Paintbrush, Pencil, Trash2, X, Check } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export function TagsPanel() {
  const [newTag, setNewTag] = useState('');
  const [newTagColor, setNewTagColor] = useState('#94a3b8');
  const [newTagDescription, setNewTagDescription] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editColor, setEditColor] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  const { tags, addTag, deleteTag, updateTag } = useDirectoryWatcher();

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTag(newTag.trim(), newTagColor, newTagDescription);
      setNewTag('');
      setNewTagDescription('');
      setNewTagColor('#94a3b8');
    }
  };

  const startEditing = (tagName: string) => {
    setEditingTag(tagName);
    setEditColor(tags[tagName].color || '#94a3b8');
    setEditDescription(tags[tagName].description || '');
  };

  const cancelEditing = () => {
    setEditingTag(null);
    setEditColor('');
    setEditDescription('');
  };

  const saveEdit = (tagName: string) => {
    updateTag(tagName, editColor, editDescription);
    setEditingTag(null);
  };

  const confirmDelete = (tagName: string) => {
    deleteTag(tagName);
    setTagToDelete(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paintbrush className="h-5 w-5" />
          Project Tags
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Tag name"
            />
            <div className="flex gap-2">
              <Input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-12"
              />
              <Input
                value={newTagDescription}
                onChange={(e) => setNewTagDescription(e.target.value)}
                placeholder="Tag description"
              />
            </div>
            <Button onClick={handleAddTag} disabled={!newTag.trim()}>
              Add Tag
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {Object.entries(tags).map(([tagName, { color, description }]) => (
              <div key={tagName} className="flex items-center justify-between p-2 rounded-md border">
                {editingTag === tagName ? (
                  // Edit mode
                  <div className="flex-1 flex gap-2">
                    <Input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="w-12"
                    />
                    <Input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Tag description"
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => saveEdit(tagName)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={cancelEditing}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  // View mode
                  <>
                    <div className="flex items-center gap-2">
                      <Badge
                        style={{ backgroundColor: color || '#94a3b8' }}
                        className="text-white"
                      >
                        {tagName}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {description}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditing(tagName)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setTagToDelete(tagName)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={tagToDelete !== null} onOpenChange={() => setTagToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tag? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => tagToDelete && confirmDelete(tagToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
