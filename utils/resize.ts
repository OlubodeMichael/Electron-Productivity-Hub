export interface VerticalResizeOptions {
  startY: number
  startHeight: number
  minHeight: number
  maxHeight: number
  onResize: (height: number) => void
}

/**
 * Sets up vertical resize from a drag: listens for mousemove and mouseup,
 * computes new height from startY/startHeight and current clientY (drag up = increase height).
 * Returns a cleanup function to remove listeners (e.g. on unmount or cancel).
 */
export function resizeVertical(options: VerticalResizeOptions): () => void {
  const { startY, startHeight, minHeight, maxHeight, onResize } = options

  const onMove = (e: MouseEvent) => {
    const delta = e.clientY - startY
    const next = Math.min(
      maxHeight,
      Math.max(minHeight, startHeight - delta)
    )
    onResize(next)
  }

  const onUp = () => {
    window.removeEventListener("mousemove", onMove)
    window.removeEventListener("mouseup", onUp)
    document.body.style.userSelect = ""
  }

  document.body.style.userSelect = "none"
  window.addEventListener("mousemove", onMove)
  window.addEventListener("mouseup", onUp)

  return onUp
}

export interface HorizontalResizeOptions {
  startX: number
  startWidth: number
  minWidth: number
  maxWidth: number
  onResize: (width: number) => void
}

/**
 * Sets up horizontal resize from a drag: listens for mousemove and mouseup,
 * computes new width from startX/startWidth and current clientX (drag right = increase width).
 * Returns a cleanup function to remove listeners.
 */
export function resizeHorizontal(options: HorizontalResizeOptions): () => void {
  const { startX, startWidth, minWidth, maxWidth, onResize } = options

  const onMove = (e: MouseEvent) => {
    const delta = e.clientX - startX
    const next = Math.min(
      maxWidth,
      Math.max(minWidth, startWidth + delta)
    )
    onResize(next)
  }

  const onUp = () => {
    window.removeEventListener("mousemove", onMove)
    window.removeEventListener("mouseup", onUp)
    document.body.style.userSelect = ""
  }

  document.body.style.userSelect = "none"
  window.addEventListener("mousemove", onMove)
  window.addEventListener("mouseup", onUp)

  return onUp
}
