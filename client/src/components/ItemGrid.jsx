import { useState } from 'react';
import { formatAmount } from '../lib/helpers';

const BRAND_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'marlboro', label: 'Marlboro' },
  { key: 'gold flake', label: 'Gold Flake' },
  { key: 'four square', label: 'Four Square' },
  { key: 'classic', label: 'Classic' },
  { key: 'dunhill', label: 'Dunhill' },
  { key: 'other', label: 'Other' },
];

const CIGARETTE_BRANDS = ['marlboro', 'gold flake', 'four square', 'classic', 'dunhill'];

function getBrand(name) {
  const lower = name.toLowerCase();
  for (const brand of CIGARETTE_BRANDS) {
    if (lower.startsWith(brand)) return brand;
  }
  return 'other';
}

export default function ItemGrid({ items, onSelect, loading }) {
  const [filter, setFilter] = useState('all');

  if (loading) return <div className="spinner" />;

  if (!items?.length) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📦</span>
        <p>No inventory items yet</p>
      </div>
    );
  }

  const filtered = filter === 'all'
    ? items
    : items.filter((item) => getBrand(item.name) === filter);

  return (
    <div>
      {/* Brand filter tabs */}
      <div style={{
        display: 'flex',
        gap: '0.375rem',
        overflowX: 'auto',
        paddingBottom: '0.75rem',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}>
        {BRAND_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '0.375rem 0.75rem',
              background: filter === key ? 'var(--color-primary)' : 'var(--color-surface)',
              color: filter === key ? '#0a0a0f' : 'var(--color-text-muted)',
              border: `1px solid ${filter === key ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: '20px',
              cursor: 'pointer',
              fontFamily: 'var(--font)',
              fontSize: '0.75rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="item-grid">
        {filtered.map((item) => (
          <button
            key={item._id}
            className="item-btn"
            onClick={() => onSelect(item)}
          >
            <span className="icon">{item.icon || '🚬'}</span>
            <span className="name">{item.name}</span>
            <span className="price">{formatAmount(item.price)}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          No items in this category
        </div>
      )}
    </div>
  );
}
