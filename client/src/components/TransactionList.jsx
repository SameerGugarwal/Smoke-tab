import { formatAmount, timeAgo } from '../lib/helpers';

export default function TransactionList({ transactions, onDelete, isVendor }) {
  if (!transactions?.length) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🧾</span>
        <p>No transactions yet</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {transactions.map((tx) => (
        <div
          key={tx._id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div
            style={{
              width: 40, height: 40,
              background: 'var(--color-surface2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              flexShrink: 0,
            }}
          >
            {tx.itemIcon || '🚬'}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
              {tx.itemName}
              {tx.quantity > 1 && (
                <span style={{ color: 'var(--color-text-muted)', marginLeft: '0.3rem' }}>×{tx.quantity}</span>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {timeAgo(tx.createdAt)}
              {tx.limitOverridden && (
                <span className="badge badge-warning" style={{ marginLeft: '0.5rem' }}>override</span>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.95rem' }}>
              +{formatAmount(tx.amount)}
            </div>
            {isVendor && onDelete && (
              <button
                onClick={() => onDelete(tx._id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-dim)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  marginTop: '2px',
                }}
              >
                ✕ remove
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
