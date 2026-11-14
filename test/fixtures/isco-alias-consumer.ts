// Flow contract: an unknown identifier remains a usable string after an unsuccessful alias check.
import { isIsco08CodingSystem } from 'antifraud-data-utils-ts/isco-08'
export function preserveUnknownSystem(value: string): string {
  if (isIsco08CodingSystem(value)) return 'ISCO-08'
  return value.trim()
}
