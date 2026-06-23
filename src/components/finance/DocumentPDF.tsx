import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import { formatDate, amountToWords } from '../../lib/utils';
import type { Region, CurrencyCode, DocItem } from '../../types/database';

export interface PdfDoc {
  kind: 'Quotation' | 'Tax Invoice';
  number: string;
  region: Region;
  currency: CurrencyCode;
  date: string;
  clientName: string;
  element?: string;
  items: DocItem[];
  net: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  /** Optional logo override (Node verification inlines a data-URI). */
  logoSrc?: string;
}

const COMPANY = '7 STAR INTERNATIONAL EVENTS L.L.C';
const ADDRESS = ['P2A-J01, WHP2-BLOCK-A COMMERCIAL', 'SAIH SHUBAIB 3', 'DUBAI - UAE'];
const VAT_TRN = '104038790200003';
const APPROVED_BY = 'Shaji Mohammed Khan';
const LOGO =
  // Browser serves from /public; Node verification can override with a path.
  (typeof process !== 'undefined' && process.env?.PDF_LOGO) ||
  '/seven-star-logo.png';

const TERMS = [
  'Any Change in working drawings should be given before the fabrication has started',
  'Any Change in size will have cost implications',
  'Any NOC’s from Municipality, Horticulture & DEWA/SEWA/FEWA are additions costs as per actuals.',
  'Economic Department approvals to be obtained by 7 Star International fees to be paid by Client.',
  'All site Utilities (Water, Electricity and Telephone) to be provided by Client.',
  'Enclosed storage area to be provided by client for storing the finished work till the time of Installation.',
  'Variation to any of the above information must be confirmed in writing by the officials.',
  'Payment Terms 50% advance along with order confirmation and 50% upon completion of project.',
  'The payment will be accepted only via Transfer & Cheques to our Bank Account.',
];
const BANK = [
  'ADCB BANK',
  'Account name - 7Star International Events LLC SHJ BR',
  'Iban - AE020030012980065820001',
  'Ac no - 12980065820001',
  'Swiftcode - ADCBAEAA',
  'Branch - Abu Dhabi Main Branch',
];

const GREEN = '#b6d7a8';
const GREEN_AMT = '#a9d08e';
const BLUE = '#1f5fbf';
const LINE = '#000000';

const money = (n: number, cur: string) =>
  `${cur}${(n || 0).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const s = StyleSheet.create({
  page: { paddingHorizontal: 36, paddingVertical: 28, fontSize: 9, fontFamily: 'Helvetica', color: '#000' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logo: { width: 92, height: 84, objectFit: 'contain' },
  companyWrap: { flex: 1, alignItems: 'flex-end' },
  companyName: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  addr: { fontSize: 8.5, color: '#222' },
  title: { fontSize: 24, fontFamily: 'Helvetica-Bold', marginTop: 4, marginBottom: 6, marginLeft: 96 },
  greenBar: { backgroundColor: GREEN, paddingVertical: 4, paddingHorizontal: 8, textAlign: 'center', fontFamily: 'Helvetica-Bold', fontSize: 9.5 },
  greenBarBorder: { borderWidth: 0.5, borderColor: '#7a9e63', borderBottomWidth: 0 },
  meta: { marginTop: 6, marginBottom: 6 },
  metaLine: { fontFamily: 'Helvetica-Bold', fontSize: 9 },

  table: { borderWidth: 0.7, borderColor: LINE },
  th: { flexDirection: 'row', borderBottomWidth: 0.7, borderColor: LINE },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: LINE, minHeight: 24 },
  cell: { paddingVertical: 3, paddingHorizontal: 4, borderRightWidth: 0.5, borderColor: LINE },
  cellLast: { paddingVertical: 3, paddingHorizontal: 4, backgroundColor: GREEN_AMT, justifyContent: 'center' },
  thText: { fontFamily: 'Helvetica-Bold', fontSize: 8.5 },

  cNo: { width: '7%', textAlign: 'center' },
  cDesc: { width: '45%' },
  cSize: { width: '11%', textAlign: 'center' },
  cQty: { width: '11%', textAlign: 'center' },
  cRate: { width: '13%', textAlign: 'right' },
  cAmt: { width: '13%', textAlign: 'right' },

  totalsWrap: { flexDirection: 'row', marginTop: -0.7 },
  totalsLeft: { width: '63%' },
  totalsRight: { width: '37%', borderWidth: 0.7, borderTopWidth: 0, borderColor: LINE },
  totRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: LINE },
  totLabel: { width: '55%', paddingVertical: 3, paddingHorizontal: 4, fontFamily: 'Helvetica-Bold', textAlign: 'center', borderRightWidth: 0.5, borderColor: LINE },
  totVal: { width: '45%', paddingVertical: 3, paddingHorizontal: 4, textAlign: 'right', fontFamily: 'Helvetica-Bold' },

  sectionHeader: { backgroundColor: GREEN, paddingVertical: 5, textAlign: 'center', fontFamily: 'Helvetica-Bold', fontSize: 10, marginTop: 14 },
  bullet: { flexDirection: 'row', marginTop: 4 },
  bulletDot: { width: 10, fontFamily: 'Helvetica-Bold' },
  bulletText: { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 8.5 },

  footer: { position: 'absolute', left: 36, right: 36, bottom: 24, backgroundColor: GREEN, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, paddingHorizontal: 10 },
  footerText: { fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: '#1a3a12' },
});

function Header({ title, logo }: { title: string; logo: string }) {
  return (
    <>
      <View style={s.headerRow}>
        <Image src={logo} style={s.logo} />
        <View style={s.companyWrap}>
          <Text style={s.companyName}>{COMPANY}</Text>
          {ADDRESS.map((a) => (
            <Text key={a} style={s.addr}>{a}</Text>
          ))}
        </View>
      </View>
      <Text style={s.title}>{title}</Text>
    </>
  );
}

function ClientBlock({ clientName, element }: { clientName: string; element?: string }) {
  return (
    <View>
      <Text style={[s.greenBar, s.greenBarBorder]}>CLIENT : {clientName}</Text>
      <Text style={[s.greenBar, { borderWidth: 0.5, borderColor: '#7a9e63' }]}>
        Element : {element ?? ''}
      </Text>
    </View>
  );
}

function Meta({ doc }: { doc: PdfDoc }) {
  const dateLabel = doc.kind === 'Quotation' ? 'Quotation Date' : 'Invoice Date';
  const numLabel = doc.kind === 'Quotation' ? 'Quotation Number' : 'Invoice Number';
  return (
    <View style={s.meta}>
      <Text style={s.metaLine}>{dateLabel}: {doc.date ? formatDate(doc.date) : ''}</Text>
      <Text style={s.metaLine}>{numLabel}: {doc.number}</Text>
      <Text style={s.metaLine}>VAT TRN: - {VAT_TRN}</Text>
    </View>
  );
}

function Footer({ email }: { email: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>NAD AL HAMMAR, DUBAI, UAE.</Text>
      <Text style={s.footerText}>{email}</Text>
      <Text style={s.footerText}>+971 56 506 5566</Text>
    </View>
  );
}

function ItemsTable({ doc }: { doc: PdfDoc }) {
  const vatPct = `${(doc.vatRate * 100).toFixed(0)}% Vat`;
  const cur = doc.currency;
  const MIN_ROWS = 15;
  const emptyRows = Math.max(0, MIN_ROWS - doc.items.length);
  return (
    <>
      <View style={s.table}>
        <View style={s.th}>
          <Text style={[s.cell, s.cNo, s.thText]}>S.No</Text>
          <Text style={[s.cell, s.cDesc, s.thText]}>Description</Text>
          <Text style={[s.cell, s.cSize, s.thText]}>Size</Text>
          <Text style={[s.cell, s.cQty, s.thText]}>Quantity</Text>
          <Text style={[s.cell, s.cRate, s.thText]}>Rate {cur}</Text>
          <Text style={[s.cAmt, s.cellLast, s.thText, { textAlign: 'center' }]}>Amount {cur}</Text>
        </View>
        {doc.items.map((it, i) => (
          <View style={s.tr} key={it.serial_no ?? i} wrap={false}>
            <Text style={[s.cell, s.cNo]}>{it.serial_no ?? i + 1}</Text>
            <Text style={[s.cell, s.cDesc]}>{it.description}</Text>
            <Text style={[s.cell, s.cSize]}>{it.size ?? ''}</Text>
            <Text style={[s.cell, s.cQty]}>{it.quantity}</Text>
            <Text style={[s.cell, s.cRate]}>
              {(it.rate || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={[s.cAmt, s.cellLast, { textAlign: 'right' }]}>
              {(it.amount || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        ))}
        {Array.from({ length: emptyRows }).map((_, i) => (
          <View style={s.tr} key={`empty-${i}`} wrap={false}>
            <Text style={[s.cell, s.cNo]} />
            <Text style={[s.cell, s.cDesc]} />
            <Text style={[s.cell, s.cSize]} />
            <Text style={[s.cell, s.cQty]} />
            <Text style={[s.cell, s.cRate]} />
            <Text style={[s.cAmt, s.cellLast]} />
          </View>
        ))}
      </View>

      <View style={s.totalsWrap}>
        <View style={s.totalsLeft} />
        <View style={s.totalsRight}>
          <View style={s.totRow}>
            <Text style={s.totLabel}>Net Amount ({cur})</Text>
            <Text style={s.totVal}>{money(doc.net, cur)}</Text>
          </View>
          <View style={s.totRow}>
            <Text style={s.totLabel}>{vatPct}</Text>
            <Text style={s.totVal}>{money(doc.vatAmount, cur)}</Text>
          </View>
          <View style={[s.totRow, { backgroundColor: GREEN_AMT, borderBottomWidth: 0 }]}>
            <Text style={[s.totLabel, { color: BLUE }]}>Total</Text>
            <Text style={[s.totVal, { color: BLUE }]}>{money(doc.total, cur)}</Text>
          </View>
        </View>
      </View>
    </>
  );
}

export function DocumentPDF({ doc }: { doc: PdfDoc }) {
  const isQuote = doc.kind === 'Quotation';
  const logo = doc.logoSrc ?? LOGO;
  const email = isQuote ? 'ShajiKhan@7StarInternational.com' : 'Info@7starinternational.com';

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Header title={doc.kind} logo={logo} />
        <ClientBlock clientName={doc.clientName} element={doc.element} />
        <Meta doc={doc} />
        <ItemsTable doc={doc} />

        {!isQuote && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>
              Amount in Words: {amountToWords(doc.total, doc.currency)}
            </Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', marginTop: 12 }}>
              Confirmed by: {APPROVED_BY}
            </Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', marginTop: 8 }}>Signature:</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', marginTop: 12 }}>Received By:</Text>
            <Text style={s.sectionHeader}>Bank Details</Text>
            {BANK.map((b) => (
              <View key={b} style={s.bullet}>
                <Text style={s.bulletDot}>•</Text>
                <Text style={s.bulletText}>{b}</Text>
              </View>
            ))}
          </View>
        )}

        <Footer email={email} />
      </Page>

      {isQuote && (
        <Page size="A4" style={s.page}>
          <Text style={[s.title, { marginLeft: 0, textAlign: 'center' }]}>Quotation</Text>
          <ClientBlock clientName={doc.clientName} element={doc.element} />
          <Meta doc={doc} />

          <Text style={s.sectionHeader}>Terms &amp; Conditions</Text>
          {TERMS.map((t) => (
            <View key={t} style={s.bullet}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>{t}</Text>
            </View>
          ))}

          <Text style={s.sectionHeader}>Bank Details</Text>
          {BANK.map((b) => (
            <View key={b} style={s.bullet}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>{b}</Text>
            </View>
          ))}

          <View style={{ flexDirection: 'row', marginTop: 28 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', textAlign: 'center' }}>
                7 Star International Events LLC
              </Text>
              <Text style={{ fontFamily: 'Helvetica-Bold', marginTop: 8 }}>
                Approved by : {APPROVED_BY}
              </Text>
              <Text style={{ fontFamily: 'Helvetica-Bold', marginTop: 6 }}>Signature :</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', textAlign: 'center' }}>Client</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold', marginTop: 8 }}>Approved by :</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold', marginTop: 6 }}>Signature :</Text>
            </View>
          </View>

          <Footer email={email} />
        </Page>
      )}
    </Document>
  );
}
