"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import {
  FIELD_SOURCE_LABELS,
  type TemplateField,
  type TemplateFieldSource,
} from "@/lib/certificate-types";
import { CertificateRender } from "@/components/certificates/certificate-render";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveTemplateAction } from "@/app/admin/certificates/actions";

const CANVAS_WIDTH = 760;

const SAMPLE = {
  recipient_name: "Ayesha Khan",
  event_title: "SPARKx Talk — Building for the Digital Age",
  event_date: "27 October 2025",
  certificate_code: "SPARK-A7K2-9QX4",
  issued_date: "15 August 2026",
};

type Props = {
  templateId: string;
  initialName: string;
  backgroundUrl: string;
  backgroundWidth: number;
  backgroundHeight: number;
  initialFields: TemplateField[];
};

export function TemplateDesigner({
  templateId,
  initialName,
  backgroundUrl,
  backgroundWidth,
  backgroundHeight,
  initialFields,
}: Props) {
  const [name, setName] = useState(initialName);
  const [fields, setFields] = useState<TemplateField[]>(initialFields);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialFields[0]?.id ?? null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const router = useRouter();

  const selected = fields.find((f) => f.id === selectedId) ?? null;
  const canvasHeight = (CANVAS_WIDTH * backgroundHeight) / backgroundWidth;

  function patch(id: string, changes: Partial<TemplateField>) {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...changes } : f)),
    );
  }

  /* ── Dragging ────────────────────────────────────────────────────────
     Pointer events rather than HTML5 drag-and-drop: DnD has no useful
     positioning during the drag and shows a ghost image we do not want. */

  function onPointerDown(e: React.PointerEvent, field: TemplateField) {
    e.preventDefault();
    setSelectedId(field.id);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      id: field.id,
      dx: (e.clientX - rect.left) / rect.width - field.x,
      dy: (e.clientY - rect.top) / rect.height - field.y,
    };
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;

    const x = (e.clientX - rect.left) / rect.width - drag.dx;
    const y = (e.clientY - rect.top) / rect.height - drag.dy;

    patch(drag.id, {
      // Clamped so a field can never be dragged off the artwork and lost.
      x: Math.min(1, Math.max(0, Number(x.toFixed(4)))),
      y: Math.min(1, Math.max(0, Number(y.toFixed(4)))),
    });
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  /* ── Field list ──────────────────────────────────────────────────── */

  function addField() {
    const field: TemplateField = {
      id: crypto.randomUUID(),
      source: "static",
      text: "New text",
      x: 0.5,
      y: 0.5,
      fontSize: 0.03,
      color: "#1a1030",
      align: "center",
      weight: 500,
      family: "sans",
    };
    setFields((prev) => [...prev, field]);
    setSelectedId(field.id);
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveTemplateAction(templateId, { name, fields });
      if (result.ok) {
        setMessage("Saved");
        router.refresh();
      } else {
        setMessage(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      {/* Canvas */}
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Template name"
            className="h-10 max-w-xs"
          />
          <Button onClick={save} disabled={pending} className="gap-2">
            <Save className="size-4" />
            {pending ? "Saving…" : "Save template"}
          </Button>
          {message && (
            <span
              className={`text-sm ${
                message === "Saved" ? "text-emerald-400" : "text-destructive"
              }`}
            >
              {message}
            </span>
          )}
        </div>

        <div
          ref={canvasRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative touch-none overflow-hidden rounded-xl border border-border shadow-2xl"
          style={{ width: CANVAS_WIDTH, height: canvasHeight, maxWidth: "100%" }}
        >
          <CertificateRender
            backgroundUrl={backgroundUrl}
            backgroundWidth={backgroundWidth}
            backgroundHeight={backgroundHeight}
            fields={fields}
            values={SAMPLE}
            width={CANVAS_WIDTH}
          />

          {/* Drag handles sit above the render so the preview stays pixel-exact
              with what recipients actually get. */}
          {fields.map((field) => (
            <button
              key={field.id}
              type="button"
              onPointerDown={(e) => onPointerDown(e, field)}
              aria-label={`Move ${FIELD_SOURCE_LABELS[field.source]}`}
              className={`absolute cursor-move rounded px-6 py-3 transition-colors ${
                selectedId === field.id
                  ? "bg-primary/20 ring-2 ring-primary"
                  : "ring-1 ring-transparent hover:bg-primary/10 hover:ring-primary/40"
              }`}
              style={{
                left: `${field.x * 100}%`,
                top: `${field.y * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Drag any field to reposition it. The preview uses sample data — real
          values are filled in at issue time.
        </p>
      </div>

      {/* Inspector */}
      <div className="w-full shrink-0 xl:w-80">
        <div className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="eyebrow">Fields</span>
            <Button size="sm" variant="ghost" onClick={addField} className="gap-1.5">
              <Plus className="size-3.5" /> Add
            </Button>
          </div>

          <div className="mb-4 flex flex-col gap-1">
            {fields.map((field) => (
              <div
                key={field.id}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                  selectedId === field.id ? "bg-primary/15" : "hover:bg-white/5"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(field.id)}
                  className="min-w-0 flex-1 truncate text-left"
                >
                  {field.source === "static"
                    ? (field.text ?? "Fixed text")
                    : FIELD_SOURCE_LABELS[field.source]}
                </button>
                <button
                  type="button"
                  onClick={() => removeField(field.id)}
                  aria-label="Remove field"
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          {selected && (
            <div className="space-y-3 border-t border-border pt-4">
              <div>
                <Label className="text-xs">Content</Label>
                <select
                  value={selected.source}
                  onChange={(e) =>
                    patch(selected.id, {
                      source: e.target.value as TemplateFieldSource,
                    })
                  }
                  className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                >
                  {Object.entries(FIELD_SOURCE_LABELS).map(([value, label]) => (
                    <option key={value} value={value} className="bg-popover">
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {selected.source === "static" && (
                <div>
                  <Label className="text-xs">Text</Label>
                  <Input
                    value={selected.text ?? ""}
                    onChange={(e) => patch(selected.id, { text: e.target.value })}
                    className="mt-1 h-9"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Size</Label>
                  <Input
                    type="number"
                    step={0.005}
                    min={0.008}
                    max={0.3}
                    value={selected.fontSize}
                    onChange={(e) =>
                      patch(selected.id, { fontSize: Number(e.target.value) })
                    }
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Weight</Label>
                  <select
                    value={selected.weight}
                    onChange={(e) =>
                      patch(selected.id, { weight: Number(e.target.value) })
                    }
                    className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                  >
                    {[300, 400, 500, 600, 700, 800].map((w) => (
                      <option key={w} value={w} className="bg-popover">
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Colour</Label>
                  <input
                    type="color"
                    value={selected.color}
                    onChange={(e) => patch(selected.id, { color: e.target.value })}
                    className="mt-1 h-9 w-full cursor-pointer rounded-md border border-input bg-transparent"
                  />
                </div>
                <div>
                  <Label className="text-xs">Align</Label>
                  <select
                    value={selected.align}
                    onChange={(e) =>
                      patch(selected.id, {
                        align: e.target.value as TemplateField["align"],
                      })
                    }
                    className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                  >
                    {["left", "center", "right"].map((a) => (
                      <option key={a} value={a} className="bg-popover">
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs">Typeface</Label>
                <select
                  value={selected.family}
                  onChange={(e) =>
                    patch(selected.id, {
                      family: e.target.value as TemplateField["family"],
                    })
                  }
                  className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                >
                  <option value="display" className="bg-popover">
                    Display
                  </option>
                  <option value="sans" className="bg-popover">
                    Body
                  </option>
                  <option value="mono" className="bg-popover">
                    Mono
                  </option>
                </select>
              </div>

              <p className="pt-1 font-mono text-[0.6875rem] text-muted-foreground">
                x {(selected.x * 100).toFixed(1)}% · y {(selected.y * 100).toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
