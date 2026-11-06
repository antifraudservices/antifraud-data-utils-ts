/** Decimal-pair encoding used by compact JWS QR transports. */
export function encodeNumericQrValue(value: string, errorCode: string): string {
  return [...value].map(character => {
    const encoded = character.charCodeAt(0) - 45
    if (encoded < 0 || encoded > 99) throw new TypeError(errorCode)
    return encoded.toString().padStart(2, '0')
  }).join('')
}

export function decodeNumericQrValue(value: string, errorCode: string): string {
  if (!value || value.length % 2 || !/^\d+$/u.test(value)) throw new TypeError(errorCode)
  let result = ''
  for (let index = 0; index < value.length; index += 2) {
    const pair = Number(value.slice(index, index + 2))
    if (pair > 77) throw new TypeError(errorCode)
    result += String.fromCharCode(pair + 45)
  }
  return result
}
