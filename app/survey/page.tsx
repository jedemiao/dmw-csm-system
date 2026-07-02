import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LangProvider } from "@/lib/i18n/lang-context";
import { SurveyMain } from "./survey-main";

export default function SurveyPage() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <SiteHeader variant="survey" />
      <LangProvider>
        <SurveyMain />
      </LangProvider>
      <SiteFooter variant="survey" />
    </>
  );
}
