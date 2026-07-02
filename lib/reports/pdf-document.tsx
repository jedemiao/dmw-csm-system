import "server-only";
import fs from "node:fs";
import path from "node:path";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { MonthlyAggregate } from "./aggregate";
import type { ImprovementPlanRow, ServiceTransactionRow } from "@/app/admin/(protected)/reports/actions";
import { MONTH_NAMES, OFFICE_ADDRESS, OFFICE_EMAIL, OFFICE_NAME, OFFICE_PHONE, OFFICE_WEBSITE } from "./constants";

// react-pdf resolves local image `src` *strings* via Node's legacy url.parse() + path.resolve(),
// which mishandles Windows paths (drive letter read as a URL protocol, then even a file:// URL
// gets mis-resolved because it calls path.resolve() on the whole href instead of the pathname).
// Passing the already-read Buffer instead skips that resolution path entirely.
function readAsset(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath));
}

const COAT_OF_ARMS_PATH = readAsset("public/images/report-ph-coat-of-arms.png");
const BAGONG_PILIPINAS_LOGO_PATH = readAsset("public/images/report-bagong-pilipinas-logo.png");

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 8.5, fontFamily: "Times-Roman", color: "#111" },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  headerLogo: { width: 55, height: 55 },
  bagongPilipinasLogo: { width: 60, height: 55 },
  headerText: { flex: 1, textAlign: "center" },
  headerKicker: { fontSize: 11 },
  headerTitle: { fontSize: 20, fontFamily: "Times-Bold", marginTop: 2 },
  addressLine: { textAlign: "center", fontSize: 8, marginTop: 4, marginBottom: 6 },
  contactLine: { textAlign: "center", fontSize: 8, marginTop: 6, marginBottom: 10 },
  link: { color: "#1155cc", textDecoration: "underline" },
  hr: { borderBottomWidth: 1, borderBottomColor: "#111" },
  reportTitle: { textAlign: "center", fontFamily: "Times-Bold", fontSize: 11 },
  reportSubtitle: { textAlign: "center", fontSize: 9, marginTop: 2, marginBottom: 10 },
  officeLine: { fontSize: 9, marginBottom: 10 },
  officeLineValue: { textDecoration: "underline", fontFamily: "Times-Bold" },
  sectionLabel: { fontFamily: "Times-Bold", fontSize: 9.5, marginBottom: 4, marginTop: 10 },
  subLabel: { fontFamily: "Times-Bold", fontSize: 9, marginBottom: 4, marginTop: 6 },
  table: { borderWidth: 1, borderColor: "#111", marginBottom: 4 },
  tr: { flexDirection: "row" },
  trHead: { flexDirection: "row" },
  trGroupHead: { flexDirection: "row" },
  trBlank: { flexDirection: "row", minHeight: 10 },
  td: { borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#111", padding: 3, fontSize: 8 },
  tdLast: { borderBottomWidth: 1, borderColor: "#111", padding: 3, fontSize: 8 },
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
  last,
  bold,
  center,
}: {
  children: React.ReactNode;
  width?: number | string;
  last?: boolean;
  bold?: boolean;
  center?: boolean;
}) {
  return (
    <View style={{ width, ...(last ? s.tdLast : s.td), ...(bold ? s.tdBold : {}), ...(center ? s.tdCenter : {}) }}>
      <Text>{children}</Text>
    </View>
  );
}

function fmtPct(v: number | null) {
  return v === null ? "" : `${v}%`;
}

function BlankRow() {
  return (
    <View style={s.trBlank}>
      <Cell width="60%">{""}</Cell>
      <Cell width="20%">{""}</Cell>
      <Cell width="20%" last>
        {""}
      </Cell>
    </View>
  );
}

function LabeledCountTable({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  return (
    <View style={{ ...s.table, marginTop: 6 }}>
      <View style={s.trHead}>
        <Cell width="70%" bold>
          {title}
        </Cell>
        <Cell width="30%" last>
          {""}
        </Cell>
      </View>
      {rows.map((row) => (
        <View style={s.tr} key={row.label}>
          <Cell width="70%">{row.label}</Cell>
          <Cell width="30%" center last>
            {row.count || ""}
          </Cell>
        </View>
      ))}
    </View>
  );
}

export function MonthlyReportDocument({
  data,
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
  data: MonthlyAggregate;
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
  const totalTx = serviceTransactions.reduce((sum, r) => sum + (r.totalTransactions || 0), 0);

  return (
    <Document title={`CSM Report - ${MONTH_NAMES[data.month - 1]} ${data.year}`}>
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
        <Text style={s.reportSubtitle}>For the Month of {MONTH_NAMES[data.month - 1]} {data.year}</Text>

        <Text style={s.officeLine}>
          Office : <Text style={s.officeLineValue}>{OFFICE_NAME}</Text>
        </Text>

        <Text style={s.sectionLabel}>A. Summary</Text>
        <View style={s.table}>
          <View style={s.trHead}>
            <Cell width="55%" bold>
              External / Internal Service
            </Cell>
            <Cell width="22.5%" bold center>
              Responses
            </Cell>
            <Cell width="22.5%" bold center last>
              Total Transactions
            </Cell>
          </View>
          {serviceTransactions.map((row, i) => (
            <View style={s.tr} key={row.service}>
              <Cell width="55%">
                {i + 1}. {row.service}
              </Cell>
              <Cell width="22.5%" center>
                {data.serviceCounts.find((r) => r.service === row.service)?.responses ?? 0}
              </Cell>
              <Cell width="22.5%" center last>
                {row.totalTransactions || ""}
              </Cell>
            </View>
          ))}
          <View style={s.tr}>
            <Cell width="55%" bold center>
              Total
            </Cell>
            <Cell width="22.5%" bold center>
              {data.totalResponses}
            </Cell>
            <Cell width="22.5%" bold center last>
              {totalTx || ""}
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
          <View style={s.trHead}>
            <Cell width="60%" bold>
              Count of CC
            </Cell>
            <Cell width="20%" bold center>
              Responses
            </Cell>
            <Cell width="20%" bold center last>
              Percentage
            </Cell>
          </View>
          <View style={s.trGroupHead}>
            <Cell width="100%" bold last>
              CC1: Awareness
            </Cell>
          </View>
          {data.cc1.map((row) => (
            <View style={s.tr} key={row.label}>
              <Cell width="60%">{row.label}</Cell>
              <Cell width="20%" center>
                {row.count || ""}
              </Cell>
              <Cell width="20%" center last>
                {fmtPct(row.pct)}
              </Cell>
            </View>
          ))}
          <BlankRow />
          <View style={s.trGroupHead}>
            <Cell width="100%" bold last>
              CC2: Visibility
            </Cell>
          </View>
          {data.cc2.map((row) => (
            <View style={s.tr} key={row.label}>
              <Cell width="60%">{row.label}</Cell>
              <Cell width="20%" center>
                {row.count || ""}
              </Cell>
              <Cell width="20%" center last>
                {fmtPct(row.pct)}
              </Cell>
            </View>
          ))}
          <BlankRow />
          <View style={s.trGroupHead}>
            <Cell width="100%" bold last>
              CC3: Citizen&apos;s Charter Usage
            </Cell>
          </View>
          {data.cc3.map((row) => (
            <View style={s.tr} key={row.label}>
              <Cell width="60%">{row.label}</Cell>
              <Cell width="20%" center>
                {row.count || ""}
              </Cell>
              <Cell width="20%" center last>
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
          <View style={s.trHead}>
            <Cell width="24%" bold>
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
            <Cell width="11%" bold center last>
              Rating
            </Cell>
          </View>
          {data.sqd.map((row) => (
            <View style={s.tr} key={row.key}>
              <Cell width="24%">{row.label}</Cell>
              {row.counts.map((c, i) => (
                <Cell width={i === 2 ? "14%" : "10%"} center key={i}>
                  {c || ""}
                </Cell>
              ))}
              <Cell width="11%" center>
                {row.responses}
              </Cell>
              <Cell width="11%" center last>
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
          <View style={s.trHead}>
            <Cell width="70%" bold>
              Details
            </Cell>
            <Cell width="30%" bold center last>
              When
            </Cell>
          </View>
          {improvementPlan.map((row, i) => (
            <View style={s.tr} key={i}>
              <Cell width="70%">{row.details}</Cell>
              <Cell width="30%" center last>
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
