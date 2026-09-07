import React from 'react';

export default function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#0f172a',
      color: '#00f2fe'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '5px solid rgba(255, 255, 255, 0.1)',
        borderTop: '5px solid #00f2fe',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <p style={{ marginTop: '20px', fontFamily: 'sans-serif', fontWeight: 'bold' }}>
        Carregando Nexus Control...
      </p>
    </div>
  );
}