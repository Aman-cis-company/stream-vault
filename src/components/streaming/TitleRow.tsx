import type { Title } from "@/lib/mock-data";
import { TitleCard } from "./TitleCard";

export function TitleRow({ heading, titles }: { heading?: string; titles: Title[] }) {
  if (!titles?.length) return null;
  return (
    <section className="space-y-3">
      {heading && <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{heading}</h2>}
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2 sm:gap-4">
        {titles?.map((t) => (
          <TitleCard key={t.id} title={t} />
        ))}
      </div>
    </section>
  );
}
