import os
from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        file_path = os.path.abspath('index.html')

        # 1. Navigate and clear storage
        page.goto(f'file://{file_path}')
        page.evaluate("localStorage.clear()")
        page.reload()

        # 2. Wait for the app to initialize (factors to be loaded)
        # We can check if a button is enabled as a proxy for initialization
        expect(page.get_by_role("button", name="新增固定源")).to_be_enabled()

        # 3. Prepare a CSV with activity data
        csv_content = (
            '範疇,排放源類型,活動數據數值,係數索引\n'
            '範疇一,"固定源: 柴油",150,diesel\n'
            '範疇三,"上游運輸: 卡車",10000,truck'
        )
        csv_path = "jules-scratch/verification/final_import.csv"
        with open(csv_path, "w", encoding="utf-8") as f:
            f.write(csv_content)

        # 4. Mock confirm dialog and import the activity data CSV
        page.on("dialog", lambda dialog: dialog.accept())
        page.locator("#csv-import-input").set_input_files(csv_path)

        # 5. Verify the data is imported and CALCULATED correctly
        # Wait for the custom data attribute to be set, which signals the async import is complete.
        page.wait_for_selector('body[data-import-status="complete"]')

        # Now that we know the import and render is complete, we can verify the calculations.
        expect(page.locator("#ghg-data-table tbody tr")).to_have_count(2)
        # S1: 150 * 2.66 / 1000 = 0.399 tCO2e
        # S3: 10000 * 0.13 / 1000 = 1.3 tCO2e
        # Total: 1.699 tCO2e
        expect(page.locator("#total-ghg")).to_have_text("1.6990")

        # Verify the activity data column is displayed correctly
        first_row_activity = page.locator("#ghg-data-table tbody tr:first-child td:nth-child(3)")
        expect(first_row_activity).to_have_text("150 L")

        # 6. Take screenshot for final verification
        screenshot_path = "jules-scratch/verification/verification_final_build.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    run_verification()