export type PrintPagePreset =
  | 'A0'
  | 'A1'
  | 'A2'
  | 'A3'
  | 'A4'
  | 'A5'
  | 'A6'
  | 'Legal'
  | 'Letter'
  | 'Tabloid'
  | 'photo-5in'
  | 'photo-5in-landscape'
  | 'photo-6in'
  | 'photo-6in-landscape'

export type PrintPageSize =
  | PrintPagePreset
  | {
      widthMm: number
      heightMm: number
    }

export type PrintMargin =
  | number
  | {
      topMm?: number
      rightMm?: number
      bottomMm?: number
      leftMm?: number
    }

export type PrintImageFit = 'fill' | 'contain' | 'cover'

export type PrintImageItem = {
  src: string
  xMm: number
  yMm: number
  widthMm: number
  heightMm: number
  fit?: PrintImageFit
  rotate?: 0 | 90 | 180 | 270
}

export type PrintRequest = {
  page: PrintPageSize
  landscape?: boolean
  margin?: PrintMargin
  background?: PrintImageItem
  images?: PrintImageItem[]
  printer?: {
    silent?: boolean
    deviceName?: string
    copies?: number
    useDefaultPageSize?: boolean
  }
}

export type PrintResult = {
  success: boolean
  failureReason?: string
}

export type PrintAPI = {
  print: (request: PrintRequest) => Promise<PrintResult>
  previewPrint: (request: PrintRequest) => Promise<void>
}

export type ExitButtonPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export type ExitButtonConfig = {
  enabled: boolean
  mark: boolean
  position: ExitButtonPosition
  size: number
}

export type WindowConfig = {
  width: number
  height: number
  autoHideMenuBar: boolean
  fullscreen: boolean
  frame: boolean
}

export type AppConfig = WindowConfig & {
  test: boolean
  hideCursor: boolean
  disableZoom: boolean
  disableSelect: boolean
  printCountdown: number
  autoUpdate: boolean
  exitButton: ExitButtonConfig
}

type AppAPI = PrintAPI & {
  quit: () => Promise<void>
  getConfigFile: () => Promise<{
    path: string
    content: string
    values: Record<string, unknown>
  }>
  saveConfigFile: (content: string) => Promise<{ path: string }>
  restart: () => Promise<void>
}

declare global {
  interface Window {
    api: AppAPI
    runtimeConfig: AppConfig
  }
}
