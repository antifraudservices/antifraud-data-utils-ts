const BASE58BTC_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

/** Decodes the explicit multibase base58btc envelope, preserving leading zeroes. */
export function decodeBase58btc(encoded: string): Uint8Array {
  if (typeof encoded !== 'string' || !encoded.startsWith('z')) {
    throw new TypeError('base58btc_prefix_required')
  }
  const digits = encoded.slice(1)
  let value = 0n
  for (const digit of digits) {
    const index = BASE58BTC_ALPHABET.indexOf(digit)
    if (index < 0) throw new TypeError('base58btc_character_invalid')
    value = value * 58n + BigInt(index)
  }
  const bytes: number[] = []
  while (value > 0n) {
    bytes.push(Number(value & 255n))
    value >>= 8n
  }
  bytes.reverse()
  let leadingZeroes = 0
  while (digits[leadingZeroes] === '1') leadingZeroes++
  return Uint8Array.from([...new Uint8Array(leadingZeroes), ...bytes])
}

/** Internal multibase encoder shared by evidence, attachments and actor hashes. */
export function encodeBase58btc(bytes: Uint8Array): string {
  let value = 0n
  for (const byte of bytes) value = (value << 8n) | BigInt(byte)

  let encoded = ''
  while (value > 0n) {
    encoded = BASE58BTC_ALPHABET[Number(value % 58n)] + encoded
    value /= 58n
  }
  for (const byte of bytes) {
    if (byte !== 0) break
    encoded = `1${encoded}`
  }
  return `z${encoded}`
}
