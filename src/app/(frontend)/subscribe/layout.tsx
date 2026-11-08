import type { ReactNode } from "react";
import { pageMetadata } from "../../../lib/seo.ts";

// The subscribe page is a client component, which can't export metadata, so
// its title, description, and canonical are set here.
export const metadata = pageMetadata({
  title: "Subscribe",
  description: "Subscribe to Transformidable for research, case files, and briefings on technology, project, and AI governance.",
  path: "/subscribe",
});

export default function SubscribeLayout({ children }: { children: ReactNode }) {
  return children;
}
