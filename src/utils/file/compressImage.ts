import Compressor from 'compressorjs'

export function compressPhoto(file: File, options?: Compressor.Options) {
  return new Promise<Blob>((resolve) => {
    try {
      new Compressor(file, {
        quality: 0.6,
        maxWidth: 2048,
        maxHeight: 2048,
        ...options,
        success(result) {
          resolve(result as Blob)
        },
        error() {
          resolve(file)
        },
      })
    } catch {
      resolve(file)
    }
  })
}
