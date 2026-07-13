import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LangProvider } from "@/lib/i18n/lang-context";
import { getDivisionBySlug } from "@/lib/constants/divisions";
import { SurveyMain } from "../survey-main";

export default async function DivisionSurveyPage({ params }: { params: Promise<{ division: string }> }) {
  const { division: slug } = await params;
  const division = getDivisionBySlug(slug);
  if (!division) notFound();

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <SiteHeader variant="survey" />
      <LangProvider>
        <SurveyMain division={division} />
      </LangProvider>
      <SiteFooter variant="survey" />
    </>
  );
}
