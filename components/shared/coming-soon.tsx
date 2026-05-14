import { Sparkles } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description?: string;
  phase?: string;
}

export function ComingSoon({ title, description, phase }: ComingSoonProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 px-8 py-20 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
        <Sparkles className="size-6" aria-hidden />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="max-w-md text-balance text-sm text-muted-foreground">{description}</p>
        )}
        {phase && (
          <span className="mt-2 inline-flex items-center justify-center gap-1 text-xs font-medium text-brand-700">
            arrive en {phase}
          </span>
        )}
      </div>
    </div>
  );
}
