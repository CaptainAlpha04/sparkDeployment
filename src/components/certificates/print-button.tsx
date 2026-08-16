"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Opens the browser print dialog, where "Save as PDF" produces the download.
 *
 * Deliberately not a rasterised canvas export: the certificate is HTML text
 * over an image, so printing keeps the type as vector and comes out sharp at
 * any size. A canvas snapshot would bake it to pixels at screen resolution.
 */
export function PrintButton() {
  return (
    <Button onClick={() => window.print()} className="gap-2">
      <Download className="size-4" />
      Download as PDF
    </Button>
  );
}
