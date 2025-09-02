import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Bubble } from './components/bubbles'
import type { BubbleData } from './types/bubble'
import './App.css'

function randId() { return Math.random().toString(36).slice(2,9) }

export default function App() {
  const [bubbles, setBubbles] = useState<BubbleData[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [resizingId, setResizingId] = useState<string | null>(null)
  const [focusNewBubbleId, setFocusNewBubbleId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const addTextIcon_URL = "/icons/addtext.png";
  const addImageIcon_URL = "/icons/addImage.png"
  const cleanIcon_URL = "/icons/clean.png"

  // formatting UI state
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [blockType, setBlockType] = useState<'H1'|'H2'|'P'|''>('')

  // keep popup open: this is a UI-level control; background opens a window, window isn't closed automatically

  useEffect(()=>{
    function onWindowMessage(_: MessageEvent){ /* reserved */ }
    window.addEventListener('message', onWindowMessage)
    return ()=> window.removeEventListener('message', onWindowMessage)
  },[])

  // update formatting buttons when selection changes
  useEffect(() => {
    const updateState = () => {
      try {
        setIsBold(document.queryCommandState('bold'))
        setIsItalic(document.queryCommandState('italic'))
        setIsUnderline(document.queryCommandState('underline'))

        // determine block type from selection
        const sel = window.getSelection()
        if (!sel || !sel.anchorNode) { setBlockType(''); return }
        let el = sel.anchorNode.nodeType === 3 ? (sel.anchorNode.parentElement as HTMLElement) : (sel.anchorNode as HTMLElement)
        while (el && el !== document.body) {
          const tag = el.tagName
          if (tag === 'H1' || tag === 'H2' || tag === 'P') { setBlockType(tag as any); return }
          el = el.parentElement as HTMLElement
        }
        setBlockType('P')
      } catch (e) {
        // ignore
      }
    }
    document.addEventListener('selectionchange', updateState)
    return () => document.removeEventListener('selectionchange', updateState)
  }, [])

  const exec = useCallback((cmd: string, value?: string) => {
    try {
      // focus stays in contentEditable; execCommand affects focused editable
      document.execCommand(cmd, false, value)
      // update UI state after command
      setIsBold(document.queryCommandState('bold'))
      setIsItalic(document.queryCommandState('italic'))
      setIsUnderline(document.queryCommandState('underline'))
    } catch (e) {
      console.warn('execCommand failed', e)
    }
  }, [])

  // helpers for toolbar actions
  const toggleBold = useCallback(() => exec('bold'), [exec])
  const toggleItalic = useCallback(() => exec('italic'), [exec])
  const toggleUnderline = useCallback(() => exec('underline'), [exec])
  const applyBlock = useCallback((tag: 'H1'|'H2'|'P') => {
    exec('formatBlock', tag)
    setBlockType(tag)
  }, [exec])

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

  const createNewTextBubble = useCallback(() => {
    const newBubble: BubbleData = {
      id: randId(),
      type: 'text',
      content: '',
      x: 100,  // position par défaut
      y: 100,
      w: 200,  // taille par défaut
      h: 100
    };
    setBubbles(prev => [...prev, newBubble]);
    return newBubble.id;
  }, []);

  // toolbar horizontal - replaced by richer editor toolbar
  const Toolbar = ()=> (
    <div className="toolbar editor-toolbar" role="toolbar" aria-label="Text editor toolbar">
      <div className="text-format-group">
        <button
          className={`format-btn ${isBold ? 'active' : ''}`}
          title="Gras (Ctrl/Cmd+B)"
          onMouseDown={e => e.preventDefault()}
          onClick={toggleBold}
        >B</button>

        <button
          className={`format-btn ${isItalic ? 'active' : ''}`}
          title="Italique (Ctrl/Cmd+I)"
          onMouseDown={e => e.preventDefault()}
          onClick={toggleItalic}
        >I</button>

        <button
          className={`format-btn ${isUnderline ? 'active' : ''}`}
          title="Souligné (Ctrl/Cmd+U)"
          onMouseDown={e => e.preventDefault()}
          onClick={toggleUnderline}
        >U</button>
      </div>

      <div className="divider" />

      <div className="block-group" role="group" aria-label="Paragraph style">
        <button
          className={`block-btn ${blockType === 'H1' ? 'active' : ''}`}
          title="Titre"
          onMouseDown={e => e.preventDefault()}
          onClick={() => applyBlock('H1')}
        >Titre</button>

        <button
          className={`block-btn ${blockType === 'H2' ? 'active' : ''}`}
          title="Sous-titre"
          onMouseDown={e => e.preventDefault()}
          onClick={() => applyBlock('H2')}
        >Sous-titre</button>

        <button
          className={`block-btn ${blockType === 'P' ? 'active' : ''}`}
          title="Corps"
          onMouseDown={e => e.preventDefault()}
          onClick={() => applyBlock('P')}
        >Corps</button>
      </div>

      <div style={{flex:1}} />

      <div style={{display:'flex', gap:8}}>
        <button onClick={() => {
          const newBubbleId = createNewTextBubble();
          setFocusNewBubbleId(newBubbleId);
        }}>
          <img className="toolbar_icon" src={addTextIcon_URL} alt="Ajouter du texte" />
        </button>

        <button onClick={()=>{ const url=prompt('Image URL?'); if(url) setBubbles(prev=>[...prev,{ id: randId(), x:80, y:120, w:200, h:140, type:'image', content:url }]) }}>
          <img className="toolbar_icon" src={addImageIcon_URL} alt = "Ajouter une image" />
        </button>

        <button onClick={()=>{ setBubbles([]) }}>
          <img className = "toolbar_icon" src={cleanIcon_URL} alt="clean"/>
        </button>
      </div>
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
