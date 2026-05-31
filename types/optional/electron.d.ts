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
}

type AppAPI = {
  quit: () => Promise<void>
  getConfigFile: () => Promise<{
    path: string
    content: string
    values: Record<string, unknown>
  }>
  saveConfigFile: (content: string) => Promise<{ path: string }>
  restart: () => Promise<void>
}

interface Window {
  api: AppAPI
  runtimeConfig: AppConfig
}
