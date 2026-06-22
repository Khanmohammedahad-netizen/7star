import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatCurrency, formatDate } from '../../lib/utils';
import { COUNTRY_LABEL } from '../../lib/constants';
import { getSettings } from '../../lib/settings';
import type {
  CountryCode,
  CurrencyCode,
  LineItem,
} from '../../types/database';

export interface PdfDoc {
  kind: 'Invoice' | 'Quotation';
  number: string;
  country: CountryCode;
  currency: CurrencyCode;
  issueDate: string;
  secondDateLabel: string;
  secondDate: string;
  status: string;
  clientName: string;
  clientContact?: string;
  items: LineItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  terms?: string | null;
  notes?: string | null;
}

const BRAND = '#2563eb';
const MUTED = '#64748b';

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: '#0f172a', fontFamily: 'Helvetica' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: BRAND,
    color: '#fff',
    textAlign: 'center',
    paddingTop: 7,
    fontSize: 14,
    marginRight: 8,
  },
  company: { fontSize: 14, fontWeight: 700 },
  docTitle: { fontSize: 22, fontWeight: 700, textAlign: 'right' },
  muted: { color: MUTED },
  section: { marginTop: 24 },
  twoCol: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  block: { width: '48%' },
  label: { color: MUTED, fontSize: 8, textTransform: 'uppercase', marginBottom: 3 },
  th: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 20,
  },
  td: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
  },
  cDesc: { width: '50%' },
  cQty: { width: '15%', textAlign: 'right' },
  cPrice: { width: '17%', textAlign: 'right' },
  cTotal: { width: '18%', textAlign: 'right' },
  totals: { marginTop: 14, marginLeft: 'auto', width: '45%' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#0f172a',
    fontSize: 12,
    fontWeight: 700,
  },
  footer: { marginTop: 36, fontSize: 8, color: MUTED, lineHeight: 1.5 },
});

export function DocumentPDF({ doc }: { doc: PdfDoc }) {
  const bank = getSettings().bank[doc.country];
  const hasBank = bank && (bank.bankName || bank.iban || bank.accountNumber);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.row}>
          <View style={s.brandRow}>
            <Text style={s.logo}>★</Text>
            <View>
              <Text style={s.company}>Seven Star Management</Text>
              <Text style={s.muted}>{COUNTRY_LABEL[doc.country]}</Text>
            </View>
          </View>
          <View>
            <Text style={s.docTitle}>{doc.kind}</Text>
            <Text style={[s.muted, { textAlign: 'right', marginTop: 4 }]}>
              {doc.number}
            </Text>
            <Text style={[s.muted, { textAlign: 'right' }]}>
              Status: {doc.status}
            </Text>
          </View>
        </View>

        <View style={s.twoCol}>
          <View style={s.block}>
            <Text style={s.label}>Bill To</Text>
            <Text style={{ fontWeight: 700 }}>{doc.clientName}</Text>
            {doc.clientContact ? <Text style={s.muted}>{doc.clientContact}</Text> : null}
          </View>
          <View style={s.block}>
            <View style={s.row}>
              <Text style={s.label}>Issue date</Text>
              <Text>{formatDate(doc.issueDate)}</Text>
            </View>
            <View style={[s.row, { marginTop: 4 }]}>
              <Text style={s.label}>{doc.secondDateLabel}</Text>
              <Text>{formatDate(doc.secondDate)}</Text>
            </View>
          </View>
        </View>

        <View style={s.th}>
          <Text style={s.cDesc}>Description</Text>
          <Text style={s.cQty}>Qty</Text>
          <Text style={s.cPrice}>Unit price</Text>
          <Text style={s.cTotal}>Total</Text>
        </View>
        {doc.items.map((it) => (
          <View style={s.td} key={it.id || it.position}>
            <Text style={s.cDesc}>{it.description}</Text>
            <Text style={s.cQty}>{it.qty}</Text>
            <Text style={s.cPrice}>{formatCurrency(it.unit_price, doc.currency)}</Text>
            <Text style={s.cTotal}>{formatCurrency(it.total, doc.currency)}</Text>
          </View>
        ))}

        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text style={s.muted}>Subtotal</Text>
            <Text>{formatCurrency(doc.subtotal, doc.currency)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.muted}>
              VAT ({(doc.vatRate * 100).toFixed(0)}%)
            </Text>
            <Text>{formatCurrency(doc.vatAmount, doc.currency)}</Text>
          </View>
          <View style={s.grandTotal}>
            <Text>Total</Text>
            <Text>{formatCurrency(doc.total, doc.currency)}</Text>
          </View>
        </View>

        <View style={s.footer}>
          {hasBank ? (
            <Text>
              Bank: {bank.bankName} · {bank.accountName}
              {bank.accountNumber ? ` · A/C ${bank.accountNumber}` : ''}
              {bank.iban ? ` · IBAN ${bank.iban}` : ''}
            </Text>
          ) : null}
          {doc.terms ? <Text>Terms: {doc.terms}</Text> : null}
          {doc.notes ? <Text>Notes: {doc.notes}</Text> : null}
          <Text style={{ marginTop: 12 }}>
            Seven Star Management · {COUNTRY_LABEL[doc.country]} · Thank you for
            your business.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

