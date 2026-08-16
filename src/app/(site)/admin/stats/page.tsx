import { getSiteStats } from "@/server/stats";
import { StatsForm } from "@/components/admin/stats-form";

export const metadata = {
  title: "Homepage figures · SPARK",
};

export default async function AdminStatsPage() {
  const stats = await getSiteStats();

  return (
    <div>
      <p className="eyebrow mb-2">Homepage</p>
      <h1 className="mb-2 text-4xl font-bold">Impact figures</h1>
      <p className="mb-6 max-w-2xl text-muted-foreground">
        The numbers under &ldquo;So far&rdquo; on the homepage. Remove them all
        and the section disappears rather than showing an empty row.
      </p>

      <div className="mb-8 max-w-2xl rounded-xl border border-border bg-white/5 p-4 text-sm text-muted-foreground">
        These are public claims about the organisation, and the people most
        likely to check them are exactly the ones you want to impress: partner
        schools, sponsors, and universities. A figure you cannot point at
        evidence for costs more than leaving it out.
      </div>

      <div className="max-w-3xl">
        <StatsForm
          stats={stats.map((stat) => ({
            key: stat.key,
            label: stat.label,
            value: stat.value,
            updatedAt: stat.updatedAt?.toISOString() ?? null,
          }))}
        />
      </div>
    </div>
  );
}
