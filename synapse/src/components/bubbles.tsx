import React, { useCallback, useEffect, useRef } from "react";
import type { BubbleData } from "../types/bubble";
import "./bubble.css";

type BubbleProps = {
  data: BubbleData;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, w: number, h: number) => void;
  onRemove: (id: string) => void;
  onContentChange: (id: string, content: string) => void;
  onStartMove: (id: string, e: React.MouseEvent) => void;
  onStartResize: (id: string, e: React.MouseEvent) => void;
  onStartLink: (id: string, side: string, e: React.MouseEvent) => void;
  onFinishLink: (id: string, side: string, e: React.MouseEvent) => void;
};

export const Bubble: React.FC<BubbleProps> = ({
  data,
  onRemove,
  onContentChange,
  onStartMove,
  onStartResize,
  onStartLink,
  onFinishLink,
}) => {
  const textRef = useRef<HTMLDivElement | null>(null);

  // focus le contenu quand c'est une nouvelle bulle texte vide
  useEffect(() => {
    if (data.type === "text" && data.content === "" && textRef.current) {
      const el = textRef.current;
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(true);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }, [data.type, data.content]);

  const handleContentBlur = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      const text = (e.target as HTMLDivElement).innerText;
      onContentChange(data.id, text);
    },
    [data.id, onContentChange]
  );

  // Convertir les événements pointer en événements mouse pour la compatibilité
  const handleLinkMouseDown = useCallback((side: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onStartLink(data.id, side, e);
  }, [data.id, onStartLink]);

  const handleLinkMouseUp = useCallback((side: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onFinishLink(data.id, side, e);
  }, [data.id, onFinishLink]);

  return (
    <div className="bubble" style={{ left: data.x, top: data.y, width: data.w, height: data.h }}>
      {/* central drag handle */}
      <div
        className="bubble-drag"
        onMouseDown={(e) => onStartMove(data.id, e)}
        title="Glisser pour déplacer"
      />

      {/* link handles - utilisation d'événements mouse au lieu de pointer */}
      <div
        className="bubble-link top"
        onMouseDown={(e) => handleLinkMouseDown("top", e)}
        onMouseUp={(e) => handleLinkMouseUp("top", e)}
      />
      <div
        className="bubble-link left"
        onMouseDown={(e) => handleLinkMouseDown("left", e)}
        onMouseUp={(e) => handleLinkMouseUp("left", e)}
      />
      <div
        className="bubble-link right"
        onMouseDown={(e) => handleLinkMouseDown("right", e)}
        onMouseUp={(e) => handleLinkMouseUp("right", e)}
      />
      <div
        className="bubble-link bottom"
        onMouseDown={(e) => handleLinkMouseDown("bottom", e)}
        onMouseUp={(e) => handleLinkMouseUp("bottom", e)}
      />

      {/* remove button */}
      <button
        className="bubble-remove"
        onClick={() => onRemove(data.id)}
        aria-label="Supprimer la bulle"
      >
        ✕
      </button>

      <div className="bubble-content">
        {data.type === "text" ? (
          <div
            ref={textRef}
            contentEditable
            suppressContentEditableWarning
            className="bubble-text"
            onBlur={handleContentBlur}
          >
            {data.content}
          </div>
        ) : (
          <img src={data.content} alt="img" className="bubble-image" />
        )}
      </div>

      {/* resize handle (bottom-right) */}
      <div
        className="bubble-resize"
        onMouseDown={(e) => onStartResize(data.id, e)}
        title="Redimensionner"
      />
    </div>
  );
};