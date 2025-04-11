import { useState, useEffect } from 'react';

export function useOrganizationName(orgId: string | null) {
  const [orgName, setOrgName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!orgId) {
      console.log('🟡 useOrganizationName - No orgId provided');
      setOrgName(null);
      return;
    }

    const fetchOrgName = async () => {
      console.log('🟡 useOrganizationName - Fetching organization name for orgId:', orgId);
      setIsLoading(true);
      try {
        const response = await fetch(`/api/organizations/${orgId}`);
        const data = await response.json();
        console.log('🟡 useOrganizationName - Response data:', data);
        setOrgName(data.name || null);
      } catch (error) {
        console.error('🟡 useOrganizationName - Failed to fetch organization name:', error);
        setOrgName(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrgName();
  }, [orgId]);

  return { orgName, isLoading };
}
