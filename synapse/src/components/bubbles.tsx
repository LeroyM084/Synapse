import React, { useCallback } from "react";
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
  const handleContentBlur = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      const text = e.target.innerText;
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
      {/* Zone de drag */}
      <div
        className="bubble-drag"
        onMouseDown={(e) => onStartMove(data.id, e)}
      />

      {/* Décorations */}
      <div className="bubble-dot top" />
      <div className="bubble-dot left" />
      <div className="bubble-dot right" />
      <div className="bubble-dot bottom" />

      {/* Bouton suppression */}
      <button className="bubble-remove" onClick={() => onRemove(data.id)}>
        ✕
      </button>

      {/* Contenu */}
      <div className="bubble-content">
        {data.type === "text" ? (
          <div
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

      {/* Resize */}
      <div
        className="bubble-resize"
        onMouseDown={(e) => onStartResize(data.id, e)}
      />
    </div>
  );
};
