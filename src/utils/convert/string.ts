export function boldChinese(str: string): string {
  return str.replace(/([\u4e00-\u9fa5]+)/g, '<b>$1</b>')
}

export function maskPhone(phone: string): string {
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    console.warn('非标准手机号格式:', phone)
  }

  return phone.replace(/(\d{3})(\d+)(\d{4})/, '$1****$3')
}

export function trimAll(str: string): string {
  return str.replace(/\s+/g, '')
}
