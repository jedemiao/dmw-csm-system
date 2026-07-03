import { NextRequest } from "next/server";
import QRCode from "qrcode";
import { getSiteOrigin } from "@/lib/site-url";

export async function GET(request: NextRequest) {
  const origin = await getSiteOrigin();
  const surveyUrl = `${origin}/survey`;

  const png = await QRCode.toBuffer(surveyUrl, {
    type: "png",
    width: 900,
    margin: 3,
    // Black on white, not brand navy — maximizes scan reliability across
    // phone cameras and lighting conditions at the service counter.
    color: { dark: "#000000", light: "#ffffff" },
  });

  const download = request.nextUrl.searchParams.get("download") !== null;

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
      ...(download ? { "Content-Disposition": 'attachment; filename="dmw-csm-survey-qr.png"' } : {}),
    },
  });
}
