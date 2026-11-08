// @ts-nocheck
import { ComingSoon } from "../../components/research/ComingSoon";
import { pageMetadata } from "../../../../lib/seo.ts";

// A "Coming soon" placeholder: kept out of search results (and the sitemap)
// until it has content.
export const metadata = pageMetadata({ title: "Webinar Archive", description: "Past webinars and recorded sessions.", path: "/briefings/webinars", noindex: true });

export default function Page() {
  return <ComingSoon kicker="Media · Webinar Archive" title="Webinar Archive" sky="podcast" intro="Past webinars and recorded sessions." />;
}
