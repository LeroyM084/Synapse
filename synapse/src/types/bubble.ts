export type BubbleData = {
  id: string
  x: number
  y: number
  w: number
  h: number
  w_init?: number
  h_init?: number
  type: 'text' | 'image'
  content: string
}
