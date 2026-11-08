// @ts-nocheck
import { ComingSoon } from "../../components/research/ComingSoon";
import { pageMetadata } from "../../../../lib/seo.ts";

// A "Coming soon" placeholder: kept out of search results (and the sitemap)
// until it has content.
export const metadata = pageMetadata({ title: "Governance Watch", description: "Monitoring governance signals across sectors.", path: "/tools/governance-watch", noindex: true });

export default function Page() {
  return <ComingSoon kicker="Tools · Governance Watch" title="Governance Watch" sky="tools" intro="Monitoring governance signals across sectors." />;
}
