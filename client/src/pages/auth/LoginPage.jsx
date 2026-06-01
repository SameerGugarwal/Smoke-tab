import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Flame, Store, User } from 'lucide-react';

export default function LoginPage() {
  const { login, registerUser, user } = useAuth();
  const navigate = useNavigate();

  // Steps: login (phone + dob) → register (name + role, for new users only)
  const [step, setStep] = useState('login');
  
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  
  const [name, setName] = useState('');
  const [role, setRole] = useState('buyer');
  const [upiId, setUpiId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If user is already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate(user.role === 'vendor' ? '/vendor' : '/buyer', { replace: true });
    }
  }, [user, navigate]);

  // ── Step 1: Enter phone and DOB ──
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!phone.match(/^\d{10}$/)) return setError('Enter a valid 10-digit number');
    if (!dob) return setError('Date of birth is required');

    setLoading(true);
    try {
      const data = await login(phone, dob);
      
      if (data.isNewUser) {
        // User does not exist, go to register step
        setStep('register');
      } else {
        // User exists and dob matched, AuthContext logged them in
        navigate(data.user.role === 'vendor' ? '/vendor' : '/buyer', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Register new user ──
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Enter your name');
    
    setLoading(true);
    setError('');
    try {
      const user = await registerUser({ phone, dob, name: name.trim(), role, upiId: upiId.trim() });
      navigate(user.role === 'vendor' ? '/vendor' : '/buyer', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      maxWidth: '400px',
      margin: '0 auto',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          marginBottom: '0.5rem',
          animation: 'fadeIn 0.5s ease',
          color: 'var(--color-primary)',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <Flame size={64} strokeWidth={1.5} />
        </div>
        <h1 style={{ color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>Tab</h1>
        <p style={{ marginTop: '0.25rem' }}>Your tapri tab, digitized</p>
      </div>

      {/* ── Login Step (Phone + DOB) ── */}
      {step === 'login' && (
        <form onSubmit={handleLoginSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s ease' }}>
          
          <div className="input-group">
            <label className="input-label">Mobile Number</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{
                padding: '0 0.75rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--color-text-muted)',
                fontWeight: 600,
                flexShrink: 0,
              }}>+91</div>
              <input
                id="phone-input"
                className="input"
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => {
                  let val = e.target.value;
                  if (val.startsWith('+91')) val = val.substring(3);
                  if (val.startsWith('91') && val.length > 10) val = val.substring(2);
                  setPhone(val.replace(/\D/g, '').slice(0, 10));
                }}
                inputMode="numeric"
                autoFocus
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Date of Birth</label>
            <input
              type="date"
              className="input"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              style={{
                cursor: 'text', // Allows clicking on the input nicely
                colorScheme: 'dark' // Helps the native date picker look good in dark mode
              }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '-0.25rem' }}>
              You must be 18+ to use Tab.
            </p>
          </div>

          {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>{error}</p>}
          
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading || phone.length < 10 || !dob}>
            {loading ? 'Continuing...' : 'Continue →'}
          </button>
        </form>
      )}

      {/* ── Register Step (New users only) ── */}
      {step === 'register' && (
        <form onSubmit={handleRegisterSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            <span className="badge badge-primary" style={{ fontSize: '0.8rem' }}>Welcome to Tab!</span>
          </div>

          <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Complete your profile</h2>

          <div className="input-group">
            <label className="input-label">Your Name</label>
            <input
              className="input"
              placeholder="Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="input-group">
            <label className="input-label">I am a...</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { key: 'vendor', icon: <Store size={32} strokeWidth={1.5} />, label: 'Shop Owner' },
                { key: 'buyer', icon: <User size={32} strokeWidth={1.5} />, label: 'Customer' },
              ].map(({ key, icon, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRole(key)}
                  style={{
                    padding: '1.25rem',
                    background: role === key ? 'var(--color-primary-dim)' : 'var(--color-surface)',
                    border: `2px solid ${role === key ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    color: role === key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    fontFamily: 'var(--font)',
                    fontWeight: 600,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ marginBottom: '0.25rem' }}>{icon}</div>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {role === 'buyer' && (
            <div className="input-group" style={{ animation: 'fadeIn 0.3s ease' }}>
              <label className="input-label">Your UPI ID</label>
              <input
                className="input"
                placeholder="e.g. 9876543210@ybl"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value.toLowerCase())}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '-0.25rem' }}>
                Required to settle tabs via UPI directly from the app.
              </p>
            </div>
          )}

          {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>{error}</p>}
          
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              className="btn btn-ghost btn-lg"
              type="button"
              onClick={() => { setStep('login'); setError(''); }}
              style={{ flex: 1, padding: '1rem' }}
            >
              Back
            </button>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ flex: 2 }}>
              {loading ? 'Creating...' : 'Enter Tab'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
