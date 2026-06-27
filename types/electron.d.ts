type PrintPagePreset =
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

type PrintPageSize =
  | PrintPagePreset
  | {
      widthMm: number
      heightMm: number
    }

type PrintMargin =
  | number
  | {
      topMm?: number
      rightMm?: number
      bottomMm?: number
      leftMm?: number
    }

type PrintImageFit = 'fill' | 'contain' | 'cover'

type PrintImageItem = {
  src: string
  xMm: number
  yMm: number
  widthMm: number
  heightMm: number
  fit?: PrintImageFit
  rotate?: 0 | 90 | 180 | 270
}

type PrintRequest = {
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

type PrintResult = {
  success: boolean
  failureReason?: string
}

type PrintAPI = {
  print: (request: PrintRequest) => Promise<PrintResult>
  previewPrint: (request: PrintRequest) => Promise<void>
}

type ExitButtonPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

type ExitButtonConfig = {
  enabled: boolean
  mark: boolean
  position: ExitButtonPosition
  size: number
}

type WindowConfig = {
  width: number
  height: number
  autoHideMenuBar: boolean
  fullscreen: boolean
  frame: boolean
}

type AppConfig = WindowConfig & {
  test: boolean
  hideCursor: boolean
  disableZoom: boolean
  disableSelect: boolean
  printCountdown: number
  autoUpdate: boolean
  exitButton: ExitButtonConfig
  list1: string
  list2: string
  list3: string
  list4: string
  list5: string
  list6: string
  list7: string
  list8: string
  list9: string
  list10: string
}

type ConfigDisplayNames = Partial<Record<keyof AppConfig, string>>

type AppAPI = PrintAPI & {
  config: AppConfig
  defineConfig: (names: ConfigDisplayNames) => Promise<ConfigDisplayNames>
  quit: () => Promise<void>
  getConfigDisplayNames: () => Promise<ConfigDisplayNames>
  getConfigFile: () => Promise<{
    path: string
    content: string
    values: Record<string, unknown>
  }>
  saveConfigFile: (content: string) => Promise<{ path: string }>
  restart: () => Promise<void>
}

interface Window {
  api?: Partial<AppAPI>
  runtimeConfig?: Partial<AppConfig>
}
