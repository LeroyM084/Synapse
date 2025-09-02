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
};

export const Bubble: React.FC<BubbleProps> = ({
  data,
  onRemove,
  onContentChange,
  onStartMove,
  onStartResize,
}) => {
  const textRef = useRef<HTMLDivElement | null>(null);

  // focus le contenu quand c'est une nouvelle bulle texte vide
  useEffect(() => {
    if (data.type === "text" && data.content === "" && textRef.current) {
      // place caret at start
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

  return (
    <div
      className="bubble"
      style={{
        left: data.x,
        top: data.y,
        width: data.w,
        height: data.h,
      }}
    >
      {/* Zone de drag principale (poignée centrale en haut) */}
      <div
        className="bubble-drag"
        onMouseDown={(e) => onStartMove(data.id, e)}
        title="Glisser pour déplacer"
      />

      {/* Poignées (cercles oranges) */}
      <div className="bubble-dot top" onMouseDown={(e) => onStartMove(data.id, e)} />
      <div className="bubble-dot left" onMouseDown={(e) => onStartMove(data.id, e)} />
      <div className="bubble-dot right" onMouseDown={(e) => onStartMove(data.id, e)} />
      <div className="bubble-dot bottom" onMouseDown={(e) => onStartMove(data.id, e)} />

      {/* Bouton suppression */}
      <button
        className="bubble-remove"
        onClick={() => onRemove(data.id)}
        aria-label="Supprimer la bulle"
      >
        ✕
      </button>

      {/* Contenu */}
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

      {/* Poignée de redimensionnement (coin bas droit) */}
      <div
        className="bubble-resize"
        onMouseDown={(e) => onStartResize(data.id, e)}
        title="Redimensionner"
      />
    </div>
  );
};
