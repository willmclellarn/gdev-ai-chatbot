import { Sidebar } from "@/components/settings/sidebar";
import { NavigationLoading } from "@/components/navigation-loading";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <NavigationLoading />
        {children}
      </main>
    </div>
  );
}
