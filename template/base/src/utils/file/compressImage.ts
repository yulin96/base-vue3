import Compressor from 'compressorjs'

export function compressPhoto(file: File, options?: Compressor.Options) {
  return new Promise<Blob>((resolve, reject) => {
    new Compressor(file, {
      quality: 0.6,
      mimeType: 'image/jpeg',
      ...options,
      success(result) {
        resolve(result as Blob)
      },
      error(err) {
        reject(err)
      },
    })
  })
}
