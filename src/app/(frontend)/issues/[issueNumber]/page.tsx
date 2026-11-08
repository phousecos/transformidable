// @ts-nocheck
import config from "@payload-config";
import { getPayload } from "payload";
import { notFound } from "next/navigation";
import MagazineHomepage from "../../components/MagazineHomepage";
import { pageMetadata } from "../../../../lib/seo.ts";

export const dynamic = "force-dynamic";

// Per-issue <title> so browser tabs and screen-reader page announcements
// differentiate issues. WCAG 2.4.2 Page Titled.
export async function generateMetadata({ params }: { params: Promise<{ issueNumber: string }> }) {
  const { issueNumber } = await params;
  const payload = await getPayload({ config });
  const issueResult = await payload.find({
    collection: "issues",
    where: { issueNumber: { equals: Number(issueNumber) } },
    limit: 1,
  });
  const issue = issueResult.docs[0];
  if (!issue) return { title: "Issue not found" };

  const num = String(issue.issueNumber).padStart(2, "0");
  const title = issue.themeTagline
    ? `Issue ${num}: ${issue.themeTagline}`
    : `${issue.title ?? `Issue ${num}`}`;

  return pageMetadata({ title, description: issue.themeSubheading, path: `/issues/${issueNumber}`, type: "article" });
}

export default async function IssuePage({ params }: { params: Promise<{ issueNumber: string }> }) {
  const { issueNumber } = await params;
  const payload = await getPayload({ config });

  const issueResult = await payload.find({
    collection: "issues",
    where: { issueNumber: { equals: Number(issueNumber) } },
    limit: 1,
  });

  const issue = issueResult.docs[0];
  if (!issue) notFound();

  const articlesResult = await payload.find({
    collection: "articles",
    where: {
      issue: { equals: issue.id },
      status: { equals: "published" },
    },
    sort: "displayOrder",
    depth: 2,
  });

  // The archive shelf: all published issues, newest first.
  const issuesResult = await payload.find({
    collection: "issues",
    where: { status: { equals: "published" } },
    sort: "-issueNumber",
    depth: 1,
    limit: 24,
  });

  // The Reading Room shelf: a few published books.
  const booksResult = await payload.find({
    collection: "books",
    where: { status: { equals: "published" } },
    sort: "-published_date",
    depth: 1,
    limit: 12,
  });

  // The podcast section: the most recent published episode.
  const podcastResult = await payload.find({
    collection: "podcast-episodes",
    where: { status: { equals: "published" } },
    sort: "-episodeNumber",
    depth: 2,
    limit: 1,
  });

  return (
    <MagazineHomepage
      issue={issue}
      articles={articlesResult.docs}
      issues={issuesResult.docs}
      books={booksResult.docs}
      latestPodcast={podcastResult.docs[0] ?? null}
    />
  );
}
