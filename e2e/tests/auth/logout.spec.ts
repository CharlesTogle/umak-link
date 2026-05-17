import { expect, test } from '../../fixtures/user.fixture'

const E2E_AUTH_USER_STORAGE_KEY = 'umak-link:e2e-auth-user'
const E2E_AUTH_TOKEN_STORAGE_KEY = 'umak-link:e2e-auth-token'

test.describe('Logout flow', () => {
  test.beforeEach(async ({ authenticateUser, mockNotificationCount }) => {
    await authenticateUser()
    await mockNotificationCount(0)
  })

  test('logout from account routes to auth and account stays guarded', async ({
    page
  }) => {
    await page.goto('/account')
    await expect(page).toHaveURL('/account')
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible()

    await page.getByRole('button', { name: 'Log out' }).click()

    await expect(page).toHaveURL(/\/auth$/)
    await expect(page.getByText('UMak-LINK')).toBeVisible()

    await expect
      .poll(async () => {
        return await page.evaluate(({ userKey, tokenKey }) => ({
          user: window.localStorage.getItem(userKey),
          token: window.localStorage.getItem(tokenKey)
        }), {
          userKey: E2E_AUTH_USER_STORAGE_KEY,
          tokenKey: E2E_AUTH_TOKEN_STORAGE_KEY
        })
      })
      .toEqual({ user: null, token: null })

    const signedOutPage = await page.context().newPage()

    try {
      await signedOutPage.goto('/account')

      await expect(signedOutPage).toHaveURL(/\/auth$/)
      await expect(signedOutPage.getByText('UMak-LINK')).toBeVisible()
      await expect(signedOutPage.getByRole('button', { name: 'Log out' })).toHaveCount(0)
    } finally {
      await signedOutPage.close()
    }
  })
})
