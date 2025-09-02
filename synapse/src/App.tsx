import React, { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

type Bubble = {
  id: string
  x: number
  y: number
  w: number
  h: number
  type: 'text' | 'image'
  content: string
}

function randId() { return Math.random().toString(36).slice(2,9) }

export default function App(){
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [resizingId, setResizingId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)

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
      <button onClick={()=>{ const t=prompt('Texte?'); if(t) setBubbles(prev=>[...prev,{ id: randId(), x:50, y:80, w:220, h:80, type:'text', content:t }]) }}>+ Text</button>
      <button onClick={()=>{ const url=prompt('Image URL?'); if(url) setBubbles(prev=>[...prev,{ id: randId(), x:80, y:120, w:200, h:140, type:'image', content:url }]) }}>+ Image</button>
      <button onClick={()=>{ setBubbles([]) }}>Clear</button>
    </div>
  )

  return (
    <div className="popup-root" style={{width:'100vw', height:'100vh', background:'#f7f7f7', display:'flex', flexDirection:'column'}}>
      <div className="topbar" style={{height:56, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 12px', background:'#ff9100'}}>
        <div style={{display:'flex', alignItems:'center'}}>
          <img src="/vite.svg" alt="logo" style={{height:36, marginRight:12}}/>
          <strong>Synapse</strong>
        </div>
        <div style={{display:'flex', alignItems:'center'}}>
          <button title="Close" onClick={()=> window.close()} style={{background:'transparent', border:'none', fontSize:18, cursor:'pointer'}}>✕</button>
        </div>
      </div>

      <Toolbar />

      <div ref={canvasRef} className="canvas" onDrop={onDrop} onDragOver={onDragOver} onMouseMove={(e)=>{ onMouseMove(e); onMouseMoveResize(e) }} onMouseUp={endMove} onMouseLeave={endMove} style={{flex:1, position:'relative', overflow:'hidden', background:'#fff', margin:16, borderRadius:8, border:'1px solid #eee'}}>
        {bubbles.map(b=> (
          <div key={b.id} className="bubble" style={{position:'absolute', left:b.x, top:b.y, width:b.w, height:b.h, border:'1px solid #ddd', background:'#fff', boxShadow:'0 4px 12px rgba(0,0,0,0.06)', display:'flex', flexDirection:'column'}} draggable onDragStart={(ev)=>{ ev.dataTransfer?.setData('text/plain', b.content) }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 8px', background:'#fafafa', borderBottom:'1px solid #eee', cursor:'move'}} onMouseDown={(e)=>startMove(b.id,e)}>
              <div style={{fontSize:12}}>{b.type}</div>
              <div style={{display:'flex', gap:8}}>
                <button onClick={()=>removeBubble(b.id)} style={{border:'none', background:'transparent', cursor:'pointer'}}>✕</button>
              </div>
            </div>
            <div style={{flex:1, overflow:'hidden', position:'relative', padding:8}}>
              {b.type==='text' ? (
                <div contentEditable suppressContentEditableWarning style={{width:'100%', height:'100%', outline:'none'}} onBlur={(e)=>{
                  const text = (e.target as HTMLElement).innerText
                  setBubbles(prev=>prev.map(x=> x.id===b.id ? {...x, content:text} : x))
                }}>{b.content}</div>
              ) : (
                <img src={b.content} alt="img" style={{maxWidth:'100%', maxHeight:'100%', objectFit:'contain'}}/>
              )}
            </div>
            <div style={{height:10, display:'flex', justifyContent:'flex-end', alignItems:'center', padding:'4px'}}>
              <div onMouseDown={(e)=>startResize(b.id,e)} style={{width:12,height:12,background:'#ddd',cursor:'nwse-resize'}} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
