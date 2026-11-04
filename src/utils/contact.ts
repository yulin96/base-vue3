export interface ContactInfo {
  name: string
  phone: string
  email: string
  company: string
  title: string
}

export function createContactVCard(contact: ContactInfo) {
  const escape = (value: string) =>
    value
      .replace(/\\/g, '\\\\')
      .replace(/\r\n|\r|\n/g, '\\n')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escape(contact.name)}`,
    `N:${escape(contact.name)};;;;`,
    `TEL;TYPE=CELL:${escape(contact.phone)}`,
    ...(contact.email ? [`EMAIL;TYPE=INTERNET:${escape(contact.email)}`] : []),
    ...(contact.company ? [`ORG:${escape(contact.company)}`] : []),
    ...(contact.title ? [`TITLE:${escape(contact.title)}`] : []),
    'END:VCARD',
  ]

  const encoder = new TextEncoder()
  return (
    lines
      .map((line) => {
        let result = ''
        let bytes = 0
        for (const character of line) {
          const length = encoder.encode(character).length
          if (bytes + length > 75) {
            result += '\r\n '
            bytes = 1
          }
          result += character
          bytes += length
        }
        return result
      })
      .join('\r\n') + '\r\n'
  )
}

export function createRandomContact(): ContactInfo {
  const surnames = ['林', '陈', '许', '周', '沈', '陆', '苏', '顾']
  const names = ['知远', '以宁', '星禾', '予安', '沐言', '清和', '一诺', '书然']
  const companies = ['青禾设计工作室', '星野科技', '云川文化', '木白创意', '拾光传媒']
  const titles = ['产品经理', '视觉设计师', '前端工程师', '品牌策划', '项目经理']
  const pick = (items: string[]) => items[Math.floor(Math.random() * items.length)]!
  const suffix = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')

  return {
    name: `${pick(surnames)}${pick(names)}`,
    phone: `1380000${suffix}`,
    email: `demo${suffix}@example.com`,
    company: pick(companies),
    title: pick(titles),
  }
}
