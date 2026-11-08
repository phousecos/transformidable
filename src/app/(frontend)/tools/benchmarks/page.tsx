// @ts-nocheck
import { ComingSoon } from "../../components/research/ComingSoon";
import { pageMetadata } from "../../../../lib/seo.ts";

// A "Coming soon" placeholder: kept out of search results (and the sitemap)
// until it has content.
export const metadata = pageMetadata({ title: "Benchmarks", description: "See where your sector's governance stands.", path: "/tools/benchmarks", noindex: true });

export default function Page() {
  return <ComingSoon kicker="Tools · Benchmarks" title="Benchmarks" sky="tools" intro="See where your sector's governance stands." />;
}
