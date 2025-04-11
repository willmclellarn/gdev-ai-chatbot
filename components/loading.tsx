import { LoaderIcon } from './icons';

export function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin">
          <LoaderIcon size={24} />
        </div>
        <div className="text-muted-foreground">Loading...</div>
      </div>
    </div>
  );
}
