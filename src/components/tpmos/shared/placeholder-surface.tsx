"use client";

import { cn } from "@/lib/utils";
import { Construction, ArrowRight } from "lucide-react";

interface PlaceholderSurfaceProps {
  title: string;
  phase: string;
  plannedFeatures: string[];
  prdSection?: string;
  className?: string;
}

export function PlaceholderSurface({
  title,
  phase,
  plannedFeatures,
  prdSection,
  className,
}: PlaceholderSurfaceProps) {
  return (
    <div
      className={cn(
        "flex flex-1 items-center justify-center p-8",
        className
      )}
    >
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted">
          <Construction className="size-6 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <div className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Coming in {phase}
          </div>
        </div>

        <div className="space-y-2 text-left">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Planned features
          </p>
          <ul className="space-y-1.5">
            {plannedFeatures.map((feature, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <ArrowRight className="mt-0.5 size-3 shrink-0 text-primary/60" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {prdSection && (
          <a
            href={`https://github.com/ItssooverWeRsoBack/TPMOS/blob/main/docs/PRD.md#${prdSection}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary/70 underline underline-offset-4 hover:text-primary"
          >
            Read the spec
          </a>
        )}
      </div>
    </div>
  );
}
