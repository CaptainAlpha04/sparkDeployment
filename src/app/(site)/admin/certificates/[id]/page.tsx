import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  countCertificatesFromTemplate,
  getTemplate,
} from "@/server/certificates";
import { TemplateDesigner } from "@/components/certificates/template-designer";
import { DeleteTemplateButton } from "@/components/certificates/delete-template-button";

export default async function TemplateDesignerPage({
  params,
}: PageProps<"/admin/certificates/[id]">) {
  const { id } = await params;
  const template = await getTemplate(id);
  if (!template) notFound();

  const issuedCount = await countCertificatesFromTemplate(template.id);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin/certificates"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All templates
        </Link>

        <DeleteTemplateButton
          id={template.id}
          name={template.name}
          issuedCount={issuedCount}
        />
      </div>

      <TemplateDesigner
        templateId={template.id}
        initialName={template.name}
        backgroundUrl={template.backgroundUrl}
        backgroundWidth={template.backgroundWidth}
        backgroundHeight={template.backgroundHeight}
        initialFields={template.fields}
      />
    </div>
  );
}
