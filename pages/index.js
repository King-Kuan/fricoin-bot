// pages/index.js
// Fricoin Bot — Status Page
// The Palace, Inc.

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a1628 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Courier New', monospace",
      color: '#fff',
      padding: '2rem',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 600 }}>

        {/* Coin animation */}
        <div style={{
          fontSize: '5rem',
          marginBottom: '1.5rem',
          animation: 'spin 4s linear infinite',
          display: 'inline-block',
        }}>
          🪙
        </div>

        <h1 style={{
          fontSize: '3rem',
          fontWeight: 900,
          background: 'linear-gradient(90deg, #f0c040, #ff9500, #f0c040)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem',
          letterSpacing: '-1px',
        }}>
          FRICOIN
        </h1>

        <p style={{
          color: '#f0c04099',
          fontSize: '1.1rem',
          marginBottom: '2.5rem',
          letterSpacing: '3px',
          textTransform: 'uppercase',
        }}>
          Mine it. Hold it. Own it.
        </p>

        {/* Status badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: '#00ff8822',
          border: '1px solid #00ff8844',
          borderRadius: '50px',
          padding: '8px 20px',
          marginBottom: '2.5rem',
          fontSize: '0.9rem',
          color: '#00ff88',
        }}>
          <span style={{
            width: 8, height: 8,
            borderRadius: '50%',
            background: '#00ff88',
            display: 'inline-block',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          Bot is Online
        </div>

        {/* Stats grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '2.5rem',
        }}>
          {[
            { label: 'Total Supply', value: '1T FRI' },
            { label: 'Daily Reward', value: '500 FRI' },
            { label: 'Network', value: 'Polygon' },
            { label: 'Tax', value: '3%' },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: '#ffffff08',
              border: '1px solid #ffffff15',
              borderRadius: '12px',
              padding: '1rem',
            }}>
              <div style={{ color: '#f0c040', fontSize: '1.4rem', fontWeight: 700 }}>{value}</div>
              <div style={{ color: '#ffffff60', fontSize: '0.75rem', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <a
          href="https://t.me/fricoiniabot"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #f0c040, #ff9500)',
            color: '#000',
            fontWeight: 800,
            fontSize: '1.1rem',
            padding: '14px 40px',
            borderRadius: '50px',
            textDecoration: 'none',
            letterSpacing: '1px',
            boxShadow: '0 0 30px #f0c04055',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseOver={e => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 0 50px #f0c04088';
          }}
          onMouseOut={e => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 0 30px #f0c04055';
          }}
        >
          ⚡ Start Mining on Telegram
        </a>

        <p style={{
          marginTop: '3rem',
          color: '#ffffff30',
          fontSize: '0.8rem',
          letterSpacing: '2px',
        }}>
          POWERED BY THE PALACE, INC. 🏰
        </p>
      </div>

      <style>{`
        @keyframes spin {
          0%   { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
