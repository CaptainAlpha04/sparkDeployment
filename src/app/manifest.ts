import type { MetadataRoute } from "next";
import { ORG_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

/**
 * Web app manifest, served at /manifest.webmanifest.
 *
 * Modest on purpose. This is not a PWA and pretending otherwise by declaring
 * "standalone" display would strip the browser chrome from a site that has
 * nothing offline to offer — people would lose the back button on a page that
 * still needs the network. "browser" is the honest value.
 *
 * It earns its place anyway: it supplies the name and colours Android uses for
 * an add-to-home-screen entry, and it is one of the files crawlers check when
 * working out what a site calls itself.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} | ${SITE_TAGLINE}`,
    short_name: "SPARK",
    description: ORG_DESCRIPTION,
    start_url: "/",
    display: "browser",
    background_color: "#06070f",
    theme_color: "#06070f",
    lang: "en",
    categories: ["education", "news"],
    icons: [
      {
        src: "/images/logo.png",
        sizes: "307x323",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
