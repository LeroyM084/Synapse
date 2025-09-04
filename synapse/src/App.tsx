import React, { useRef, useState, useCallback } from 'react';
import html2canvas from 'html2canvas';

// --- Composants ---
import { Bubble } from './components/bubbles';
import { Links } from './components/links';
import { Toolbar } from './components/Toolbar';
import { Topbar } from './components/Topbar';

// --- Services ---
import { generatePdf } from './services/pdfGenerator';
import { getImageSummary } from './services/aiService';

// --- Types ---
import type { BubbleData } from './types/bubble';
import type { LinkData } from './types/link';

import './App.css';

export default function App() {
  // --- Refs ---
  const canvasRef = useRef<HTMLDivElement>(null);

  // --- États ---
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const [links, setLinks] = useState<LinkData[]>([]);
  const [tempLink, setTempLink] = useState<any>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ w: 0, h: 0 });

  // --- Gestion des bulles ---
  const addBubble = useCallback((bubble: Omit<BubbleData, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    setBubbles(prev => [...prev, { ...bubble, id }]);
  }, []);

  const removeBubble = useCallback((id: string) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    setLinks(prev => prev.filter(l => l.idStartBubble !== id && l.idEndBubble !== id));
  }, []);

  const updateBubblePosition = useCallback((id: string, x: number, y: number) => {
    setBubbles(prev => prev.map(b => b.id === id ? { ...b, x, y } : b));
  }, []);

  const updateBubbleSize = useCallback((id: string, w: number, h: number) => {
    setBubbles(prev => prev.map(b => b.id === id ? { ...b, w: Math.max(50, w), h: Math.max(30, h) } : b));
  }, []);

  const updateBubbleContent = useCallback((id: string, content: string) => {
    setBubbles(prev => prev.map(b => b.id === id ? { ...b, content } : b));
  }, []);

  // --- Gestion des liens ---
  const removeLink = useCallback((id: string) => {
    setLinks(prev => prev.filter(l => l.id !== id));
  }, []);

  const startLink = useCallback((bubbleId: string, side: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setTempLink({
      startBubbleId: bubbleId,
      startSide: side,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  const finishLink = useCallback((bubbleId: string, side: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tempLink || tempLink.startBubbleId === bubbleId) {
      setTempLink(null);
      return;
    }

    const linkId = Math.random().toString(36).slice(2, 9);
    const newLink: LinkData = {
      id: linkId,
      idStartBubble: tempLink.startBubbleId,
      idEndBubble: bubbleId,
      startSide: tempLink.startSide,
      endSide: side,
      type: 'arrow',
      color: '#ff9100'
    };

    setLinks(prev => [...prev, newLink]);
    setTempLink(null);
  }, [tempLink]);

  // --- Gestion des interactions souris ---
  const startMove = useCallback((id: string, e: React.MouseEvent) => {
    const bubble = bubbles.find(b => b.id === id);
    if (!bubble) return;
    
    setDraggingId(id);
    setDragOffset({
      x: e.clientX - bubble.x,
      y: e.clientY - bubble.y
    });
  }, [bubbles]);

  const startResize = useCallback((id: string, e: React.MouseEvent) => {
    const bubble = bubbles.find(b => b.id === id);
    if (!bubble) return;
    
    setResizingId(id);
    setResizeStart({ w: bubble.w, h: bubble.h });
    setDragOffset({
      x: e.clientX,
      y: e.clientY
    });
  }, [bubbles]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (tempLink) {
      setTempLink(prev  => ({
        ...prev,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }));
    }

    if (draggingId) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      updateBubblePosition(draggingId, Math.max(0, newX), Math.max(0, newY));
    }

    if (resizingId) {
      const deltaX = e.clientX - dragOffset.x;
      const deltaY = e.clientY - dragOffset.y;
      const newW = resizeStart.w + deltaX;
      const newH = resizeStart.h + deltaY;
      updateBubbleSize(resizingId, newW, newH);
    }
  }, [tempLink, draggingId, resizingId, dragOffset, resizeStart, updateBubblePosition, updateBubbleSize]);

  const handleMouseUp = useCallback(() => {
    setDraggingId(null);
    setResizingId(null);
    if (!tempLink?.startBubbleId) {
      setTempLink(null);
    }
  }, [tempLink]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => f.type.startsWith('image/'));
    
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        addBubble({
          type: 'image',
          content: url,
          x: e.clientX - rect.left - 100,
          y: e.clientY - rect.top - 70,
          w: 200,
          h: 140
        });
      };
      reader.readAsDataURL(imageFile);
    }
  }, [addBubble]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // --- Export PDF ---
  const handleExport = async () => {
    if (!canvasRef.current || isExporting) return;

    setIsExporting(true);
    alert("Génération du rapport en cours... L'opération peut prendre un moment.");
    
    try {
      const canvasImage = await html2canvas(canvasRef.current, { useCORS: true });
      const imageDataUrl = canvasImage.toDataURL('image/png');
      
      const summaryText = await getImageSummary(imageDataUrl);
      await generatePdf(canvasRef.current, summaryText || "Analyse non disponible");

    } catch (error) {
      console.error("L'exportation a échoué :", error);
      alert("L'exportation a échoué. Veuillez consulter la console pour plus de détails.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="popup-root">
      <Topbar />

      <Toolbar
        onExport={handleExport}
        isExporting={isExporting}
        onAddTextBubble={() => addBubble({ type: 'text', content: '', x: 100, y: 100, w: 200, h: 100 })}
        onAddImageBubble={(url : any) => addBubble({ type: 'image', content: url, x: 80, y: 120, w: 200, h: 140 })}
        onClearCanvas={() => {
          setBubbles([]);
          setLinks([]);
        }}
      />

      <div 
        ref={canvasRef} 
        className="canvas"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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
            onMove={updateBubblePosition}
            onResize={updateBubbleSize}
            onRemove={removeBubble}
            onContentChange={updateBubbleContent}
            onStartMove={startMove}
            onStartResize={startResize}
            onStartLink={startLink}
            onFinishLink={finishLink}
          />
        ))}
      </div>
    </div>
  );
}