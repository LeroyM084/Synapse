import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bubble } from "./components/bubbles";
import { Links } from "./components/links";
import type { BubbleData } from "./types/bubble";
import type { LinkData } from "./types/link";
import "./App.css";

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function randId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function App() {
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  // core state
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
  const [focusNewBubbleId, setFocusNewBubbleId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const addTextIcon_URL = "/icons/addtext.png";
  const addImageIcon_URL = "/icons/addImage.png";
  const cleanIcon_URL = "/icons/clean.png";
  const exportPDF_URL = "/icons/exportPDF.png";

  // formatting UI state
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [blockType, setBlockType] = useState<"H1" | "H2" | "P" | "">("");

  // keep popup open: placeholder listener
  useEffect(() => {
    function onWindowMessage(_: MessageEvent) {
      /* reserved */
    }
    window.addEventListener("message", onWindowMessage);
    return () => window.removeEventListener("message", onWindowMessage);
  }, []);

  // update formatting buttons when selection changes
  useEffect(() => {
    const updateState = () => {
      try {
        setIsBold(document.queryCommandState("bold"));
        setIsItalic(document.queryCommandState("italic"));
        setIsUnderline(document.queryCommandState("underline"));

        const sel = window.getSelection();
        if (!sel || !sel.anchorNode) {
          setBlockType("");
          return;
        }
        let el =
          sel.anchorNode.nodeType === 3
            ? (sel.anchorNode.parentElement as HTMLElement)
            : (sel.anchorNode as HTMLElement);
        while (el && el !== document.body) {
          const tag = el.tagName;
          if (tag === "H1" || tag === "H2" || tag === "P") {
            setBlockType(tag as any);
            return;
          }
          el = el.parentElement as HTMLElement;
        }
        setBlockType("P");
      } catch {
        /* ignore */
      }
    };
    document.addEventListener("selectionchange", updateState);
    return () => document.removeEventListener("selectionchange", updateState);
  }, []);

  const exec = useCallback((cmd: string, value?: string) => {
    try {
      document.execCommand(cmd, false, value);
      setIsBold(document.queryCommandState("bold"));
      setIsItalic(document.queryCommandState("italic"));
      setIsUnderline(document.queryCommandState("underline"));
    } catch {
      console.warn("execCommand failed");
    }
  }, []);

  const toggleBold = useCallback(() => exec("bold"), [exec]);
  const toggleItalic = useCallback(() => exec("italic"), [exec]);
  const toggleUnderline = useCallback(() => exec("underline"), [exec]);
  const applyBlock = useCallback(
    (tag: "H1" | "H2" | "P") => {
      exec("formatBlock", tag);
      setBlockType(tag);
    },
    [exec]
  );

  // Drop handling (single implementation)
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    const x = e.clientX - (rect?.left || 0);
    const y = e.clientY - (rect?.top || 0);

    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => {
setBubbles(prev => [
            ...prev,
            {
              id: randId(),
              x,
              y,
              w: img.naturalWidth,
              h: img.naturalHeight,
              w_init: img.naturalWidth,   // pour min resize
              h_init: img.naturalHeight,  // pour min resize
              type: "image",
              content: reader.result as string,
            },
          ]);
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
      return;
    }

    const text = e.dataTransfer?.getData("text") || e.dataTransfer?.getData("text/plain");
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

  // move/resize handlers
  function startMove(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDraggingId(id);

    // Met la bulle au premier plan (fin du tableau)
    setBubbles(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx === -1) return prev;
      const bubble = prev[idx];
      const newArr = [...prev.slice(0, idx), ...prev.slice(idx + 1), bubble];
      return newArr;
    });

    const rect = canvasRef.current?.getBoundingClientRect();
    const bubble = bubbles.find(b => b.id === id);
    if (rect && bubble) {
      const offsetX = e.clientX - rect.left - bubble.x;
      const offsetY = e.clientY - rect.top - bubble.y;
      setDragOffset({ x: offsetX, y: offsetY });
    }
  }
  function startResize(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setResizingId(id);
  }

  function onMouseMove(e: React.MouseEvent) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (draggingId && dragOffset) {
      const toolbarHeight = 5; // hauteur de la toolbar
      const canvasHeight = rect.height;
      const canvasWidth = rect.width;

      setBubbles((prev) =>
        prev.map((b) => {
          if (b.id !== draggingId) return b;
          let newX = e.clientX - rect.left - dragOffset.x;
          let newY = e.clientY - rect.top - dragOffset.y;

          // Clamp X
          newX = Math.max(0, Math.min(newX, canvasWidth - b.w));
          // Clamp Y (empêche sous la toolbar)
          newY = Math.max(toolbarHeight, Math.min(newY, canvasHeight - b.h));

          return { ...b, x: newX, y: newY };
        })
      );
    }

    if (resizingId) {
      setBubbles((prev) =>
        prev.map((b) =>
          b.id === resizingId
            ? { ...b, w: Math.max(40, e.clientX - rect.left - b.x), h: Math.max(24, e.clientY - rect.top - b.y) }
            : b
        )
      );
    }

    if (tempLink) {
      setTempLink({ ...tempLink, x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }

  function endMove() {
  setDraggingId(null);
  setResizingId(null);
  setTempLink(null);
  setDragOffset(null);
  }

  // create bubble & focus logic
  const createNewTextBubble = useCallback(() => {
    const newBubble: BubbleData = { id: randId(), type: "text", content: "", x: 100, y: 100, w: 200, h: 100 };
    setBubbles((prev) => [...prev, newBubble]);
    return newBubble.id;
  }, []);

  // bubble modifications
  const handleMove = useCallback((id: string, x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const toolbarHeight = 48;
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;

    setBubbles((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        let newX = Math.max(0, Math.min(x, canvasWidth - b.w));
        let newY = Math.max(toolbarHeight, Math.min(y, canvasHeight - b.h));
        return { ...b, x: newX, y: newY };
      })
    );
  }, []);
  const handleResize = useCallback((id: string, w: number, h: number) => {
    setBubbles((prev) => prev.map((b) => {
      if (b.id !== id) return b;
      if (b.type === "image") {
        const minW = b.w_init ?? b.w;
        const minH = b.h_init ?? b.h;
        return { ...b, w: Math.max(w, minW), h: Math.max(h, minH) };
      }
      return { ...b, w, h };
    }));
  }, []);
  const handleContentChange = useCallback((id: string, content: string) => {
    setBubbles((prev) => prev.map((b) => (b.id === id ? { ...b, content } : b)));
  }, []);

  // links
  function onStartLink(bubbleId: string, side: string, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      console.warn('onStartLink: no canvas rect');
      return;
    }
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    console.log('onStartLink', { bubbleId, side, x, y });
    setTempLink({ startBubbleId: bubbleId, startSide: side as any, x, y });
  }

  function onFinishLink(bubbleId: string, side: string, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!tempLink) return;

    // Trouve la bulle cible
    const bubble = bubbles.find(b => b.id === bubbleId);
    if (!bubble) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Coordonnées du curseur dans le canvas
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Coordonnées des centres des côtés de la bulle cible
    const sides = {
      top:   { x: bubble.x + bubble.w / 2, y: bubble.y },
      bottom:{ x: bubble.x + bubble.w / 2, y: bubble.y + bubble.h },
      left:  { x: bubble.x, y: bubble.y + bubble.h / 2 },
      right: { x: bubble.x + bubble.w, y: bubble.y + bubble.h / 2 }
    };

    // Trouve le côté le plus proche du curseur
    let minDist = Infinity, closestSide = "top";
    for (const [sideName, pos] of Object.entries(sides)) {
      const dist = Math.hypot(x - pos.x, y - pos.y);
      if (dist < minDist) {
        minDist = dist;
        closestSide = sideName;
      }
    }

    const type = window.confirm("Voulez-vous une flèche ? (OK = flèche, Annuler = ligne)") ? "arrow" : "line";
    const newLink: LinkData = {
      id: randId(),
      idStartBubble: tempLink.startBubbleId,
      idEndBubble: bubbleId,
      startSide: tempLink.startSide,
      endSide: closestSide as any,
      type,
      color: "#ff9100",
    };
    setLinks(prev => [...prev, newLink]);
    setTempLink(null);
  }

  function removeBubble(id: string) {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
  }
  function removeLink(id: string) {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  //export pdf 

const exportPDF = async () => {
  try {

    const canvasDiv = canvasRef.current;
    if (!canvasDiv) return;
    const canvasImage = await html2canvas(canvasDiv);
    const imgData = canvasImage.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [canvasDiv.offsetWidth, canvasDiv.offsetHeight],
    });
    pdf.addImage(
      imgData,
      "PNG",
      0,
      0,
      canvasDiv.offsetWidth,
      canvasDiv.offsetHeight
    );
    pdf.save("synapse_canvas.pdf");
  } catch (err) {
    alert("Erreur export PDF: " + err);
    console.error(err);
  }
};

  // Toolbar UI
  const Toolbar = () => (
    <div className="toolbar editor-toolbar" role="toolbar" aria-label="Text editor toolbar">
      <div className="text-format-group">
        <button className={`format-btn ${isBold ? "active" : ""}`} title="Gras (Ctrl/Cmd+B)" onMouseDown={(e) => e.preventDefault()} onClick={toggleBold}>B</button>
        <button className={`format-btn ${isItalic ? "active" : ""}`} title="Italique (Ctrl/Cmd+I)" onMouseDown={(e) => e.preventDefault()} onClick={toggleItalic}>I</button>
        <button className={`format-btn ${isUnderline ? "active" : ""}`} title="Souligné (Ctrl/Cmd+U)" onMouseDown={(e) => e.preventDefault()} onClick={toggleUnderline}>U</button>
      </div>

      <div className="divider" />

      <div className="block-group" role="group" aria-label="Paragraph style">
        <button className={`block-btn ${blockType === "H1" ? "active" : ""}`} title="Titre" onMouseDown={(e) => e.preventDefault()} onClick={() => applyBlock("H1")}>Titre</button>
        <button className={`block-btn ${blockType === "H2" ? "active" : ""}`} title="Sous-titre" onMouseDown={(e) => e.preventDefault()} onClick={() => applyBlock("H2")}>Sous-titre</button>
        <button className={`block-btn ${blockType === "P" ? "active" : ""}`} title="Corps" onMouseDown={(e) => e.preventDefault()} onClick={() => applyBlock("P")}>Corps</button>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => {
            const newBubbleId = createNewTextBubble();
            setFocusNewBubbleId(newBubbleId);
          }}
        >
          <img className="toolbar_icon" src={addTextIcon_URL} alt="Ajouter du texte" />
        </button>

        <button
          onClick={() => {
            const url = prompt("Image URL?");
            if (url) setBubbles((prev) => [...prev, { id: randId(), x: 80, y: 120, w: 200, h: 140, type: "image", content: url }]);
          }}
        >
          <img className="toolbar_icon" src={addImageIcon_URL} alt="Ajouter une image" />
        </button>

        <button onClick={() => setBubbles([])}>
          <img className="toolbar_icon" src={cleanIcon_URL} alt="clean" />
        </button>
        <button onClick={exportPDF}>
          <img className="toolbar_icon" src={exportPDF_URL} alt="clean" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="popup-root">
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src="/vite.svg" alt="logo" style={{ height: 32, marginRight: 8 }} />
          <strong style={{ color: "#fff" }}>Synapse</strong>
        </div>
        <button title="Close" onClick={() => window.close()} style={{ background: "transparent", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", padding: "4px" }}>
          ✕
        </button>
      </div>

      <Toolbar />

      <div ref={canvasRef} className="canvas" onDrop={onDrop} onDragOver={onDragOver} onMouseMove={onMouseMove} onMouseUp={endMove} onMouseLeave={endMove}>
        <Links links={links} bubbles={bubbles} tempLink={tempLink} onRemoveLink={removeLink} />

        {bubbles.map((bubble) => (
          <Bubble
            key={bubble.id}
            data={bubble}
            onMove={handleMove}
            onResize={handleResize}
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
