// @ts-nocheck
import config from "@payload-config";
import { getPayload } from "payload";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ResearchShell } from "../../../components/research/ResearchShell";
import { Sky } from "../../../components/research/Sky";
import { ToolRequestForm } from "../../../components/advisory/ToolRequestForm";
import { TOOLS_PATH, assetTypeLabel, findTool, isOffered } from "../../../../../lib/advisoryTools.ts";
import "../../../components/home/home.css";
import { pageMetadata } from "../../../../../lib/seo.ts";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  try {
    const payload = await getPayload({ config });
    return await findTool(payload, slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const tool = await load(slug);
  if (!tool) return { title: "Advisory tools" };
  return pageMetadata({
    title: `${tool.title} | Governance Tools`,
    description: tool.summary,
    path: `${TOOLS_PATH}/${slug}`,
    noindex: tool.status === "retired",
  });
}

export default async function ToolPage({ params }) {
  const { slug } = await params;
  const tool = await load(slug);
  if (!tool) notFound();

  // A retired tool sends people on to what replaced it, when that is offered.
  if (tool.status === "retired" && isOffered(tool.replacedBy)) redirect(`${TOOLS_PATH}/${tool.replacedBy.slug}`);
  const retired = tool.status === "retired";
  const type = assetTypeLabel(tool.assetType);

  return (
    <ResearchShell>
      <section className="idx-hero tr-onsky">
        <Sky variant="advisory" />
        <div className="wrap idx-hero-in">
          <p className="kicker">Advisory tools{type ? ` · ${type}` : ""}</p>
          <h1 className="idx-title">{tool.title}</h1>
          {tool.summary && <p className="idx-intro">{tool.summary}</p>}
        </div>
      </section>

      <section aria-label={retired ? "This tool has been updated" : "Download"}>
        <div className="wrap av-tool">
          {retired ? (
            <div className="av-card">
              <h2>This resource has been updated.</h2>
              <p>It is no longer available. See the current Advisory tools for its replacement.</p>
              <Link className="link" href="/advisory#tools">See Advisory tools</Link>
            </div>
          ) : tool.publishedFile ? (
            <ToolRequestForm slug={tool.slug} title={tool.title} />
          ) : (
            <div className="av-card">
              <h2>Coming soon.</h2>
              <p>This tool is being prepared. Check back shortly.</p>
            </div>
          )}
          <p className="av-fallback">
            Want to talk it through? <Link className="link" href="/advisory/conversation">Book a conversation</Link> or{" "}
            <Link className="link" href="/advisory#tools">see all Advisory tools</Link>.
          </p>
        </div>
      </section>
    </ResearchShell>
  );
}
