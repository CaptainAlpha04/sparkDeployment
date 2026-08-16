import Link from "next/link";
import { Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listTemplates } from "@/server/certificates";
import { CertificateRender } from "@/components/certificates/certificate-render";
import { NewTemplateForm } from "@/components/certificates/new-template-form";

const PREVIEW = {
  recipient_name: "Ayesha Khan",
  event_title: "SPARKx Talk",
  event_date: "27 October 2025",
  certificate_code: "SPARK-A7K2-9QX4",
  issued_date: "15 August 2026",
};

export default async function AdminCertificatesPage() {
  const templates = await listTemplates();

  return (
    <div>
      <p className="eyebrow mb-2">Certificates</p>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-bold">Templates</h1>
        {templates.length > 0 && (
          <Button asChild>
            <Link href="/admin/certificates/issue" className="gap-2">
              <Award className="size-4" />
              Issue certificates
            </Link>
          </Button>
        )}
      </div>
      <p className="mb-8 max-w-2xl text-muted-foreground">
        Design a certificate once, then issue it to everyone who checked in to an
        event. Each certificate gets a unique code that anyone can verify at{" "}
        <span className="font-mono text-foreground">/verify</span>.
      </p>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div>
          {templates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground">
                No templates yet. Create one to get started.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {templates.map((template) => (
                <Link
                  key={template.id}
                  href={`/admin/certificates/${template.id}`}
                  className="group overflow-hidden rounded-xl border border-border transition-all duration-300 hover:-translate-y-1 hover:border-primary/60"
                >
                  <div className="pointer-events-none origin-top-left overflow-hidden bg-white">
                    <CertificateRender
                      backgroundUrl={template.backgroundUrl}
                      backgroundWidth={template.backgroundWidth}
                      backgroundHeight={template.backgroundHeight}
                      fields={template.fields}
                      values={PREVIEW}
                      width={340}
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-medium">{template.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {template.fields.length} field
                      {template.fields.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <NewTemplateForm />
      </div>
    </div>
  );
}
