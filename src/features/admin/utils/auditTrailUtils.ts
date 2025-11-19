
export function formatActionType (actionType: string | null): string {
  if (!actionType) return 'Unknown Action'
  // Convert snake_case to Title Case
  return actionType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function getUniqueActionTypes (
  logs: any[]
): Array<{ label: string; value: string }> {
  const types = new Set(logs.map(log => log.action_type).filter(Boolean))
  return Array.from(types).map(type => ({
    label: formatActionType(type),
    value: type
  }))
}

export function getUniqueUserNames (
  logs: any[]
): Array<{ label: string; value: string }> {
  const names = new Set(logs.map(log => log.user_name).filter(Boolean))
  return Array.from(names).map(name => ({
    label: name || 'Unknown',
    value: name || ''
  }))
}
