export function useAuditLogsFilterOptions (
  actionTypes: string[],
  userNames: string[]
) {
  const getFilterOptions = () => {
    return [
      {
        categoryName: 'Action Type',
        options: actionTypes.map(type => ({
          value: `action:${type}`,
          label: formatActionType(type)
        }))
      },
      {
        categoryName: 'User Names',
        options: userNames.map(name => ({
          value: `user:${name}`,
          label: name || 'Unknown'
        }))
      }
    ]
  }

  const getSortOptions = () => {
    return [
      { value: 'newest', label: 'Newest First' },
      { value: 'oldest', label: 'Oldest First' }
    ]
  }

  return {
    getFilterOptions,
    getSortOptions
  }
}

function formatActionType (actionType: string | null) {
  if (!actionType) return 'Unknown Action'
  return actionType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
