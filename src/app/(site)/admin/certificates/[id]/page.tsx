import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTemplate } from "@/server/certificates";
import { TemplateDesigner } from "@/components/certificates/template-designer";

export default async function TemplateDesignerPage({
  params,
}: PageProps<"/admin/certificates/[id]">) {
  const { id } = await params;
  const template = await getTemplate(id);
  if (!template) notFound();

  return (
    <div>
      <Link
        href="/admin/certificates"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All templates
      </Link>

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
