import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"BROWSER ERROR: {err}"))

        routes = [
            {"path": "/dashboard/index", "check": "可視化儀表"},
            {"path": "/env/air", "check": "空氣污染監測"},
            {"path": "/env/water", "check": "廢水汙染監測"},
            {"path": "/env/waste", "check": "廢棄物管理"},
            {"path": "/env/toxic", "check": "毒性及關注化學物質"},
            {"path": "/env/iso14001", "check": "ISO 14001 文件"},
            {"path": "/osh/management", "check": "職安衛管理辦法"},
            {"path": "/osh/iso45001", "check": "ISO 45001 文件"},
            {"path": "/osh/sds", "check": "SDS 與 GHS 管理"},
            {"path": "/ghg/inventory", "check": "組織型碳盤查 (ISO 14064-1)"},
            {"path": "/ghg/footprint", "check": "產品碳足跡 (ISO 14067)"},
            {"path": "/ghg/cbam", "check": "歐盟 CBAM"},
            {"path": "/energy/overview", "check": "能源數據監控"},
            {"path": "/energy/iso50001", "check": "ISO 50001 文件"},
            {"path": "/energy/water-efficiency", "check": "ISO 46001 用水效率"},
            {"path": "/other/reports", "check": "工作報告與甘特圖"},
            {"path": "/other/layout", "check": "廠區配置圖"},
            {"path": "/settings/employees", "check": "員工管理"},
            {"path": "/settings/access", "check": "權限設定 (承攬/供應商)"},
        ]

        success_count = 0
        for route in routes:
            url = f"http://localhost:8080/#{route['path']}"
            print(f"Checking {url} ...")
            try:
                page.goto(url, timeout=60000)
                page.wait_for_load_state("networkidle")
                time.sleep(2) # Give Vue time to render

                content = page.content()
                if route['check'] in content:
                    print(f"✅ {route['path']} verified.")
                    success_count += 1
                else:
                    print(f"❌ {route['path']} FAILED. Expected '{route['check']}'")
                    # print(content[:2000])
            except Exception as e:
                print(f"❌ {route['path']} ERROR: {e}")

        print(f"\nVerified {success_count}/{len(routes)} routes.")
        browser.close()

if __name__ == "__main__":
    run()
