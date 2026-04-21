import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { formatAmount, getInitials } from '../../lib/helpers';
import { SpendChart } from '../../components/ConsumptionChart';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function VendorAnalytics() {
  const navigate = useNavigate();
  const [data, setData] = useState({ exposure: null, debtors: [], trends: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/exposure'),
      api.get('/analytics/top-debtors'),
      api.get('/analytics/trends'),
    ]).then(([exp, debt, trends]) => {
      setData({
        exposure: exp.data,
        debtors: debt.data.debtors,
        trends: trends.data.daily,
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullPage />;

  const { exposure, debtors, trends } = data;

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/vendor')}>←</button>
        <h2>Analytics</h2>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="stat-card">
          <div className="label">Total Exposure</div>
          <div className="value" style={{ color: 'var(--color-danger)' }}>
            {formatAmount(exposure?.totalExposure)}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Customers</div>
          <div className="value" style={{ color: 'var(--color-primary)' }}>
            {exposure?.customerCount || 0}
          </div>
        </div>
      </div>

      {/* Revenue trend chart */}
      {trends?.length > 0 && (
        <div className="card">
          <div className="section-title" style={{ marginBottom: '0.75rem' }}>This Month</div>
          <SpendChart data={trends} />
        </div>
      )}

      {/* Top debtors */}
      <div>
        <div className="section-title">Top Debtors</div>
        {debtors.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🎉</span>
            <p>No outstanding dues!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {debtors.map((tab, idx) => (
              <div
                key={tab._id}
                className="list-item"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                onClick={() => navigate(`/vendor/customer/${tab._id}`)}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: idx === 0 ? 'var(--color-danger)' : idx === 1 ? 'var(--color-warning)' : 'var(--color-surface2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 800, flexShrink: 0,
                  color: idx < 2 ? '#000' : 'var(--color-text-muted)',
                }}>
                  {idx + 1}
                </div>
                <div className="avatar" style={{ width: 36, height: 36, fontSize: '0.9rem' }}>
                  {getInitials(tab.buyerId?.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{tab.buyerId?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{tab.buyerId?.phone}</div>
                </div>
                <div style={{ color: 'var(--color-danger)', fontWeight: 700 }}>
                  {formatAmount(tab.balanceDue)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
