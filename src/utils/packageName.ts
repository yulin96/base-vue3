export function isValidPackageName(value: string) {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(value)
}

export function toValidPackageName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]+/, '')
    .replace(/[^a-z0-9-~]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
