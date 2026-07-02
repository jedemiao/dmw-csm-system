import "server-only";
import fs from "node:fs";
import path from "node:path";
import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";
import type { ReportAggregate } from "./aggregate";
import type { ImprovementPlanRow, ServiceTransactionRow } from "@/app/admin/(protected)/reports/actions";
import { OFFICE_ADDRESS, OFFICE_EMAIL, OFFICE_NAME, OFFICE_PHONE, OFFICE_WEBSITE } from "./constants";

// react-pdf resolves local image `src` *strings* via Node's legacy url.parse() + path.resolve(),
// which mishandles Windows paths (drive letter read as a URL protocol, then even a file:// URL
// gets mis-resolved because it calls path.resolve() on the whole href instead of the pathname).
// Passing the already-read Buffer instead skips that resolution path entirely.
function readAsset(relativePath: string) {
  return fs.readFileSync(path.join(/* turbopackIgnore: true */ process.cwd(), relativePath));
}

// Font.register's `src` doesn't accept a Buffer (only a standard font name, a URL, a data URL,
// or a file path handed to fontkit.open) — encode as a data URL to avoid the same path-resolution
// pitfalls as readAsset above.
function readFontAsDataUrl(relativePath: string) {
  return `data:font/woff;base64,${readAsset(relativePath).toString("base64")}`;
}

const COAT_OF_ARMS_PATH = readAsset("public/images/report-ph-coat-of-arms.png");
const BAGONG_PILIPINAS_LOGO_PATH = readAsset("public/images/report-bagong-pilipinas-logo.png");

// The rest of the document uses react-pdf's built-in "Times-Roman" standard font, which isn't
// embedded in the PDF and gets substituted by whatever the viewer has installed — that substitution
// varies enough across viewers/OSes to visibly not match a Word-authored reference letterhead.
// The masthead ("Republic of the Philippines" / "Department of Migrant Workers") is embedded with
// Tinos, a metrically-compatible, SIL-OFL-licensed clone of Times New Roman, so it renders identically
// everywhere. See public/fonts/TINOS-LICENSE.txt.
Font.register({
  family: "Tinos",
  fonts: [
    { src: readFontAsDataUrl("public/fonts/tinos-regular.woff") },
    { src: readFontAsDataUrl("public/fonts/tinos-bold.woff"), fontWeight: "bold" },
  ],
});

const s = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 36, paddingLeft: 72, paddingRight: 72, fontSize: 8.5, fontFamily: "Times-Roman", color: "#111" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 0 },
  headerLogo: { width: 64, height: 64 },
  bagongPilipinasLogo: { width: 70, height: 64 },
  headerText: { alignItems: "center" },
  headerKicker: { fontFamily: "Tinos", fontSize: 11, textAlign: "center" },
  headerTitle: { fontFamily: "Tinos", fontWeight: "bold", fontSize: 20, marginTop: 2, textAlign: "center" },
  addressLine: { textAlign: "center", fontSize: 8, marginTop: -8, marginBottom: 4 },
  contactLine: { textAlign: "center", fontSize: 8, marginTop: 2, marginBottom: 10 },
  link: { color: "#1155cc", textDecoration: "underline" },
  hr: { width: 280, alignSelf: "center", borderBottomWidth: 1, borderBottomColor: "#111" },
  reportTitle: { textAlign: "center", fontFamily: "Times-Bold", fontSize: 11 },
  reportSubtitle: { textAlign: "center", fontSize: 9, marginTop: 2, marginBottom: 10 },
  officeLine: { textAlign: "center", fontSize: 9, marginBottom: 10 },
  officeLineValue: { textDecoration: "underline", fontFamily: "Times-Bold" },
  sectionLabel: { fontFamily: "Times-Bold", fontSize: 9.5, marginBottom: 4, marginTop: 10 },
  subLabel: { fontFamily: "Times-Bold", fontSize: 9, marginBottom: 4, marginTop: 6 },
  // Tables have no border of their own — every edge comes from the cells. Every cell gets
  // top+right by default (plus left on the first cell in a row); only the true last row of each
  // table gets an added bottom border, via Cell's `last` prop. Each horizontal boundary is then
  // drawn exactly once — by the row below's top edge — so there's no doubled/heavier line at
  // ordinary row boundaries. And because every row (not just the header) owns its top edge,
  // whichever row a page break happens to land on still renders as a closed box, instead of
  // being open along the top like it would if only the header carried a top border.
  //
  // (A table-level container border was tried first and dropped — react-pdf drew a stray empty
  // bordered box at the page break when the container itself split across pages. Giving every row
  // BOTH a top and bottom border was tried next and also dropped — react-pdf renders two stacked
  // 1px borders as a visibly heavier line, not a merged hairline, so every row boundary in the
  // document read as double-ruled.)
  table: { marginBottom: 4, marginHorizontal: 36 },
  tr: { flexDirection: "row" },
  trHead: { flexDirection: "row" },
  trGroupHead: { flexDirection: "row" },
  trBlank: { flexDirection: "row", minHeight: 10 },
  td: { borderTopWidth: 1, borderRightWidth: 1, borderColor: "#111", padding: 3, fontSize: 8 },
  tdFirst: { borderLeftWidth: 1, borderLeftColor: "#111" },
  tdLastRow: { borderBottomWidth: 1, borderBottomColor: "#111" },
  tdBold: { fontFamily: "Times-Bold" },
  tdCenter: { textAlign: "center" },
  analysis: { fontSize: 8, marginTop: 4, marginBottom: 2 },
  analysisLabel: { fontFamily: "Times-Bold" },
  signRow: { flexDirection: "row", marginTop: 24, gap: 40 },
  signCol: { flex: 1 },
  signName: { textDecoration: "underline", fontFamily: "Times-Bold", fontSize: 9, marginTop: 24 },
  signTitle: { fontSize: 8, marginTop: 2 },
});

function Cell({
  children,
  width,
  first,
  last,
  bold,
  center,
}: {
  children: React.ReactNode;
  width?: number | string;
  first?: boolean;
  last?: boolean;
  bold?: boolean;
  center?: boolean;
}) {
  return (
    <View
      style={{
        width,
        ...s.td,
        ...(first ? s.tdFirst : {}),
        ...(last ? s.tdLastRow : {}),
        ...(bold ? s.tdBold : {}),
        ...(center ? s.tdCenter : {}),
      }}
    >
      <Text>{children}</Text>
    </View>
  );
}

function fmtPct(v: number | null) {
  return v === null ? "" : `${v}%`;
}

function BlankRow() {
  return (
    <View style={s.trBlank} wrap={false}>
      <Cell width="60%" first>
        {""}
      </Cell>
      <Cell width="20%">{""}</Cell>
      <Cell width="20%">{""}</Cell>
    </View>
  );
}

function LabeledCountTable({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  return (
    <View style={{ ...s.table, marginTop: 6, marginHorizontal: 90 }}>
      <View style={s.trHead} wrap={false}>
        <Cell width="70%" first bold last={rows.length === 0}>
          {title}
        </Cell>
        <Cell width="30%" last={rows.length === 0}>
          {""}
        </Cell>
      </View>
      {rows.map((row, i) => (
        <View style={s.tr} key={row.label} wrap={false}>
          <Cell width="70%" first last={i === rows.length - 1}>
            {row.label}
          </Cell>
          <Cell width="30%" center last={i === rows.length - 1}>
            {row.count || ""}
          </Cell>
        </View>
      ))}
    </View>
  );
}

export function CsmReportDocument({
  data,
  periodLabel,
  serviceTransactions,
  improvementPlan,
  summaryAnalysis,
  ccAnalysis,
  sqdAnalysis,
  preparedByName,
  preparedByTitle,
  approvedByName,
  approvedByTitle,
}: {
  data: ReportAggregate;
  periodLabel: string;
  serviceTransactions: ServiceTransactionRow[];
  improvementPlan: ImprovementPlanRow[];
  summaryAnalysis: string;
  ccAnalysis: string;
  sqdAnalysis: string;
  preparedByName: string;
  preparedByTitle: string;
  approvedByName: string;
  approvedByTitle: string;
}) {
  return (
    <Document title={`CSM Report - ${periodLabel}`}>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <Image src={COAT_OF_ARMS_PATH} style={s.headerLogo} />
          <View style={s.headerText}>
            <Text style={s.headerKicker}>Republic of the Philippines</Text>
            <Text style={s.headerTitle}>Department of Migrant Workers</Text>
          </View>
          <Image src={BAGONG_PILIPINAS_LOGO_PATH} style={s.bagongPilipinasLogo} />
        </View>
        <Text style={s.addressLine}>{OFFICE_ADDRESS}</Text>
        <View style={s.hr} />
        <Text style={s.contactLine}>
          Website: <Text style={s.link}>{OFFICE_WEBSITE}</Text> | Email: <Text style={s.link}>{OFFICE_EMAIL}</Text> |{" "}
          {OFFICE_PHONE}
        </Text>

        <Text style={s.reportTitle}>CUSTOMER SATISFACTION MEASUREMENT (CSM) REPORT</Text>
        <Text style={s.reportSubtitle}>{periodLabel}</Text>

        <Text style={s.officeLine}>
          Office : <Text style={s.officeLineValue}>{OFFICE_NAME}</Text>
        </Text>

        <Text style={s.sectionLabel}>A. Summary</Text>
        <View style={s.table}>
          <View style={s.trHead} wrap={false}>
            <Cell width="55%" first bold>
              External / Internal Service
            </Cell>
            <Cell width="45%" bold center>
              Responses
            </Cell>
          </View>
          {serviceTransactions.map((row, i) => (
            <View style={s.tr} key={row.service} wrap={false}>
              <Cell width="55%" first>
                {i + 1}. {row.service}
              </Cell>
              <Cell width="45%" center>
                {data.serviceCounts.find((r) => r.service === row.service)?.responses ?? 0}
              </Cell>
            </View>
          ))}
          <View style={s.tr} wrap={false}>
            <Cell width="55%" first last bold center>
              Total Transactions
            </Cell>
            <Cell width="45%" last bold center>
              {data.totalResponses}
            </Cell>
          </View>
        </View>
        <Text style={s.analysis}>
          <Text style={s.analysisLabel}>Description/Analysis: </Text>
          {summaryAnalysis}
        </Text>

        <Text style={s.sectionLabel}>B. Result: Count of Citizen&apos;s Charter (CC) and Service Quality Dimension (SQD)</Text>

        <Text style={s.subLabel}>A. Citizen&apos;s Charter (CC)</Text>
        <View style={s.table}>
          <View style={s.trHead} wrap={false}>
            <Cell width="60%" first bold>
              Count of CC
            </Cell>
            <Cell width="20%" bold center>
              Responses
            </Cell>
            <Cell width="20%" bold center>
              Percentage
            </Cell>
          </View>
          <View style={s.trGroupHead} wrap={false}>
            <Cell width="100%" first bold>
              CC1: Awareness
            </Cell>
          </View>
          {data.cc1.map((row) => (
            <View style={s.tr} key={row.label} wrap={false}>
              <Cell width="60%" first>
                {row.label}
              </Cell>
              <Cell width="20%" center>
                {row.count || ""}
              </Cell>
              <Cell width="20%" center>
                {fmtPct(row.pct)}
              </Cell>
            </View>
          ))}
          <BlankRow />
          <View style={s.trGroupHead} wrap={false}>
            <Cell width="100%" first bold>
              CC2: Visibility
            </Cell>
          </View>
          {data.cc2.map((row) => (
            <View style={s.tr} key={row.label} wrap={false}>
              <Cell width="60%" first>
                {row.label}
              </Cell>
              <Cell width="20%" center>
                {row.count || ""}
              </Cell>
              <Cell width="20%" center>
                {fmtPct(row.pct)}
              </Cell>
            </View>
          ))}
          <BlankRow />
          <View style={s.trGroupHead} wrap={false}>
            <Cell width="100%" first bold>
              CC3: Citizen&apos;s Charter Usage
            </Cell>
          </View>
          {data.cc3.map((row, i) => (
            <View style={s.tr} key={row.label} wrap={false}>
              <Cell width="60%" first last={i === data.cc3.length - 1}>
                {row.label}
              </Cell>
              <Cell width="20%" center last={i === data.cc3.length - 1}>
                {row.count || ""}
              </Cell>
              <Cell width="20%" center last={i === data.cc3.length - 1}>
                {fmtPct(row.pct)}
              </Cell>
            </View>
          ))}
        </View>
        <Text style={s.analysis}>
          <Text style={s.analysisLabel}>Description/Analysis: </Text>
          {ccAnalysis}
        </Text>

        <Text style={s.subLabel}>B. Service Quality Dimension (SQD)</Text>
        <View style={s.table}>
          <View style={s.trHead} wrap={false}>
            <Cell width="24%" first bold>
              Dimension
            </Cell>
            <Cell width="10%" bold center>
              Strongly Disagree
            </Cell>
            <Cell width="10%" bold center>
              Disagree
            </Cell>
            <Cell width="14%" bold center>
              Neither Agree or Disagree
            </Cell>
            <Cell width="10%" bold center>
              Agree
            </Cell>
            <Cell width="10%" bold center>
              Strongly Agree
            </Cell>
            <Cell width="11%" bold center>
              Responses
            </Cell>
            <Cell width="11%" bold center>
              Rating
            </Cell>
          </View>
          {data.sqd.map((row, i) => (
            <View style={s.tr} key={row.key} wrap={false}>
              <Cell width="24%" first last={i === data.sqd.length - 1}>
                {row.label}
              </Cell>
              {row.counts.map((c, j) => (
                <Cell width={j === 2 ? "14%" : "10%"} center last={i === data.sqd.length - 1} key={j}>
                  {c || ""}
                </Cell>
              ))}
              <Cell width="11%" center last={i === data.sqd.length - 1}>
                {row.responses}
              </Cell>
              <Cell width="11%" center last={i === data.sqd.length - 1}>
                {fmtPct(row.ratingPct)}
              </Cell>
            </View>
          ))}
        </View>
        <Text style={s.analysis}>
          <Text style={s.analysisLabel}>Description/Analysis: </Text>
          {sqdAnalysis}
        </Text>

        <Text style={s.sectionLabel}>C. Client Demographic</Text>

        <LabeledCountTable title="Sex:" rows={data.sex} />
        <LabeledCountTable title="Client Type:" rows={data.customerType} />
        <LabeledCountTable title="Age:" rows={data.age} />
        <LabeledCountTable title="Region:" rows={data.region} />

        <Text style={s.sectionLabel}>Continuous Improvement Plan</Text>
        <View style={s.table}>
          <View style={s.trHead} wrap={false}>
            <Cell width="70%" first bold last={improvementPlan.length === 0}>
              Details
            </Cell>
            <Cell width="30%" bold center last={improvementPlan.length === 0}>
              When
            </Cell>
          </View>
          {improvementPlan.map((row, i) => (
            <View style={s.tr} key={i} wrap={false}>
              <Cell width="70%" first last={i === improvementPlan.length - 1}>
                {row.details}
              </Cell>
              <Cell width="30%" center last={i === improvementPlan.length - 1}>
                {row.when}
              </Cell>
            </View>
          ))}
        </View>

        <View style={s.signRow}>
          <View style={s.signCol}>
            <Text style={{ fontSize: 8 }}>Prepared by:</Text>
            <Text style={s.signName}>{preparedByName || " "}</Text>
            <Text style={s.signTitle}>{preparedByTitle}</Text>
          </View>
          <View style={s.signCol}>
            <Text style={{ fontSize: 8 }}>Approved by:</Text>
            <Text style={s.signName}>{approvedByName || " "}</Text>
            <Text style={s.signTitle}>{approvedByTitle}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
