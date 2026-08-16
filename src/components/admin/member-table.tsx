"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, TriangleAlert } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateMemberRoleAction } from "@/app/(site)/admin/members/actions";

export type MemberTableRow = {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  university: string | null;
  /** Pre-formatted on the server — raw Dates are never rendered. */
  joinedLabel: string;
  role: string;
  registrationCount: number;
  attendedCount: number;
};

type Props = {
  members: MemberTableRow[];
  /** Used to mark the signed-in admin's own row. */
  currentUserId: string;
};

const ROLE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  editor: "secondary",
  moderator: "secondary",
  member: "outline",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  editor: "Editor",
  moderator: "Moderator",
  member: "Member",
};

function initials(name: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function MemberTable({ members, currentUserId }: Props) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Roles echo back optimistically so the select does not snap back to the old
  // value while the server round-trip and revalidation are in flight.
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return members;
    return members.filter(
      (member) =>
        (member.fullName ?? "").toLowerCase().includes(needle) ||
        (member.university ?? "").toLowerCase().includes(needle),
    );
  }, [members, query]);

  function changeRole(userId: string, role: string) {
    setError(null);
    setSavingId(userId);
    setOverrides((prev) => ({ ...prev, [userId]: role }));

    startTransition(async () => {
      const result = await updateMemberRoleAction(userId, role);
      setSavingId(null);

      if (!result.ok) {
        // Roll the select back to the truth, then say why loudly. The
        // self-demotion refusal is a deliberate lockout guard, so it must not
        // look like a transient glitch.
        setOverrides((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or university"
            aria-label="Search members"
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {filtered.length} of {members.length}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Role not changed</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>University</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Registered</TableHead>
              <TableHead className="text-right">Attended</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  No member matches “{query}”.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((member) => {
                const role = overrides[member.id] ?? member.role;
                const isSelf = member.id === currentUserId;

                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          {member.avatarUrl && (
                            <AvatarImage src={member.avatarUrl} alt="" />
                          )}
                          <AvatarFallback className="text-xs">
                            {initials(member.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {member.fullName ?? "Unnamed member"}
                          </p>
                          {isSelf && (
                            <p className="text-xs text-muted-foreground">You</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.university ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {member.joinedLabel}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {member.registrationCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {member.attendedCount}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={ROLE_VARIANT[role] ?? "outline"}>
                          {ROLE_LABEL[role] ?? role}
                        </Badge>
                        <Select
                          value={role}
                          disabled={savingId === member.id}
                          onValueChange={(next) => {
                            if (next !== role) changeRole(member.id, next);
                          }}
                        >
                          <SelectTrigger
                            size="sm"
                            className="w-32"
                            aria-label={`Role for ${member.fullName ?? "member"}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
