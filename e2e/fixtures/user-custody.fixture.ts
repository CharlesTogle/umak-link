import { test as base } from '../playwright'
import type {
  CustodySessionStatusResponse,
  PostRecord,
  PostRecordDetails,
  StudentCustodyHistoryResponse
} from '@/shared/lib/api-types'

const E2E_AUTH_USER_STORAGE_KEY = 'umak-link:e2e-auth-user'
const E2E_AUTH_TOKEN_STORAGE_KEY = 'umak-link:e2e-auth-token'

export const userAccount = {
  user_id: 'user-001',
  user_name: 'Poster One',
  email: 'poster.one@umak.edu.ph',
  profile_picture_url: null,
  user_type: 'User' as const,
  notification_token: null
}

const eligiblePost: PostRecord = {
  post_id: 123,
  item_id: 'item-123',
  poster_name: 'Poster One',
  poster_id: userAccount.user_id,
  item_name: 'Black Wallet',
  item_description: 'A black leather wallet with school ID and folded receipts.',
  item_type: 'found',
  item_image_url: 'https://example.com/item.jpg',
  category: 'Accessories',
  last_seen_at: '2026-05-14T06:00:00.000Z',
  last_seen_location: 'Main Gate',
  submission_date: '2026-05-14T07:30:00.000Z',
  post_status: 'accepted',
  item_status: 'unclaimed',
  accepted_by_staff_name: null,
  accepted_by_staff_email: null,
  claim_id: null,
  claimed_by_name: null,
  claimed_by_email: null,
  claim_processed_by_staff_id: null,
  accepted_on_date: '2026-05-14T07:45:00.000Z',
  is_anonymous: false,
  custody_status: 'with_reporter'
}

const eligiblePostFull: PostRecordDetails = {
  ...eligiblePost,
  linked_lost_item_id: null,
  returned_at_local: null
}

const initialHistory: StudentCustodyHistoryResponse = {
  post_id: 123,
  item_id: 'item-123',
  post_status: 'accepted',
  custody_status: 'with_reporter',
  history: [
    {
      history_id: 'reported-123',
      event_type: 'item_reported',
      source_record_type: null,
      message: 'Item reported in Umak Link',
      occurred_at: '2026-05-14T07:30:00.000Z',
      custody_attempt_id: null,
      qr_code_session_id: null,
      attempt_number: null,
      guard_post_id: null,
      guard_post_name: null,
      full_location_name: null,
      handover_image_url: null,
      actor_user_id: userAccount.user_id,
      actor_name: 'Poster One'
    }
  ]
}

const baseSessionStatus: CustodySessionStatusResponse = {
  qr_code_session_id: 'qr-session-001',
  custody_attempt_id: 'attempt-001',
  post_id: 123,
  item_id: 'item-123',
  qr_status: 'active',
  attempt_status: 'open',
  custody_status: 'handover_in_progress',
  expires_at: '2026-05-14T08:00:00.000Z',
  scanned_at: null,
  decision_at: null,
  current_window_expired: false,
  can_retry: false,
  number_of_attempts: 1,
  max_number_of_attempts: 5,
  retries_remaining: 4
}

type UserCustodyFixtures = {
  authenticateUser: () => Promise<void>
  mockNotificationCount: (count?: number) => Promise<void>
  mockOwnHistoryPosts: (posts?: PostRecord[]) => Promise<void>
  mockPostDetails: () => Promise<void>
  mockGuardPosts: () => Promise<void>
  mockStorageUpload: () => Promise<void>
  mockCreateCustodyAttempt: () => Promise<void>
  mockCustodyHistorySequence: (
    histories: StudentCustodyHistoryResponse[]
  ) => Promise<void>
  mockCustodySessionStatusSequence: (
    statuses: Partial<CustodySessionStatusResponse>[]
  ) => Promise<void>
  mockCancelCustodySession: () => Promise<void>
}

export const test = base.extend<UserCustodyFixtures>({
  authenticateUser: async ({ page }, applyFixture) => {
    await applyFixture(async () => {
      await page.addInitScript(
        ({ token, user, tokenKey, userKey }) => {
          window.localStorage.setItem(userKey, JSON.stringify(user))
          window.localStorage.setItem(tokenKey, token)
        },
        {
          user: userAccount,
          token: 'e2e-user-token',
          userKey: E2E_AUTH_USER_STORAGE_KEY,
          tokenKey: E2E_AUTH_TOKEN_STORAGE_KEY
        }
      )
    })
  },

  mockNotificationCount: async ({ page }, applyFixture) => {
    await applyFixture(async (count = 0) => {
      await page.route('**/notifications/count', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ unread_count: count })
        })
      })
    })
  },

  mockOwnHistoryPosts: async ({ page }, applyFixture) => {
    await applyFixture(async (posts = [eligiblePost]) => {
      await page.route('**/posts?**', async route => {
        const requestUrl = new URL(route.request().url())
        if (requestUrl.pathname !== '/posts') {
          await route.fallback()
          return
        }

        const type = requestUrl.searchParams.get('type')
        if (type !== 'own') {
          await route.fallback()
          return
        }

        const excludeIds =
          requestUrl.searchParams.get('exclude_ids')?.split(',').filter(Boolean) ?? []
        const filteredPosts = posts.filter(
          post => !excludeIds.includes(String(post.post_id))
        )

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            posts: filteredPosts,
            count: posts.length
          })
        })
      })
    })
  },

  mockPostDetails: async ({ page }, applyFixture) => {
    await applyFixture(async () => {
      await page.route('**/posts/123', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(eligiblePost)
        })
      })

      await page.route('**/posts/123/full', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(eligiblePostFull)
        })
      })
    })
  },

  mockGuardPosts: async ({ page }, applyFixture) => {
    await applyFixture(async () => {
      await page.route('**/custody/guard-posts', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            guard_posts: [
              {
                guard_post_id: 'guard-post-001',
                guard_post_name: 'Main Gate',
                location_id: 1,
                full_location_name: 'Main Gate',
                is_active: true
              }
            ]
          })
        })
      })
    })
  },

  mockStorageUpload: async ({ page }, applyFixture) => {
    await applyFixture(async () => {
      await page.route('**/storage/upload-url', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            uploadUrl: 'https://example.com/storage/custody-upload',
            objectPath: 'custody/123/upload.webp',
            publicUrl: 'https://example.com/storage/custody-upload.webp'
          })
        })
      })

      await page.route('https://example.com/storage/custody-upload', async route => {
        await route.fulfill({ status: 200, body: '' })
      })

      await page.route('**/storage/confirm-upload', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            publicUrl: 'https://example.com/storage/custody-upload.webp'
          })
        })
      })
    })
  },

  mockCreateCustodyAttempt: async ({ page }, applyFixture) => {
    await applyFixture(async () => {
      await page.route('**/custody/attempts', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            custody_attempt_id: 'attempt-001',
            qr_code_session_id: 'qr-session-001',
            attempt_status: 'open',
            qr_status: 'active',
            custody_status: 'handover_in_progress',
            expires_at: '2026-05-14T08:00:00.000Z',
            number_of_attempts: 1,
            max_number_of_attempts: 5,
            retries_remaining: 4
          })
        })
      })
    })
  },

  mockCustodyHistorySequence: async ({ page }, applyFixture) => {
    await applyFixture(async histories => {
      let requestCount = 0

      await page.route('**/custody/posts/123/history', async route => {
        const response =
          histories[Math.min(requestCount, histories.length - 1)] ?? initialHistory
        requestCount += 1

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(response)
        })
      })
    })
  },

  mockCustodySessionStatusSequence: async ({ page }, applyFixture) => {
    await applyFixture(async statuses => {
      let requestCount = 0

      await page.route('**/custody/sessions/qr-session-001/status', async route => {
        const nextStatus = statuses[Math.min(requestCount, statuses.length - 1)] ?? {}
        requestCount += 1

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...baseSessionStatus,
            ...nextStatus
          })
        })
      })
    })
  },

  mockCancelCustodySession: async ({ page }, applyFixture) => {
    await applyFixture(async () => {
      await page.route('**/custody/sessions/qr-session-001/cancel', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            qr_code_session_id: 'qr-session-001',
            custody_attempt_id: 'attempt-001',
            attempt_status: 'cancelled',
            qr_status: 'cancelled',
            custody_status: 'with_reporter',
            cancelled_at: '2026-05-14T08:03:00.000Z'
          })
        })
      })
    })
  }
})

export { expect } from '../playwright'
