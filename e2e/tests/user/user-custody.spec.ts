import type { Page } from '../../../../umak-link-web/node_modules/@playwright/test'
import { test, expect } from '../../fixtures/user.fixture'

type FlowMode = 'accepted' | 'rejected' | 'retry'

async function attachHandoverImage (page: Page) {
  await page
    .locator('input[type="file"]')
    .setInputFiles('src/shared/assets/umak-seal.png')
}

async function openHandoverFlow (page: Page) {
  await page.goto('/user/history')
  await expect(page.getByText('Blue Umbrella')).toBeVisible()
  await page.getByRole('button', { name: 'More options' }).first().click()
  await page.getByText('Handover to Guard').click()
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
        attempt_status: 'open',
        qr_status: 'active',
        custody_status: 'handover_in_progress',
        expires_at: '2026-05-14T08:05:00.000Z',
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
          qr_status: 'expired',
          attempt_status: 'open',
          custody_status: 'handover_in_progress',
          expires_at: '2026-05-14T08:05:00.000Z',
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

    if ((mode === 'accepted' || mode === 'rejected') && statusPollCount === 2) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          qr_code_session_id: 'qr-session-123',
          custody_attempt_id: 'attempt-123',
          post_id: 123,
          item_id: 'item-123',
          qr_status: 'active',
          attempt_status: 'open',
          custody_status: 'handover_in_progress',
          expires_at: '2026-05-14T08:05:00.000Z',
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
          qr_status: mode,
          attempt_status: mode,
          custody_status: mode === 'accepted' ? 'with_guard' : 'with_reporter',
          expires_at: '2026-05-14T08:05:00.000Z',
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

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        qr_code_session_id: 'qr-session-123',
        custody_attempt_id: 'attempt-123',
        post_id: 123,
        item_id: 'item-123',
        qr_status: 'active',
        attempt_status: 'open',
        custody_status: 'handover_in_progress',
        expires_at: '2026-05-14T08:05:00.000Z',
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

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        custody_attempt_id: 'attempt-123',
        qr_code_session_id: 'qr-session-123',
        attempt_status: 'open',
        qr_status: 'active',
        custody_status: 'handover_in_progress',
        expires_at: '2026-05-14T08:10:00.000Z',
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

  test('student can open a unique QR code from the handover form', async ({
    page
  }) => {
    await mockCustodyFlow(page, 'accepted')
    await openHandoverFlow(page)
    await completeHandoverForm(page)
    await clickIonButtonByTestId(page, 'user-custody-open-qr')

    await expect(page.getByTestId('user-custody-qr-card')).toBeVisible()
    await expect(page.getByTestId('user-custody-qr-image')).toBeVisible()
    await expect(page.getByText('This QR code is valid for the whole session.')).toBeVisible()
  })

  test('polling blurs the QR after guard scan and then shows the accepted popup', async ({
    page
  }) => {
    await mockCustodyFlow(page, 'accepted')
    await openHandoverFlow(page)
    await completeHandoverForm(page)
    await clickIonButtonByTestId(page, 'user-custody-open-qr')

    await expect(page.getByTestId('user-custody-qr-card')).toBeVisible()
    await page.waitForTimeout(5200)
    await expect(page.getByTestId('user-custody-qr-overlay')).toBeVisible()

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
    await openHandoverFlow(page)
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
    await openHandoverFlow(page)
    await completeHandoverForm(page)
    await clickIonButtonByTestId(page, 'user-custody-open-qr')

    await expect(page.getByTestId('user-custody-retry')).toBeVisible()
    await clickIonButtonByTestId(page, 'user-custody-retry')
    await expect(page.getByTestId('user-custody-status-message')).toContainText(
      'Polling the server every 5 seconds'
    )

    await clickIonButtonByTestId(page, 'user-custody-cancel')
    await page.getByText('Cancel handover session?').waitFor()
    await page.getByRole('button', { name: 'Cancel Session' }).click()

    await expect(page).toHaveURL('/user/post/history/view/123')
    await expect(page.getByTestId('user-custody-history-attempt_cancelled')).toBeVisible()
  })
})
