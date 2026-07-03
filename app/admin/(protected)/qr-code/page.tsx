import { DownloadSimple, ArrowSquareOut } from "@phosphor-icons/react/ssr";
import { getSiteOrigin } from "@/lib/site-url";

export default async function AdminQrCodePage() {
  const origin = await getSiteOrigin();
  const surveyUrl = `${origin}/survey`;

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>QR Code</h1>
      <p style={{ color: "var(--ink-500)", marginBottom: "1.5rem", maxWidth: "60ch" }}>
        Print this code and post it at the service counter so clients can open the survey on their own phone.
      </p>

      <div className="info-card" style={{ maxWidth: "26rem", textAlign: "center" }}>
        <img
          src="/admin/qr-code/image"
          alt="QR code linking to the DMW CSM survey form"
          width={320}
          height={320}
          style={{ width: "100%", height: "auto", borderRadius: "var(--radius-sm)" }}
        />

        <p
          style={{
            marginTop: "1rem",
            fontFamily: "var(--font-mono, ui-monospace, monospace)",
            fontSize: "0.85rem",
            color: "var(--ink-500)",
            wordBreak: "break-all",
          }}
        >
          {surveyUrl}
        </p>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1.25rem", flexWrap: "wrap" }}>
          <a href="/admin/qr-code/image?download" className="btn btn-primary" download="dmw-csm-survey-qr.png">
            <DownloadSimple size={16} aria-hidden="true" /> Download PNG
          </a>
          <a href={surveyUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">
            <ArrowSquareOut size={16} aria-hidden="true" /> Open survey
          </a>
        </div>
      </div>
    </div>
  );
}
