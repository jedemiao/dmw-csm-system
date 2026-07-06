import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import sharp from "sharp";
import { getSiteOrigin } from "@/lib/site-url";

const QR_SIZE = 900;
// Seal covers ~22% of the QR's width, centered. Error-correction level H
// tolerates up to ~30% of modules being obscured, so this stays comfortably
// scannable while still reading as branded at counter-print size.
const SEAL_SIZE = Math.round(QR_SIZE * 0.22);
const SEAL_PADDING = Math.round(SEAL_SIZE * 0.12);
const SEAL_PATH = path.join(process.cwd(), "public/images/dmw_logo.png");

export async function GET(request: NextRequest) {
  const origin = await getSiteOrigin();
  const surveyUrl = `${origin}/survey`;

  const qrPng = await QRCode.toBuffer(surveyUrl, {
    type: "png",
    width: QR_SIZE,
    margin: 3,
    errorCorrectionLevel: "H",
    // Black on white, not brand navy — maximizes scan reliability across
    // phone cameras and lighting conditions at the service counter.
    color: { dark: "#000000", light: "#ffffff" },
  });

  const seal = await sharp(fs.readFileSync(SEAL_PATH)).resize(SEAL_SIZE, SEAL_SIZE).toBuffer();

  // White circular plate behind the seal so it reads cleanly instead of
  // colliding with whatever QR modules would otherwise sit underneath it.
  const plateSize = SEAL_SIZE + SEAL_PADDING * 2;
  const plate = Buffer.from(
    `<svg width="${plateSize}" height="${plateSize}"><circle cx="${plateSize / 2}" cy="${plateSize / 2}" r="${plateSize / 2}" fill="#ffffff"/></svg>`,
  );
  const badge = await sharp(plate).composite([{ input: seal, left: SEAL_PADDING, top: SEAL_PADDING }]).png().toBuffer();

  const offset = Math.round((QR_SIZE - plateSize) / 2);
  const png = await sharp(qrPng)
    .composite([{ input: badge, left: offset, top: offset }])
    .png()
    .toBuffer();

  const download = request.nextUrl.searchParams.get("download") !== null;

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
      ...(download ? { "Content-Disposition": 'attachment; filename="dmw-csm-survey-qr.png"' } : {}),
    },
  });
}
