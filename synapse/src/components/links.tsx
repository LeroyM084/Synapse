import React from "react";
import type { LinkData } from "../types/link";
import type { BubbleData } from "../types/bubble";
import "./link.css";

type TempLink = {
  startBubbleId: string;
  startSide: "top" | "bottom" | "left" | "right";
  x: number;
  y: number;
};

type LinksProps = {
  links: LinkData[];
  bubbles: BubbleData[];
  tempLink?: TempLink | null;
  onRemoveLink: (id: string) => void;
};

function getDotPosition(
  bubble: BubbleData,
  side: "top" | "bottom" | "left" | "right"
) {
  switch (side) {
    case "top":
      return { x: bubble.x + bubble.w / 2, y: bubble.y };
    case "bottom":
      return { x: bubble.x + bubble.w / 2, y: bubble.y + bubble.h };
    case "left":
      return { x: bubble.x, y: bubble.y + bubble.h / 2 };
    case "right":
      return { x: bubble.x + bubble.w, y: bubble.y + bubble.h / 2 };
  }
}

export const Links: React.FC<LinksProps> = ({
  links,
  bubbles,
  tempLink,
  onRemoveLink,
}) => {
  return (
    <svg
      className="links-layer"
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
        pointerEvents: "none",
      }}
    >
      {links.map((link) => {
        const startBubble = bubbles.find((b) => b.id === link.idStartBubble);
        const endBubble = bubbles.find((b) => b.id === link.idEndBubble);
        if (!startBubble || !endBubble) return null;

        const start = getDotPosition(startBubble, link.startSide);
        const end = getDotPosition(endBubble, link.endSide);

        return (
          <line
            key={link.id}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={link.color}
            strokeWidth="2"
            markerEnd={link.type === "arrow" ? "url(#arrowhead)" : undefined}
            style={{ cursor: "pointer", pointerEvents: "auto" }}
            onContextMenu={(e) => {
              e.preventDefault();
              onRemoveLink(link.id);
            }}
          />
        );
      })}

      {tempLink && (() => {
        const startBubble = bubbles.find(
          (b) => b.id === tempLink.startBubbleId
        );
        if (!startBubble) return null;
        const start = getDotPosition(startBubble, tempLink.startSide);

        return (
          <line
            x1={start.x}
            y1={start.y}
            x2={tempLink.x}
            y2={tempLink.y}
            stroke="#ff9100"
            strokeWidth="2"
            strokeDasharray="4"
          />
        );
      })()}

      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="10"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#ff9100" />
        </marker>
      </defs>
    </svg>
  );
};
