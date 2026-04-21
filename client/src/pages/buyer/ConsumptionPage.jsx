import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { formatAmount } from '../../lib/helpers';
import { SpendChart, CountChart } from '../../components/ConsumptionChart';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ConsumptionPage() {
  const navigate = useNavigate();
  const [tabs, setTabs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tabs/buyer').then((res) => {
      const t = res.data.tabs;
      setTabs(t);
      if (t.length > 0) {
        setSelected(t[0]._id);
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selected) {
      api.get(`/tabs/${selected}/consumption`).then((res) => setStats(res.data));
    }
  }, [selected]);

  if (loading) return <LoadingSpinner fullPage />;

  const daily = stats?.daily?.[0];
  const monthly = stats?.monthly?.[0];

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/buyer')}>←</button>
        <h2>Consumption</h2>
      </div>

      {/* Shop selector */}
      {tabs.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {tabs.map((t) => (
            <button
              key={t._id}
              onClick={() => setSelected(t._id)}
              className={`btn btn-sm ${selected === t._id ? 'btn-primary' : 'btn-ghost'}`}
            >
              {t.shopId?.name}
            </button>
          ))}
        </div>
      )}

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="stat-card">
          <div className="label">Today</div>
          <div className="value" style={{ color: 'var(--color-warning)' }}>{daily?.count || 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>cigarettes</div>
        </div>
        <div className="stat-card">
          <div className="label">Today Spend</div>
          <div className="value" style={{ color: 'var(--color-danger)' }}>{formatAmount(daily?.amount)}</div>
        </div>
        <div className="stat-card">
          <div className="label">This Month</div>
          <div className="value">{monthly?.count || 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>cigarettes</div>
        </div>
        <div className="stat-card">
          <div className="label">Monthly Spend</div>
          <div className="value" style={{ color: 'var(--color-danger)' }}>{formatAmount(monthly?.amount)}</div>
        </div>
      </div>

      {/* Charts */}
      {stats?.weekly?.length > 0 && (
        <>
          <div className="card">
            <SpendChart data={stats.weekly} />
          </div>
          <div className="card">
            <CountChart data={stats.weekly} />
          </div>
        </>
      )}

      {(!stats?.weekly?.length) && (
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <p>No data yet. Start a tab to see your trends.</p>
        </div>
      )}
    </div>
  );
}
