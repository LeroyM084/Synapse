export type LinkData = {
  id: string
  idStartBubble: string
  idEndBubble: string
  startSide: 'top' | 'bottom' | 'left' | 'right'
  endSide: 'top' | 'bottom' | 'left' | 'right'
  type: 'arrow' | 'line'
  color: string
}