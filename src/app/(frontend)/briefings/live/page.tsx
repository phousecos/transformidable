// @ts-nocheck
import { ComingSoon } from "../../components/research/ComingSoon";
import { pageMetadata } from "../../../../lib/seo.ts";

// A "Coming soon" placeholder: kept out of search results (and the sitemap)
// until it has content.
export const metadata = pageMetadata({ title: "Live Sessions", description: "Upcoming and live briefings.", path: "/briefings/live", noindex: true });

export default function Page() {
  return <ComingSoon kicker="Media · Live Sessions" title="Live Sessions" sky="podcast" intro="Upcoming and live briefings." />;
}
