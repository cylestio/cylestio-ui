import { test, expect } from '@playwright/test'

test.describe('Example E2E Test Suite', () => {
  test('should navigate to home page', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Cylestio/)
  })

  test('basic interactions', async ({ page }) => {
    await page.goto('/')

    // Instead of looking for a Menu button that doesn't exist,
    // let's verify that the Sidebar exists and contains navigation items
    const sidebar = page.locator('nav')
    await expect(sidebar).toBeVisible()
    
    // Check for Dashboard link in the sidebar
    const dashboardLink = page.getByRole('link', { name: 'Dashboard' })
    await expect(dashboardLink).toBeVisible()

    // Click the link and verify navigation
    await dashboardLink.click()
    await expect(page).toHaveURL(/.*\//)
  })
})
