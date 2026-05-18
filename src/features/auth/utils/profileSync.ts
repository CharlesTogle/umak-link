import api from '@/shared/lib/api'
import type { UserProfile } from '@/shared/lib/api-types'
import { makeDisplay } from '@/shared/utils/imageUtils'
import { saveCachedBlob } from '@/shared/utils/fileUtils'

export const PROFILE_PICTURE_CACHE_FILE_NAME = 'profilePicture.webp'

interface ProfileSyncFallbacks {
  userName?: string | null
  profilePictureUrl?: string | null
}

function getNonEmptyString (value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function getSessionProfileFallbacks (metadata: unknown): ProfileSyncFallbacks {
  if (typeof metadata !== 'object' || metadata === null) {
    return {}
  }

  const record = metadata as Record<string, unknown>

  return {
    userName:
      getNonEmptyString(record.full_name) ??
      getNonEmptyString(record.name),
    profilePictureUrl:
      getNonEmptyString(record.avatar_url) ??
      getNonEmptyString(record.picture)
  }
}

function mergeProfileFallbacks (
  metadata: unknown,
  explicitFallbacks?: ProfileSyncFallbacks
): Required<ProfileSyncFallbacks> {
  const sessionFallbacks = getSessionProfileFallbacks(metadata)

  return {
    userName:
      getNonEmptyString(sessionFallbacks.userName) ??
      getNonEmptyString(explicitFallbacks?.userName),
    profilePictureUrl:
      getNonEmptyString(sessionFallbacks.profilePictureUrl) ??
      getNonEmptyString(explicitFallbacks?.profilePictureUrl)
  }
}

export function isManagedProfilePictureUrl (value: string | null): boolean {
  if (!value) {
    return false
  }

  return value.includes('/profilePictures/') || value.includes('profilePictures')
}

async function uploadProfilePictureFromRemoteUrl (
  userId: string,
  imageUrl: string
): Promise<string> {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch remote profile image: ${response.status}`)
  }

  const sourceBlob = await response.blob()
  const sourceType = sourceBlob.type || 'image/jpeg'
  const sourceExtension = sourceType.split('/')[1]?.split(';')[0] || 'jpg'
  const sourceFile = new File(
    [sourceBlob],
    `profile.${sourceExtension}`,
    { type: sourceType }
  )

  const displayBlob = await makeDisplay(sourceFile)
  const objectPath = `users/${userId}/${Date.now()}_profile.webp`
  const uploadData = await api.storage.getUploadUrl(
    'profilePictures',
    objectPath,
    'image/webp'
  )

  const uploadRes = await fetch(uploadData.uploadUrl, {
    method: 'PUT',
    body: displayBlob,
    headers: {
      'Content-Type': 'image/webp'
    }
  })

  if (!uploadRes.ok) {
    throw new Error(`Failed to upload profile image: ${uploadRes.status}`)
  }

  await api.storage.confirmUpload('profilePictures', uploadData.objectPath)
  await saveCachedBlob(displayBlob, PROFILE_PICTURE_CACHE_FILE_NAME, 'cache/images')

  return uploadData.publicUrl
}

export async function syncMissingProfileFields (
  profile: UserProfile,
  metadata: unknown,
  explicitFallbacks?: ProfileSyncFallbacks
): Promise<UserProfile> {
  const fallbacks = mergeProfileFallbacks(metadata, explicitFallbacks)
  const currentUserName = getNonEmptyString(profile.user_name)
  const currentProfilePictureUrl = getNonEmptyString(profile.profile_picture_url)
  const updates: {
    user_name?: string | null
    profile_picture_url?: string | null
  } = {}

  if (!currentUserName && fallbacks.userName) {
    updates.user_name = fallbacks.userName
  }

  let resolvedProfilePictureUrl = currentProfilePictureUrl

  if (fallbacks.profilePictureUrl) {
    const shouldUploadManagedProfilePicture =
      !currentProfilePictureUrl ||
      !isManagedProfilePictureUrl(currentProfilePictureUrl)

    if (shouldUploadManagedProfilePicture) {
      try {
        resolvedProfilePictureUrl = await uploadProfilePictureFromRemoteUrl(
          profile.user_id,
          fallbacks.profilePictureUrl
        )
      } catch (error) {
        console.warn('[profileSync] Failed to upload Google profile picture to storage:', error)
        resolvedProfilePictureUrl = currentProfilePictureUrl
      }
    }
  }

  if (
    resolvedProfilePictureUrl &&
    isManagedProfilePictureUrl(resolvedProfilePictureUrl) &&
    resolvedProfilePictureUrl !== currentProfilePictureUrl
  ) {
    updates.profile_picture_url = resolvedProfilePictureUrl
  }

  if (!updates.user_name && !updates.profile_picture_url) {
    return {
      ...profile,
      user_name: currentUserName ?? fallbacks.userName,
      profile_picture_url: resolvedProfilePictureUrl
    }
  }

  try {
    const response = await api.auth.updateProfile(updates)
    return response.user
  } catch (error) {
    console.warn('[profileSync] Failed to sync profile fields from available fallbacks:', error)
    return {
      ...profile,
      user_name: currentUserName ?? fallbacks.userName,
      profile_picture_url: resolvedProfilePictureUrl
    }
  }
}
