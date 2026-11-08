// @ts-nocheck
import { ComingSoon } from "../../components/research/ComingSoon";
import { pageMetadata } from "../../../../lib/seo.ts";

// A "Coming soon" placeholder: kept out of search results (and the sitemap)
// until it has content.
export const metadata = pageMetadata({ title: "Assessment Tools", description: "Run a governance assessment on your own organization.", path: "/tools/assessments", noindex: true });

export default function Page() {
  return <ComingSoon kicker="Tools · Assessment Tools" title="Assessment Tools" sky="tools" intro="Run a governance assessment on your own organization." />;
}
