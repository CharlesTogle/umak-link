import { expect, test } from '../../fixtures/guard.fixture'

test.describe('Guard notifications', () => {
  const caughtUpMessage = "You're all caught up."

  test.beforeEach(async ({
    authenticateGuard,
    mockNotificationCount
  }) => {
    await authenticateGuard()
    await mockNotificationCount(1)
  })

  test('guard notification items can follow direct routes and keep UUID ids', async ({
    page
  }) => {
    const notificationId = '11111111-2222-4333-8444-555555555555'
    const markAsReadPaths: string[] = []

    await page.route('**/notifications', async route => {
      if (route.request().resourceType() === 'document') {
        await route.continue()
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          notifications: [
            {
              notification_id: notificationId,
              user_id: 'guard-001',
              title: 'Custody Follow-up Needed',
              body: 'Review the accepted custody handover and coordinate delivery.',
              description:
                'Review the accepted custody handover and coordinate delivery.',
              sent_to: 'guard-001',
              sent_by: 'staff-001',
              type: 'custody_guard_follow_up',
              data: {
                url: '/guard/settings'
              },
              is_read: false,
              created_at: '2026-05-14T08:00:00.000Z',
              image_url: null
            }
          ]
        })
      })
    })

    await page.route('**/notifications/*/read', async route => {
      markAsReadPaths.push(new URL(route.request().url()).pathname)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    await page.goto('/guard/notifications')

    await expect(page.getByText('Custody Follow-up Needed')).toBeVisible()
    await page.getByText('Custody Follow-up Needed').click()

    await expect(page).toHaveURL('/guard/settings')
    await expect
      .poll(() => markAsReadPaths[0])
      .toContain(`/notifications/${notificationId}/read`)
  })

  test('guard can revisit settings and notifications after opening home and scan', async ({
    page
  }) => {
    await page.route('**/notifications', async route => {
      if (route.request().resourceType() === 'document') {
        await route.continue()
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          notifications: []
        })
      })
    })

    await page.goto('/guard/settings')
    await expect(page).toHaveURL('/guard/settings')
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    await page.getByRole('tab', { name: 'Home' }).click()
    await expect(page).toHaveURL('/guard/home')
    await expect(page.getByTestId('guard-home-page')).toBeVisible()

    await page.getByRole('tab', { name: 'Settings' }).click()
    await expect(page).toHaveURL('/guard/settings')
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    await page.getByRole('tab', { name: 'Notifications' }).click()
    await expect(page).toHaveURL('/guard/notifications')
    await expect(page.getByText(caughtUpMessage).last()).toBeVisible()

    await page.getByRole('tab', { name: 'Scan' }).click()
    await expect(page).toHaveURL('/guard/scan')
    await expect(page.getByTestId('guard-scan-page')).toBeVisible()

    await page.getByRole('tab', { name: 'Notifications' }).click()
    await expect(page).toHaveURL('/guard/notifications')
    await expect(page.getByText(caughtUpMessage).last()).toBeVisible()
  })
})
