'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Settings,
  Users,
  Database,
  Shield,
  Bell,
  Mail,
  Building2,
  ArrowLeft,
  MessageSquare,
} from 'lucide-react';

const sidebarNavItems = [
  {
    title: 'General',
    href: '/settings',
    icon: Settings,
  },
  {
    title: 'Organization',
    href: '/settings/organization',
    icon: Building2,
  },
  {
    title: 'Database',
    href: '/settings/database',
    icon: Database,
  },
  {
    title: 'Security',
    href: '/settings/security',
    icon: Shield,
  },
  {
    title: 'Notifications',
    href: '/settings/notifications',
    icon: Bell,
  },
  {
    title: 'Email',
    href: '/settings/email',
    icon: Mail,
  },
  {
    title: 'Prompts',
    href: '/settings/prompts',
    icon: MessageSquare,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r bg-background flex flex-col h-full">
      <div className="space-y-4 py-4 flex-1">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 mb-4 px-4">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h2 className="text-lg font-semibold tracking-tight">
              Settings
            </h2>
          </div>
          <div className="space-y-1">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
                    pathname === item.href
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <div className="p-4 border-t">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent text-muted-foreground hover:text-foreground"
        >
          <MessageSquare className="h-4 w-4" />
          Back to Chats
        </Link>
      </div>
    </div>
  );
}
