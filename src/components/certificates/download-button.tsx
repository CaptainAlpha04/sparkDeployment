import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Downloads the certificate as a real PDF, built on the server.
 *
 * This used to call window.print() and rely on "Save as PDF" in the browser
 * dialog. That produced blank pages: print stylesheets drop background images
 * by default, and the absolutely positioned fields collapsed in the print
 * renderer. The PDF is now drawn field by field server-side, so it is
 * identical on every machine and needs no dialog.
 */
export function DownloadButton({ code }: { code: string }) {
  return (
    <Button asChild className="gap-2">
      <a href={`/certificates/${code}/download`} download>
        <Download className="size-4" />
        Download PDF
      </a>
    </Button>
  );
}
