import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to Dashboard...")
        try:
            page.goto("http://localhost:8080/#/dashboard/index", timeout=60000)
            page.wait_for_load_state("networkidle")
            time.sleep(5) # Wait for dynamic routes

            content = page.content()
            if "可視化儀表" in content:
                print("Dashboard verified successfully.")
            else:
                print("Dashboard verification failed. '可視化儀表' not found.")
                # print(content)
        except Exception as e:
             print(f"Dashboard navigation failed: {e}")

        print("Navigating to GHG Inventory...")
        try:
            page.goto("http://localhost:8080/#/ghg/inventory", timeout=60000)
            page.wait_for_load_state("networkidle")
            time.sleep(5)

            content = page.content()
            if "組織型碳盤查" in content:
                print("GHG Inventory verified successfully.")
            else:
                print("GHG Inventory verification failed. '組織型碳盤查' not found.")
                # print(content)
        except Exception as e:
             print(f"GHG navigation failed: {e}")

        browser.close()

if __name__ == "__main__":
    run()
