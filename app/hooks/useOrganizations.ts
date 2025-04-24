import { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/use-admin";

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAdmin } = useAdmin();

  useEffect(() => {
    if (!isAdmin) {
      setOrganizations([]);
      return;
    }

    const fetchOrganizations = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/organizations");
        if (!response.ok) {
          throw new Error("Failed to fetch organizations");
        }
        const data = await response.json();
        setOrganizations(data.organizations);
      } catch (error) {
        console.error("Failed to fetch organizations:", error);
        setOrganizations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, [isAdmin]);

  return { organizations, isLoading };
}
