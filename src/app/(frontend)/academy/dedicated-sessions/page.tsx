// @ts-nocheck
import { AcademyFormPage } from "../../components/academy/AcademyFormPage";
import { getAcademyPage } from "../../../../lib/academy.ts";
import { pageMetadata } from "../../../../lib/seo.ts";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const page = await getAcademyPage();
  return pageMetadata({
    title: `${page.dedicatedHeadline || "Dedicated sessions"} | Transformidable Academy`,
    absolute: true,
    description: page.dedicatedIntro,
    path: "/academy/dedicated-sessions",
  });
}

export default function DedicatedSessionsPage({ searchParams }) {
  return <AcademyFormPage kind="dedicated" searchParams={searchParams} />;
}
