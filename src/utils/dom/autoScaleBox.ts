/**
 * 自动缩放指定的HTMLDivElement或其ID对应的元素，以确保其宽度不超过给定的最大值。
 *
 * @param element 要进行缩放的HTMLDivElement元素或其ID字符串。
 * @param maxWidth 元素允许的最大宽度。
 * @returns 停止观察并恢复元素内联样式的清理函数。
 */
export default function autoScaleBox(element: HTMLDivElement | string, maxWidth?: number) {
  const box = typeof element === 'string' ? document.getElementById(element) : element
  if (!box) throw new Error('Element not found')
  if (maxWidth !== undefined && (!Number.isFinite(maxWidth) || maxWidth <= 0)) {
    throw new RangeError('maxWidth 必须是大于 0 的有限数值')
  }

  const originalWhiteSpace = box.style.whiteSpace
  const originalTransform = box.style.transform
  const getMaxWidth = () => maxWidth ?? box.parentElement?.clientWidth ?? window.innerWidth

  box.style.whiteSpace = 'nowrap'

  const scaleHtml = () => {
    const width = box.clientWidth
    const availableWidth = getMaxWidth()
    const baseTransform = originalTransform && originalTransform !== 'none' ? `${originalTransform} ` : ''
    box.style.transform =
      width > availableWidth ? `${baseTransform}scale(${availableWidth / width})` : originalTransform
  }

  scaleHtml()

  let observer: ResizeObserver | MutationObserver
  let listeningWindowResize = false

  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(scaleHtml)

    observer.observe(box)
    if (maxWidth === undefined && box.parentElement) observer.observe(box.parentElement)
  } else {
    observer = new MutationObserver(scaleHtml)

    observer.observe(box, { childList: true, characterData: true, subtree: true })
    window.addEventListener('resize', scaleHtml)
    listeningWindowResize = true
  }

  return () => {
    observer.disconnect()
    if (listeningWindowResize) window.removeEventListener('resize', scaleHtml)
    box.style.whiteSpace = originalWhiteSpace
    box.style.transform = originalTransform
  }
}
