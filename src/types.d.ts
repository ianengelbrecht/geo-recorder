export type record = {
  timestamp: number,
  latitude: number,
  longitude: number,
  accuracy: number
}

export type settings = {
  format: 'DD' | 'DM' | 'DMS',
  removeSpaces: boolean,
  includeGrid: string,
  includeDatum: boolean
}
