const BASE58BTC_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

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
