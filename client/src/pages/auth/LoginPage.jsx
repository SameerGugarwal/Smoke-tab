import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const { sendOtp, verifyOtp, registerUser, user } = useAuth();
  const navigate = useNavigate();

  // Steps: phone → otp → register (only for new users)
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [role, setRole] = useState('buyer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationToken, setRegistrationToken] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);

  // If user is already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate(user.role === 'vendor' ? '/vendor' : '/buyer', { replace: true });
    }
  }, [user, navigate]);

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // ── Step 1: Enter phone, request OTP ──
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!phone.match(/^\d{10}$/)) return setError('Enter a valid 10-digit number');

    setLoading(true);
    try {
      await sendOtp(phone);
      setStep('otp');
      setResendTimer(30);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handling ──
  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  // ── OTP paste support ──
  const handleOtpPaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      e.preventDefault();
      setOtp(paste.split(''));
      document.getElementById('otp-5')?.focus();
    }
  };

  // ── Step 2: Verify OTP ──
  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) return setError('Enter the full 6-digit OTP');

    setError('');
    setLoading(true);
    try {
      const data = await verifyOtp({ phone, otp: code });

      if (data.isNewUser) {
        // New user — needs to register (pick name + role)
        setRegistrationToken(data.registrationToken);
        setStep('register');
      } else {
        // Returning user — already logged in by AuthContext
        navigate(data.user.role === 'vendor' ? '/vendor' : '/buyer', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError('');
    try {
      await sendOtp(phone);
      setResendTimer(30);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  // ── Step 3: Register new user ──
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Enter your name');
    setLoading(true);
    setError('');
    try {
      const user = await registerUser({ registrationToken, name: name.trim(), role });
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
          fontSize: '4rem',
          marginBottom: '0.5rem',
          animation: 'fadeIn 0.5s ease',
        }}>🚬</div>
        <h1 style={{ color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>SmokeTab</h1>
        <p style={{ marginTop: '0.25rem' }}>Your tapri tab, digitized</p>
      </div>

      {/* ── Phone Step ── */}
      {step === 'phone' && (
        <form onSubmit={handlePhoneSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.3s ease' }}>
          <div className="input-group">
            <label className="input-label">Phone Number</label>
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
          {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>{error}</p>}
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading || phone.length < 10}>
            {loading ? 'Sending OTP...' : 'Get OTP →'}
          </button>
        </form>
      )}

      {/* ── OTP Step ── */}
      {step === 'otp' && (
        <div style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>
          <p style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            Enter the 6-digit OTP sent to
          </p>
          <p style={{ textAlign: 'center', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '1.5rem' }}>
            +91 {phone}
          </p>

          <div className="otp-container" style={{ marginBottom: '1.5rem' }} onPaste={handleOtpPaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-${idx}`}
                className="otp-input"
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}

          <button
            className="btn btn-primary btn-lg"
            onClick={handleVerifyOtp}
            disabled={loading || otp.join('').length < 6}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <button
              style={{
                background: 'none',
                border: 'none',
                color: resendTimer > 0 ? 'var(--color-text-dim)' : 'var(--color-primary)',
                cursor: resendTimer > 0 ? 'default' : 'pointer',
                fontFamily: 'var(--font)',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
              onClick={handleResendOtp}
              disabled={resendTimer > 0}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
            </button>

            <button
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                fontFamily: 'var(--font)',
                fontSize: '0.85rem',
              }}
              onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError(''); }}
            >
              ← Change number
            </button>
          </div>

          {/* Dev hint */}
          <div className="card" style={{ marginTop: '1.5rem', borderColor: 'var(--color-warning)', padding: '0.75rem 1rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              💡 <span>Check your server terminal for the OTP (dev mode)</span>
            </p>
          </div>
        </div>
      )}

      {/* ── Register Step (new users only) ── */}
      {step === 'register' && (
        <form onSubmit={handleRegister} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            <span className="badge badge-success" style={{ fontSize: '0.8rem' }}>✓ Phone verified</span>
          </div>

          <h2 style={{ textAlign: 'center' }}>Complete your profile</h2>

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
                { key: 'vendor', emoji: '🏪', label: 'Shop Owner' },
                { key: 'buyer', emoji: '👤', label: 'Customer' },
              ].map(({ key, emoji, label }) => (
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
                  <span style={{ fontSize: '2rem' }}>{emoji}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>{error}</p>}
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Enter SmokeTab →'}
          </button>
        </form>
      )}
    </div>
  );
}
