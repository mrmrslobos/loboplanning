import { test, expect } from '@playwright/test';

// Comprehensive audit test for LoboHub
test.describe('LoboHub Comprehensive QA Audit', () => {
  
  test('Authentication Flow', async ({ page }) => {
    await page.goto('/');
    
    // Test login page elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Test registration
    await page.click('text=Register');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[name="name"]', 'Test User');
    await page.click('button[type="submit"]');
  });

  test('Navigation and Sidebar', async ({ page }) => {
    // Assuming logged in, test all navigation elements
    const navItems = [
      'Dashboard', 'Tasks', 'Lists', 'Calendar', 
      'Events', 'Budget', 'Chat', 'Devotional', 'Meal Planning'
    ];
    
    for (const item of navItems) {
      await page.click(`text=${item}`);
      await expect(page).toHaveURL(new RegExp(item.toLowerCase()));
    }
  });

  test('Tasks Page - All Interactive Elements', async ({ page }) => {
    await page.goto('/tasks');
    
    // Test create task button and dialog
    await page.click('[data-testid="button-create-task"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Fill and submit form
    await page.fill('[data-testid="input-task-title"]', 'Test Task');
    await page.fill('[data-testid="input-task-description"]', 'Test Description');
    await page.click('[data-testid="button-submit-task"]');
    
    // Test filters
    await page.click('[data-testid="filter-status"]');
    await page.click('[data-testid="filter-assignee"]');
  });

  test('Lists Page - All Interactive Elements', async ({ page }) => {
    await page.goto('/lists');
    
    // Test create list
    await page.click('[data-testid="button-create-list"]');
    await page.fill('[data-testid="input-list-title"]', 'Test List');
    await page.click('[data-testid="select-template"]');
    await page.click('[data-testid="button-submit-list"]');
  });

  test('Form Validation Testing', async ({ page }) => {
    await page.goto('/tasks');
    
    // Test empty form submission
    await page.click('[data-testid="button-create-task"]');
    await page.click('[data-testid="button-submit-task"]');
    
    // Should show validation errors
    await expect(page.locator('text=required')).toBeVisible();
  });

  test('Dialog and Modal Behavior', async ({ page }) => {
    await page.goto('/lists');
    
    // Open dialog
    await page.click('[data-testid="button-create-list"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Test ESC key
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    
    // Test click outside
    await page.click('[data-testid="button-create-list"]');
    await page.click('body', { position: { x: 10, y: 10 } });
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

});