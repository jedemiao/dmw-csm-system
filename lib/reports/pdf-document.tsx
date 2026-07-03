import "server-only";
import fs from "node:fs";
import path from "node:path";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { ReportAggregate } from "./aggregate";
import type { ImprovementPlanRow, ServiceTransactionRow } from "@/app/admin/(protected)/reports/actions";
import { BUREAU_NAME, DIVISION_NAME, OFFICE_LOCATION, OFFICE_NAME } from "./constants";

// react-pdf resolves local image `src` *strings* via Node's legacy url.parse() + path.resolve(),
// which mishandles Windows paths (drive letter read as a URL protocol, then even a file:// URL
// gets mis-resolved because it calls path.resolve() on the whole href instead of the pathname).
// Passing the already-read Buffer instead skips that resolution path entirely.
function readAsset(relativePath: string) {
  return fs.readFileSync(path.join(/* turbopackIgnore: true */ process.cwd(), relativePath));
}

const HEADER_BANNER_PATH = readAsset("public/images/header-report.png");

const s = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 40, paddingLeft: 72, paddingRight: 72, fontSize: 8.5, fontFamily: "Times-Roman", color: "#111" },
  headerBanner: { width: 451, height: 58, alignSelf: "center", objectFit: "contain", marginBottom: 8 },
  reportTitle: { textAlign: "center", fontFamily: "Times-Bold", fontSize: 11 },
  reportSubtitle: { textAlign: "center", fontSize: 9, marginTop: 2, marginBottom: 10 },
  metaLine: { fontFamily: "Times-Bold", fontSize: 9, marginBottom: 2 },
  sectionLabel: { fontFamily: "Times-Bold", fontSize: 9.5, marginBottom: 4, marginTop: 10 },
  subLabel: { fontFamily: "Times-Bold", fontSize: 9, marginBottom: 4, marginTop: 6 },
  noteText: { fontFamily: "Times-Italic", fontSize: 7.5, marginBottom: 2 },
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
  boxText: { fontSize: 8, lineHeight: 1.4 },
  signRow: { flexDirection: "row", marginTop: 24, gap: 40 },
  signCol: { flex: 1 },
  signName: { textDecoration: "underline", fontFamily: "Times-Bold", fontSize: 9, marginTop: 24 },
  signTitle: { fontSize: 8, marginTop: 2 },
  pageFooter: { position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center", fontSize: 7.5, color: "#444" },
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

// Section D/E/G are a single bordered box of free text on the paper form — a numbered
// list for D (remarks), a plain paragraph for E and G.
function BoxedText({ lines }: { lines: string[] }) {
  return (
    <View style={{ ...s.table }}>
      <View style={s.tr} wrap={false}>
        <Cell width="100%" first last>
          <View>
            {lines.length === 0 ? (
              <Text style={s.boxText}>None recorded.</Text>
            ) : (
              lines.map((line, i) => (
                <Text style={s.boxText} key={i}>
                  {i + 1}. {line}
                </Text>
              ))
            )}
          </View>
        </Cell>
      </View>
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
  actionPlanResults,
  csmRecommendations,
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
  actionPlanResults: string;
  csmRecommendations: string;
  preparedByName: string;
  preparedByTitle: string;
  approvedByName: string;
  approvedByTitle: string;
}) {
  const totalTransactions = serviceTransactions.reduce((sum, r) => sum + r.totalTransactions, 0);

  return (
    <Document title={`CSM Report - ${periodLabel}`}>
      <Page size="A4" style={s.page}>
        <Image src={HEADER_BANNER_PATH} style={s.headerBanner} />

        <Text style={s.reportTitle}>CUSTOMER SATISFACTION MEASUREMENT (CSM) REPORT</Text>
        <Text style={s.reportSubtitle}>{periodLabel}</Text>

        <Text style={s.metaLine}>Bureau/Service/ : {BUREAU_NAME}</Text>
        <Text style={s.metaLine}>Office (B/S/Os) : {OFFICE_NAME}</Text>
        <Text style={{ ...s.metaLine, marginBottom: 10 }}>
          Division : {DIVISION_NAME}      Location : {OFFICE_LOCATION}
        </Text>

        <Text style={s.sectionLabel}>A. Summary</Text>
        <View style={s.table}>
          <View style={s.trHead} wrap={false}>
            <Cell width="50%" first bold>
              {"Name of Service\n[X] External   [ ] Internal"}
            </Cell>
            <Cell width="25%" bold center>
              Responses
            </Cell>
            <Cell width="25%" bold center>
              Total Transactions
            </Cell>
          </View>
          {serviceTransactions.map((row, i) => (
            <View style={s.tr} key={row.service} wrap={false}>
              <Cell width="50%" first>
                {i + 1}. {row.service}
              </Cell>
              <Cell width="25%" center>
                {data.serviceCounts.find((r) => r.service === row.service)?.responses || ""}
              </Cell>
              <Cell width="25%" center>
                {row.totalTransactions || ""}
              </Cell>
            </View>
          ))}
          <View style={s.tr} wrap={false}>
            <Cell width="50%" first last bold center>
              Total
            </Cell>
            <Cell width="25%" last bold center>
              {data.totalResponses}
            </Cell>
            <Cell width="25%" last bold center>
              {totalTransactions}
            </Cell>
          </View>
        </View>
        <Text style={s.noteText}>Note: Kindly indicate if the service/s had no clients (i.e. Zero-Client Service)</Text>
        <Text style={s.analysis}>
          <Text style={s.analysisLabel}>Description/Analysis: </Text>
          {summaryAnalysis}
        </Text>

        <Text style={s.sectionLabel}>
          B. Result: Count of Citizen&apos;s Charter (CC) and Service Quality Dimension (SQD):
        </Text>

        <Text style={s.subLabel}>B.1 Citizen&apos;s Charter (CC)</Text>
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

        <Text style={s.subLabel}>B.2 Service Quality Dimension (SQD)</Text>
        <Text style={{ ...s.subLabel, marginTop: 0, fontSize: 8 }}>SQD1-8 Results:</Text>
        <View style={s.table}>
          <View style={s.trHead} wrap={false}>
            <Cell width="20%" first bold>
              Dimension
            </Cell>
            <Cell width="9%" bold center>
              Strongly Disagree
            </Cell>
            <Cell width="9%" bold center>
              Disagree
            </Cell>
            <Cell width="12%" bold center>
              Neither Agree or Disagree
            </Cell>
            <Cell width="9%" bold center>
              Agree
            </Cell>
            <Cell width="9%" bold center>
              Strongly Agree
            </Cell>
            <Cell width="9%" bold center>
              N/A
            </Cell>
            <Cell width="11%" bold center>
              Total Responses
            </Cell>
            <Cell width="12%" bold center>
              Overall
            </Cell>
          </View>
          {data.sqd.map((row) => (
            <View style={s.tr} key={row.key} wrap={false}>
              <Cell width="20%" first>
                {row.label}
              </Cell>
              {row.counts.map((c, j) => (
                <Cell width={j === 2 ? "12%" : "9%"} center key={j}>
                  {c || ""}
                </Cell>
              ))}
              <Cell width="11%" center>
                {row.responses}
              </Cell>
              <Cell width="12%" center>
                {fmtPct(row.ratingPct)}
              </Cell>
            </View>
          ))}
          <View style={s.tr} wrap={false}>
            <Cell width="20%" first last bold>
              Overall
            </Cell>
            {data.sqdOverall.counts.map((c, j) => (
              <Cell width={j === 2 ? "12%" : "9%"} center last bold key={j}>
                {c || ""}
              </Cell>
            ))}
            <Cell width="11%" center last bold>
              {data.sqdOverall.responses}
            </Cell>
            <Cell width="12%" center last bold>
              {fmtPct(data.sqdOverall.ratingPct)}
            </Cell>
          </View>
        </View>
        <Text style={s.analysis}>
          <Text style={s.analysisLabel}>Description/Analysis: </Text>
          {sqdAnalysis}
        </Text>

        <Text style={s.sectionLabel}>C. Client Demographic Profile:</Text>

        <LabeledCountTable title="C.1 Gender" rows={[...data.sex, { label: "Did not specify", count: 0 }]} />
        <LabeledCountTable
          title="C.2 Type of Client"
          rows={[...data.customerType, { label: "Did not specify", count: 0 }]}
        />
        <LabeledCountTable title="C.3 Age Bracket" rows={[...data.age, { label: "Did not specify", count: 0 }]} />
        <LabeledCountTable title="C.4 Client Demographic by Region (Region by Residence)" rows={data.region} />

        <Text style={s.sectionLabel}>D. Free Responses/Suggestions from the client/s on how to further improve services:</Text>
        <BoxedText lines={data.remarks} />

        <Text style={s.sectionLabel}>E. Results of the B/S/Os Action Plan Reported (from previously submitted report/s):</Text>
        <BoxedText lines={actionPlanResults.trim() ? [actionPlanResults.trim()] : []} />

        <Text style={s.sectionLabel}>F. Continuous Improvement Plan:</Text>
        <View style={s.table}>
          <View style={s.trHead} wrap={false}>
            <Cell width="40%" first bold last={improvementPlan.length === 0}>
              Recommendation
            </Cell>
            <Cell width="35%" bold center last={improvementPlan.length === 0}>
              Action Plan
            </Cell>
            <Cell width="25%" bold center last={improvementPlan.length === 0}>
              Timeline/Period
            </Cell>
          </View>
          {improvementPlan.map((row, i) => (
            <View style={s.tr} key={i} wrap={false}>
              <Cell width="40%" first last={i === improvementPlan.length - 1}>
                {row.recommendation}
              </Cell>
              <Cell width="35%" center last={i === improvementPlan.length - 1}>
                {row.actionPlan}
              </Cell>
              <Cell width="25%" center last={i === improvementPlan.length - 1}>
                {row.timeline}
              </Cell>
            </View>
          ))}
        </View>

        <Text style={s.sectionLabel}>
          G. Recommendations for Improving the DMW CSM Reporting (e.g. best practices, process improvements)
        </Text>
        <BoxedText lines={csmRecommendations.trim() ? [csmRecommendations.trim()] : []} />

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

        <Text
          style={s.pageFooter}
          fixed
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </Page>
    </Document>
  );
}
