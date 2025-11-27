/**
 * Get current time in Philippine timezone (UTC+8)
 */
export function getPhilippineTime (): Date {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  return new Date(utc + 8 * 3600000)
}

/**
 * Initialize date/time state for Philippine timezone
 * Returns formatted date, time (12-hour), and meridian (AM/PM)
 */
export function initializeDateTimeState () {
  const ph = getPhilippineTime()
  let hh = ph.getHours()
  const mm = ph.getMinutes().toString().padStart(2, '0')
  const meridian = hh >= 12 ? 'PM' : 'AM'
  hh = hh % 12 || 12

  return {
    date: ph.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    }),
    time: `${hh}:${mm}`,
    meridian: meridian as 'AM' | 'PM'
  }
}

/**
 * Convert date, time, and meridian to ISO 8601 format with Philippine timezone (+08:00)
 */
export function toISODate (
  date: string,
  time: string,
  meridian: 'AM' | 'PM'
): string {
  const [month, day, year] = date.split('/')
  let [hours, minutes] = time.split(':').map(Number)
  if (meridian === 'PM' && hours < 12) hours += 12
  if (meridian === 'AM' && hours === 12) hours = 0
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${String(
    hours
  ).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+08:00`
}

/**
 * Get the maximum datetime in ISO format for Philippine timezone
 * This converts Philippine time to UTC so IonDatetime can use it as max value
 */
export function getPhilippineTimeISO (): string {
  const ph = getPhilippineTime()
  const year = ph.getFullYear()
  const month = String(ph.getMonth() + 1).padStart(2, '0')
  const day = String(ph.getDate()).padStart(2, '0')
  const hours = String(ph.getHours()).padStart(2, '0')
  const minutes = String(ph.getMinutes()).padStart(2, '0')
  const seconds = String(ph.getSeconds()).padStart(2, '0')

  // Return in ISO format with Philippine timezone offset
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+08:00`
}
