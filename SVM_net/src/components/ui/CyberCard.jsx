// src/components/ui/CyberCard.jsx
import React from 'react';

function CyberCard({ children, className = '', ...props }) {
  const baseStyle = `
    bg-gray-800/70 border border-cyan-500/30 rounded-lg 
    backdrop-blur-sm shadow-lg shadow-cyan-500/10 
    overflow-hidden
  `;

  return (
    <div
      className={`${baseStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default CyberCard;