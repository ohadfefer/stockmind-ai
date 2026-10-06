import { expect, test } from "@playwright/test"

// The name the run found, put back by afterEach whether or not the test passed.
let originalName: string | undefined

test.afterEach(async ({ page }) => {
  if (originalName === undefined) return
  const response = await page.request.patch("/api/user", {
    data: { fullName: originalName },
  })
  expect(response.status()).toBe(200)
})

test("renaming yourself saves the name and shows it in the sidebar", async ({
  page,
}) => {
  const main = page.getByRole("main")
  // Unique per run, so it always differs from the saved name and Save enables.
  const newName = `E2E ${Date.now()}`

  await page.goto("/settings/basic-information")
  const nameInput = main.getByLabel("Full Name")
  originalName = await nameInput.inputValue()

  await nameInput.fill(newName)
  await main.getByRole("button", { name: "Save changes" }).click()
  await expect(main.getByRole("status").filter({ hasText: "Saved" })).toBeVisible()
  // The sidebar's account menu, re-rendered by the router.refresh() after save.
  await expect(page.getByRole("button", { name: newName })).toBeVisible()

  await page.reload()
  await expect(nameInput).toHaveValue(newName)
})
