import { test, expect } from "@playwright/test";

// Helper function to retry actions that might fail in CI
async function retryIfNeeded(action: () => Promise<void>, maxAttempts = 3): Promise<void> {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await action();
      return;
    } catch (error) {
      console.log(`Attempt ${attempt} failed, retrying...`);
      lastError = error;
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw lastError;
}

test.describe("Authentication", () => {
  test("should register, logout and login a new user", async ({ page }) => {
    // Enable console logging
    page.on("console", (msg) => console.log(`Browser console: ${msg.text()}`));

    const testUser = {
      email: "newuser@example.com",
      password: "Password123!",
      name: "New User",
    };

    // Take a screenshot at the beginning
    await page.screenshot({ path: 'test-results/before-navigation.png' });

    // Step 1: Navigate to registration page with retry
    await retryIfNeeded(async () => {
      await page.goto("/register", { timeout: 30000 });
      await expect(page).toHaveURL("/register");
    });

    // Take a screenshot after navigation
    await page.screenshot({ path: 'test-results/after-navigation-to-register.png' });

    // Step 2: Fill registration form
    // Add explicit waits for elements to be visible before interacting with them
    await retryIfNeeded(async () => {
      await page.getByTestId("name-input").waitFor({ state: "visible", timeout: 20000 });
      await page.getByTestId("name-input").fill(testUser.name);
      
      await page.getByTestId("email-input").waitFor({ state: "visible" });
      await page.getByTestId("email-input").fill(testUser.email);
      
      await page.getByTestId("password-input").waitFor({ state: "visible" });
      await page.getByTestId("password-input").fill(testUser.password);
      
      await page.getByTestId("confirm-password-input").waitFor({ state: "visible" });
      await page.getByTestId("confirm-password-input").fill(testUser.password);
    });

    // Take a screenshot after filling form
    await page.screenshot({ path: 'test-results/after-filling-registration.png' });

    const termsCheckbox = page
      .locator("label")
      .filter({ hasText: "I agree to the Terms of" })
      .locator("span")
      .first();
    
    await retryIfNeeded(async () => {
      await termsCheckbox.waitFor({ state: "visible", timeout: 10000 });
      await termsCheckbox.check();
    });

    // Step 3: Submit registration form
    await retryIfNeeded(async () => {
      await page.getByTestId("register-button").waitFor({ state: "visible" });
      await page.getByTestId("register-button").click();
    });

    // Take a screenshot after submission
    await page.screenshot({ path: 'test-results/after-registration-submit.png' });

    // Step 4: Verify successful registration with increased timeout
    await expect(page).toHaveURL("/", { timeout: 30000 });

    // Step 5: Logout
    await retryIfNeeded(async () => {
      await page.locator(".sidebar-signout .tab-icon").waitFor({ state: "visible", timeout: 15000 });
      await page.locator(".sidebar-signout .tab-icon").click();
    });
    
    await expect(page).toHaveURL("/login", { timeout: 20000 });

    // Take a screenshot after logout
    await page.screenshot({ path: 'test-results/after-logout.png' });

    // Step 5: Fill login form
    await retryIfNeeded(async () => {
      await page.getByTestId("email-input").waitFor({ state: "visible", timeout: 15000 });
      await page.getByTestId("email-input").fill(testUser.email);
      
      await page.getByTestId("password-input").waitFor({ state: "visible" });
      await page.getByTestId("password-input").fill(testUser.password);
    });
    

    // Step 6: Submit login form
    await retryIfNeeded(async () => {
      await page.getByTestId("login-button").waitFor({ state: "visible" });
      await page.getByTestId("login-button").click();
    });
    
    // Take a screenshot after login submit
    await page.screenshot({ path: 'test-results/after-login-submit.png' });
    
    // Verify successful login with increased timeout
    await expect(page).toHaveURL("/", { timeout: 30000 });
  });

  test("should reset password successfully", async ({ page }) => {
    page.on("console", (msg) => console.log(`Browser console: ${msg.text()}`));

    const testUser = {
      email: "test@example.com",
      newPassword: "NewPassword123!",
      resetCode: "123456",
    };

    // Mock the password reset request API
    await page.route("**/user/request-password-reset", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Password reset email sent" }),
      });
    });

    // Mock the reset password with code API
    await page.route("**/user/reset-password-with-code", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Password reset successful" }),
      });
    });

    // Take a screenshot at the beginning
    await page.screenshot({ path: 'test-results/reset-before-navigation.png' });

    // Step 1: Navigate to forgot password page
    await retryIfNeeded(async () => {
      await page.goto("/forgot-password", { timeout: 30000 });
      await expect(page).toHaveURL("/forgot-password");
    });

    // Take a screenshot after navigation
    await page.screenshot({ path: 'test-results/after-navigation-to-forgot.png' });

    // Step 2: Request password reset
    await retryIfNeeded(async () => {
      await page.getByTestId("email-input").waitFor({ state: "visible", timeout: 20000 });
      await page.getByTestId("email-input").fill(testUser.email);
      
      await page.getByTestId("submit-button").waitFor({ state: "visible" });
      await page.getByTestId("submit-button").click();
    });

    // Take a screenshot after submission
    await page.screenshot({ path: 'test-results/after-forgot-submit.png' });

    // Step 3: Verify navigation to reset password page with increased timeout
    await expect(page).toHaveURL(
      `/reset-password?email=${encodeURIComponent(testUser.email)}`,
      { timeout: 20000 }
    );

    // Step 4: Fill reset password form
    await retryIfNeeded(async () => {
      await page.getByTestId("email-input").waitFor({ state: "visible", timeout: 15000 });
      await page.getByTestId("email-input").fill(testUser.email);
      
      await page.getByTestId("code-input").waitFor({ state: "visible" });
      await page.getByTestId("code-input").fill(testUser.resetCode);
      
      await page.getByTestId("password-input").waitFor({ state: "visible" });
      await page.getByTestId("password-input").fill(testUser.newPassword);
      
      await page.getByTestId("confirm-password-input").waitFor({ state: "visible" });
      await page.getByTestId("confirm-password-input").fill(testUser.newPassword);
    });

    // Take a screenshot after filling reset form
    await page.screenshot({ path: 'test-results/after-filling-reset.png' });

    // Step 5: Submit reset password form
    await retryIfNeeded(async () => {
      await page.getByTestId("reset-button").waitFor({ state: "visible" });
      await page.getByTestId("reset-button").click();
    });

    // Take a screenshot after reset submission
    await page.screenshot({ path: 'test-results/after-reset-submit.png' });

    // Step 7: Verify navigation to login page with increased timeout
    await expect(page).toHaveURL("/login", { timeout: 20000 });

    // Step 8: Verify can login with new password
    await retryIfNeeded(async () => {
      await page.getByTestId("email-input").waitFor({ state: "visible", timeout: 15000 });
      await page.getByTestId("email-input").fill(testUser.email);
      
      await page.getByTestId("password-input").waitFor({ state: "visible" });
      await page.getByTestId("password-input").fill(testUser.newPassword);
    });
    
    // const rememberMeCheckbox = page.locator("span").nth(2);
    // await retryIfNeeded(async () => {
    //   await rememberMeCheckbox.waitFor({ state: "visible" });
    //   await rememberMeCheckbox.check();
    // });
    
    await retryIfNeeded(async () => {
      await page.getByTestId("login-button").waitFor({ state: "visible" });
      await page.getByTestId("login-button").click();
    });

    // Take a screenshot after login submit
    await page.screenshot({ path: 'test-results/after-final-login-submit.png' });

    // Step 9: Verify successful login with increased timeout
    await expect(page).toHaveURL("/", { timeout: 30000 });
  });
});
