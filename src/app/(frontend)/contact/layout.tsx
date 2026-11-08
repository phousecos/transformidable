import type { ReactNode } from "react";
import { pageMetadata } from "../../../lib/seo.ts";

// The contact page is a client component, which can't export metadata, so its
// title, description, and canonical are set here.
export const metadata = pageMetadata({
  title: "Contact",
  description: "Contact Transformidable about technology, project, and AI governance advisory, governance training, research, or media.",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
