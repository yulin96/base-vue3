type ClientUpdateStatus =
  | { status: 'available'; version: string }
  | { status: 'unsupported' | 'offline' | 'current' | 'error' | 'updating' }

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
  | 'photo-6in'
  | 'dnp-5in'
  | 'dnp-6in'
  | 'dnp-7in'
  | 'dnp-8in'

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

type PrintTextAlign = 'left' | 'center' | 'right'

type PrintTextItem = {
  content: string
  xMm: number
  yMm: number
  widthMm: number
  heightMm: number
  fontSizePt?: number
  fontFamily?: string
  fontWeight?: number | 'normal' | 'bold'
  color?: string
  align?: PrintTextAlign
  lineHeight?: number
  rotate?: 0 | 90 | 180 | 270
}

type PrintOffset = {
  xMm?: number
  yMm?: number
}

type PrintRequest = {
  page: PrintPageSize
  landscape?: boolean
  margin?: PrintMargin
  offset?: PrintOffset
  background?: PrintImageItem
  images?: PrintImageItem[]
  texts?: PrintTextItem[]
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

type PrintPrinter = {
  name: string
  displayName: string
}

type PrintAPI = {
  getPrinters: () => Promise<PrintPrinter[]>
  print: (request: PrintRequest) => Promise<PrintResult>
  previewPrint: (request: PrintRequest) => Promise<void>
}

type ExitButtonPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
type HardwareAccelerationMode = 'auto' | 'enabled' | 'disabled'

type ExitButtonConfig = {
  enabled: boolean
  mark: boolean
  position: ExitButtonPosition
  size: number
}

type WindowConfig = {
  width: number
  height: number
  backgroundColor: string
  autoHideMenuBar: boolean
  fullscreen: boolean
  frame: boolean
}

type AppConfig = WindowConfig & {
  test: boolean
  hideCursor: boolean
  disableZoom: boolean
  disableSelect: boolean
  hardwareAcceleration: HardwareAccelerationMode
  printCountdown: number
  autoUpdate: boolean
  autoLaunch: boolean
  alwaysOnTop: boolean
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
  list11: string
  list12: string
  list13: string
  list14: string
  list15: string
  list16: string
  list17: string
  list18: string
  list19: string
  list20: string
}

type AppConfigFieldName = keyof AppConfig | 'resourceUrl' | 'ossManifestUrl'

type ProjectFieldKey = Extract<keyof AppConfig, `list${number}`>
type ProjectFieldType = 'text' | 'number' | 'switch' | 'select'
type ProjectFieldDefinition = {
  name?: string
  type?: ProjectFieldType
  default?: string
  options?: string[]
}
type ProjectFieldDefinitions = Partial<Record<ProjectFieldKey, ProjectFieldDefinition>>
type ProjectFieldSources = Partial<Record<ProjectFieldKey, 'default' | 'user'>>
type ProjectFieldErrors = Partial<Record<ProjectFieldKey, string>>
type ProjectFieldsResult = { config: AppConfig; errors: ProjectFieldErrors }
type ProjectFieldEdits = {
  revision: string
  changed: ProjectFieldKey[]
  reset: ProjectFieldKey[]
}
type ProjectFieldsView = {
  definitions: ProjectFieldDefinitions
  sources: ProjectFieldSources
  errors: ProjectFieldErrors
  revision: string
}

type ConfigDisplayNames = Partial<Record<AppConfigFieldName, string>>

type ConfigGroupName =
  | 'systemStartup'
  | 'resourceUpdate'
  | 'window'
  | 'performance'
  | 'pageBehavior'
  | 'exitButton'
  | 'customConfig'

type ConfigHideTarget =
  | AppConfigFieldName
  | ConfigGroupName
  | 'exitButton.enabled'
  | 'exitButton.mark'
  | 'exitButton.position'
  | 'exitButton.size'
  | (
      | AppConfigFieldName
      | ConfigGroupName
      | 'exitButton.enabled'
      | 'exitButton.mark'
      | 'exitButton.position'
      | 'exitButton.size'
    )[]

type ConfigEditorOptions = {
  hiddenConfigs: string[]
  hideAllConfig: boolean
}

type ScreenMessage = {
  from: number | null
  to: number
  command: string
  data?: unknown
}

type ScreenAPI = {
  getScreenIndex: () => Promise<number | null>
  sendToScreen: (target: number, command: string, data?: unknown) => Promise<boolean>
  onScreenMessage: (listener: (message: ScreenMessage) => void) => () => void
}

type NetworkCheckResult = {
  online: boolean
  status: number | null
  latency: number
  error: string | null
}

type AppDiagnostics = {
  version: string
  electron: string
  chromium: string
  gpu: Record<string, string>
  processes: { pid: number; type: string; memoryMB: number }[]
  displays: {
    id: number
    primary: boolean
    width: number
    height: number
    scaleFactor: number
    refreshRate: number
  }[]
}

type InteractionStatInitRequest = { projectId: string }
type InteractionStatInitResult = { initialized: boolean; error: string | null }
type InteractionStatRequest = { projectId: string; event: string }
type InteractionStatResult = { saved: boolean; error: string | null }

type AppAPI = PrintAPI & {
  initInteractionStats: (request: InteractionStatInitRequest) => Promise<InteractionStatInitResult>
  recordInteractionStat: (request: InteractionStatRequest) => Promise<InteractionStatResult>
  checkClientUpdate: () => Promise<ClientUpdateStatus>
  installClientUpdate: () => Promise<boolean>
  getDiagnostics: () => Promise<AppDiagnostics>
  config: AppConfig
  defineProjectFields: (fields: ProjectFieldDefinitions) => Promise<ProjectFieldsResult>
  defineDisplayNames: (names: ConfigDisplayNames) => Promise<ConfigDisplayNames>
  hideConfig: (names: ConfigHideTarget) => Promise<ConfigEditorOptions>
  hideAllConfig: () => Promise<ConfigEditorOptions>
  enterFullscreen: () => Promise<boolean>
  exitFullscreen: () => Promise<boolean>
  quit: () => Promise<void>
  getConfigDisplayNames: () => Promise<ConfigDisplayNames>
  getConfig: () => Promise<AppConfig>
  getConfigEditorOptions: () => Promise<ConfigEditorOptions>
  restart: () => Promise<void>
  checkOnline: () => Promise<NetworkCheckResult>
} & ScreenAPI

interface Window {
  api?: Partial<AppAPI>
}
