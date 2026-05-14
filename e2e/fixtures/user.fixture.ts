import { test as base } from '../playwright'

const E2E_AUTH_USER_STORAGE_KEY = 'umak-link:e2e-auth-user'
const E2E_AUTH_TOKEN_STORAGE_KEY = 'umak-link:e2e-auth-token'

const user = {
  user_id: 'user-001',
  user_name: 'Student One',
  email: 'student.one@umak.edu.ph',
  profile_picture_url: null,
  user_type: 'User' as const,
  notification_token: null
}

type UserFixtures = {
  authenticateUser: () => Promise<void>
  mockNotificationCount: (count?: number) => Promise<void>
  mockFoundHistoryPost: () => Promise<void>
  mockGuardPosts: () => Promise<void>
  mockStorageUpload: () => Promise<void>
}

export const test = base.extend<UserFixtures>({
  authenticateUser: async ({ page }, applyFixture) => {
    await applyFixture(async () => {
      await page.addInitScript(
        ({ authUser, token, userKey, tokenKey }) => {
          window.localStorage.setItem(userKey, JSON.stringify(authUser))
          window.localStorage.setItem(tokenKey, token)
        },
        {
          authUser: user,
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

  mockFoundHistoryPost: async ({ page }, applyFixture) => {
    await applyFixture(async () => {
      await page.route(/\/posts\?.*type=own.*/, async route => {
        const url = new URL(route.request().url())
        const excludedIds = url.searchParams.get('exclude_ids')?.split(',') ?? []

        const posts = excludedIds.includes('123')
          ? []
          : [
              {
                post_id: '123',
                item_id: 'item-123',
                poster_name: 'Student One',
                poster_id: 'user-001',
                item_name: 'Blue Umbrella',
                item_description: 'Navy blue folding umbrella with a wooden handle.',
                item_type: 'found',
                item_image_url: 'https://example.com/item-123.jpg',
                category: 'Accessories',
                last_seen_at: '2026-05-14T07:00:00.000Z',
                last_seen_location: 'Main Gate',
                submission_date: '2026-05-14T07:30:00.000Z',
                post_status: 'accepted',
                item_status: 'unclaimed',
                custody_status: 'with_reporter',
                accepted_by_staff_name: 'Staff One',
                accepted_by_staff_email: 'staff.one@umak.edu.ph',
                claim_id: null,
                claimed_by_name: null,
                claimed_by_email: null,
                claim_processed_by_staff_id: null,
                accepted_on_date: '2026-05-14T08:00:00.000Z',
                is_anonymous: false
              }
            ]

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            posts,
            count: posts.length
          })
        })
      })

      await page.route('**/posts/123/full', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            post_id: 123,
            item_id: 'item-123',
            poster_name: 'Student One',
            poster_id: 'user-001',
            item_name: 'Blue Umbrella',
            item_description: 'Navy blue folding umbrella with a wooden handle.',
            item_type: 'found',
            item_image_url: 'https://example.com/item-123.jpg',
            category: 'Accessories',
            last_seen_at: '2026-05-14T07:00:00.000Z',
            last_seen_location: 'Main Gate',
            submission_date: '2026-05-14T07:30:00.000Z',
            post_status: 'accepted',
            item_status: 'unclaimed',
            custody_status: 'with_reporter',
            accepted_by_staff_name: 'Staff One',
            accepted_by_staff_email: 'staff.one@umak.edu.ph',
            claim_id: null,
            claimed_by_name: null,
            claimed_by_email: null,
            claim_processed_by_staff_id: null,
            accepted_on_date: '2026-05-14T08:00:00.000Z',
            is_anonymous: false,
            linked_lost_item_id: null,
            returned_at_local: null
          })
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
            uploadUrl: 'https://e2e.local/upload/custody-handover.webp',
            objectPath: 'custody/custody-handover.webp',
            publicUrl: 'https://example.com/custody-handover.webp'
          })
        })
      })

      await page.route('https://e2e.local/upload/**', async route => {
        await route.fulfill({
          status: 200,
          body: ''
        })
      })

      await page.route('**/storage/confirm-upload', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            publicUrl: 'https://example.com/custody-handover.webp'
          })
        })
      })
    })
  }
})

export { expect } from '../playwright'
