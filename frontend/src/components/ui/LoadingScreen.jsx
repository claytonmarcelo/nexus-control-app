import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-dark-bg text-nexus-400">
      <div className="flex flex-col items-center gap-6">
        {/* Animated Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-dark-border rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-nexus-500 rounded-full animate-spin"></div>
        </div>
        
        {/* Loading Text */}
        <div className="text-center">
          <p className="text-sm font-semibold text-white">Carregando Nexus Control...</p>
          <p className="text-xs text-text-secondary mt-2">Por favor, aguarde</p>
        </div>
      </div>
    </div>
  );
}