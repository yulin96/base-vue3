import { annotate } from 'rough-notation'
import type { RoughAnnotationConfig } from 'rough-notation/lib/model'

import { sleep } from '@/utils/common'

export const notate = (name: string, config: RoughAnnotationConfig) => {
  const ele = document.querySelector<HTMLElement>(name)
  if (!ele) return console.error('element not found')

  return annotate(ele, config)
}

export async function notateAuto(name: string, config: RoughAnnotationConfig, removeTime: number = 600) {
  const _notate = notate(name, config)
  if (!_notate) return

  _notate.show()

  const animationDuration = config.animationDuration ?? 800
  await sleep(animationDuration + removeTime)

  if (removeTime) _notate.remove()
}
