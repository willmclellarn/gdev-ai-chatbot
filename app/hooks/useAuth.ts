'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export function useUserId() {
  const { data: session } = useSession();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      setUserId(session.user.id);
    }
  }, [session]);

  return userId;
}

export function useUserOrg() {
  const { data: session } = useSession();
  const [orgIds, setOrgIds] = useState<string[]>([]);

  useEffect(() => {
    if (session?.user?.orgIds) {
      setOrgIds(session.user.orgIds);
    }
  }, [session]);

  return orgIds;
}
