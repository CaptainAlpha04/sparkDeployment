"use client";

import { deleteTemplateAction } from "@/app/(site)/admin/certificates/actions";
import { DeleteButton } from "@/components/admin/delete-button";

/**
 * The server refuses to delete a template that has issued certificates, since
 * those rows reference it with ON DELETE RESTRICT and the issued certificates
 * still need to render. That refusal surfaces here as its own message.
 */
export function DeleteTemplateButton({
  id,
  name,
  issuedCount,
}: {
  id: string;
  name: string;
  issuedCount: number;
}) {
  return (
    <DeleteButton
      label="this template"
      confirmText={name}
      redirectTo="/admin/certificates"
      buttonLabel="Delete template"
      loadImpact={async () => ({
        ok: true,
        data:
          issuedCount > 0 ? (
            <p className="text-destructive">
              {issuedCount} certificate{issuedCount === 1 ? " has" : "s have"}{" "}
              been issued from this template and still need it to render, so it
              cannot be deleted.
            </p>
          ) : (
            <p className="text-muted-foreground">
              No certificates have been issued from this template, so nothing
              else is affected. The artwork stays in storage.
            </p>
          ),
      })}
      onDelete={() => deleteTemplateAction(id)}
    />
  );
}
