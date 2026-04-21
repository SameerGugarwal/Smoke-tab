import { formatAmount } from '../lib/helpers';

export default function LimitWarningModal({ warning, onOverride, onCancel }) {
  if (!warning) return null;

  const isCount = warning.limitType === 'daily_count';

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚠️</div>
          <h2 style={{ color: 'var(--color-warning)' }}>Limit Reached</h2>
          <p style={{ marginTop: '0.5rem' }}>
            {isCount
              ? `Customer's daily limit is ${warning.limitValue} cigarette${warning.limitValue !== 1 ? 's' : ''}. They've already had ${warning.currentCount}.`
              : `Customer's daily spend limit is ${formatAmount(warning.limitValue)}. Current spend: ${formatAmount(warning.currentSpend)}.`
            }
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button className="btn btn-danger btn-lg" onClick={onOverride}>
            Override & Add Anyway
          </button>
          <button className="btn btn-ghost btn-lg" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
