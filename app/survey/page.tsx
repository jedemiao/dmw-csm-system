import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LangProvider } from "@/lib/i18n/lang-context";
import { DivisionPicker } from "./division-picker";

export default function SurveyPickerPage() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <SiteHeader variant="survey" />
      <LangProvider>
        <DivisionPicker />
      </LangProvider>
      <SiteFooter variant="survey" />
    </>
  );
}
