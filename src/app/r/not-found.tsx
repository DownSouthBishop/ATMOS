export default function ReceiptNotFound() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--black)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--ff)',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '5px',
          color: 'var(--gold)',
          marginBottom: '72px',
        }}
      >
        ATMOS
      </div>

      <div
        style={{
          fontFamily: 'var(--fs)',
          fontSize: '96px',
          color: 'rgba(255,255,255,0.05)',
          fontWeight: 300,
          lineHeight: 1,
          marginBottom: '32px',
          userSelect: 'none',
        }}
      >
        404
      </div>

      <div
        style={{
          fontFamily: 'var(--fs)',
          fontSize: '30px',
          color: 'var(--cream)',
          fontWeight: 300,
          marginBottom: '16px',
        }}
      >
        Receipt not found
      </div>

      <div
        style={{
          fontFamily: 'var(--fm)',
          fontSize: '11px',
          color: 'var(--muted)',
          letterSpacing: '0.5px',
          marginBottom: '72px',
          maxWidth: '380px',
          lineHeight: 1.8,
        }}
      >
        This link may have expired, been revoked, or never existed.
        Contact the party who shared it with you.
      </div>

      <a
        href="/register"
        style={{
          fontFamily: 'var(--fm)',
          fontSize: '10px',
          letterSpacing: '3px',
          color: 'var(--muted)',
          textDecoration: 'none',
        }}
      >
        Stamp your own receipts — ATMOS
      </a>
    </div>
  );
}
