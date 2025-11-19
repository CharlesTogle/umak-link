import { Filesystem, Directory } from '@capacitor/filesystem'

/**
 * Retrieves a cached image from the specified directory
 * @param fileName - The name of the file to retrieve (e.g., 'profilePicture.png')
 * @param folder - The folder path within cache (default: 'cache/images')
 * @returns Base64 encoded image data with data URL prefix, or null if not found
 */
export async function getCachedImage (
  fileName: string,
  folder: string = 'cache/images'
): Promise<string | null> {
  try {
    const result = await Filesystem.readFile({
      path: `${folder}/${fileName}`,
      directory: Directory.Data
    })

    // The data is already base64, add the appropriate prefix
    const extension = fileName.split('.').pop()?.toLowerCase()
    let mimeType = 'image/png' // default

    if (extension === 'jpg' || extension === 'jpeg') {
      mimeType = 'image/jpeg'
    } else if (extension === 'svg') {
      mimeType = 'image/svg+xml'
    } else if (extension === 'png') {
      mimeType = 'image/png'
    } else if (extension === 'webp') {
      mimeType = 'image/webp'
    } else if (extension === 'gif') {
      mimeType = 'image/gif'
    }

    // Return data URL format for direct use in img src
    return `data:${mimeType};base64,${result.data}`
  } catch (error) {
    console.error(`Error retrieving cached image ${fileName}:`, error)
    return null
  }
}

/**
 * Saves an image to the cache directory
 * @param imageUrl - The URL of the image to download and save
 * @param fileName - The name to save the file as
 * @param folder - The folder path within cache (default: 'cache/images')
 * @returns The saved file name with extension, or null if failed
 */
export async function saveCachedImage (
  imageUrl: string,
  fileName: string,
  folder: string = 'cache/images'
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      console.error('Failed to fetch image:', response.statusText)
      return null
    }

    const blob = await response.blob()

    // Determine file extension from content type or provided fileName
    const contentType = response.headers.get('content-type')
    let extension = fileName.split('.').pop() || 'png'

    // Override extension if content type suggests different format
    if (!fileName.includes('.')) {
      if (contentType?.includes('svg')) {
        extension = 'svg'
      } else if (
        contentType?.includes('jpeg') ||
        contentType?.includes('jpg')
      ) {
        extension = 'jpg'
      } else if (contentType?.includes('png')) {
        extension = 'png'
      } else if (contentType?.includes('webp')) {
        extension = 'webp'
      } else if (contentType?.includes('gif')) {
        extension = 'gif'
      }
    }

    // Convert blob to base64
    const reader = new FileReader()
    const base64Data = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })

    // Ensure the directory exists
    try {
      await Filesystem.mkdir({
        path: folder,
        directory: Directory.Data,
        recursive: true
      })
    } catch (mkdirError) {
      console.log('Directory creation info:', mkdirError)
    }

    // Create full filename with extension if not provided
    const fullFileName = fileName.includes('.')
      ? fileName
      : `${fileName}.${extension}`

    await Filesystem.writeFile({
      path: `${folder}/${fullFileName}`,
      data: base64Data,
      directory: Directory.Data
    })

    return fullFileName
  } catch (error) {
    console.error('Error saving cached image:', error)
    return null
  }
}

/**
 * Checks if a cached file exists
 * @param fileName - The name of the file to check
 * @param folder - The folder path within cache (default: 'cache/images')
 * @returns True if the file exists, false otherwise
 */
export async function cachedFileExists (
  fileName: string,
  folder: string = 'cache/images'
): Promise<boolean> {
  try {
    await Filesystem.stat({
      path: `${folder}/${fileName}`,
      directory: Directory.Data
    })
    return true
  } catch {
    return false
  }
}

/**
 * Deletes a cached file
 * @param fileName - The name of the file to delete
 * @param folder - The folder path within cache (default: 'cache/images')
 * @returns True if deletion was successful, false otherwise
 */
export async function deleteCachedFile (
  fileName: string,
  folder: string = 'cache/images'
): Promise<boolean> {
  try {
    await Filesystem.deleteFile({
      path: `${folder}/${fileName}`,
      directory: Directory.Data
    })
    console.log(`Cached file ${fileName} deleted successfully`)
    return true
  } catch (error) {
    console.error('Error deleting cached file:', error)
    return false
  }
}

/**
 * Lists all files in a cache directory
 * @param folder - The folder path within cache (default: 'cache/images')
 * @returns Array of file names, or empty array if directory doesn't exist
 */
export async function listCachedFiles (
  folder: string = 'cache/images'
): Promise<string[]> {
  try {
    const result = await Filesystem.readdir({
      path: folder,
      directory: Directory.Data
    })
    return result.files.map(file => file.name)
  } catch (error) {
    console.error(`Error listing cached files in ${folder}:`, error)
    return []
  }
}

/**
 * Clears all files in a cache directory
 * @param folder - The folder path within cache (default: 'cache/images')
 * @returns Number of files deleted
 */
export async function clearCachedFolder (
  folder: string = 'cache/images'
): Promise<number> {
  try {
    const files = await listCachedFiles(folder)
    let deletedCount = 0

    for (const file of files) {
      const deleted = await deleteCachedFile(file, folder)
      if (deleted) deletedCount++
    }

    console.log(`Cleared ${deletedCount} files from ${folder}`)
    return deletedCount
  } catch (error) {
    console.error(`Error clearing cached folder ${folder}:`, error)
    return 0
  }
}
