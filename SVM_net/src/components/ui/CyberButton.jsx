// src/components/ui/CyberButton.jsx
import React from 'react';

function CyberButton({ children, onClick, disabled = false, className = '', ...props }) {
  const baseStyle = `
    px-4 py-2 rounded 
    font-semibold text-sm tracking-wider uppercase
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
  `;

  const enabledStyle = `
    bg-cyan-600 text-black 
    hover:bg-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]
    active:bg-cyan-700
    focus:ring-cyan-500
  `;

  const disabledStyle = `
    bg-gray-600 text-gray-400 cursor-not-allowed opacity-60
  `;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${disabled ? disabledStyle : enabledStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default CyberButton;