/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @returns {Promise<boolean>} 是否复制成功
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    // 优先使用现代 Clipboard API
    if (navigator.clipboard) {
      try {
        // 检查权限（如果支持权限 API）
        if (navigator.permissions) {
          const permissionStatus = await navigator.permissions.query({
            name: 'clipboard-write' as PermissionName,
          })
          if (permissionStatus.state === 'granted' || permissionStatus.state === 'prompt') {
            await navigator.clipboard.writeText(text)
            return true
          }
        } else {
          // 如果不支持权限 API，仍然尝试使用剪贴板 API
          await navigator.clipboard.writeText(text)
          return true
        }
      } catch (clipboardErr) {
        console.warn('Clipboard API 失败，尝试备用方法', clipboardErr)
        // 失败后会继续尝试下面的备用方法
      }
    }

    // 回退到传统的 execCommand 方法
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    textArea.style.top = '10px'
    textArea.setAttribute('readonly', 'readonly')
    document.body.appendChild(textArea)

    // 在移动设备上可能需要特殊处理
    if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
      textArea.contentEditable = 'true'
      textArea.readOnly = false

      const range = document.createRange()
      range.selectNodeContents(textArea)

      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
        textArea.setSelectionRange(0, 999999)
      }
    } else {
      textArea.select()
    }

    const success = document.execCommand('copy')
    document.body.removeChild(textArea)

    if (!success) {
      throw new Error('无法复制文本：execCommand 返回失败')
    }

    return true
  } catch (err) {
    console.error('复制文本失败:', err)
    return false
  }
}
