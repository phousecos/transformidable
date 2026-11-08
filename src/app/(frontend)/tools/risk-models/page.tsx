// @ts-nocheck
import { ComingSoon } from "../../components/research/ComingSoon";
import { pageMetadata } from "../../../../lib/seo.ts";

// A "Coming soon" placeholder: kept out of search results (and the sitemap)
// until it has content.
export const metadata = pageMetadata({ title: "Risk Models", description: "Models for anticipating governance and transformation risk.", path: "/tools/risk-models", noindex: true });

export default function Page() {
  return <ComingSoon kicker="Tools · Risk Models" title="Risk Models" sky="tools" intro="Models for anticipating governance and transformation risk." />;
}
