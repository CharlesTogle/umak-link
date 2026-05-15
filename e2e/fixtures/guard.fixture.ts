import { test as base } from '../playwright'

const E2E_AUTH_USER_STORAGE_KEY = 'umak-link:e2e-auth-user'
const E2E_AUTH_TOKEN_STORAGE_KEY = 'umak-link:e2e-auth-token'

export const guardUser = {
  user_id: 'guard-001',
  user_name: 'Guard One',
  email: 'guard.one@umak.edu.ph',
  profile_picture_url: null,
  user_type: 'Guard' as const,
  notification_token: null
}

type GuardFixtures = {
  authenticateGuard: () => Promise<void>
  mockNotificationCount: (count?: number) => Promise<void>
  mockGuardScanSuccess: () => Promise<void>
  mockGuardCameraScanSuccess: () => Promise<void>
  mockGuardDecisionSuccess: (decision: 'accepted' | 'rejected') => Promise<void>
}

export const test = base.extend<GuardFixtures>({
  authenticateGuard: async ({ page }, applyFixture) => {
    await applyFixture(async () => {
      await page.addInitScript(
        ({ user, token, userKey, tokenKey }) => {
          window.localStorage.setItem(userKey, JSON.stringify(user))
          window.localStorage.setItem(tokenKey, token)
        },
        {
          user: guardUser,
          token: 'e2e-guard-token',
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

  mockGuardScanSuccess: async ({ page }, applyFixture) => {
    await applyFixture(async () => {
      await page.route('**/guard/custody/scan', async route => {
        const body = route.request().postDataJSON() as
          | {
            manual_entry_code: string
          }
          | {
            qr_code_session_id: string
            session_token: string
          }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            qr_code_session_id:
              'qr_code_session_id' in body ? body.qr_code_session_id : 'qr-session-001',
            custody_attempt_id: 'attempt-001',
            post_id: 123,
            item_id: 'item-001',
            item_name: 'Black Wallet',
            item_description: 'A black leather wallet with school ID and folded receipts.',
            item_image_url: 'https://example.com/item.jpg',
            handover_image_url: 'https://example.com/handover.jpg',
            category: 'Accessories',
            last_seen_at: '2026-05-14T06:00:00.000Z',
            last_seen_location: 'Main Gate',
            submission_date: '2026-05-14T07:30:00.000Z',
            guard_post_id: 'guard-post-001',
            guard_post_name: 'Main Gate',
            attempt_number: 1,
            custody_status: 'handover_in_progress',
            qr_status: 'active',
            attempt_status: 'open'
          })
        })
      })
    })
  },

  mockGuardCameraScanSuccess: async ({ page }, applyFixture) => {
    await applyFixture(async () => {
      await page.addInitScript(
        ({ payload }) => {
          window.__UMAK_LINK_E2E_GUARD_QR_PAYLOAD = payload
        },
        {
          payload: {
            qr_code_session_id: 'qr-session-001',
            session_token: 'plain-session-token'
          }
        }
      )
    })
  },

  mockGuardDecisionSuccess: async ({ page }, applyFixture) => {
    await applyFixture(async decision => {
      await page.route('**/guard/custody/attempts/*/decision', async route => {
        const body = route.request().postDataJSON() as {
          qr_code_session_id: string
          decision: 'accepted' | 'rejected'
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            custody_attempt_id: 'attempt-001',
            qr_code_session_id: body.qr_code_session_id,
            attempt_status: decision,
            qr_status: decision,
            custody_status: decision === 'accepted' ? 'with_guard' : 'with_reporter',
            decision_at: '2026-05-14T08:10:00.000Z'
          })
        })
      })
    })
  }
})

export { expect } from '../playwright'
