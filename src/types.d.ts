export type record = {
  timestamp: number,
  latitude: number,
  longitude: number,
  accuracy: number
}

export type settings = {
  format: 'DD' | 'DM' | 'DMS',
  ddAsString: boolean,
  removeSpaces: boolean,
  includeGrid: string,
  includeDatum: boolean
}
