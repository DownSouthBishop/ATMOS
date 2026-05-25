import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

interface ReceiptData {
  receiptNumber: string;
  type: string;
  title: string;
  description: string | null;
  partyAName: string;
  partyBName: string;
  settlementCurrency: string;
  settlementAmount: string | null;
  paymentMethod: string | null;
  paymentNotes: string | null;
  status: string;
  sigA: boolean;
  sigAAt: string | null;
  sigB: boolean;
  sigBAt: string | null;
  sealedAt: string | null;
  createdAt: string;
  shareToken: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  real_world: 'REAL WORLD DEAL',
  real_world_deal: 'REAL WORLD DEAL',
  payment: 'PAYMENT',
  service: 'SERVICE',
  agreement: 'AGREEMENT',
  contract: 'CONTRACT',
  agent_job: 'AGENT JOB',
  job_completion: 'JOB COMPLETION',
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

const GOLD = '#C9A84C';
const DARK = '#101312';
const MUTED = '#7A7870';
const CREAM = '#F0EBE1';

const styles = StyleSheet.create({
  page: {
    backgroundColor: DARK,
    padding: 48,
    fontFamily: 'Helvetica',
    color: CREAM,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingBottom: 16,
    borderBottom: `1px solid rgba(201,168,76,0.3)`,
  },
  brand: {
    fontSize: 18,
    color: GOLD,
    letterSpacing: 4,
    fontFamily: 'Helvetica-Bold',
  },
  receiptNum: {
    fontSize: 8,
    color: GOLD,
    letterSpacing: 1,
    fontFamily: 'Courier',
    textAlign: 'right',
  },
  statusBadge: {
    marginTop: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(201,168,76,0.12)',
    borderRadius: 3,
    alignSelf: 'flex-end',
  },
  statusText: {
    fontSize: 7,
    color: GOLD,
    letterSpacing: 2,
    fontFamily: 'Courier',
  },
  // Type + title
  typeLabel: {
    fontSize: 8,
    color: MUTED,
    letterSpacing: 3,
    fontFamily: 'Courier',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    color: CREAM,
    fontFamily: 'Helvetica',
    marginBottom: 8,
    lineHeight: 1.2,
  },
  description: {
    fontSize: 11,
    color: MUTED,
    lineHeight: 1.6,
    marginBottom: 28,
    paddingBottom: 24,
    borderBottom: `1px solid rgba(255,255,255,0.06)`,
  },
  // Sections
  sectionLabel: {
    fontSize: 7,
    color: MUTED,
    letterSpacing: 3,
    fontFamily: 'Courier',
    marginBottom: 12,
  },
  row2: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  partyBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 4,
    padding: 14,
  },
  partyRole: {
    fontSize: 7,
    color: MUTED,
    letterSpacing: 2,
    fontFamily: 'Courier',
    marginBottom: 6,
  },
  partyName: {
    fontSize: 16,
    color: CREAM,
    marginBottom: 8,
  },
  sigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sigDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 4,
  },
  sigText: {
    fontSize: 7,
    letterSpacing: 1,
    fontFamily: 'Courier',
  },
  // Settlement
  settlementRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 24,
  },
  settleLabel: {
    fontSize: 7,
    color: MUTED,
    letterSpacing: 2,
    fontFamily: 'Courier',
    marginBottom: 6,
  },
  settleAmount: {
    fontSize: 28,
    color: GOLD,
  },
  settleCurrency: {
    fontSize: 10,
    color: MUTED,
    letterSpacing: 1,
    fontFamily: 'Courier',
    marginTop: 4,
  },
  settleMethod: {
    fontSize: 12,
    color: CREAM,
    marginTop: 4,
  },
  // Record
  recordSection: {
    borderTop: `1px solid rgba(255,255,255,0.06)`,
    paddingTop: 20,
    marginBottom: 24,
  },
  recordRow: {
    flexDirection: 'row',
    gap: 48,
  },
  recordItem: {
    marginRight: 32,
  },
  recordKey: {
    fontSize: 7,
    color: MUTED,
    letterSpacing: 2,
    fontFamily: 'Courier',
    marginBottom: 4,
  },
  recordVal: {
    fontSize: 9,
    color: CREAM,
    fontFamily: 'Courier',
  },
  recordValGold: {
    fontSize: 9,
    color: GOLD,
    fontFamily: 'Courier',
  },
  // Watermark stamp (diagonal)
  stampWrapper: {
    position: 'absolute',
    top: 200,
    right: 48,
    width: 140,
    height: 140,
    transform: 'rotate(15deg)',
    opacity: 0.12,
  },
  stampCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    border: `3px solid ${GOLD}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampText: {
    fontSize: 11,
    color: GOLD,
    letterSpacing: 6,
    fontFamily: 'Courier',
    textAlign: 'center',
  },
  stampSub: {
    fontSize: 7,
    color: GOLD,
    letterSpacing: 3,
    fontFamily: 'Courier',
    textAlign: 'center',
    marginTop: 2,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 48,
    right: 48,
    borderTop: `1px solid rgba(255,255,255,0.06)`,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: MUTED,
    fontFamily: 'Courier',
    letterSpacing: 1,
  },
  footerUrl: {
    fontSize: 8,
    color: GOLD,
    fontFamily: 'Courier',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 20,
  },
});

interface Props {
  receipt: ReceiptData;
}

export function ReceiptPDFDocument({ receipt }: Props) {
  const typeLabel = TYPE_LABELS[receipt.type] ?? receipt.type.replace(/_/g, ' ').toUpperCase();
  const sealed = receipt.status === 'sealed';
  const shareUrl = receipt.shareToken ? `atmos.io/r/${receipt.shareToken}` : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Watermark stamp — low opacity, diagonal */}
        {sealed && (
          <View style={styles.stampWrapper}>
            <View style={styles.stampCircle}>
              <Text style={styles.stampText}>ATMOS</Text>
              <Text style={styles.stampSub}>STAMPED</Text>
              <Text style={styles.stampSub}>VERIFIED</Text>
            </View>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>ATMOS</Text>
          <View>
            <Text style={styles.receiptNum}>{receipt.receiptNumber}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{sealed ? '◈ STAMPED' : '◇ PENDING'}</Text>
            </View>
          </View>
        </View>

        {/* Type + Title */}
        <Text style={styles.typeLabel}>{typeLabel}</Text>
        <Text style={styles.title}>{receipt.title}</Text>

        {receipt.description && (
          <Text style={styles.description}>{receipt.description}</Text>
        )}

        {/* §01 PARTIES */}
        <Text style={styles.sectionLabel}>§01 · PARTIES</Text>
        <View style={styles.row2}>
          {/* Party A */}
          <View style={styles.partyBox}>
            <Text style={styles.partyRole}>PARTY A</Text>
            <Text style={styles.partyName}>{receipt.partyAName}</Text>
            <View style={styles.sigRow}>
              <View style={[styles.sigDot, { backgroundColor: receipt.sigA ? GOLD : MUTED }]} />
              {receipt.sigA ? (
                <Text style={[styles.sigText, { color: GOLD }]}>
                  STAMPED{receipt.sigAAt ? ` · ${fmtDate(receipt.sigAAt)}` : ''}
                </Text>
              ) : (
                <Text style={[styles.sigText, { color: MUTED }]}>AWAITING STAMP</Text>
              )}
            </View>
          </View>

          {/* Party B */}
          <View style={styles.partyBox}>
            <Text style={styles.partyRole}>PARTY B</Text>
            <Text style={styles.partyName}>{receipt.partyBName || '—'}</Text>
            <View style={styles.sigRow}>
              <View style={[styles.sigDot, { backgroundColor: receipt.sigB ? GOLD : MUTED }]} />
              {receipt.sigB ? (
                <Text style={[styles.sigText, { color: GOLD }]}>
                  STAMPED{receipt.sigBAt ? ` · ${fmtDate(receipt.sigBAt)}` : ''}
                </Text>
              ) : (
                <Text style={[styles.sigText, { color: MUTED }]}>AWAITING STAMP</Text>
              )}
            </View>
          </View>
        </View>

        {/* §02 SETTLEMENT */}
        {(receipt.settlementAmount ?? receipt.paymentMethod) && (
          <>
            <Text style={styles.sectionLabel}>§02 · SETTLEMENT</Text>
            <View style={styles.settlementRow}>
              {receipt.settlementAmount && (
                <View>
                  <Text style={styles.settleLabel}>AMOUNT</Text>
                  <Text style={styles.settleAmount}>{receipt.settlementAmount}</Text>
                  <Text style={styles.settleCurrency}>{receipt.settlementCurrency}</Text>
                </View>
              )}
              {receipt.paymentMethod && (
                <View>
                  <Text style={styles.settleLabel}>METHOD</Text>
                  <Text style={styles.settleMethod}>
                    {receipt.paymentMethod.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            {receipt.paymentNotes && (
              <Text style={[styles.description, { marginBottom: 20 }]}>{receipt.paymentNotes}</Text>
            )}
            <View style={styles.divider} />
          </>
        )}

        {/* §03 RECORD */}
        <Text style={styles.sectionLabel}>§03 · RECORD</Text>
        <View style={styles.recordRow}>
          <View style={styles.recordItem}>
            <Text style={styles.recordKey}>ISSUED</Text>
            <Text style={styles.recordVal}>{fmtDate(receipt.createdAt)}</Text>
          </View>
          {receipt.sealedAt && (
            <View style={styles.recordItem}>
              <Text style={styles.recordKey}>STAMPED</Text>
              <Text style={styles.recordValGold}>{fmtDate(receipt.sealedAt)}</Text>
            </View>
          )}
          <View style={styles.recordItem}>
            <Text style={styles.recordKey}>PLATFORM</Text>
            <Text style={styles.recordVal}>ATMOS</Text>
          </View>
          {shareUrl && (
            <View style={styles.recordItem}>
              <Text style={styles.recordKey}>VERIFY</Text>
              <Text style={styles.recordValGold}>{shareUrl}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This receipt was stamped on ATMOS · {receipt.receiptNumber}
          </Text>
          {shareUrl && (
            <Text style={styles.footerUrl}>{shareUrl}</Text>
          )}
        </View>

      </Page>
    </Document>
  );
}
