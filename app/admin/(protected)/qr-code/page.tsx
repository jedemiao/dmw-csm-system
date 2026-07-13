import { DownloadSimple, ArrowSquareOut } from "@phosphor-icons/react/ssr";
import { getSiteOrigin } from "@/lib/site-url";
import { requireAdmin } from "@/lib/auth/dal";
import { DIVISIONS } from "@/lib/constants/divisions";

export default async function AdminQrCodePage() {
  const user = await requireAdmin();
  const origin = await getSiteOrigin();
  const divisions = user.division ? DIVISIONS.filter((d) => d.value === user.division) : DIVISIONS;

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>QR Code</h1>
      <p style={{ color: "var(--ink-500)", marginBottom: "1.5rem", maxWidth: "60ch" }}>
        Print the code for a division and post it at that division's service counter so clients can open its survey
        on their own phone.
      </p>

      <div className="card-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        {divisions.map((division) => {
          const surveyUrl = `${origin}/survey/${division.slug}`;
          const imageSrc = `/admin/qr-code/image?division=${division.slug}`;
          return (
            <div key={division.slug} className="info-card" style={{ textAlign: "center" }}>
              <h3 style={{ marginBottom: "0.75rem" }}>{division.label}</h3>
              <img
                src={imageSrc}
                alt={`QR code linking to the ${division.label} CSM survey form`}
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
                <a href={`${imageSrc}&download`} className="btn btn-primary" download={`dmw-csm-survey-qr-${division.slug}.png`}>
                  <DownloadSimple size={16} aria-hidden="true" /> Download PNG
                </a>
                <a href={surveyUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">
                  <ArrowSquareOut size={16} aria-hidden="true" /> Open survey
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
