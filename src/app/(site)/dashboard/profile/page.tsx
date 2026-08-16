import { getMemberOverview } from "@/server/events";
import { createClient } from "@/lib/supabase/server";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/dashboard/profile-form";

export const metadata = {
  title: "Profile · SPARK",
};

const ROLE_LABEL: Record<string, string> = {
  member: "Member",
  moderator: "Moderator",
  admin: "Admin",
};

export default async function ProfilePage() {
  const { profile } = await getMemberOverview();

  // Email lives in Supabase Auth, not in `profiles`. Read from the verified
  // claims rather than trusting anything the client could supply.
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = (data?.claims?.email as string | undefined) ?? null;

  return (
    <div>
      <Reveal>
        <p className="eyebrow mb-2">Your details</p>
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-bold">Profile</h1>
          <Badge variant="outline">
            {ROLE_LABEL[profile.role] ?? profile.role}
          </Badge>
        </div>
        <p className="mb-8 max-w-xl text-muted-foreground">
          Your name is what appears on certificates and on the door list at
          events, so keep it as you would want it printed. Everything else is
          optional.
        </p>
      </Reveal>

      <Reveal delay={90}>
        <ProfileForm
          initial={{
            fullName: profile.fullName,
            university: profile.university,
            degree: profile.degree,
            phone: profile.phone,
            gradYear: profile.gradYear,
            bio: profile.bio,
          }}
          email={email}
        />
      </Reveal>
    </div>
  );
}
