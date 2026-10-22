export type SerialPayload = { hex: string } | { text: string } | { bytes: Uint8Array }
export type SerialReceived = { data: Uint8Array; error: string | null }
export type SerialAPI = {
  send: (number: number, payload: SerialPayload) => Promise<void>
  receive: (number: number, callback: (event: SerialReceived) => void) => () => void
}
