import { sleep } from '@/utils/common'
import { annotate } from 'rough-notation'
import type { RoughAnnotationConfig } from 'rough-notation/lib/model'

export const notate = (name: string, config: RoughAnnotationConfig) => {
  const ele = document.querySelector(name)
  if (!ele) return console.error('element not found')

  const _notate = annotate(document.querySelector(name)!, config)
  return _notate
}

export async function notateAuto(name: string, config: RoughAnnotationConfig, removeTime: number = 600) {
  const _notate = notate(name, config)
  if (!_notate) return

  _notate.show()

  const animationDuration = config?.animationDuration || 800
  await sleep(animationDuration + removeTime)

  if (removeTime) _notate.remove()
}
