import React from 'react';

export const Topbar = () => {
  return (
    <div className="topbar">
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src="/vite.svg" alt="logo" style={{ height: 32, marginRight: 8 }} />
        <strong style={{ color: "#fff" }}>Synapse</strong>
      </div>
      <button 
        title="Close" 
        onClick={() => window.close()} 
        style={{ 
          background: "transparent", 
          border: "none", 
          color: "#fff", 
          fontSize: 18, 
          cursor: "pointer", 
          padding: "4px" 
        }}
      >
        ✕
      </button>
    </div>
  );
};