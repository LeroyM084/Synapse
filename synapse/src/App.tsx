import React, { useCallback, useRef, useState } from "react";
import { Bubble } from "./components/bubbles";
import { Links } from "./components/links";
import type { BubbleData } from "./types/bubble";
import type { LinkData } from "./types/link";
import "./App.css";

function randId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function App() {
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const [links, setLinks] = useState<LinkData[]>([]);
  const [tempLink, setTempLink] = useState<{
    startBubbleId: string;
    startSide: "top" | "bottom" | "left" | "right";
    x: number;
    y: number;
  } | null>(null);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const addTextIcon_URL = "/icons/addtext.png";
  const addImageIcon_URL = "/icons/addImage.png";
  const cleanIcon_URL = "/icons/clean.png";

  // Drag & drop
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    const x = e.clientX - (rect?.left || 0);
    const y = e.clientY - (rect?.top || 0);

    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setBubbles((prev) => [
          ...prev,
          {
            id: randId(),
            x,
            y,
            w: 200,
            h: 150,
            type: "image",
            content: String(reader.result),
          },
        ]);
      };
      reader.readAsDataURL(file);
      return;
    }

    const text =
      e.dataTransfer?.getData("text") ||
      e.dataTransfer?.getData("text/plain");
    if (text) {
      setBubbles((prev) => [
        ...prev,
        { id: randId(), x, y, w: 220, h: 80, type: "text", content: text },
      ]);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Bubble move
  function startMove(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDraggingId(id);
  }
  function onMouseMove(e: React.MouseEvent) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (draggingId) {
      setBubbles((prev) =>
        prev.map((b) =>
          b.id === draggingId
            ? {
                ...b,
                x: e.clientX - rect.left - b.w / 2,
                y: e.clientY - rect.top - b.h / 2,
              }
            : b
        )
      );
    }

    if (resizingId) {
      setBubbles((prev) =>
        prev.map((b) =>
          b.id === resizingId
            ? {
                ...b,
                w: Math.max(40, e.clientX - rect.left - b.x),
                h: Math.max(24, e.clientY - rect.top - b.y),
              }
            : b
        )
      );
    }

    if (tempLink) {
      setTempLink({
        ...tempLink,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }
  function endMove() {
    setDraggingId(null);
    setResizingId(null);
    setTempLink(null); // annuler lien si relâché ailleurs
  }

  // Resize
  function startResize(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setResizingId(id);
  }

  // Supprimer bulle
  function removeBubble(id: string) {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
  }

  // Supprimer lien
  function removeLink(id: string) {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  // Commencer un lien
  function onStartLink(bubbleId: string, side: string, e: React.MouseEvent) {
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTempLink({
      startBubbleId: bubbleId,
      startSide: side as "top" | "bottom" | "left" | "right",
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  // Finir un lien
  function onFinishLink(bubbleId: string, side: string, e: React.MouseEvent) {
    if (tempLink) {
      // Demande à l'utilisateur s'il veut une flèche ou une ligne
      const type = window.confirm("Voulez-vous une flèche ? (OK = flèche, Annuler = ligne)") ? "arrow" : "line";
      const newLink: LinkData = {
        id: randId(),
        idStartBubble: tempLink.startBubbleId,
        idEndBubble: bubbleId,
        startSide: tempLink.startSide,
        endSide: side as "top" | "bottom" | "left" | "right",
        type,
        color: "#ff9100",
      };
      setLinks((prev) => [...prev, newLink]);
      setTempLink(null);
    }
  }

  // Toolbar
  const Toolbar = () => (
    <div className="toolbar">
      <button
        onClick={() => {
          const t = prompt("Texte?");
          if (t)
            setBubbles((prev) => [
              ...prev,
              {
                id: randId(),
                x: 50,
                y: 80,
                w: 220,
                h: 80,
                type: "text",
                content: t,
              },
            ]);
        }}
      >
        <img className="toolbar_icon" src={addTextIcon_URL} alt="Ajouter du texte" />
      </button>
      <button
        onClick={() => {
          const url = prompt("Image URL?");
          if (url)
            setBubbles((prev) => [
              ...prev,
              {
                id: randId(),
                x: 80,
                y: 120,
                w: 200,
                h: 140,
                type: "image",
                content: url,
              },
            ]);
        }}
      >
        <img className="toolbar_icon" src={addImageIcon_URL} alt="Ajouter une image" />
      </button>
      <button onClick={() => setBubbles([])}>
        <img className="toolbar_icon" src={cleanIcon_URL} alt="clean" />
      </button>
    </div>
  );

  const handleContentChange = useCallback((id: string, content: string) => {
    setBubbles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content } : b))
    );
  }, []);

  return (
    <div className="popup-root">
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
            padding: "4px",
          }}
        >
          ✕
        </button>
      </div>

      <Toolbar />

      <div
        ref={canvasRef}
        className="canvas"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onMouseMove={onMouseMove}
        onMouseUp={endMove}
        onMouseLeave={endMove}
      >
        <Links
          links={links}
          bubbles={bubbles}
          tempLink={tempLink}
          onRemoveLink={removeLink}
        />

        {bubbles.map((bubble) => (
          <Bubble
            key={bubble.id}
            data={bubble}
            onMove={() => {}}
            onResize={() => {}}
            onRemove={removeBubble}
            onContentChange={handleContentChange}
            onStartMove={startMove}
            onStartResize={startResize}
            onStartLink={onStartLink}
            onFinishLink={onFinishLink}
          />
        ))}
      </div>
    </div>
  );
}
