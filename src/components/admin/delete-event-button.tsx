"use client";

import {
  deleteEventAction,
  eventDeletionImpactAction,
} from "@/app/(site)/admin/events/actions";
import { DeleteButton } from "@/components/admin/delete-button";

/**
 * Deleting an event takes its registrations, answers and check-ins with it.
 * Those only mean anything in the context of the event, so that is acceptable,
 * but the admin should see the numbers before committing.
 *
 * Certificates are different and the server refuses outright, since their
 * public verification links would break permanently.
 */
export function DeleteEventButton({ id, title }: { id: string; title: string }) {
  return (
    <DeleteButton
      label="this event"
      confirmText={title}
      redirectTo="/admin/events"
      buttonLabel="Delete event"
      loadImpact={async () => {
        const result = await eventDeletionImpactAction(id);
        if (!result.ok) return { ok: false, error: result.error };

        const { registrations, checkIns, certificates } = result.data;

        if (certificates > 0) {
          return {
            ok: true,
            data: (
              <p className="text-destructive">
                This event has issued {certificates} certificate
                {certificates === 1 ? "" : "s"}. Deleting it would permanently
                break their public verification links, so it cannot be deleted.
                Set the event to <strong>cancelled</strong> instead.
              </p>
            ),
          };
        }

        if (registrations === 0) {
          return {
            ok: true,
            data: (
              <p className="text-muted-foreground">
                Nobody has registered, so nothing else goes with it.
              </p>
            ),
          };
        }

        return {
          ok: true,
          data: (
            <div className="space-y-1.5">
              <p>This will also delete:</p>
              <ul className="ml-4 list-disc text-muted-foreground">
                <li>
                  {registrations} registration{registrations === 1 ? "" : "s"}
                </li>
                {checkIns > 0 && (
                  <li>
                    {checkIns} attendance record{checkIns === 1 ? "" : "s"}
                  </li>
                )}
              </ul>
              <p className="pt-1 text-muted-foreground">
                If the event already happened and you just want it off the
                upcoming list, mark it <strong>completed</strong> instead.
              </p>
            </div>
          ),
        };
      }}
      onDelete={() => deleteEventAction(id)}
    />
  );
}
