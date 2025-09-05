import React, { useCallback, useEffect, useRef } from "react";
import type { BubbleData } from "../types/bubble";
import "./bubble.css";

type BubbleProps = {
  data: BubbleData;
  fontFamily?: string;
  fontSize?: number;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, w: number, h: number) => void;
  onRemove: (id: string) => void;
  onContentChange: (id: string, content: string) => void;
  onStartMove: (id: string, e: React.MouseEvent) => void;
  onStartResize: (id: string, e: React.MouseEvent) => void;
  onStartLink: (id: string, side: string, e: React.MouseEvent) => void;
  onFinishLink: (id: string, side: string, e: React.MouseEvent) => void;
  shouldFocus?: boolean;
  onFocused?: () => void;
};

export const Bubble: React.FC<BubbleProps> = ({
  data,
  fontFamily,
  fontSize,
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

  return (
    <div
      className="bubble"
      style={{
        left: data.x,
        top: data.y,
        width: data.w,
        height: data.h,
        fontSize: Math.max(12, Math.min(data.w, data.h) * 0.1) + "px"
      }}
      onPointerUp={(e) => {
        if (e.button === 0) {
          onFinishLink(data.id, "", e);
        }
      }}
    >
      {/* central drag handle (invisible bar or small handle) */}
      <div
        className="bubble-drag"
        onMouseDown={(e) => onStartMove(data.id, e)}
        title="Glisser pour déplacer"
      />

      {/* move handles (small orange circles) */}
          {/* Removed duplicate move handles */}

      {/* link handles: use pointer events and stop propagation */}
      <div
        className="bubble-link top"
        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); onStartLink(data.id, "top", e as unknown as React.MouseEvent); }}
        onPointerUp={(e) => { e.stopPropagation(); e.preventDefault(); onFinishLink(data.id, "top", e as unknown as React.MouseEvent); }}
      />
      <div
        className="bubble-link left"
        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); onStartLink(data.id, "left", e as unknown as React.MouseEvent); }}
        onPointerUp={(e) => { e.stopPropagation(); e.preventDefault(); onFinishLink(data.id, "left", e as unknown as React.MouseEvent); }}
      />
      <div
        className="bubble-link right"
        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); onStartLink(data.id, "right", e as unknown as React.MouseEvent); }}
        onPointerUp={(e) => { e.stopPropagation(); e.preventDefault(); onFinishLink(data.id, "right", e as unknown as React.MouseEvent); }}
      />
      <div
        className="bubble-link bottom"
        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); onStartLink(data.id, "bottom", e as unknown as React.MouseEvent); }}
        onPointerUp={(e) => { e.stopPropagation(); e.preventDefault(); onFinishLink(data.id, "bottom", e as unknown as React.MouseEvent); }}
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
            style={{ textAlign: 'center', fontFamily: fontFamily || 'Inter, sans-serif', fontSize: (fontSize || 16) + 'px' }}
          >
            {data.content}
          </div>
        ) : (
          <img src={data.content} alt="img" className="bubble-image" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", pointerEvents: "none" }} draggable={false} />
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
