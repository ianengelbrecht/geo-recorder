/**
 * 
 * @param coordsString A valid decimal coordinates string
 * @returns A QDS grid reference for Africa south of the equator only, otherwise null
 */
export function coordsToQDS(coordsString: string): string | null {

  if (!coordsString || !coordsString.trim()) {
    throw new Error('empty coordinates for calculating grid')
  }

  //validate using our coordinates factory, it will just throw if there's a problem
  // makeCoordinates({
  //   verbatimCoordinates: coordsString,
  //   decimalCoordinates: coordsString
  // })

  const parts: number[] = coordsString.split(',').map(x => Number(x))

  //QDS are only valid in southern Africa, but we'll be liberal and allow south of the equator
  if (parts[0] > 0.0 || parts[1] < 8.6 || parts[1] > 42.8) {
    return null
  }

  const cleanedStringParts: string[] = parts.map(x => x.toString().trim().replace('-', ''))

  let qds = cleanedStringParts.map(x => x.split('.')[0].toString().padStart(2, '0')).join('')
  let latDecimalPart = (Number(cleanedStringParts[0]) - Number(cleanedStringParts[0].split('.')[0])) * 100
  let longDecimalPart = (Number(cleanedStringParts[1]) - Number(cleanedStringParts[1].split('.')[0])) * 100
  const row = latDecimalPart < 50 ? 'AB' : 'CD'
  const first = longDecimalPart < 50 ? row[0] : row[1]

  if (latDecimalPart >= 50) {
    latDecimalPart -= 50
  }

  if (longDecimalPart >= 50) {
    longDecimalPart -= 50
  }

  const row2 = latDecimalPart < 25 ? 'AB' : 'CD'
  const second = longDecimalPart < 25 ? row2[0] : row2[1]

  qds += first + second
  return qds
}