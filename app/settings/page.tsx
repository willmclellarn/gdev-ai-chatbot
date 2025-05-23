"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { Loading } from "@/components/loading";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSeed = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/seed", {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        alert("Successfully seeded data!");
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert("Failed to seed data");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">General Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Database Actions</CardTitle>
          <CardDescription>
            Manage your database and perform administrative actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSeed}>Seed Organization Data</Button>
        </CardContent>
      </Card>
    </div>
  );
}
