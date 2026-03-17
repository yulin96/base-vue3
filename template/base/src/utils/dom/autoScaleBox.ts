/**
 * 自动缩放指定的HTMLDivElement或其ID对应的元素，以确保其宽度不超过给定的最大值。
 *
 * @param element 要进行缩放的HTMLDivElement元素或其ID字符串。
 * @param maxWidth 元素允许的最大宽度。
 */
export default function autoScaleBox(element: HTMLDivElement | string, maxWidth?: number) {
  const box = typeof element === 'string' ? document.getElementById(element) : element
  if (!box) throw new Error('Element not found')

  maxWidth = maxWidth || box.parentElement?.clientWidth || window.innerWidth

  box.style.whiteSpace = 'nowrap'

  scaleHtml(box, maxWidth)

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach(() => {
        scaleHtml(box, maxWidth)
      })
    })

    resizeObserver.observe(box)
  } else {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          scaleHtml(box, maxWidth)
        }
      })
    })

    observer.observe(box, { childList: true, characterData: true, subtree: true })
  }

  function scaleHtml(box: HTMLElement, maxWidth: number) {
    const width = box.clientWidth
    if (width > maxWidth) {
      box.style.transform = `scale(${maxWidth / width})`
    }
  }
}
