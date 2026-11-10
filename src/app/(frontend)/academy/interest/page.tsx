// @ts-nocheck
import { AcademyFormPage } from "../../components/academy/AcademyFormPage";
import { getAcademyPage } from "../../../../lib/academy.ts";
import { pageMetadata } from "../../../../lib/seo.ts";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const page = await getAcademyPage();
  return pageMetadata({
    title: `${page.interestHeadline || "Interest list"} | Transformidable Academy`,
    absolute: true,
    description: page.interestIntro,
    path: "/academy/interest",
    noindex: true,
  });
}

export default function InterestPage({ searchParams }) {
  return <AcademyFormPage kind="interest" searchParams={searchParams} />;
}
