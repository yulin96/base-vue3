export function formDataToObj(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData)
}
