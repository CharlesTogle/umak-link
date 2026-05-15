import { expect, test } from '../../fixtures/guard.fixture'

test.describe('Guard custody flow', () => {
  test.beforeEach(async ({
    authenticateGuard,
    mockNotificationCount
  }) => {
    await authenticateGuard()
    await mockNotificationCount(0)
  })

  test('guard home shows the handover workflow and empty state', async ({
    page
  }) => {
    await page.goto('/guard/home')

    await expect(page.getByTestId('guard-home-page')).toBeVisible()
    await expect(page.getByTestId('guard-home-title')).toContainText(
      'Review custody handovers'
    )
    await expect(page.getByTestId('guard-no-active-session')).toBeVisible()
    await expect(page.getByTestId('guard-start-scan')).toBeVisible()
  })

  test('guard can load a handover review from manual QR session entry', async ({
    page,
    mockGuardScanSuccess
  }) => {
    await mockGuardScanSuccess()
    await page.goto('/guard/scan')

    await page
      .getByTestId('guard-manual-entry-code-input')
      .locator('input')
      .fill('AB2C3D')

    await page.getByTestId('guard-scan-submit').click()

    await expect(page).toHaveURL(/\/guard\/scan\/review\/attempt-001$/)
    await expect(page.getByTestId('guard-review-summary')).toBeVisible()
    await expect(page.getByTestId('guard-review-post-name')).toContainText(
      'Main Gate'
    )
    await expect(page.getByTestId('guard-review-description')).toContainText(
      'black leather wallet'
    )
    await expect(page.getByTestId('guard-item-image')).toBeVisible()
    await expect(page.getByTestId('guard-handover-image')).toBeVisible()
  })

  test('guard can scan the camera QR and open the review automatically', async ({
    page,
    mockGuardCameraScanSuccess,
    mockGuardScanSuccess
  }) => {
    await mockGuardScanSuccess()
    await mockGuardCameraScanSuccess()
    await page.goto('/guard/scan')

    await expect(page.getByTestId('guard-camera-scan-card')).toBeVisible()
    await expect(page.getByTestId('guard-open-camera')).toBeVisible()
    const guardScanRequest = page.waitForRequest('**/guard/custody/scan')

    await page.getByTestId('guard-open-camera').click()

    const request = await guardScanRequest

    expect(request.postDataJSON()).toEqual({
      qr_code_session_id: 'qr-session-001',
      session_token: 'plain-session-token'
    })
    await expect(page).toHaveURL(/\/guard\/scan\/review\/attempt-001$/)
    await expect(page.getByTestId('guard-review-summary')).toBeVisible()
    await expect(page.getByTestId('guard-review-post-name')).toContainText(
      'Main Gate'
    )
  })

  test('guard can accept a custody handover and see the recorded result on home', async ({
    page,
    mockGuardDecisionSuccess,
    mockGuardScanSuccess
  }) => {
    await mockGuardScanSuccess()
    await mockGuardDecisionSuccess('accepted')
    await page.goto('/guard/scan')

    await page
      .getByTestId('guard-manual-entry-code-input')
      .locator('input')
      .fill('AB2C3D')
    await page.getByTestId('guard-scan-submit').click()

    await expect(page.getByTestId('guard-review-page')).toBeVisible()
    await page
      .getByTestId('guard-decision-reason')
      .locator('textarea')
      .fill('Student and item details match the evidence.')
    await page.getByTestId('guard-accept-button').click()

    await expect(page).toHaveURL('/guard/home')
    await expect(page.getByTestId('guard-decision-banner')).toContainText(
      'Handover accepted'
    )
    await expect(page.getByTestId('guard-latest-decision')).toContainText(
      'Accepted'
    )
  })

  test('guard can reject a custody handover and see the rejected result on home', async ({
    page,
    mockGuardDecisionSuccess,
    mockGuardScanSuccess
  }) => {
    await mockGuardScanSuccess()
    await mockGuardDecisionSuccess('rejected')
    await page.goto('/guard/scan')

    await page
      .getByTestId('guard-manual-entry-code-input')
      .locator('input')
      .fill('AB2C3D')
    await page.getByTestId('guard-scan-submit').click()

    await expect(page.getByTestId('guard-review-page')).toBeVisible()
    await page
      .getByTestId('guard-decision-reason')
      .locator('textarea')
      .fill('The presented item does not match the handover evidence.')
    await page.getByTestId('guard-reject-button').click()

    await expect(page).toHaveURL('/guard/home')
    await expect(page.getByTestId('guard-decision-banner')).toContainText(
      'Handover rejected'
    )
    await expect(page.getByTestId('guard-latest-decision')).toContainText(
      'Rejected'
    )
  })
})
