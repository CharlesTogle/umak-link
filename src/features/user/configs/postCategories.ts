/**
 * Post Categories Configuration
 * Each category has a type and associated icon (optional)
 */

export interface CategoryConfig {
  type: string
  icon?: string // Optional: can add ionicons icon names later
}

export const POST_CATEGORIES: CategoryConfig[] = [
  { type: 'Electronics' },
  { type: 'Accessories' },
  { type: 'Documents' },
  { type: 'Books & Notebooks' },
  { type: 'Bags' },
  { type: 'Wallets & Cards' },
  { type: 'Keys' },
  { type: 'Clothing' },
  { type: 'Eyewear' },
  { type: 'School Supplies' },
  { type: 'Sports Equipment' },
  { type: 'Water Bottles' },
  { type: 'Umbrellas' },
  { type: 'Medical Items' },
  { type: 'Other' }
]

/**
 * Helper function to get all category types as string array
 * Useful for form dropdowns and validation
 * @returns Array of category type strings
 */
export function getCategoryTypes (): string[] {
  return POST_CATEGORIES.map(cat => cat.type)
}

/**
 * Helper function to check if a category type is valid
 * @param type - The category type to validate
 * @returns True if valid, false otherwise
 */
export function isValidCategory (type: string): boolean {
  return POST_CATEGORIES.some(cat => cat.type === type)
}

/**
 * Helper function to get category config by type
 * @param type - The category type
 * @returns Category config or undefined
 */
export function getCategoryConfig (type: string): CategoryConfig | undefined {
  return POST_CATEGORIES.find(cat => cat.type === type)
}
