'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Prompt } from '@/lib/db/schema';
import { useUserId, useUserOrg } from '@/app/hooks/useAuth';
import { useOrganizationName } from '@/app/hooks/useOrganizationName';

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const userId = useUserId();
  const orgIds = useUserOrg();

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/prompts');
      const data = await response.json();
      setPrompts(data);
    } catch (error) {
      toast.error('Failed to fetch prompts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    if (!userId || !orgIds) {
      toast.error('User or organization information not available');
      return;
    }

    if (orgIds.length === 0) {
      toast.error('No organization found');
      return;
    }

    setEditingPrompt({
      id: '',
      title: '',
      description: '',
      content: '',
      userId,
      organizationId: orgIds[0],
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setSelectedOrgId(orgIds[0]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrompt || !userId || !selectedOrgId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingPrompt.id || undefined,
          title: editingPrompt.title,
          content: editingPrompt.content,
          description: editingPrompt.description || '',
          userId,
          organizationId: selectedOrgId,
        }),
      });

      if (!response.ok) throw new Error('Failed to save prompt');

      toast.success('Prompt saved successfully');
      setEditingPrompt(null);
      setSelectedOrgId(null);
      fetchPrompts();
    } catch (error) {
      toast.error('Failed to save prompt');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Manage Prompts</h1>

      <div className="flex justify-end mb-6">
        <Button onClick={handleCreateNew}>
          Create New Prompt
        </Button>
      </div>

      <div className="grid gap-6">
        {prompts.map((prompt) => (
          <Card key={prompt.id}>
            <CardHeader>
              <CardTitle>{prompt.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {prompt.description && (
                  <p className="text-sm text-gray-500">{prompt.description}</p>
                )}
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="whitespace-pre-wrap text-sm">{prompt.content}</pre>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Organization: {prompt.organizationId ? <OrganizationName orgId={prompt.organizationId} /> : 'None'}</span>
                  <span>Created: {new Date(prompt.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingPrompt(prompt);
                      setSelectedOrgId(prompt.organizationId);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>{editingPrompt.id ? 'Edit Prompt' : 'Create New Prompt'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                {orgIds.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Organization</label>
                    <Select
                      value={selectedOrgId || ''}
                      onValueChange={setSelectedOrgId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {orgIds.map((orgId) => (
                          <SelectItem key={orgId} value={orgId}>
                            Organization {orgId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input
                    value={editingPrompt.title}
                    onChange={(e) =>
                      setEditingPrompt({ ...editingPrompt, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input
                    value={editingPrompt.description || ''}
                    onChange={(e) =>
                      setEditingPrompt({
                        ...editingPrompt,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Content</label>
                  <Textarea
                    value={editingPrompt.content}
                    onChange={(e) =>
                      setEditingPrompt({
                        ...editingPrompt,
                        content: e.target.value,
                      })
                    }
                    className="min-h-[200px]"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingPrompt(null);
                      setSelectedOrgId(null);
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function OrganizationName({ orgId }: { orgId: string }) {
  const { orgName, isLoading } = useOrganizationName(orgId);
  return isLoading ? 'Loading...' : orgName || 'Unknown';
}
