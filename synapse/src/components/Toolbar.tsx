import React, { useState, useEffect, useCallback } from 'react';

// Interface définissant les "props" que le composant attend de son parent
interface ToolbarProps {
  onExport: () => void;
  isExporting: boolean;
  onAddTextBubble: () => void;
  onAddImageBubble: (url: string) => void;
  onClearCanvas: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onExport,
  isExporting,
  onAddTextBubble,
  onAddImageBubble,
  onClearCanvas
}) => {
  // --- Logique de l'éditeur de texte, maintenant encapsulée ici ---
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [blockType, setBlockType] = useState<'H1' | 'H2' | 'P' | ''>('');

  useEffect(() => {
    const updateState = () => {
      setIsBold(document.queryCommandState('bold'));
      setIsItalic(document.queryCommandState('italic'));
      // ... (logique de mise à jour de l'état de la sélection)
    };
    document.addEventListener('selectionchange', updateState);
    return () => document.removeEventListener('selectionchange', updateState);
  }, []);
  
  const exec = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
  }, []);

  const toggleBold = () => exec('bold');
  const toggleItalic = () => exec('italic');
  const toggleUnderline = () => exec('underline');
  const applyBlock = (tag: 'H1' | 'H2' | 'P') => exec('formatBlock', tag);
  
  // --- Rendu JSX du composant ---
  return (
    <div className="toolbar editor-toolbar" role="toolbar">
      {/* Section Formatage de texte */}
      <div className="text-format-group">
        <button className={`format-btn ${isBold ? 'active' : ''}`} onClick={toggleBold}>B</button>
        <button className={`format-btn ${isItalic ? 'active' : ''}`} onClick={toggleItalic}>I</button>
        <button className={`format-btn ${isUnderline ? 'active' : ''}`} onClick={toggleUnderline}>U</button>
      </div>
      <div className="divider" />
      {/* Section Styles de paragraphe */}
      <div className="block-group">
        <button className={`block-btn ${blockType === 'H1' ? 'active' : ''}`} onClick={() => applyBlock('H1')}>Titre</button>
        <button className={`block-btn ${blockType === 'H2' ? 'active' : ''}`} onClick={() => applyBlock('H2')}>Sous-titre</button>
        <button className={`block-btn ${blockType === 'P' ? 'active' : ''}`} onClick={() => applyBlock('P')}>Corps</button>
      </div>

      <div style={{ flex: 1 }} />

      {/* Section Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onAddTextBubble}>
          <img className="toolbar_icon" src="/icons/addtext.png" alt="Ajouter texte" />
        </button>
        <button onClick={() => {
          const url = prompt('URL de l\'image?');
          if (url) onAddImageBubble(url);
        }}>
          <img className="toolbar_icon" src="/icons/addImage.png" alt="Ajouter image" />
        </button>
        <button onClick={onClearCanvas}>
          <img className="toolbar_icon" src="/icons/clean.png" alt="Nettoyer" />
        </button>
        <button onClick={onExport} disabled={isExporting}>
          <img className="toolbar_icon" src="/icons/exportPDF.png" alt="Exporter en PDF" />
          {isExporting && '...'}
        </button>
      </div>
    </div>
  );
};