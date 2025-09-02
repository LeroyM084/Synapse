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
      <div
        className="bubble-drag"
        onMouseDown={(e) => onStartMove(data.id, e)}
      />

      <div
        className="bubble-dot top"
        onMouseDown={(e) => onStartLink(data.id, "top", e)}
        onMouseUp={(e) => onFinishLink(data.id, "top", e)}
      />
      <div
        className="bubble-dot left"
        onMouseDown={(e) => onStartLink(data.id, "left", e)}
        onMouseUp={(e) => onFinishLink(data.id, "left", e)}
      />
      <div
        className="bubble-dot right"
        onMouseDown={(e) => onStartLink(data.id, "right", e)}
        onMouseUp={(e) => onFinishLink(data.id, "right", e)}
      />
      <div
        className="bubble-dot bottom"
        onMouseDown={(e) => onStartLink(data.id, "bottom", e)}
        onMouseUp={(e) => onFinishLink(data.id, "bottom", e)}
      />

      <button className="bubble-remove" onClick={() => onRemove(data.id)}>
        ✕
      </button>

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

      <div
        className="bubble-resize"
        onMouseDown={(e) => onStartResize(data.id, e)}
      />
    </div>
  );
};
