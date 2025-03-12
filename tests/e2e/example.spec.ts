import { test, expect } from '@playwright/test'

test.describe('Example E2E Test Suite', () => {
  test('should navigate to home page', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Cylestio/)
  })

  test('basic interactions', async ({ page }) => {
    await page.goto('/')

    // Example of interacting with elements
    const button = page.getByRole('button', { name: 'Menu' })
    await expect(button).toBeVisible()

    // Example of checking navigation
    await page.getByRole('link', { name: 'Dashboard' }).click()
    await expect(page).toHaveURL(/.*dashboard/)
  })
})
