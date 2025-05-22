// src/components/TagsMainViewer.tsx
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
  Check,
  FileText
} from "lucide-react";
import { useTags } from '@/contexts/TagContext';
import { useFiles } from '@/contexts/FileContext';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function TagsMainViewer() {
  const { tags, addTag, updateTag, deleteTag, getFilesWithTag } = useTags();
  const { watchedFiles } = useFiles();

  const [filter, setFilter] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [taggedFiles, setTaggedFiles] = useState<string[]>([]);

  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366f1');
  const [newTagDescription, setNewTagDescription] = useState('');

  const [isEditingTag, setIsEditingTag] = useState(false);
  const [editTagName, setEditTagName] = useState('');
  const [editTagColor, setEditTagColor] = useState('');
  const [editTagDescription, setEditTagDescription] = useState('');

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Filter tags based on search input
  const filteredTags = Object.entries(tags)
    .filter(([name, config]) =>
      name.toLowerCase().includes(filter.toLowerCase()) ||
      config.description?.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => a[0].localeCompare(b[0]));

  // Handle tag selection
  const handleSelectTag = (tagName: string) => {
    setSelectedTag(tagName);
    const files = getFilesWithTag(tagName);
    setTaggedFiles(files.map(file => file.path));
  };

  // Handle adding a new tag
  const handleAddTag = async () => {
    if (newTagName.trim()) {
      await addTag(newTagName.trim(), newTagColor, newTagDescription);
      setNewTagName('');
      setNewTagColor('#6366f1');
      setNewTagDescription('');
      setIsAddingTag(false);
    }
  };

  // Handle updating a tag
  const handleUpdateTag = async () => {
    if (selectedTag) {
      await updateTag(selectedTag, editTagColor, editTagDescription);
      setIsEditingTag(false);
    }
  };

  // Handle deleting a tag
  const handleDeleteTag = async () => {
    if (selectedTag) {
      await deleteTag(selectedTag);
      setSelectedTag(null);
      setTaggedFiles([]);
      setShowDeleteDialog(false);
    }
  };

  // Start editing a tag
  const startEditingTag = () => {
    if (selectedTag && tags[selectedTag]) {
      setEditTagName(selectedTag);
      setEditTagColor(tags[selectedTag].color || '#6366f1');
      setEditTagDescription(tags[selectedTag].description || '');
      setIsEditingTag(true);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tag Manager</span>
            <Button
              onClick={() => setIsAddingTag(true)}
              className="flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Tag
            </Button>
          </CardTitle>
          <CardDescription>
            Manage file tags and view tagged files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter tags..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="grid grid-cols-[300px_1fr] gap-4">
            <div>
              <ScrollArea className="h-[500px] pr-3">
                <div className="space-y-2">
                  {filteredTags.length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground">
                      No tags found
                    </div>
                  ) : (
                    filteredTags.map(([name, config]) => (
                      <div
                        key={name}
                        className={`flex items-center justify-between p-2 rounded-md border cursor-pointer hover:bg-muted ${selectedTag === name ? 'bg-muted' : ''
                          }`}
                        onClick={() => handleSelectTag(name)}
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: config.color }}
                          />
                          <span>{name}</span>
                        </div>
                        <Badge variant="outline">
                          {getFilesWithTag(name).length}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            <div>
              {selectedTag ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: tags[selectedTag]?.color || '#6366f1' }}
                        />
                        <span>{selectedTag}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={startEditingTag}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteDialog(true)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      {tags[selectedTag]?.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>Files with this tag ({taggedFiles.length})</span>
                    </div>
                    <ScrollArea className="h-[350px] w-full rounded-md border">
                      {taggedFiles.length === 0 ? (
                        <div className="text-center p-4 text-muted-foreground">
                          No files with this tag
                        </div>
                      ) : (
                        <div className="p-4">
                          {taggedFiles.map((path) => (
                            <div
                              key={path}
                              className="py-1 px-2 hover:bg-muted rounded"
                            >
                              {path}
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Select a tag to see details
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Tag Dialog */}
      <Dialog open={isAddingTag} onOpenChange={setIsAddingTag}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Tag</DialogTitle>
            <DialogDescription>
              Create a new tag to organize your files
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <label htmlFor="tag-name">Name</label>
              <Input
                id="tag-name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
              />
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <label htmlFor="tag-color">Color</label>
              <div className="flex space-x-2 items-center">
                <Input
                  id="tag-color"
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-12"
                />
                <div
                  className="w-6 h-6 rounded-full border"
                  style={{ backgroundColor: newTagColor }}
                />
              </div>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <label htmlFor="tag-description">Description</label>
              <Input
                id="tag-description"
                value={newTagDescription}
                onChange={(e) => setNewTagDescription(e.target.value)}
                placeholder="Tag description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingTag(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTag} disabled={!newTagName.trim()}>
              Add Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog open={isEditingTag} onOpenChange={setIsEditingTag}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag: {editTagName}</DialogTitle>
            <DialogDescription>
              Update the tag properties
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <label htmlFor="edit-color">Color</label>
              <div className="flex space-x-2 items-center">
                <Input
                  id="edit-color"
                  type="color"
                  value={editTagColor}
                  onChange={(e) => setEditTagColor(e.target.value)}
                  className="w-12"
                />
                <div
                  className="w-6 h-6 rounded-full border"
                  style={{ backgroundColor: editTagColor }}
                />
              </div>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <label htmlFor="edit-description">Description</label>
              <Input
                id="edit-description"
                value={editTagDescription}
                onChange={(e) => setEditTagDescription(e.target.value)}
                placeholder="Tag description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingTag(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTag}>
              Update Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tag Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the tag "{selectedTag}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTag}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
