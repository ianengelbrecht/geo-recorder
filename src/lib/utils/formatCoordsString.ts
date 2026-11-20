import { convert } from 'geo-coordinates-parser'
import type { settings } from '../../types'
import { coordsToQDS } from './coordsToQDS'
import { getCurrentDateTime } from './getCurrentDate'


export const formatCoordsString = (latitude: number, longitude: number, accuracy: number, settings: settings, coordsOnly: boolean) => {
  let coordsString = ''
  if (settings.format === 'DD') {
    coordsString = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`

    if (settings.ddAsString) {

      if (coordsString.startsWith('-')) {
        coordsString = `S${coordsString.slice(1)}`
      } else {
        coordsString = `N${coordsString}`
      }

      if (coordsString.includes(', -')) {
        coordsString = coordsString.replace(', -', '°, W')
      } else {
        coordsString = coordsString.replace(', ', '°, E')
      }

      coordsString += '°'
    }
  }
  else if (settings.format === 'DM') {
    coordsString = convert(`${latitude}, ${longitude}`).toCoordinateFormat(convert.to.DM)
  }
  else if (settings.format === 'DMS') {
    coordsString = convert(`${latitude}, ${longitude}`).toCoordinateFormat(convert.to.DMS)
  }

  if (settings.removeSpaces) {
    coordsString = coordsString.replace(/\s+/g, '')
  }

  if (!coordsOnly) {
    if (settings.useAccuracyPlaceholder) {
      coordsString += ` ± ____\u2060m` // Placeholder and invisible character for proper breaking
    }
    else {
      coordsString += ` ± ${Math.round(accuracy)}m`
    }

    if (settings.includeDatum) {
      coordsString += ' WGS84'
    }

    if (settings.includeGrid) {
      coordsString += ` ${coordsToQDS(`${latitude}, ${longitude}`)}`
    }
  }

  if (settings.includeDate && !coordsOnly) {
    const dateNow = getCurrentDateTime(settings.useSlashesNotDashes, settings.includeTime)
    coordsString += `\n${dateNow}`
  }

  return coordsString
}