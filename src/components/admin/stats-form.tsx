"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createStatAction,
  deleteStatAction,
  updateStatAction,
} from "@/app/(site)/admin/stats/actions";

export type StatRow = {
  key: string;
  label: string;
  value: string;
  updatedAt: string | null;
};

function Row({ stat }: { stat: StatRow }) {
  const [label, setLabel] = useState(stat.label);
  const [value, setValue] = useState(stat.value);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const dirty = label !== stat.label || value !== stat.value;

  function save() {
    setError(null);
    setSaved(false);
    start(async () => {
      const result = await updateStatAction(stat.key, { label, value });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  function remove() {
    setError(null);
    start(async () => {
      const result = await deleteStatAction(stat.key);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border bg-white/5 p-4">
      <div className="grid gap-3 sm:grid-cols-[7rem_1fr_auto]">
        <div>
          <Label htmlFor={`v-${stat.key}`} className="text-xs">
            Figure
          </Label>
          <Input
            id={`v-${stat.key}`}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSaved(false);
            }}
            className="mt-1 font-mono"
            placeholder="500+"
          />
        </div>

        <div>
          <Label htmlFor={`l-${stat.key}`} className="text-xs">
            Label
          </Label>
          <Input
            id={`l-${stat.key}`}
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              setSaved(false);
            }}
            className="mt-1"
            placeholder="Student members"
          />
        </div>

        <div className="flex items-end gap-2">
          <Button
            type="button"
            onClick={save}
            disabled={!dirty || pending}
            className="gap-1.5"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : saved && !dirty ? (
              <Check className="size-4" />
            ) : null}
            {saved && !dirty ? "Saved" : "Save"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={remove}
            disabled={pending}
            aria-label={`Remove ${stat.label}`}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <p className="mt-2 text-xs text-muted-foreground">
        Shows as{" "}
        <span className="text-foreground">
          {value || "—"} {label || "—"}
        </span>
        . The figure counts up on screen, so a leading number works best.
      </p>
    </div>
  );
}

export function StatsForm({ stats }: { stats: StatRow[] }) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function add() {
    setError(null);
    start(async () => {
      const result = await createStatAction({ label, value });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLabel("");
      setValue("");
      setAdding(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {stats.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-muted-foreground">
            No figures, so the section is hidden from the homepage entirely.
          </p>
        </div>
      )}

      {stats.map((stat) => (
        <Row key={stat.key} stat={stat} />
      ))}

      {adding ? (
        <div className="rounded-xl border border-primary/40 bg-white/5 p-4">
          <div className="grid gap-3 sm:grid-cols-[7rem_1fr_auto]">
            <div>
              <Label htmlFor="new-value" className="text-xs">
                Figure
              </Label>
              <Input
                id="new-value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="mt-1 font-mono"
                placeholder="12"
              />
            </div>
            <div>
              <Label htmlFor="new-label" className="text-xs">
                Label
              </Label>
              <Input
                id="new-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="mt-1"
                placeholder="Sessions run"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="button" onClick={add} disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : "Add"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setAdding(false);
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setAdding(true)}
          className="gap-2"
        >
          <Plus className="size-4" />
          Add a figure
        </Button>
      )}
    </div>
  );
}
