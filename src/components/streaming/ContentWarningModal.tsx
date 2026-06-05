import type { ContentRating, WarningFlag } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AgeRatingBadge } from "./AgeRatingBadge";
import { ShieldAlert, Swords, MessageSquareWarning, Flame, Eye } from "lucide-react";

const FLAG_META: Record<WarningFlag, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  violence:        { label: "Violence",        Icon: Swords },
  strong_language: { label: "Strong Language", Icon: MessageSquareWarning },
  mature_themes:   { label: "Mature Themes",   Icon: Flame },
  nudity:          { label: "Nudity",           Icon: Eye },
};

interface Props {
  open: boolean;
  title: string;
  contentRating?: ContentRating | null;
  warningFlags?: WarningFlag[] | string | null;
  minimumAge?: number | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ContentWarningModal({
  open,
  title,
  contentRating,
  warningFlags,
  minimumAge,
  onConfirm,
  onCancel,
}: Props) {
  const flags: WarningFlag[] = (() => {
    if (!warningFlags) return [];
    if (Array.isArray(warningFlags)) return warningFlags.filter((f) => FLAG_META[f as WarningFlag]);
    if (typeof warningFlags === "string") {
      try {
        const parsed = JSON.parse(warningFlags);
        return Array.isArray(parsed) ? parsed.filter((f: unknown) => FLAG_META[f as WarningFlag]) : [];
      } catch { return []; }
    }
    return [];
  })();

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex size-10 items-center justify-center rounded-full bg-red-500/15">
              <ShieldAlert className="size-5 text-red-400" />
            </div>
            <DialogTitle className="text-xl">Content Warning</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{title}</strong> contains content
            that may not be suitable for all audiences.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {contentRating && <AgeRatingBadge rating={contentRating} />}
            {minimumAge && (
              <span className="text-xs text-muted-foreground">
                Suitable for {minimumAge}+ years
              </span>
            )}
          </div>

          {flags.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                This title contains
              </p>
              <div className="flex flex-wrap gap-2">
                {flags.map((flag) => {
                  const { label, Icon } = FLAG_META[flag];
                  return (
                    <span
                      key={flag}
                      className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-400"
                    >
                      <Icon className="size-3" />
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            By continuing, you confirm you are old enough to view this content and
            consent to watching it.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onCancel}>Go Back</Button>
          <Button onClick={onConfirm}>Continue Watching</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
