import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bubble } from "./components/bubbles";
import { Links } from "./components/links";
import type { BubbleData } from "./types/bubble";
import type { LinkData } from "./types/link";
import "./App.css";
import { generatePdf } from "./services/pdfExportService";
import { getImageSummary } from "./services/iaSummarize";
import html2canvas from "html2canvas";

const randId = (): string => Math.random().toString(36).slice(2, 9);

// UI constants
const ADD_TEXT_ICON_URL = "/icons/addtext.png";
const ADD_IMAGE_ICON_URL = "/icons/addImage.png";
const CLEAN_ICON_URL = "/icons/clean.png";
const EXPORT_PDF_URL = "/icons/exportPDF.png";

type TempLink = {
  startBubbleId: string;
  startSide: "top" | "bottom" | "left" | "right";
  x: number;
  y: number;
} | null;

// Le composant Toolbar est défini HORS de App pour éviter d'être recréé à chaque render.
const FONT_FAMILIES: Record<string, string> = {
  Inter: 'Inter, sans-serif',
  Roboto: 'Roboto, sans-serif',
  'Open Sans': 'Open Sans, sans-serif',
  Merriweather: 'Merriweather, serif',
  Lobster: 'Lobster, cursive',
  'Comic Neue': 'Comic Neue, cursive',
  Pacifico: 'Pacifico, cursive',
  'Press Start 2P': '"Press Start 2P", cursive',
};

const Toolbar = ({
  isBold,
  isItalic,
  isUnderline,
  blockType,
  align,
  arrowed,
  fontKey,
  fontSize,
  toggleBold,
  toggleItalic,
  toggleUnderline,
  applyBlock,
  toggleAlign,
  toggleArrowed,
  setFontKey,
  setFontSize,
  createNewTextBubble,
  setBubbles,
  handleExportPDF,
  exporting,
}: any) => (
  <div className="toolbar editor-toolbar" role="toolbar" aria-label="Text editor toolbar">
    <div className="text-format-group">
      <button className={`format-btn ${isBold ? "active" : ""}`} title="Gras (Ctrl/Cmd+B)" onMouseDown={e => e.preventDefault()} onClick={toggleBold}>B</button>
      <button className={`format-btn ${isItalic ? "active" : ""}`} title="Italique (Ctrl/Cmd+I)" onMouseDown={e => e.preventDefault()} onClick={toggleItalic}>I</button>
      <button className={`format-btn ${isUnderline ? "active" : ""}`} title="Souligné (Ctrl/Cmd+U)" onMouseDown={e => e.preventDefault()} onClick={toggleUnderline}>U</button>
    </div>
    <div className="divider" />
    <div className="font-group" role="group" aria-label="Police">
      <select
        className="font-select"
        value={fontKey}
        onChange={(e) => setFontKey(e.target.value)}
        title="Police"
        style={{ fontFamily: FONT_FAMILIES[fontKey] }}
      >
        {Object.keys(FONT_FAMILIES).map((name) => (
          <option key={name} value={name} style={{ fontFamily: FONT_FAMILIES[name] }}>
            {name}
          </option>
        ))}
      </select>
      <select className="size-select" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} title="Taille" style={{ fontSize }}>
        <option value={12} style={{ fontSize: 12 }}>12 px</option>
        <option value={14} style={{ fontSize: 14 }}>14 px</option>
        <option value={16} style={{ fontSize: 16 }}>16 px</option>
        <option value={18} style={{ fontSize: 18 }}>18 px</option>
        <option value={20} style={{ fontSize: 20 }}>20 px</option>
        <option value={24} style={{ fontSize: 24 }}>24 px</option>
        <option value={28} style={{ fontSize: 28 }}>28 px</option>
        <option value={32} style={{ fontSize: 32 }}>32 px</option>
      </select>
    </div>
    <div className="block-group" role="group" aria-label="Paragraph style">
      <button className={`block-btn ${blockType === "H1" ? "active" : ""}`} title="Titre" onMouseDown={e => e.preventDefault()} onClick={() => applyBlock("H1")}>Titre</button>
      <button className={`block-btn ${blockType === "H2" ? "active" : ""}`} title="Sous-titre" onMouseDown={e => e.preventDefault()} onClick={() => applyBlock("H2")}>Sous-titre</button>
      <button className={`block-btn ${blockType === "P" ? "active" : ""}`} title="Corps" onMouseDown={e => e.preventDefault()} onClick={() => applyBlock("P")}>Corps</button>
    </div>
    <button className="block-btn" title={`Aligner: ${align === 'right' ? 'Droite' : align === 'center' ? 'Centre' : 'Gauche'}`} onMouseDown={e => e.preventDefault()} onClick={toggleAlign}>
      {align === 'right' ? '↦ Droite' : align === 'center' ? '↔ Centre' : '↤ Gauche'}
    </button>
    <button className={`block-btn ${arrowed ? 'active' : ''}`} title={`Liens: ${arrowed ? 'Fléchés' : 'Lignes'}`} onMouseDown={e => e.preventDefault()} onClick={toggleArrowed}>
      {arrowed ? '→ Fléchés' : '— Lignes'}
    </button>
    <div style={{ flex: 1 }} />
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={createNewTextBubble}>
        <img className="toolbar_icon" src={ADD_TEXT_ICON_URL} alt="Ajouter du texte" />
      </button>
      <button
        onClick={() => {
          const url = prompt("Image URL?");
          if (url)
            setBubbles((prev: BubbleData[]) => [
              ...prev,
              { id: randId(), x: 80, y: 120, w: 200, h: 140, type: "image", content: url },
            ]);
        }}
      >
        <img className="toolbar_icon" src={ADD_IMAGE_ICON_URL} alt="Ajouter une image" />
      </button>
      <button onClick={() => setBubbles([])}>
        <img className="toolbar_icon" src={CLEAN_ICON_URL} alt="clean" />
      </button>
      <button onClick={handleExportPDF} disabled={exporting}>
        <img className="toolbar_icon" src={EXPORT_PDF_URL} alt="Exporter PDF" />
      </button>
    </div>
  </div>
);

export default function App(): React.ReactElement {
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const [links, setLinks] = useState<LinkData[]>([]);
  const [tempLink, setTempLink] = useState<TempLink>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [blockType, setBlockType] = useState<"H1" | "H2" | "P" | "">("");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('center');
  const [arrowed, setArrowed] = useState<boolean>(true);
  const [focusNewBubbleId, setFocusNewBubbleId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [fontKey, setFontKey] = useState<string>('Inter');
  const fontFamily = FONT_FAMILIES[fontKey];
  const [fontSize, setFontSize] = useState<number>(16);
  const canvasRef = useRef<HTMLDivElement>(null);

  // --- Formatting events ---
  const exec = useCallback((cmd: string, value?: string) => {
    try {
      document.execCommand(cmd, false, value);
    } catch { /* Ignore */ }
  }, []);
  
  // AVERTISSEMENT: document.execCommand est une API obsolète.
  useEffect(() => {
    const updateState = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      if (canvasRef.current && selection.anchorNode && canvasRef.current.contains(selection.anchorNode)) {
        try {
          setIsBold(document.queryCommandState("bold"));
          setIsItalic(document.queryCommandState("italic"));
          setIsUnderline(document.queryCommandState("underline"));

          // (Optionnel) détection de formatage additionnel
        } catch { /* ignore */ }
      }
    };
    document.addEventListener("selectionchange", updateState);
    return () => document.removeEventListener("selectionchange", updateState);
  }, []);

  // --- Toolbar handlers ---
  const toggleBold = useCallback(() => exec("bold"), [exec]);
  const toggleItalic = useCallback(() => exec("italic"), [exec]);
  const toggleUnderline = useCallback(() => exec("underline"), [exec]);
  
  const applyBlock = useCallback((tag: "H1" | "H2" | "P") => {
    exec("formatBlock", tag);
    setBlockType(tag);
  }, [exec]);

  const toggleAlign = useCallback(() => {
    const order: Array<'right' | 'center' | 'left'> = ['right', 'center', 'left'];
    const next = order[(order.indexOf(align) + 1) % order.length];
    setAlign(next);
    if (next === 'left') exec('justifyLeft');
    else if (next === 'center') exec('justifyCenter');
    else exec('justifyRight');
  }, [align, exec]);

  const toggleArrowed = useCallback(() => setArrowed(prev => !prev), []);
  
  // Font handlers are applied directly via setFontFamily/setFontSize in Toolbar

  // --- Drag/Drop and Bubble Logic ---
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setBubbles(prev => [
          ...prev,
          { id: randId(), x, y, w: 200, h: 140, type: "image", content: reader.result as string },
        ]);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);

  // --- Move/Resize/Content handlers ---
  const startMove = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingId(id);
    setBubbles(prev => {
      const bubble = prev.find(b => b.id === id);
      if (!bubble) return prev;
      return [...prev.filter(b => b.id !== id), bubble];
    });
    const bubble = bubbles.find(b => b.id === id);
    if (bubble) {
      setDragOffset({ x: e.clientX - bubble.x, y: e.clientY - bubble.y });
    }
  }, [bubbles]);

  const startResize = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setResizingId(id);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (draggingId && dragOffset) {
      setBubbles(prev =>
        prev.map(b => {
          if (b.id !== draggingId) return b;
          let newX = e.clientX - dragOffset.x;
          let newY = e.clientY - dragOffset.y;
          newX = Math.max(0, Math.min(newX, rect.width - b.w));
          newY = Math.max(0, Math.min(newY, rect.height - b.h));
          return { ...b, x: newX, y: newY };
        })
      );
    }
    if (resizingId) {
      setBubbles(prev =>
        prev.map(b => {
          if (b.id !== resizingId) return b;
          const newW = e.clientX - rect.left - b.x;
          const newH = e.clientY - rect.top - b.y;
          return { ...b, w: Math.max(50, newW), h: Math.max(50, newH) };
        })
      );
    }
    if (tempLink) {
      setTempLink({ ...tempLink, x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, [draggingId, resizingId, tempLink, dragOffset]);

  const endInteractions = useCallback(() => {
    setDraggingId(null);
    setResizingId(null);
    setTempLink(null);
    setDragOffset(null);
  }, []);

  // --- Bubble logic ---
  const createNewTextBubble = useCallback(() => {
    const newBubbleId = randId();
    setBubbles(prev => [...prev, { id: newBubbleId, type: "text", content: "", x: 100, y: 100, w: 200, h: 100 }]);
    setFocusNewBubbleId(newBubbleId);
  }, []);

  const handleContentChange = useCallback((id: string, content: string) => {
    setBubbles(prev => prev.map(b => (b.id === id ? { ...b, content } : b)));
  }, []);

  const removeBubble = useCallback((id: string) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    setLinks(prev => prev.filter(l => l.idStartBubble !== id && l.idEndBubble !== id));
  }, []);

  // --- Link logic ---
  const pickBestEndSide = useCallback((start: BubbleData, end: BubbleData): 'top' | 'bottom' | 'left' | 'right' => {
    const startCx = start.x + start.w / 2;
    const startCy = start.y + start.h / 2;
    const endCx = end.x + end.w / 2;
    const endCy = end.y + end.h / 2;
    const dx = endCx - startCx;
    const dy = endCy - startCy;
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx >= 0 ? 'left' : 'right';
    } else {
      return dy >= 0 ? 'top' : 'bottom';
    }
  }, []);

  const onStartLink = useCallback((bubbleId: string, side: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTempLink({
      startBubbleId: bubbleId,
      startSide: side as any,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const onFinishLink = useCallback((bubbleId: string, _side: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!tempLink || tempLink.startBubbleId === bubbleId) return;
    
    const validSides = new Set(["top", "bottom", "left", "right"]);
    const startBubble = bubbles.find(b => b.id === tempLink.startBubbleId);
    const endBubble = bubbles.find(b => b.id === bubbleId);
    
    if (!startBubble || !endBubble || !validSides.has(tempLink.startSide as any)) {
      setTempLink(null);
      return;
    }
    
    const computedEndSide = pickBestEndSide(startBubble, endBubble);
    setLinks(prev => [
      ...prev,
      {
        id: randId(),
        idStartBubble: tempLink.startBubbleId,
        idEndBubble: bubbleId,
        startSide: tempLink.startSide,
        endSide: computedEndSide,
        type: arrowed ? "arrow" : "line",
        color: "#ff9100",
      },
    ]);
    setTempLink(null);
  }, [tempLink, arrowed, bubbles, pickBestEndSide]);

  const removeLink = useCallback((id: string) => {
    setLinks(prev => prev.filter(l => l.id !== id));
  }, []);

  // --- Export PDF + IA ---
  const handleExportPDF = useCallback(async (): Promise<void> => {
    if (!canvasRef.current || exporting) return;
    setExporting(true);
    try {
      const scale = Math.max(2, window.devicePixelRatio || 1);
      const canvasImage = await html2canvas(canvasRef.current, {
        useCORS: true,
        backgroundColor: '#ffffff',
        scale,
        windowWidth: canvasRef.current.scrollWidth,
        windowHeight: canvasRef.current.scrollHeight,
      });
      const dataUrl = canvasImage.toDataURL("image/png");
      const summary = await getImageSummary(dataUrl);
      await generatePdf(canvasRef.current, summary || "Erreur du résumé IA.");
    } catch(error) {
      console.error("Export failed:", error);
      alert("L'exportation a échoué. Voir la console pour les détails.");
    } finally {
      setExporting(false);
    }
  }, [exporting]);

  // --- Main render ---
  return (
    <div className="popup-root">
      <div className="topbar"></div>
      <Toolbar
        isBold={isBold}
        isItalic={isItalic}
        isUnderline={isUnderline}
        blockType={blockType}
        align={align}
        arrowed={arrowed}
        fontKey={fontKey}
        fontSize={fontSize}
        toggleBold={toggleBold}
        toggleItalic={toggleItalic}
        toggleUnderline={toggleUnderline}
        applyBlock={applyBlock}
        toggleAlign={toggleAlign}
        toggleArrowed={toggleArrowed}
        setFontKey={setFontKey}
        setFontSize={setFontSize}
        createNewTextBubble={createNewTextBubble}
        setBubbles={setBubbles}
        handleExportPDF={handleExportPDF}
        exporting={exporting}
      />
      <div
        ref={canvasRef}
        className="canvas"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onMouseMove={onMouseMove}
        onMouseUp={endInteractions}
        onMouseLeave={endInteractions}
      >
        <Links links={links} bubbles={bubbles} tempLink={tempLink} onRemoveLink={removeLink} />
        {bubbles.map(bubble => (
          <Bubble
            key={bubble.id}
            data={bubble}
            fontFamily={fontFamily}
            fontSize={fontSize}
            onMove={() => {}}
            onResize={() => {}}
            onRemove={removeBubble}
            onContentChange={handleContentChange}
            onStartMove={startMove}
            onStartResize={startResize}
            onStartLink={onStartLink}
            onFinishLink={onFinishLink}
            shouldFocus={focusNewBubbleId === bubble.id}
            onFocused={() => setFocusNewBubbleId(null)}
          />
        ))}
      </div>
      {exporting && (
        <div className="export-overlay">
          <div className="export-modal">
            <div className="spinner" />
            <div>Génération du PDF…</div>
          </div>
        </div>
      )}
    </div>
  );
}