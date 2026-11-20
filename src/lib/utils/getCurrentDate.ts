export function getCurrentDateTime(useSlashesNotDashes: boolean, includeTime: boolean) {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')

  const separator = useSlashesNotDashes ? '/' : '-'

  let dateNow = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate())
  ].join(separator)

  if (includeTime) {
    dateNow += ` ${pad(now.getHours())}:${pad(now.getMinutes())}`
  }

  return dateNow
}