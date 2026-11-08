// @ts-nocheck
import { ComingSoon } from "../../components/research/ComingSoon";
import { pageMetadata } from "../../../../lib/seo.ts";

// A "Coming soon" placeholder: kept out of search results (and the sitemap)
// until it has content.
export const metadata = pageMetadata({ title: "Research Projects", description: "Active and ongoing lines of inquiry.", path: "/research/projects", noindex: true });

export default function Page() {
  return <ComingSoon kicker="Research · Projects" title="Research Projects" sky="research" intro="Active and ongoing lines of inquiry." />;
}
