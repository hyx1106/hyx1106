document.addEventListener('DOMContentLoaded', () => {

    // --- Emission Factors Database ---
    const ghgEmissionFactors = {
        // Data Source: Taiwan EPA GHG Emission Factors (or IPCC defaults as fallback)
        // 單位: kgCO2e / unit
        'natural-gas': { factor: 2.02, unit: 'm3' },      // 天然氣, kgCO2e/m³
        'diesel': { factor: 2.66, unit: 'l' },         // 柴油, kgCO2e/L
        'gasoline': { factor: 2.28, unit: 'l' },        // 汽油, kgCO2e/L
        'electricity': { factor: 0.502, unit: 'kWh' },    // 電力, kgCO2e/度 (2022年電力排碳係數)
        'mixed-waste': { factor: 531, unit: 'tonne' } // 混合事業廢棄物, kgCO2e/公噸
    };

    // --- DOM Element References ---
    const ghgDataTableBody = document.getElementById('ghg-data-table').getElementsByTagName('tbody')[0];
    const productNameInput = document.getElementById('product-name');
    const productAmountInput = document.getElementById('product-amount');

    // --- Data Management ---
    // Load data from localStorage or initialize with default structure
    let inventoryData = JSON.parse(localStorage.getItem('inventoryData')) || {
        productName: '',
        productAmount: 0,
        ghgEntries: []
    };

    // --- Core Functions ---
    function calculateEmissionIntensity() {
        const totalGhg = parseFloat(document.getElementById('total-ghg').textContent) || 0;
        const productAmount = parseFloat(inventoryData.productAmount) || 0;
        const intensitySpan = document.getElementById('emission-intensity');

        if (totalGhg > 0 && productAmount > 0) {
            const intensity = totalGhg / productAmount;
            intensitySpan.textContent = intensity.toFixed(4);
        } else {
            intensitySpan.textContent = '0.0000';
        }
    }

    function saveAndRender() {
        // Save the entire data object to localStorage
        localStorage.setItem('inventoryData', JSON.stringify(inventoryData));

        // Render the table
        ghgDataTableBody.innerHTML = '';
        let totalScope1 = 0, totalScope2 = 0, totalScope3 = 0;

        inventoryData.ghgEntries.forEach((data, index) => {
            const newRow = ghgDataTableBody.insertRow();
            newRow.innerHTML = `
                <td>${data.scope}</td>
                <td>${data.type}</td>
                <td>${data.activity}</td>
                <td>${data.emissions.toFixed(4)}</td>
                <td><button class="delete-ghg-entry" data-index="${index}">刪除</button></td>
            `;
            if (data.scope === '範疇一') totalScope1 += data.emissions;
            if (data.scope === '範疇二') totalScope2 += data.emissions;
            if (data.scope === '範疇三') totalScope3 += data.emissions;
        });

        // Update summary
        document.getElementById('total-scope1').textContent = totalScope1.toFixed(4);
        document.getElementById('total-scope2').textContent = totalScope2.toFixed(4);
        document.getElementById('total-scope3').textContent = totalScope3.toFixed(4);
        const totalGhg = totalScope1 + totalScope2 + totalScope3;
        document.getElementById('total-ghg').textContent = totalGhg.toFixed(4);

        // Update product info in the form
        productNameInput.value = inventoryData.productName;
        productAmountInput.value = inventoryData.productAmount > 0 ? inventoryData.productAmount : '';

        // Recalculate CBAM intensity
        calculateEmissionIntensity();
    }

    function addGhgEntry(scope, type, activity, amount, factorKey) {
        const factorInfo = ghgEmissionFactors[factorKey];
        if (!factorInfo || !amount || amount <= 0) {
            alert('請輸入有效的正數活動數據！');
            return;
        }

        const emissionsInKg = amount * factorInfo.factor;
        const emissionsInTonnes = emissionsInKg / 1000;

        inventoryData.ghgEntries.push({
            scope: scope,
            type: type,
            activity: activity,
            emissions: emissionsInTonnes
        });

        saveAndRender();
    }

    // --- Event Listeners ---

    // Product Info
    productNameInput.addEventListener('input', (e) => {
        inventoryData.productName = e.target.value;
        localStorage.setItem('inventoryData', JSON.stringify(inventoryData)); // Save on change
    });
    productAmountInput.addEventListener('input', (e) => {
        inventoryData.productAmount = parseFloat(e.target.value) || 0;
        calculateEmissionIntensity(); // Recalculate intensity live
        localStorage.setItem('inventoryData', JSON.stringify(inventoryData)); // Save on change
    });

    // Scope 1 Stationary
    document.getElementById('add-s1-stationary').addEventListener('click', () => {
        const fuelType = document.getElementById('s1-fuel-type').value;
        const fuelAmount = parseFloat(document.getElementById('s1-fuel-amount').value);
        const fuelUnitEl = document.getElementById('s1-fuel-unit');
        const fuelUnitText = fuelUnitEl.options[fuelUnitEl.selectedIndex].text;
        const typeName = document.getElementById('s1-fuel-type').options[document.getElementById('s1-fuel-type').selectedIndex].text;

        addGhgEntry('範疇一', `固定源: ${typeName}`, `${fuelAmount} ${fuelUnitText}`, fuelAmount, fuelType);
        document.getElementById('ghg-scope1-stationary-form').reset();
    });

    // Scope 1 Mobile
    document.getElementById('add-s1-mobile').addEventListener('click', () => {
        const fuelType = document.getElementById('s1-mobile-fuel-type').value;
        const fuelAmount = parseFloat(document.getElementById('s1-mobile-fuel-amount').value);
        const typeName = document.getElementById('s1-mobile-fuel-type').options[document.getElementById('s1-mobile-fuel-type').selectedIndex].text;

        addGhgEntry('範疇一', `移動源: ${typeName}`, `${fuelAmount} 公升 (L)`, fuelAmount, fuelType);
        document.getElementById('ghg-scope1-mobile-form').reset();
    });

    // Scope 2 Electricity
    document.getElementById('add-s2-electricity').addEventListener('click', () => {
        const amount = parseFloat(document.getElementById('s2-electricity-amount').value);
        addGhgEntry('範疇二', '外購電力', `${amount} 度 (kWh)`, amount, 'electricity');
        document.getElementById('ghg-scope2-form').reset();
    });

    // Scope 3 Waste
    document.getElementById('add-s3-waste').addEventListener('click', () => {
        const amount = parseFloat(document.getElementById('s3-waste-amount').value);
        addGhgEntry('範疇三', '委外處理廢棄物', `${amount} 公噸`, amount, 'mixed-waste');
        document.getElementById('ghg-scope3-waste-form').reset();
    });

    // Delete Entry (Event Delegation)
    ghgDataTableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-ghg-entry')) {
            const indexToDelete = parseInt(event.target.dataset.index, 10);
            inventoryData.ghgEntries.splice(indexToDelete, 1);
            saveAndRender();
        }
    });

    // --- Initial Load ---
    saveAndRender(); // Initial render to display any stored data
});