import { listMembers } from "@/server/members";
import { requireAdmin } from "@/server/auth";
import { Reveal } from "@/components/motion/reveal";
import { MemberTable, type MemberTableRow } from "@/components/admin/member-table";

export const metadata = {
  title: "Members · SPARK admin",
};

const JOINED = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Karachi",
});

export default async function AdminMembersPage() {
  // The layout already gates on role; this resolves *which* admin is looking,
  // so the table can mark their own row.
  const [me, members] = await Promise.all([requireAdmin(), listMembers()]);

  // Dates are formatted here rather than sent to the client component, which
  // keeps the timezone in one place and avoids rendering raw Date objects.
  const rows: MemberTableRow[] = members.map((member) => ({
    id: member.id,
    fullName: member.fullName,
    avatarUrl: member.avatarUrl,
    university: member.university,
    joinedLabel: JOINED.format(member.createdAt),
    role: member.role,
    registrationCount: member.registrationCount,
    attendedCount: member.attendedCount,
  }));

  return (
    <div>
      <Reveal>
        <p className="eyebrow mb-2">Community</p>
        <h1 className="mb-2 text-4xl font-bold">Members</h1>
        <p className="mb-8 max-w-2xl text-muted-foreground">
          Everyone with a SPARK account. Moderators can run check-in at the
          door; admins can also create events and issue certificates. You cannot
          remove your own admin access — ask another admin.
        </p>
      </Reveal>

      <Reveal delay={90}>
        <MemberTable members={rows} currentUserId={me.id} />
      </Reveal>
    </div>
  );
}
