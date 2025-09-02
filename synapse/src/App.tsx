import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Bubble } from './components/bubbles'
import type { BubbleData } from './types/bubble'
import './App.css'

function randId() { return Math.random().toString(36).slice(2,9) }

export default function App() {
  const [bubbles, setBubbles] = useState<BubbleData[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [resizingId, setResizingId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const addTextIcon_URL = "/icons/addtext.png";
  const addImageIcon_URL = "/icons/addImage.png"
  const cleanIcon_URL = "/icons/clean.png"

  // keep popup open: this is a UI-level control; background opens a window, window isn't closed automatically

  useEffect(()=>{
    function onWindowMessage(_: MessageEvent){ /* reserved */ }
    window.addEventListener('message', onWindowMessage)
    return ()=> window.removeEventListener('message', onWindowMessage)
  },[])

  // Drop handling
  const onDrop = useCallback((e: React.DragEvent)=>{
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    const x = (e.clientX - (rect?.left||0))
    const y = (e.clientY - (rect?.top||0))

    // files (images)
    const file = e.dataTransfer?.files?.[0]
    if (file && file.type.startsWith('image/')){
      const reader = new FileReader()
      reader.onload = ()=>{
        setBubbles(prev=>[...prev,{ id: randId(), x, y, w: 200, h: 150, type: 'image', content: String(reader.result)}])
      }
      reader.readAsDataURL(file)
      return
    }

    // text
    const text = e.dataTransfer?.getData('text') || e.dataTransfer?.getData('text/plain')
    if (text) {
      setBubbles(prev=>[...prev,{ id: randId(), x, y, w: 220, h: 80, type: 'text', content: text }])
    }
  },[])

  const onDragOver = useCallback((e: React.DragEvent)=>{ e.preventDefault() },[])

  // bubble move handlers
  function startMove(id:string, e: React.MouseEvent){
    e.stopPropagation(); setDraggingId(id)
  }
  function onMouseMove(e: React.MouseEvent){
    if (!draggingId) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    setBubbles(prev=>prev.map(b=> b.id===draggingId ? {...b, x: e.clientX-rect.left - b.w/2, y: e.clientY-rect.top - b.h/2} : b))
  }
  function endMove(){ setDraggingId(null); setResizingId(null) }

  // resizing
  function startResize(id:string, e: React.MouseEvent){ e.stopPropagation(); setResizingId(id) }
  function onMouseMoveResize(e: React.MouseEvent){
    if (!resizingId) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    setBubbles(prev=>prev.map(b=> b.id===resizingId ? {...b, w: Math.max(40, e.clientX-rect.left - b.x), h: Math.max(24, e.clientY-rect.top - b.y)} : b))
  }

  // remove bubble
  function removeBubble(id:string){ setBubbles(prev=>prev.filter(b=>b.id!==id)) }

  // toolbar horizontal
  const Toolbar = ()=> (
    <div className="toolbar">
      <button onClick={()=>{ const t=prompt('Texte?'); if(t) setBubbles(prev=>[...prev,{ id: randId(), x:50, y:80, w:220, h:80, type:'text', content:t }]) }}>
        <img className="toolbar_icon" src={addTextIcon_URL} alt="Ajouter du texte" />
      </button>
      <button onClick={()=>{ const url=prompt('Image URL?'); if(url) setBubbles(prev=>[...prev,{ id: randId(), x:80, y:120, w:200, h:140, type:'image', content:url }]) }}>
        <img className="toolbar_icon" src={addImageIcon_URL} alt = "Ajouter une image" />
      </button>
      <button onClick={()=>{ setBubbles([]) }}>
        <img className = "toolbar_icon" src={cleanIcon_URL} alt="clean"/>
      </button>
    </div>
  )

  const handleMove = useCallback((id: string, x: number, y: number) => {
    setBubbles(prev => prev.map(b => b.id === id ? {...b, x, y} : b))
  }, [])

  const handleResize = useCallback((id: string, w: number, h: number) => {
    setBubbles(prev => prev.map(b => b.id === id ? {...b, w, h} : b))
  }, [])

  const handleContentChange = useCallback((id: string, content: string) => {
    setBubbles(prev => prev.map(b => b.id === id ? {...b, content} : b))
  }, [])

  return (
    <div className="popup-root">
      <div className="topbar">
        <div style={{display:'flex', alignItems:'center'}}>
          <img src="/vite.svg" alt="logo" style={{height:32, marginRight:8}}/>
          <strong style={{color:'#fff'}}>Synapse</strong>
        </div>
        <button title="Close" onClick={()=> window.close()} style={{background:'transparent', border:'none', color:'#fff', fontSize:18, cursor:'pointer', padding:'4px'}}>✕</button>
      </div>

      <Toolbar />

      <div ref={canvasRef} 
        className="canvas" 
        onDrop={onDrop} 
        onDragOver={onDragOver} 
        onMouseMove={(e) => { onMouseMove(e); onMouseMoveResize(e) }} 
        onMouseUp={endMove} 
        onMouseLeave={endMove}
      >
        {bubbles.map(bubble => (
          <Bubble
            key={bubble.id}
            data={bubble}
            onMove={handleMove}
            onResize={handleResize}
            onRemove={removeBubble}
            onContentChange={handleContentChange}
            onStartMove={startMove}
            onStartResize={startResize}
          />
        ))}
      </div>
    </div>
  )
}
