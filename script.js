document.addEventListener('DOMContentLoaded', async () => {

    let ghgEmissionFactors = {};

    // --- Data Management ---
    let inventoryData = JSON.parse(localStorage.getItem('inventoryData')) || {
        companyName: '貴公司名稱',
        reportingYear: new Date().getFullYear(),
        productName: '',
        productAmount: 0,
        ghgEntries: []
    };

    // --- DOM Element References ---
    // ... (references remain the same)
    const ghgDataTableBody = document.getElementById('ghg-data-table').getElementsByTagName('tbody')[0];
    const productNameInput = document.getElementById('product-name');
    const productAmountInput = document.getElementById('product-amount');
    const importCsvButton = document.getElementById('import-csv');
    const csvImportInput = document.getElementById('csv-import-input');
    const exportCsvButton = document.getElementById('export-csv');
    const generateReportButton = document.getElementById('generate-report');


    // --- Core Functions ---
    async function initializeApp() {
        try {
            const response = await fetch('emission-factors.json');
            if (!response.ok) throw new Error('無法載入排放係數檔案！');
            ghgEmissionFactors = await response.json();
            console.log("排放係數已成功載入。");
            saveAndRender();
        } catch (error) {
            console.error(error);
            alert('應用程式初始化失敗：' + error.message);
        }
    }

    function saveAndRender() {
        // Centralized calculation: Always recalculate emissions for all entries before rendering/saving
        inventoryData.ghgEntries.forEach(entry => {
            const factorInfo = ghgEmissionFactors[entry.factorKey];
            entry.emissions = factorInfo ? (entry.amount * factorInfo.factor) / 1000 : 0;
        });

        localStorage.setItem('inventoryData', JSON.stringify(inventoryData));

        const totals = { scope1: 0, scope2: 0, scope3: 0 };
        ghgDataTableBody.innerHTML = '';

        inventoryData.ghgEntries.forEach((data, index) => {
            const unit = ghgEmissionFactors[data.factorKey]?.unit || '';
            const newRow = ghgDataTableBody.insertRow();
            newRow.innerHTML = `
                <td>${data.scope}</td>
                <td>${data.type}</td>
                <td>${data.amount || ''} ${unit}</td>
                <td>${(data.emissions || 0).toFixed(4)}</td>
                <td><button class="delete-ghg-entry" data-index="${index}">刪除</button></td>
            `;
            if (data.scope === '範疇一') totals.scope1 += data.emissions;
            else if (data.scope === '範疇二') totals.scope2 += data.emissions;
            else if (data.scope === '範疇三') totals.scope3 += data.emissions;
        });

        const totalGhg = totals.scope1 + totals.scope2 + totals.scope3;
        document.getElementById('total-scope1').textContent = totals.scope1.toFixed(4);
        document.getElementById('total-scope2').textContent = totals.scope2.toFixed(4);
        document.getElementById('total-scope3').textContent = totals.scope3.toFixed(4);
        document.getElementById('total-ghg').textContent = totalGhg.toFixed(4);

        productNameInput.value = inventoryData.productName;
        productAmountInput.value = inventoryData.productAmount > 0 ? inventoryData.productAmount : '';

        const productAmount = parseFloat(inventoryData.productAmount) || 0;
        document.getElementById('emission-intensity').textContent = (productAmount > 0 && totalGhg > 0 ? (totalGhg / productAmount) : 0).toFixed(4);
    }

    function addGhgEntry(entryData) {
        if (!entryData.amount || entryData.amount <= 0) {
            alert('請輸入有效的正數活動數據！');
            return;
        }
        // Just add the raw activity data, calculation will be handled by saveAndRender
        inventoryData.ghgEntries.push(entryData);
        saveAndRender();
    }

    // --- Export and Report ---
    function exportToCSV() {
        const headers = ["範疇", "排放源類型", "活動數據數值", "係數索引"];
        let csvContent = headers.join(",") + "\n";
        inventoryData.ghgEntries.forEach(row => {
            csvContent += [row.scope, `"${row.type}"`, row.amount, row.factorKey].join(",") + "\n";
        });
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", `ghg_activity_data_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function handleCsvImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            encoding: "UTF-8",
            complete: function(results) {
                if (results.errors.length > 0) {
                    alert("CSV 解析錯誤: " + results.errors.map(e => e.message).join('\n'));
                    return;
                }

                // Pre-computation validation
                try {
                    const expectedHeaders = ["範疇", "排放源類型", "活動數據數值", "係數索引"];
                    const actualHeaders = results.meta.fields.filter(h => h && h.trim());
                    if (!expectedHeaders.every(h => actualHeaders.includes(h))) {
                       throw new Error("CSV 標頭不符或缺少必要欄位。請確認包含: " + expectedHeaders.join(', '));
                    }
                    const newEntries = results.data.map(row => {
                        const amount = parseFloat(row["活動數據數值"]);
                        if (isNaN(amount)) throw new Error(`資料行 "${row["排放源類型"]}" 的活動數據數值非數字。`);
                        return {
                            scope: row["範疇"],
                            type: row["排放源類型"],
                            amount: amount,
                            factorKey: row["係數索引"]
                        };
                    });

                    // If parsing is successful, then confirm and replace data
                    if (confirm('這將會覆蓋所有現有數據，確定要匯入嗎？')) {
                        inventoryData.ghgEntries = newEntries;
                        saveAndRender();
                        alert('CSV 檔案已成功匯入！');
                        document.body.dataset.importStatus = 'complete'; // Signal for Playwright
                    }
                } catch (error) {
                     alert('匯入失敗：' + error.message);
                }
            },
            error: (err) => alert("讀取檔案時發生錯誤: " + err.message)
        });
        event.target.value = '';
    }

    function generateReport() {
        const reportWindow = window.open('', '_blank');
        const totals = { s1: 0, s2: 0, s3: 0, total: 0 };
        inventoryData.ghgEntries.forEach(entry => {
            if(entry.scope === '範疇一') totals.s1 += entry.emissions;
            else if(entry.scope === '範疇二') totals.s2 += entry.emissions;
            else if(entry.scope === '範疇三') totals.s3 += entry.emissions;
        });
        totals.total = totals.s1 + totals.s2 + totals.s3;
        const tableRows = inventoryData.ghgEntries.map(row => `<tr><td>${row.scope}</td><td>${row.type}</td><td>${row.amount} ${ghgEmissionFactors[row.factorKey]?.unit || ''}</td><td>${row.emissions.toFixed(4)}</td></tr>`).join('');

        const reportHTML = `
            <!DOCTYPE html><html lang="zh-Hant"><head><meta charset="UTF-8"><title>溫室氣體盤查報告書</title>
            <style>
                body { font-family: 'Microsoft JhengHei', sans-serif; margin: 2rem; color: #333; }
                .report-container { max-width: 800px; margin: auto; }
                h1, h2 { color: #004a99; border-bottom: 2px solid #0056b3; padding-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; font-size: 0.9rem; }
                th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
                th { background-color: #e9ecef; }
                .summary { margin-top: 2rem; padding: 1.5rem; background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; }
                .summary p { font-size: 1.1rem; margin: 0.5rem 0; }
                footer { text-align: center; margin-top: 2rem; font-size: 0.8rem; color: #888; }
            </style></head><body><div class="report-container">
                <h1>溫室氣體盤查報告書</h1>
                <p><strong>公司名稱:</strong> ${inventoryData.companyName}</p>
                <p><strong>報告年份:</strong> ${inventoryData.reportingYear}</p>
                <p><strong>報告產出日期:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>盤查方法學:</strong> 本報告依循 GHG Protocol 企業會計與報告標準進行。
                <h2>排放源數據列表</h2>
                <table><thead><tr><th>範疇</th><th>排放源類型</th><th>活動數據</th><th>排放量 (tCO2e)</th></tr></thead><tbody>${tableRows}</tbody></table>
                <div class="summary">
                    <h2>排放總結</h2>
                    <p><strong>範疇一總排放量:</strong> ${totals.s1.toFixed(4)} tCO2e</p>
                    <p><strong>範疇二總排放量:</strong> ${totals.s2.toFixed(4)} tCO2e</p>
                    <p><strong>範疇三總排放量:</strong> ${totals.s3.toFixed(4)} tCO2e</p><hr>
                    <p><strong>總排放量:</strong> ${totals.total.toFixed(4)} tCO2e</p>
                </div>
                <footer><p>開發者：黃義翔</p></footer>
            </div></body></html>`;
        reportWindow.document.write(reportHTML);
        reportWindow.document.close();
    }

    // --- Event Listeners Setup ---
    productNameInput.addEventListener('input', (e) => { inventoryData.productName = e.target.value; saveAndRender(); });
    productAmountInput.addEventListener('input', (e) => { inventoryData.productAmount = parseFloat(e.target.value) || 0; saveAndRender(); });

    document.getElementById('add-s1-stationary').addEventListener('click', () => {
        const factorKey = document.getElementById('s1-fuel-type').value;
        addGhgEntry({ scope: '範疇一', type: `固定源: ${ghgEmissionFactors[factorKey].name}`, amount: parseFloat(document.getElementById('s1-fuel-amount').value), factorKey: factorKey });
        document.getElementById('ghg-scope1-stationary-form').reset();
    });
    document.getElementById('add-s1-mobile').addEventListener('click', () => {
        const factorKey = document.getElementById('s1-mobile-fuel-type').value;
        addGhgEntry({ scope: '範疇一', type: `移動源: ${ghgEmissionFactors[factorKey].name}`, amount: parseFloat(document.getElementById('s1-mobile-fuel-amount').value), factorKey: factorKey });
        document.getElementById('ghg-scope1-mobile-form').reset();
    });
    document.getElementById('add-s1-fugitive').addEventListener('click', () => {
        const factorKey = document.getElementById('s1-refrigerant-type').value;
        addGhgEntry({ scope: '範疇一', type: `逸散源: ${ghgEmissionFactors[factorKey].name}`, amount: parseFloat(document.getElementById('s1-refrigerant-amount').value), factorKey: factorKey });
        document.getElementById('ghg-scope1-fugitive-form').reset();
    });
    document.getElementById('add-s2-electricity').addEventListener('click', () => {
        addGhgEntry({ scope: '範疇二', type: '外購電力', amount: parseFloat(document.getElementById('s2-electricity-amount').value), factorKey: 'electricity' });
        document.getElementById('ghg-scope2-form').reset();
    });
    document.getElementById('add-s3-waste').addEventListener('click', () => {
        addGhgEntry({ scope: '範疇三', type: '委外處理廢棄物', amount: parseFloat(document.getElementById('s3-waste-amount').value), factorKey: 'mixed-waste' });
        document.getElementById('ghg-scope3-waste-form').reset();
    });
    document.getElementById('add-s3-travel').addEventListener('click', () => {
        const factorKey = document.getElementById('s3-travel-type').value;
        addGhgEntry({ scope: '範疇三', type: `商務差旅: ${ghgEmissionFactors[factorKey].name}`, amount: parseFloat(document.getElementById('s3-travel-distance').value), factorKey: factorKey });
        document.getElementById('ghg-scope3-travel-form').reset();
    });
    document.getElementById('add-s3-commute').addEventListener('click', () => {
        const factorKey = document.getElementById('s3-commute-type').value;
        addGhgEntry({ scope: '範疇三', type: `員工通勤: ${ghgEmissionFactors[factorKey].name}`, amount: parseFloat(document.getElementById('s3-commute-distance').value), factorKey: factorKey });
        document.getElementById('ghg-scope3-commute-form').reset();
    });
    document.getElementById('add-s3-transport').addEventListener('click', () => {
        const factorKey = document.getElementById('s3-transport-mode').value;
        addGhgEntry({ scope: '範疇三', type: `上游運輸: ${ghgEmissionFactors[factorKey].name}`, amount: parseFloat(document.getElementById('s3-transport-distance').value), factorKey: factorKey });
        document.getElementById('ghg-scope3-transport-form').reset();
    });

    ghgDataTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-ghg-entry')) {
            inventoryData.ghgEntries.splice(parseInt(e.target.dataset.index, 10), 1);
            saveAndRender();
        }
    });

    importCsvButton.addEventListener('click', () => csvImportInput.click());
    csvImportInput.addEventListener('change', handleCsvImport);
    exportCsvButton.addEventListener('click', exportToCSV);
    generateReportButton.addEventListener('click', generateReport);

    await initializeApp();
});