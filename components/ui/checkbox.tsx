import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <div className="flex items-center space-x-2">
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary",
        className
      )}
      ref={ref}
      {...props}
    />
    <Check className="h-4 w-4 text-primary" />
  </div>
));
Checkbox.displayName = "Checkbox";

export { Checkbox };
