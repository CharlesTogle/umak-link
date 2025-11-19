# File Cache Utilities Documentation

## Overview
The File Cache Utilities provide a universal interface for caching and retrieving images in your Capacitor app. All cached files are stored in the device's data directory using Capacitor's Filesystem API.

## Location
**File:** `src/shared/utils/fileUtils.ts`

## Storage Location

Cached files are stored in the device's private data directory:

- **Android:** `/data/data/[app-id]/files/[folder]/`
- **iOS:** `/Library/Application Support/[folder]/`
- **Web:** IndexedDB/localStorage (not accessible as traditional file path)

## Available Functions

### 1. `getCachedImage(fileName, folder?)`

Retrieves a cached image and returns it as a base64 data URL ready for use in `<img>` tags.

**Parameters:**
- `fileName` (string): Name of the file to retrieve (e.g., `'profilePicture.png'`)
- `folder` (string, optional): Folder path within cache (default: `'cache/images'`)

**Returns:** `Promise<string | null>`
- Data URL format: `data:image/[type];base64,[data]`
- `null` if file not found

**Example:**
```typescript
import { getCachedImage } from '@/shared/utils/fileUtils'

// Get profile picture
const avatarUrl = await getCachedImage('profilePicture.png', 'cache/images')
if (avatarUrl) {
  setImageSrc(avatarUrl) // Use in <img src={imageSrc} />
}

// Get a place photo
const placePhotoUrl = await getCachedImage('place-123.jpg', 'cache/places')
```

---

### 2. `saveCachedImage(imageUrl, fileName, folder?)`

Downloads an image from a URL and saves it to the cache directory.

**Parameters:**
- `imageUrl` (string): URL of the image to download
- `fileName` (string): Name to save the file as (with or without extension)
- `folder` (string, optional): Folder path within cache (default: `'cache/images'`)

**Returns:** `Promise<string | null>`
- Full filename with extension if successful
- `null` if download/save failed

**Features:**
- Automatically detects image format from content-type header
- Creates directories if they don't exist
- Supports: PNG, JPG/JPEG, SVG, WebP, GIF

**Example:**
```typescript
import { saveCachedImage } from '@/shared/utils/fileUtils'

// Save profile picture
const savedFile = await saveCachedImage(
  'https://lh3.googleusercontent.com/a/xyz',
  'profilePicture',
  'cache/images'
)
console.log(savedFile) // 'profilePicture.png'

// Save place photo with custom folder
const placeFile = await saveCachedImage(
  'https://example.com/photo.jpg',
  'place-123',
  'cache/places'
)
console.log(placeFile) // 'place-123.jpg'
```

---

### 3. `cachedFileExists(fileName, folder?)`

Checks if a file exists in the cache.

**Parameters:**
- `fileName` (string): Name of the file to check
- `folder` (string, optional): Folder path within cache (default: `'cache/images'`)

**Returns:** `Promise<boolean>`

**Example:**
```typescript
import { cachedFileExists } from '@/shared/utils/fileUtils'

const exists = await cachedFileExists('profilePicture.png', 'cache/images')
if (exists) {
  console.log('Profile picture is cached!')
}
```

---

### 4. `deleteCachedFile(fileName, folder?)`

Deletes a specific file from the cache.

**Parameters:**
- `fileName` (string): Name of the file to delete
- `folder` (string, optional): Folder path within cache (default: `'cache/images'`)

**Returns:** `Promise<boolean>`
- `true` if deletion successful
- `false` if deletion failed

**Example:**
```typescript
import { deleteCachedFile } from '@/shared/utils/fileUtils'

// Delete old profile picture
const deleted = await deleteCachedFile('old-avatar.png', 'cache/images')

// Clean up place photos
await deleteCachedFile('place-123.jpg', 'cache/places')
```

---

### 5. `listCachedFiles(folder?)`

Lists all files in a cache directory.

**Parameters:**
- `folder` (string, optional): Folder path within cache (default: `'cache/images'`)

**Returns:** `Promise<string[]>`
- Array of filenames
- Empty array if directory doesn't exist

**Example:**
```typescript
import { listCachedFiles } from '@/shared/utils/fileUtils'

const imageFiles = await listCachedFiles('cache/images')
console.log(imageFiles) // ['profilePicture.png', 'avatar-2.jpg']

const placeFiles = await listCachedFiles('cache/places')
console.log(placeFiles) // ['place-123.jpg', 'place-456.png']
```

---

### 6. `clearCachedFolder(folder?)`

Deletes all files in a cache directory.

**Parameters:**
- `folder` (string, optional): Folder path within cache (default: `'cache/images'`)

**Returns:** `Promise<number>`
- Number of files deleted

**Example:**
```typescript
import { clearCachedFolder } from '@/shared/utils/fileUtils'

// Clear all cached images
const deletedCount = await clearCachedFolder('cache/images')
console.log(`Deleted ${deletedCount} files`)

// Clear place photos cache
await clearCachedFolder('cache/places')
```

---

## Common Use Cases

### 1. Caching User Profile Pictures

```typescript
import { saveCachedImage, getCachedImage } from '@/shared/utils/fileUtils'

// On login - save profile picture
const savedFile = await saveCachedImage(
  user.profile_picture_url,
  'profilePicture',
  'cache/images'
)

// On app load - retrieve cached profile picture
const cachedAvatar = await getCachedImage('profilePicture.png', 'cache/images')
if (cachedAvatar) {
  setUserAvatar(cachedAvatar)
}
```

### 2. Caching Place Photos

```typescript
import { saveCachedImage, getCachedImage } from '@/shared/utils/fileUtils'

// Save multiple place photos
for (const place of places) {
  await saveCachedImage(
    place.photo_url,
    `place-${place.id}`,
    'cache/places'
  )
}

// Retrieve a specific place photo
const placePhoto = await getCachedImage(`place-${placeId}.jpg`, 'cache/places')
```

### 3. Offline-First Strategy

```typescript
import { getCachedImage, cachedFileExists, saveCachedImage } from '@/shared/utils/fileUtils'

async function getImage(imageUrl: string, imageId: string) {
  const fileName = `${imageId}.png`
  
  // Try to get from cache first
  const exists = await cachedFileExists(fileName, 'cache/images')
  if (exists) {
    return await getCachedImage(fileName, 'cache/images')
  }
  
  // If not cached, download and save
  await saveCachedImage(imageUrl, imageId, 'cache/images')
  return await getCachedImage(fileName, 'cache/images')
}
```

### 4. Cache Management on Logout

```typescript
import { clearCachedFolder, deleteCachedFile } from '@/shared/utils/fileUtils'

async function handleLogout() {
  // Clear all user-related cached images
  await clearCachedFolder('cache/images')
  
  // Or delete specific files
  await deleteCachedFile('profilePicture.png', 'cache/images')
  
  // Logout logic...
}
```

---

## Supported Image Formats

- **PNG** (.png)
- **JPEG** (.jpg, .jpeg)
- **SVG** (.svg)
- **WebP** (.webp)
- **GIF** (.gif)

The utilities automatically detect the correct MIME type based on the file extension.

---

## Error Handling

All functions handle errors gracefully:
- Return `null` or `false` on failure
- Log errors to console for debugging
- Don't throw exceptions (safe to use without try-catch)

**Example:**
```typescript
const image = await getCachedImage('nonexistent.png')
if (image) {
  // Image found
} else {
  // Image not found - handle gracefully
  console.log('Using default image')
}
```

---

## Integration with Supabase

The file utilities are already integrated with the authentication service:

**File:** `src/features/auth/services/authServices.tsx`

```typescript
import { saveCachedImage } from '@/shared/utils/fileUtils'

// In GetOrRegisterAccount function
if (profile?.profile_picture_url) {
  const savedFileName = await saveCachedImage(
    profile.profile_picture_url,
    'profilePicture',
    'cache/images'
  )
  if (savedFileName) {
    localProfilePicturePath = `cache/images/${savedFileName}`
  }
}
```

---

## Best Practices

1. **Use descriptive folder names:** Organize by feature (e.g., `'cache/places'`, `'cache/users'`)
2. **Include file extensions:** Always specify extensions for clarity
3. **Check existence before downloading:** Avoid unnecessary network requests
4. **Clear cache on logout:** Remove sensitive user data
5. **Handle offline scenarios:** Always provide fallbacks for missing images

---

## Notes

- Files are stored in the app's private data directory (not accessible by other apps)
- Cache persists across app restarts
- On app uninstall, all cached files are deleted
- Web platform uses different storage mechanism (IndexedDB)
- No size limits enforced by utilities (device storage dependent)

---

## Dependencies

- `@capacitor/filesystem` - Required for file operations
- Install with: `npm install @capacitor/filesystem`

---

## Questions or Issues?

For bugs or feature requests, please refer to the project's issue tracker or contact the development team.
