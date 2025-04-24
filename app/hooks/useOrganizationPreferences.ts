import { useState, useEffect } from "react";

interface OrganizationPreferences {
  greetingTitle: string;
  greetingSubtitle: string;
  chatSuggestedTopics: string[];
}

export function useOrganizationPreferences(orgId: string | null) {
  const [preferences, setPreferences] =
    useState<OrganizationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!orgId) {
      setPreferences(null);
      return;
    }

    const fetchPreferences = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/organization/preferences?organizationId=${orgId}`
        );
        const data = await response.json();
        setPreferences(data);
      } catch (error) {
        console.error("Failed to fetch organization preferences:", error);
        setPreferences(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [orgId]);

  return { preferences, isLoading };
}
