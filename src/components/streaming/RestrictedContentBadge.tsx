import { ShieldAlert } from "lucide-react";

interface Props {
  minimumAge?: number | null;
  className?: string;
}

export function RestrictedContentBadge({ minimumAge, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border border-red-500/40 bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-400 ${className}`}
    >
      <ShieldAlert className="size-3" />
      {minimumAge ? `${minimumAge}+` : "Restricted"}
    </span>
  );
}
