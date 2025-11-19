export const parseReasonForReporting = (text: string) => {
  const parts = text.split('\n\n ')
  let reason = 'No reason provided'
  let details = ''

  for (const part of parts) {
    if (part.startsWith('Reason for reporting: ')) {
      reason = part.replace('Reason for reporting: ', '').trim()
    } else if (part.startsWith('Additional details: ')) {
      details = part.replace('Additional details: ', '').trim()
    }
  }

  return { reason, details }
}
