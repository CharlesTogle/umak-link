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
    page,
    mockGuardEmptyActiveClaimReviews
  }) => {
    await mockGuardEmptyActiveClaimReviews()
    await page.goto('/guard/home')

    await expect(page.getByTestId('guard-home-page')).toBeVisible()
    await expect(page.getByTestId('guard-home-title')).toContainText(
      'Review custody handovers'
    )
    await expect(page.getByTestId('guard-home-session-card')).toContainText(
      'No accepted handover posts are assigned to your account right now.'
    )
    await expect(page.getByTestId('guard-start-scan')).toBeVisible()
    await expect(page.getByTestId('guard-open-scan-secondary')).toHaveCount(0)
  })

  test('guard can reroute to an in-custody post and see the post record page body', async ({
    page,
    mockGuardActiveClaimReviews,
    mockGuardPostRecordFallback
  }) => {
    await mockGuardActiveClaimReviews()
    await mockGuardPostRecordFallback()
    await page.goto('/guard/home')

    const custodyPost = page.getByTestId('guard-custody-post-2410')

    await expect(custodyPost).toBeVisible()
    await expect(custodyPost).toContainText('Black Wallet')
    await expect(
      custodyPost.getByAltText('Charles Nathaniel Togle profile')
    ).toBeVisible()

    await custodyPost.click()

    await expect(page).toHaveURL(/\/guard\/post-record\/view\/2410$/)
    const postRecordPage = page.getByTestId('guard-post-record-page')
    await expect(postRecordPage).toBeVisible()
    await expect(page.getByText('Post Details')).toBeVisible()
    await expect(page.getByText('Poster Details')).toBeVisible()
    await expect(postRecordPage.getByAltText('Charles Nathaniel Togle')).toBeVisible()
    await expect(page.getByText('No record found')).toHaveCount(0)
  })

  test('guard can open the claim flow from a pending in-custody post', async ({
    page,
    mockGuardActiveClaimReviews,
    mockGuardPostRecordFallback,
    mockGuardClaimVerificationSession,
    mockGuardClaimCodeResolution
  }) => {
    await mockGuardActiveClaimReviews()
    await mockGuardPostRecordFallback()
    await mockGuardClaimVerificationSession()
    await mockGuardClaimCodeResolution()
    await page.goto('/guard/home')

    await page.getByTestId('guard-custody-post-2410').click()

    await expect(page).toHaveURL(/\/guard\/post-record\/view\/2410$/)
    await expect(page.getByTestId('guard-post-record-page')).toBeVisible()

    await page.getByRole('button', { name: 'More options' }).click()
    await expect(page.getByText('Claim Item')).toBeVisible()

    await page.getByText('Claim Item').click()

    await expect(page).toHaveURL(/\/guard\/post\/claim\/2410$/)
    const claimItemPage = page.getByTestId('guard-claim-item-page')
    await expect(claimItemPage).toBeVisible()
    await expect(page.getByText('Process Guard Claim')).toBeVisible()
    await expect(
      claimItemPage.getByAltText('Charles Nathaniel Togle profile')
    ).toBeVisible()

    await claimItemPage.locator('ion-input#claim-manual-code input').fill('ABC123')
    await page.getByRole('button', { name: 'Use Claim Code' }).click()

    await expect(claimItemPage.getByAltText('Student Claimer')).toBeVisible()
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
    mockGuardEmptyActiveClaimReviews,
    mockGuardDecisionSuccess,
    mockGuardScanSuccess
  }) => {
    await mockGuardEmptyActiveClaimReviews()
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
  })

  test('guard can reject a custody handover and see the rejected result on home', async ({
    page,
    mockGuardEmptyActiveClaimReviews,
    mockGuardDecisionSuccess,
    mockGuardScanSuccess
  }) => {
    await mockGuardEmptyActiveClaimReviews()
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
  })
})
