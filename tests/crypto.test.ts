import { expect, test, vi } from 'vitest'
import CryptoJS from 'crypto-js'
import { decrypt, encrypt } from '@/utils/crypto/crypto'
import { createAesCrypto, createIvEncryption } from '@/utils/crypto/cryptoJS'

const key = '0123456789abcdef'
const iv = 'abcdef9876543210'
const text = '活动开始'
// 密文由 Node crypto 的 AES-CBC/PKCS7 独立生成。
const ciphertext = 'h2llyZAIOkLMU9Bdb1t8SA=='

test('两个固定 IV 入口保留相同的密文和文本解密结果', () => {
  const aes = createAesCrypto(key, iv)
  expect(encrypt(text, key, iv)).toBe(ciphertext)
  expect(aes.encrypt(text)).toBe(ciphertext)
  expect(decrypt(ciphertext, key, iv)).toBe(text)
  expect(aes.decrypt(ciphertext)).toBe(text)
})

test('JSON 解密保留对象返回与原始字符串返回的区别', () => {
  const data = { count: 2, label: '活动' }
  const json = '{"count":2,"label":"活动"}'
  const encrypted = 'cRYUecllAy7SJwrUQad/f5BJhHnBLPAjdsRyb/zfFV8='
  const aes = createAesCrypto(key, iv)
  expect(encrypt(json, key, iv)).toBe(encrypted)
  expect(aes.encrypt(data)).toBe(encrypted)
  expect(decrypt<typeof data>(encrypted, key, iv)).toEqual(data)
  expect(aes.decrypt(encrypted)).toBe(json)
})

test('空明文解密分别返回 null 和空字符串', () => {
  const encrypted = 'PqT6TuLOnMLUZCaPHLe5bg=='
  expect(decrypt(encrypted, key, iv)).toBeNull()
  expect(createAesCrypto(key, iv).decrypt(encrypted)).toBe('')
})

test('非法 UTF-8 明文保留 null 返回与向外抛错的区别', () => {
  const encrypted = 'NI0vTSCeCdIJOIUcBKYT/Q=='
  expect(decrypt(encrypted, key, iv)).toBeNull()
  expect(() => createAesCrypto(key, iv).decrypt(encrypted)).toThrow('Malformed UTF-8 data')
})

test.each([
  { size: 16, encrypted: 'qefDySSBxuCXnNwiAYCS0g==' },
  { size: 24, encrypted: 'e/+32iSQY2TUYOuyk41XAQ==' },
  { size: 32, encrypted: 'ekjUJmMX3P6wwiXd9LevfA==' },
])('固定 IV 入口接受 $size 字节 key，保留完整密钥', ({ size, encrypted }) => {
  const aesKey = 'k'.repeat(size)
  const aes = createAesCrypto(aesKey, iv)
  expect(encrypt(text, aesKey, iv)).toBe(encrypted)
  expect(aes.encrypt(text)).toBe(encrypted)
  expect(decrypt(encrypted, aesKey, iv)).toBe(text)
  expect(aes.decrypt(encrypted)).toBe(text)
})

test('校验使用 UTF-8 字节数，接受少于 16 个字符的有效 key 和 IV', () => {
  const utf8Config = '中文测试abcd'
  const aes = createAesCrypto(utf8Config, utf8Config)
  const encrypted = encrypt(text, utf8Config, utf8Config)
  expect(aes.encrypt(text)).toBe(encrypted)
  expect(decrypt(encrypted, utf8Config, utf8Config)).toBe(text)
  expect(aes.decrypt(encrypted)).toBe(text)
})

test.each(['', 'k'.repeat(15), 'k'.repeat(17), 'k'.repeat(33), '中'.repeat(16)])(
  '三个 AES 入口拒绝无效 key，并保留错误字段名：%s',
  (invalidKey) => {
    const expected = new RangeError('AES key 必须是 16、24 或 32 字节')
    for (const action of [
      () => encrypt(text, invalidKey, iv),
      () => decrypt(ciphertext, invalidKey, iv),
      () => createAesCrypto(invalidKey, iv),
    ]) {
      expect(action).toThrow(RangeError)
      expect(action).toThrow(expected)
    }
    expect(() => createIvEncryption(invalidKey)).toThrow(RangeError)
    expect(() => createIvEncryption(invalidKey)).toThrow(new RangeError('AES secretKey 必须是 16、24 或 32 字节'))
  },
)

test.each(['i'.repeat(15), 'i'.repeat(17), '中'.repeat(16)])('固定 IV 入口拒绝无效 IV：%s', (invalidIv) => {
  const expected = new RangeError('AES iv 必须是 16 字节')
  for (const action of [
    () => encrypt(text, key, invalidIv),
    () => decrypt(ciphertext, key, invalidIv),
    () => createAesCrypto(key, invalidIv),
  ]) {
    expect(action).toThrow(RangeError)
    expect(action).toThrow(expected)
  }
})

test('随机 IV 入口保留 IV 前缀、密文格式及缺失 IV 的错误', () => {
  const ivHex = '00112233445566778899aabbccddeeff'
  const random = vi.spyOn(CryptoJS.lib.WordArray, 'random').mockReturnValue(CryptoJS.enc.Hex.parse(ivHex))
  const aes = createIvEncryption(key)
  const encrypted = `${ivHex}D36nUroZurbzbTGZs9aOrQ==`
  expect(aes.encrypt(text)).toBe(encrypted)
  expect(random).toHaveBeenCalledExactlyOnceWith(16)
  expect(aes.decrypt(encrypted)).toBe(text)
  expect(aes.secretKey).toBe(key)
  expect(() => aes.decrypt('missing-iv')).toThrow('密文缺少有效的 IV')
})

test('随机 IV 入口未传 key 时仍生成并返回可用的 secretKey', () => {
  const generated = '00112233445566778899aabbccddeeff'
  vi.spyOn(CryptoJS.lib.WordArray, 'random').mockReturnValue(CryptoJS.enc.Hex.parse(generated))
  const aes = createIvEncryption()
  expect(aes.secretKey).toBe(generated)
  expect(aes.decrypt(aes.encrypt(text))).toBe(text)
})
