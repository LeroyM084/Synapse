import React, { useCallback } from 'react'
import type { BubbleData } from '../types/bubble'

type BubbleProps = {
  data: BubbleData
  onMove: (id: string, x: number, y: number) => void
  onResize: (id: string, w: number, h: number) => void
  onRemove: (id: string) => void
  onContentChange: (id: string, content: string) => void
  onStartMove: (id: string, e: React.MouseEvent) => void
  onStartResize: (id: string, e: React.MouseEvent) => void
}

export const Bubble: React.FC<BubbleProps> = ({
  data,
  onRemove,
  onContentChange,
  onStartMove,
  onStartResize
}) => {
  const handleContentBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    const text = e.target.innerText
    onContentChange(data.id, text)
  }, [data.id, onContentChange])

  return (
    <div 
      className="bubble" 
      style={{
        position: 'absolute',
        left: data.x,
        top: data.y,
        width: data.w,
        height: data.h,
        border: '1px solid #ddd',
        background: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Top handle */}
      <div
        style={{
          position: 'absolute',
          top: -5,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 10,
          height: 10,
          background: '#ff9100',
          borderRadius: '50%',
          cursor: 'move',
          zIndex: 10,
          border: '2px solid white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}
        onMouseDown={(e) => onStartMove(data.id, e)}
      />

      {/* Left handle */}
      <div
        style={{
          position: 'absolute',
          left: -5,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 10,
          height: 10,
          background: '#ff9100',
          borderRadius: '50%',
          cursor: 'move',
          zIndex: 10,
          border: '2px solid white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}
        onMouseDown={(e) => onStartMove(data.id, e)}
      />

      {/* Right handle */}
      <div
        style={{
          position: 'absolute',
          right: -5,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 10,
          height: 10,
          background: '#ff9100',
          borderRadius: '50%',
          cursor: 'move',
          zIndex: 10,
          border: '2px solid white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}
        onMouseDown={(e) => onStartMove(data.id, e)}
      />

      {/* Bottom handle */}
      <div
        style={{
          position: 'absolute',
          bottom: -5,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 10,
          height: 10,
          background: '#ff9100',
          borderRadius: '50%',
          cursor: 'move',
          zIndex: 10,
          border: '2px solid white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}
        onMouseDown={(e) => onStartMove(data.id, e)}
      />

      {/* Remove button */}
      <button 
        onClick={() => onRemove(data.id)}
        style={{
          position: 'absolute',
          top: -6,
          right: -6,
          width: 20,
          height: 20,
          border: 'none',
          background: '#ff4444',
          color: '#fff',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          zIndex: 11
        }}
      >
        ✕
      </button>

      <div style={{flex: 1, overflow: 'hidden', position: 'relative', padding: 12}}>
        {data.type === 'text' ? (
          <div 
            contentEditable 
            suppressContentEditableWarning
            style={{
              width: '100%',
              height: '100%',
              outline: 'none',
              color: '#333',
              textAlign: 'left',
              wordBreak: 'break-word',
              cursor: 'text'
            }}
            onBlur={handleContentBlur}
          >
            {data.content}
          </div>
        ) : (
          <img 
            src={data.content} 
            alt="img" 
            style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}}
          />
        )}
      </div>

      <div 
        onMouseDown={(e) => onStartResize(data.id, e)}
        style={{
          position: 'absolute',
          right: -5,
          bottom: -5,
          width: 10,
          height: 10,
          background: '#ff9100',
          cursor: 'nwse-resize',
          borderRadius: '50%',
          zIndex: 10,
          border: '2px solid white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}
      />
    </div>
  )
}