import { organization, organizationMember } from '@/lib/db/schema';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { auth } from '@/app/(auth)/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function OrganizationSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  // Get the user's organization membership
  const [membership] = await db
    .select()
    .from(organizationMember)
    .where(eq(organizationMember.userId, session.user.id))
    .limit(1);

  if (!membership) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Organization</CardTitle>
            <CardDescription>You are not a member of any organization.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Get the organization details
  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, membership.organizationId))
    .limit(1);

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>View and manage your organization settings</CardDescription>
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
    </div>
  );
}
