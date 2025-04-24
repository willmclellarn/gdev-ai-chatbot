import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface RagChunkValidationProps {
  issues: string[];
  chunkPositions: { start: number; end: number }[];
}

export function RagChunkValidation({
  issues,
  chunkPositions,
}: RagChunkValidationProps) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Chunk Validation Issues</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1">
            {issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>

      {chunkPositions.length > 0 && (
        <div className="text-sm text-muted-foreground">
          <p>Chunk positions:</p>
          <ul className="list-disc list-inside space-y-1">
            {chunkPositions.map((pos, index) => (
              <li key={index}>
                Chunk {index + 1}: Start at {pos.start}, End at {pos.end}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
