export function extractNumbers(str: string, returnAsArray = false): number[] | number | null {
  const matches = str.match(/-?\d+(\.\d+)?/g)

  if (!matches) {
    return returnAsArray ? [] : null
  }

  const numbers = matches.map(Number)
  return returnAsArray ? numbers : (numbers[0] ?? null)
}

export function toFixedNumber(num: number, digits: number = 2): number {
  const n = typeof num === 'number' ? num : Number(num)

  if (isNaN(n)) return num

  return Number(n.toFixed(digits))
}
