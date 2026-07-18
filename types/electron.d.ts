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
  | 'photo-6in'

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
  gpuAcceleration: boolean
  printCountdown: number
  autoUpdate: boolean
  autoLaunch: boolean
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

export type AppConfigPatch = Omit<Partial<AppConfig>, 'exitButton'> & {
  exitButton?: Partial<ExitButtonConfig>
}

export type ConfigDisplayNames = Partial<Record<keyof AppConfig, string>>

export type ConfigGroupName =
  | 'systemStartup'
  | 'resourceUpdate'
  | 'window'
  | 'performance'
  | 'pageBehavior'
  | 'exitButton'
  | 'customConfig'

export type ConfigHideKey =
  | keyof AppConfig
  | ConfigGroupName
  | 'exitButton.enabled'
  | 'exitButton.mark'
  | 'exitButton.position'
  | 'exitButton.size'
  | 'ossManifestUrl'

export type ConfigHideTarget = ConfigHideKey | ConfigHideKey[]

export type ConfigEditorOptions = {
  hiddenConfigs: ConfigHideKey[]
  hideAllConfig: boolean
}

export type ScreenMessage = {
  from: number | null
  to: number
  command: string
  data?: unknown
}

export type ScreenAPI = {
  getScreenIndex: () => Promise<number | null>
  sendToScreen: (target: number, command: string, data?: unknown) => Promise<boolean>
  onScreenMessage: (listener: (message: ScreenMessage) => void) => () => void
}

export type AppAPI = PrintAPI & {
  config: AppConfig
  defineConfig: (config: AppConfigPatch) => Promise<AppConfig>
  defineDisplayNames: (names: ConfigDisplayNames) => Promise<ConfigDisplayNames>
  hideConfig: (names: ConfigHideTarget) => Promise<ConfigEditorOptions>
  hideAllConfig: () => Promise<ConfigEditorOptions>
  enterFullscreen: () => Promise<boolean>
  exitFullscreen: () => Promise<boolean>
  quit: () => Promise<void>
  getConfigDisplayNames: () => Promise<ConfigDisplayNames>
  getConfig: () => Promise<AppConfig>
  getConfigEditorOptions: () => Promise<ConfigEditorOptions>
  getConfigFile: () => Promise<{
    path: string
    content: string
    values: Record<string, unknown>
  }>
  saveConfigFile: (config: Record<string, unknown>) => Promise<{ path: string }>
  restart: () => Promise<void>
} & ScreenAPI

declare global {
  interface Window {
    api?: Partial<AppAPI>
  }
}
