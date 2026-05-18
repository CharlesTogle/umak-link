import type { Page } from '../../../../umak-link-web/node_modules/@playwright/test'
import { test, expect } from '../../fixtures/user.fixture'

type FlowMode = 'accepted' | 'rejected' | 'retry' | 'scanned_expired' | 'timed_out'

async function attachHandoverImage (page: Page) {
  await page
    .locator('input[type="file"]')
    .setInputFiles('src/shared/assets/umak-seal.png')
}

async function goToHandoverPage (page: Page) {
  await page.goto('/user/post/history/view/123/handover')
  await expect(page).toHaveURL('/user/post/history/view/123/handover')
}

async function completeHandoverForm (page: Page) {
  await attachHandoverImage(page)
  await page
    .getByTestId('user-custody-guard-post-select')
    .selectOption('guard-post-001')
  await expect(page.getByTestId('user-custody-guard-post-select')).toHaveValue(
    'guard-post-001'
  )
  await expect(page.getByText('umak-seal.png')).toBeVisible()
  await expect(page.getByTestId('user-custody-open-qr')).toBeVisible()
}

async function clickIonButtonByTestId (page: Page, testId: string) {
  await page.getByTestId(testId).click({ force: true })
}

async function mockCustodyFlow (
  page: Page,
  mode: FlowMode
) {
  let currentCustodyStatus: 'with_reporter' | 'handover_in_progress' | 'with_guard' = 'with_reporter'
  let currentAttemptNumber = 1
  let statusPollCount = 0
  let finalEventRecorded = false
  let currentWindowExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  const refreshCurrentWindow = () => {
    currentWindowExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
  }

  const history = [
    {
      history_id: 'item-reported-123',
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
      actor_user_id: 'user-001',
      actor_name: 'Student One'
    }
  ]

  await page.route('**/custody/posts/123/history', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        post_id: 123,
        item_id: 'item-123',
        post_status: 'accepted',
        custody_status: currentCustodyStatus,
        history
      })
    })
  })

  await page.route('**/custody/attempts', async route => {
    refreshCurrentWindow()
    history.push({
      history_id: `handover-attempted-${history.length + 1}`,
      event_type: 'handover_attempted',
      source_record_type: 'custody_attempt',
      message: 'Handover attempt opened at Main Gate',
      occurred_at: '2026-05-14T08:00:00.000Z',
      custody_attempt_id: 'attempt-123',
      qr_code_session_id: 'qr-session-123',
      attempt_number: 1,
      guard_post_id: 'guard-post-001',
      guard_post_name: 'Main Gate',
      full_location_name: 'Main Gate',
      handover_image_url: 'https://example.com/custody-handover.webp',
      actor_user_id: 'user-001',
      actor_name: 'Student One'
    })
    currentCustodyStatus = 'handover_in_progress'

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        custody_attempt_id: 'attempt-123',
        qr_code_session_id: 'qr-session-123',
        manual_entry_code: 'AB2C3D',
        attempt_status: 'open',
        qr_status: 'active',
        custody_status: 'handover_in_progress',
        expires_at: currentWindowExpiresAt,
        number_of_attempts: 1,
        max_number_of_attempts: 5,
        retries_remaining: 4
      })
    })
  })

  await page.route('**/custody/sessions/qr-session-123/status', async route => {
    statusPollCount += 1

    if (mode === 'retry' && statusPollCount === 1) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          qr_code_session_id: 'qr-session-123',
          custody_attempt_id: 'attempt-123',
          post_id: 123,
          item_id: 'item-123',
          manual_entry_code: 'AB2C3D',
          qr_status: 'expired',
          attempt_status: 'open',
          custody_status: 'handover_in_progress',
          expires_at: currentWindowExpiresAt,
          scanned_at: null,
          decision_at: null,
          current_window_expired: true,
          can_retry: true,
          number_of_attempts: 1,
          max_number_of_attempts: 5,
          retries_remaining: 4
        })
      })
      return
    }

    if (mode === 'scanned_expired' && statusPollCount >= 1) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          qr_code_session_id: 'qr-session-123',
          custody_attempt_id: 'attempt-123',
          post_id: 123,
          item_id: 'item-123',
          manual_entry_code: 'AB2C3D',
          qr_status: 'expired',
          attempt_status: 'open',
          custody_status: 'handover_in_progress',
          expires_at: currentWindowExpiresAt,
          scanned_at: '2026-05-14T08:01:00.000Z',
          decision_at: null,
          current_window_expired: true,
          can_retry: true,
          number_of_attempts: 1,
          max_number_of_attempts: 5,
          retries_remaining: 4
        })
      })
      return
    }

    if ((mode === 'accepted' || mode === 'rejected') && statusPollCount === 2) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          qr_code_session_id: 'qr-session-123',
          custody_attempt_id: 'attempt-123',
          post_id: 123,
          item_id: 'item-123',
          manual_entry_code: 'AB2C3D',
          qr_status: 'active',
          attempt_status: 'open',
          custody_status: 'handover_in_progress',
          expires_at: currentWindowExpiresAt,
          scanned_at: '2026-05-14T08:01:00.000Z',
          decision_at: null,
          current_window_expired: false,
          can_retry: false,
          number_of_attempts: currentAttemptNumber,
          max_number_of_attempts: 5,
          retries_remaining: 5 - currentAttemptNumber
        })
      })
      return
    }

    if ((mode === 'accepted' || mode === 'rejected') && statusPollCount >= 3) {
      if (!finalEventRecorded) {
        finalEventRecorded = true
        currentCustodyStatus = mode === 'accepted' ? 'with_guard' : 'with_reporter'
        history.push({
          history_id: `final-event-${history.length + 1}`,
          event_type: mode === 'accepted' ? 'guard_accepted' : 'guard_rejected',
          source_record_type: 'custody_attempt',
          message:
            mode === 'accepted'
              ? 'Guard accepted the handover at Main Gate'
              : 'Guard rejected the handover at Main Gate',
          occurred_at: '2026-05-14T08:02:00.000Z',
          custody_attempt_id: 'attempt-123',
          qr_code_session_id: 'qr-session-123',
          attempt_number: currentAttemptNumber,
          guard_post_id: 'guard-post-001',
          guard_post_name: 'Main Gate',
          full_location_name: 'Main Gate',
          handover_image_url: 'https://example.com/custody-handover.webp',
          actor_user_id: 'guard-001',
          actor_name: 'Guard One'
        })
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          qr_code_session_id: 'qr-session-123',
          custody_attempt_id: 'attempt-123',
          post_id: 123,
          item_id: 'item-123',
          manual_entry_code: 'AB2C3D',
          qr_status: mode,
          attempt_status: mode,
          custody_status: mode === 'accepted' ? 'with_guard' : 'with_reporter',
          expires_at: currentWindowExpiresAt,
          scanned_at: '2026-05-14T08:01:00.000Z',
          decision_at: '2026-05-14T08:02:00.000Z',
          current_window_expired: false,
          can_retry: false,
          number_of_attempts: currentAttemptNumber,
          max_number_of_attempts: 5,
          retries_remaining: 5 - currentAttemptNumber
        })
      })
      return
    }

    if (mode === 'timed_out' && statusPollCount >= 2) {
      if (!finalEventRecorded) {
        finalEventRecorded = true
        currentCustodyStatus = 'with_reporter'
        history.push({
          history_id: `timed-out-${history.length + 1}`,
          event_type: 'session_timed_out',
          source_record_type: 'custody_attempt',
          message: 'Handover session timed out at Main Gate',
          occurred_at: '2026-05-14T08:15:00.000Z',
          custody_attempt_id: 'attempt-123',
          qr_code_session_id: 'qr-session-123',
          attempt_number: currentAttemptNumber,
          guard_post_id: 'guard-post-001',
          guard_post_name: 'Main Gate',
          full_location_name: 'Main Gate',
          handover_image_url: 'https://example.com/custody-handover.webp',
          actor_user_id: null,
          actor_name: null
        })
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          qr_code_session_id: 'qr-session-123',
          custody_attempt_id: 'attempt-123',
          post_id: 123,
          item_id: 'item-123',
          manual_entry_code: 'AB2C3D',
          qr_status: 'expired',
          attempt_status: 'timed_out',
          custody_status: 'with_reporter',
          expires_at: currentWindowExpiresAt,
          scanned_at: null,
          decision_at: null,
          current_window_expired: false,
          can_retry: false,
          number_of_attempts: currentAttemptNumber,
          max_number_of_attempts: 5,
          retries_remaining: 0
        })
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        qr_code_session_id: 'qr-session-123',
        custody_attempt_id: 'attempt-123',
        post_id: 123,
        item_id: 'item-123',
        manual_entry_code: 'AB2C3D',
        qr_status: 'active',
        attempt_status: 'open',
        custody_status: 'handover_in_progress',
        expires_at: currentWindowExpiresAt,
        scanned_at: null,
        decision_at: null,
        current_window_expired: false,
        can_retry: false,
        number_of_attempts: currentAttemptNumber,
        max_number_of_attempts: 5,
        retries_remaining: 5 - currentAttemptNumber
      })
    })
  })

  await page.route('**/custody/sessions/qr-session-123/retry', async route => {
    currentAttemptNumber = 2
    statusPollCount = 1
    refreshCurrentWindow()

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        custody_attempt_id: 'attempt-123',
        qr_code_session_id: 'qr-session-123',
        manual_entry_code: 'CD4E5F',
        attempt_status: 'open',
        qr_status: 'active',
        custody_status: 'handover_in_progress',
        expires_at: currentWindowExpiresAt,
        number_of_attempts: 2,
        max_number_of_attempts: 5,
        retries_remaining: 3
      })
    })
  })

  await page.route('**/custody/sessions/qr-session-123/cancel', async route => {
    currentCustodyStatus = 'with_reporter'
    history.push({
      history_id: `cancelled-${history.length + 1}`,
      event_type: 'attempt_cancelled',
      source_record_type: 'custody_attempt',
      message: 'Handover session cancelled by the reporter',
      occurred_at: '2026-05-14T08:03:00.000Z',
      custody_attempt_id: 'attempt-123',
      qr_code_session_id: 'qr-session-123',
      attempt_number: currentAttemptNumber,
      guard_post_id: 'guard-post-001',
      guard_post_name: 'Main Gate',
      full_location_name: 'Main Gate',
      handover_image_url: 'https://example.com/custody-handover.webp',
      actor_user_id: 'user-001',
      actor_name: 'Student One'
    })

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        qr_code_session_id: 'qr-session-123',
        custody_attempt_id: 'attempt-123',
        attempt_status: 'cancelled',
        qr_status: 'cancelled',
        custody_status: 'with_reporter',
        cancelled_at: '2026-05-14T08:03:00.000Z'
      })
    })
  })
}

test.describe('User custody flow', () => {
  test.beforeEach(async ({
    authenticateUser,
    mockFoundHistoryPost,
    mockGuardPosts,
    mockNotificationCount,
    mockStorageUpload
  }) => {
    await authenticateUser()
    await mockNotificationCount(0)
    await mockFoundHistoryPost()
    await mockGuardPosts()
    await mockStorageUpload()
  })

  test('eligible found history post shows the handover to guard action', async ({
    page
  }) => {
    await mockCustodyFlow(page, 'accepted')
    await page.goto('/user/history')

    await expect(page.getByText('Blue Umbrella')).toBeVisible()
    await page.getByRole('button', { name: 'More options' }).first().click()
    await expect(page.getByText('Handover to Guard')).toBeVisible()
  })

  test('custody history renders in chronological order when the API response is unsorted', async ({
    page
  }) => {
    await page.route('**/custody/posts/123/history', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          post_id: 123,
          item_id: 'item-123',
          post_status: 'accepted',
          custody_status: 'with_guard',
          history: [
            {
              history_id: 'accepted-001',
              event_type: 'guard_accepted',
              source_record_type: 'guard_accepted',
              message: 'Guard Stefanie Gabion has accepted handover',
              occurred_at: '2026-05-19T03:08:00.000Z',
              custody_attempt_id: 'attempt-001',
              qr_code_session_id: 'qr-session-001',
              attempt_number: 1,
              guard_post_id: 'guard-post-001',
              guard_post_name: 'Security Desk',
              full_location_name: 'Admin Building > Lobby > Security Desk',
              handover_image_url: 'https://example.com/custody-handover.webp',
              actor_user_id: 'guard-001',
              actor_name: 'Stefanie Gabion'
            },
            {
              history_id: 'attempted-001',
              event_type: 'handover_attempted',
              source_record_type: 'attempt_started',
              message: 'Guard handover attempted at Admin Building > Lobby > Security Desk',
              occurred_at: '2026-05-19T03:05:00.000Z',
              custody_attempt_id: 'attempt-001',
              qr_code_session_id: 'qr-session-001',
              attempt_number: 1,
              guard_post_id: 'guard-post-001',
              guard_post_name: 'Security Desk',
              full_location_name: 'Admin Building > Lobby > Security Desk',
              handover_image_url: 'https://example.com/custody-handover.webp',
              actor_user_id: 'user-001',
              actor_name: 'Student One'
            },
            {
              history_id: 'reported-001',
              event_type: 'item_reported',
              source_record_type: null,
              message: 'Item reported in Umak Link',
              occurred_at: '2026-05-19T03:03:00.000Z',
              custody_attempt_id: null,
              qr_code_session_id: null,
              attempt_number: null,
              guard_post_id: null,
              guard_post_name: null,
              full_location_name: null,
              handover_image_url: null,
              actor_user_id: 'user-001',
              actor_name: 'Student One'
            }
          ]
        })
      })
    })

    await page.goto('/user/post/history/view/123')

    const historyEntries = page.locator(
      '[data-testid^="user-custody-history-"]:not([data-testid="user-custody-history-card"])'
    )

    await expect(historyEntries).toHaveCount(3)
    await expect(historyEntries.nth(0)).toContainText('Item reported in Umak Link')
    await expect(historyEntries.nth(1)).toContainText(
      'Guard handover attempted at Admin Building > Lobby > Security Desk'
    )
    await expect(historyEntries.nth(2)).toContainText(
      'Guard Stefanie Gabion has accepted handover'
    )
  })

  test('history actions show resume handover when a session is already open', async ({
    page
  }) => {
    await mockCustodyFlow(page, 'accepted')
    await goToHandoverPage(page)
    await completeHandoverForm(page)
    await clickIonButtonByTestId(page, 'user-custody-open-qr')
    await expect(page.getByTestId('user-custody-current-status')).toContainText(
      'handover in progress'
    )

    await page.goto('/user/post/history/view/123')
    await expect(page.getByText('Blue Umbrella')).toBeVisible()
    await expect(page.getByTestId('user-custody-current-status')).toContainText(
      'handover in progress'
    )
    await page.getByRole('button', { name: 'More options' }).click()
    await expect(page.getByText('Resume Handover to Guard')).toBeVisible()

    await page.getByText('Resume Handover to Guard').click()
    await expect(page).toHaveURL('/user/post/history/view/123/handover')
    await expect(page.getByTestId('user-custody-qr-card')).toBeVisible()
  })

  test('student can open a unique QR code from the handover form', async ({
    page
  }) => {
    await mockCustodyFlow(page, 'accepted')
    await goToHandoverPage(page)
    await completeHandoverForm(page)
    const createAttemptRequest = page.waitForRequest('**/custody/attempts')
    await clickIonButtonByTestId(page, 'user-custody-open-qr')
    const request = await createAttemptRequest
    const payload = request.postDataJSON() as { session_token: string }

    await expect(page.getByTestId('user-custody-qr-card')).toBeVisible()
    await expect(page.getByTestId('user-custody-qr-image')).toBeVisible()
    await expect(page.getByTestId('user-custody-countdown-card')).toBeVisible()
    await expect(page.getByTestId('user-custody-countdown')).toHaveText(/\d{2}:\d{2}/)
    await expect(
      page.getByText('This QR code stays live until the current handover window expires.')
    ).toBeVisible()
    await expect(page.getByTestId('user-custody-manual-entry-details')).toBeVisible()
    await expect(page.getByTestId('user-custody-manual-entry-code')).toHaveText(
      'AB2 C3D'
    )
    await expect(payload.session_token).toBeTruthy()
  })

  test('student can resume an open handover after sessionStorage is cleared', async ({
    page
  }) => {
    await mockCustodyFlow(page, 'accepted')
    await goToHandoverPage(page)
    await completeHandoverForm(page)
    await clickIonButtonByTestId(page, 'user-custody-open-qr')

    await expect(page.getByTestId('user-custody-qr-card')).toBeVisible()
    await page.evaluate(() => window.sessionStorage.clear())
    await page.goto('/user/post/history/view/123')
    await expect(page.getByTestId('user-custody-current-status')).toContainText(
      'handover in progress'
    )
    await page.getByRole('button', { name: 'More options' }).click()
    await page.getByText('Resume Handover to Guard').click()

    await expect(page.getByTestId('user-custody-qr-card')).toBeVisible()
    await expect(page.getByTestId('user-custody-cancel')).toBeVisible()

    await clickIonButtonByTestId(page, 'user-custody-cancel')
    await page.getByText('Cancel handover session?').waitFor()
    await page.getByRole('button', { name: 'Cancel Session' }).click()

    await expect(page).toHaveURL('/user/post/history/view/123')
    await expect(
      page.getByTestId('user-custody-history-attempt_cancelled').first()
    ).toBeVisible()
  })

  test('polling blurs the QR after guard scan and then shows the accepted popup', async ({
    page
  }) => {
    await mockCustodyFlow(page, 'accepted')
    await goToHandoverPage(page)
    await completeHandoverForm(page)
    await clickIonButtonByTestId(page, 'user-custody-open-qr')

    await expect(page.getByTestId('user-custody-qr-card')).toBeVisible()
    await page.waitForTimeout(5200)
    await expect(page.getByTestId('user-custody-qr-overlay')).toBeVisible()
    await expect(page.getByTestId('user-custody-countdown-card')).toHaveCount(0)
    await expect(page.getByTestId('user-custody-manual-entry-code')).toHaveText(
      '• • • • • •'
    )
    await expect(page.getByText(
      'Manual entry is locked after the guard scans the live QR.'
    )).toBeVisible()

    await page.waitForTimeout(5200)
    await expect(page.getByTestId('user-custody-result-modal')).toBeVisible()
    await expect(page.getByTestId('user-custody-result-title')).toContainText(
      'Guard Accepted Handover'
    )
    await expect(page.getByTestId('user-custody-result-message')).toContainText(
      'The guard has accepted handover'
    )
  })

  test('polling shows the rejected popup when the guard rejects the handover', async ({
    page
  }) => {
    await mockCustodyFlow(page, 'rejected')
    await goToHandoverPage(page)
    await completeHandoverForm(page)
    await clickIonButtonByTestId(page, 'user-custody-open-qr')

    await page.waitForTimeout(10400)
    await expect(page.getByTestId('user-custody-result-modal')).toBeVisible()
    await expect(page.getByTestId('user-custody-result-title')).toContainText(
      'Guard Rejected Handover'
    )
    await expect(page.getByTestId('user-custody-result-message')).toContainText(
      'Try again later or try a different guard post.'
    )
  })

  test('expired QR window exposes retry and cancel records the event in history', async ({
    page
  }) => {
    await mockCustodyFlow(page, 'retry')
    await goToHandoverPage(page)
    await completeHandoverForm(page)
    await clickIonButtonByTestId(page, 'user-custody-open-qr')

    await expect(page.getByTestId('user-custody-retry')).toBeVisible()
    await expect(page.getByTestId('user-custody-qr-overlay')).toContainText(
      'QR Expired. Click Get Fresh QR to get a new one.'
    )
    await expect(page.getByTestId('user-custody-manual-entry-overlay')).toContainText(
      'QR Expired. Click Get Fresh QR to get a new one.'
    )
    await clickIonButtonByTestId(page, 'user-custody-retry')
    await expect(page.getByTestId('user-custody-attempt-counter')).toContainText(
      '2 / 5'
    )

    await clickIonButtonByTestId(page, 'user-custody-cancel')
    await page.getByText('Cancel handover session?').waitFor()
    await page.getByRole('button', { name: 'Cancel Session' }).click()

    await expect(page).toHaveURL('/user/post/history/view/123')
    await expect(
      page.getByTestId('user-custody-history-attempt_cancelled').first()
    ).toBeVisible()
  })

  test('expired QR window does not expose retry after the guard has already scanned it', async ({
    page
  }) => {
    await mockCustodyFlow(page, 'scanned_expired')
    await goToHandoverPage(page)
    await completeHandoverForm(page)
    await clickIonButtonByTestId(page, 'user-custody-open-qr')

    await expect(page.getByTestId('user-custody-qr-overlay')).toContainText(
      'Guard scanned your QR. Waiting for acceptance or rejection.'
    )
    await expect(page.getByTestId('user-custody-status-message')).toContainText(
      'The guard scanned your QR. Wait for the decision while polling continues.'
    )
    await expect(page.getByTestId('user-custody-countdown-card')).toHaveCount(0)
    await expect(page.getByTestId('user-custody-retry')).toHaveCount(0)
  })

  test('timed out session clears the live handover view and restores the handover action', async ({
    page
  }) => {
    await mockCustodyFlow(page, 'timed_out')
    await goToHandoverPage(page)
    await completeHandoverForm(page)
    await clickIonButtonByTestId(page, 'user-custody-open-qr')

    await expect(page.getByTestId('user-custody-qr-card')).toBeVisible()
    await page.waitForTimeout(5200)
    await expect(page.getByTestId('user-custody-qr-card')).toHaveCount(0)
    await expect(
      page.getByTestId('user-custody-history-session_timed_out').first()
    ).toBeVisible()
    await expect(page.getByTestId('user-custody-open-qr')).toBeVisible()

    await page.goto('/user/history')
    await expect(page.getByText('Blue Umbrella')).toBeVisible()
    await page.getByRole('button', { name: 'More options' }).first().click()
    await expect(page.getByText('Handover to Guard')).toBeVisible()
  })
})
