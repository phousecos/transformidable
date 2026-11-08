// @ts-nocheck
import { ComingSoon } from "../../components/research/ComingSoon";
import { pageMetadata } from "../../../../lib/seo.ts";

// A "Coming soon" placeholder: kept out of search results (and the sitemap)
// until it has content.
export const metadata = pageMetadata({ title: "Datasets", description: "The data behind the research, available to explore and download.", path: "/research/datasets", noindex: true });

export default function Page() {
  return <ComingSoon kicker="Research · Datasets" title="Datasets" sky="research" intro="The data behind the research, available to explore and download." />;
}
