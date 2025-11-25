import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"BROWSER ERROR: {err}"))

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
        except Exception as e:
             print(f"Dashboard navigation failed: {e}")

        browser.close()

if __name__ == "__main__":
    run()
