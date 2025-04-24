"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Loading } from "@/components/loading";

export default function OrganizationSettingsPage() {
  const [org, setOrg] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch("/api/organization");
        if (!response.ok) {
          throw new Error("Failed to fetch organization");
        }
        const data = await response.json();
        setOrg(data.organization);
        setMembership(data.membership);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganization();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Organization</CardTitle>
            <CardDescription>
              You are not a member of any organization.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            View and manage your organization settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Organization Name</h3>
            <p className="text-sm text-muted-foreground">{org.name}</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Your Role</h3>
            <Badge variant="secondary">{membership.role}</Badge>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Member Since</h3>
            <p className="text-sm text-muted-foreground">
              {new Date(membership.createdAt).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Greeting Settings</CardTitle>
          <CardDescription>
            Customize the greeting message for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GreetingSettings organizationId={org.id} />
        </CardContent>
        <CardContent>
          <ChatSuggestedTopicsSettings organizationId={org.id} />
        </CardContent>
      </Card>
    </div>
  );
}

function GreetingSettings({ organizationId }: { organizationId: string }) {
  const [greetingTitle, setGreetingTitle] = useState("");
  const [greetingSubtitle, setGreetingSubtitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch(
          `/api/organization/preferences?organizationId=${organizationId}`
        );
        const data = await response.json();
        setGreetingTitle(data.greetingTitle);
        setGreetingSubtitle(data.greetingSubtitle);
      } catch (error) {
        console.error("Failed to fetch preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [organizationId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/organization/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          greetingTitle,
          greetingSubtitle,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Greeting Title</label>
        <Input
          value={greetingTitle}
          onChange={(e) => setGreetingTitle(e.target.value)}
          placeholder="Hello there!"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Greeting Subtitle</label>
        <Input
          value={greetingSubtitle}
          onChange={(e) => setGreetingSubtitle(e.target.value)}
          placeholder="How can I help you today?"
        />
      </div>
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}

function ChatSuggestedTopicsSettings({
  organizationId,
}: {
  organizationId: string;
}) {
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch(
          `/api/organization/preferences?organizationId=${organizationId}`
        );
        const data = await response.json();
        setTopics(data.chatSuggestedTopics || []);
      } catch (error) {
        console.error("Failed to fetch preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [organizationId]);

  const handleAddTopic = () => {
    if (newTopic.trim()) {
      setTopics([...topics, newTopic.trim()]);
      setNewTopic("");
    }
  };

  const handleRemoveTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/organization/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, chatSuggestedTopics: topics }),
      });
      if (!response.ok) throw new Error("Failed to save preferences");
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Suggested Topics</label>
        <div className="space-y-2">
          {topics.map((topic, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input value={topic} readOnly />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleRemoveTopic(index)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Enter a new topic"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddTopic();
                }
              }}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddTopic}
              disabled={!newTopic.trim()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
