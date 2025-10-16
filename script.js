// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- Module Switching Logic ---
    const sidebarLinks = document.querySelectorAll('#sidebar ul li a');
    const moduleContents = document.querySelectorAll('.module-content');
    const dashboardContent = document.getElementById('dashboard-content'); // Specifically the dashboard

    // Function to hide all module contents
    function hideAllModules() {
        moduleContents.forEach(content => {
            content.style.display = 'none';
        });
        // Also explicitly hide dashboard if it's not part of moduleContents query (it should be)
        if (dashboardContent) {
            dashboardContent.style.display = 'none';
        }
    }

    // Function to show a specific module
    function showModule(moduleId) {
        hideAllModules();
        const moduleToShow = document.getElementById(moduleId + '-content');
        if (moduleToShow) {
            moduleToShow.style.display = 'block';
        } else if (moduleId === 'dashboard' && dashboardContent) { // Special case for dashboard if ID is just 'dashboard-content'
            dashboardContent.style.display = 'block';
        }
    }

    // Add event listeners to sidebar links
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const moduleName = event.target.dataset.module;
            if (moduleName) {
                showModule(moduleName);
            }
        });
    });

    // Initial state: Show dashboard by default
    showModule('dashboard'); // Assumes dashboard content div has id "dashboard-content"

    // --- GHG Inventory Logic ---

    const ghgEmissionFactors = {
        // Data Source: Taiwan EPA GHG Emission Factors (or IPCC defaults as fallback)
        // Note: Using simplified CO2e factors for this example. A real tool would have separate factors for CO2, CH4, N2O and their GWPs.
        // 單位: kgCO2e / unit
        'natural-gas': { factor: 2.02, unit: 'm3' }, // 天然氣, kgCO2e/m³
        'diesel': { factor: 2.66, unit: 'l' },      // 柴油, kgCO2e/L
        'gasoline': { factor: 2.28, unit: 'l' },     // 汽油, kgCO2e/L
        'electricity': { factor: 0.502, unit: 'kWh' }, // 電力, kgCO2e/度 (2022年電力排碳係數)
        'mixed-waste': { factor: 0.531 * 1000, unit: 'tonne' } // 混合事業廢棄物, kgCO2e/公噸 (轉換為kg)
    };

    const ghgDataTableBody = document.getElementById('ghg-data-table').getElementsByTagName('tbody')[0];
    let ghgData = []; // Array to store GHG data entries

    function renderGhgTable() {
        ghgDataTableBody.innerHTML = ''; // Clear existing table
        let totalScope1 = 0, totalScope2 = 0, totalScope3 = 0;

        ghgData.forEach((data, index) => {
            const newRow = ghgDataTableBody.insertRow();
            newRow.innerHTML = `
                <td>${data.scope}</td>
                <td>${data.type}</td>
                <td>${data.activity}</td>
                <td>${data.emissions.toFixed(4)}</td>
                <td><button class="delete-ghg-entry" data-index="${index}">刪除</button></td>
            `;

            // Sum up totals
            if (data.scope === '範疇一') totalScope1 += data.emissions;
            if (data.scope === '範疇二') totalScope2 += data.emissions;
            if (data.scope === '範疇三') totalScope3 += data.emissions;
        });

        // Update summary
        document.getElementById('total-scope1').textContent = totalScope1.toFixed(4);
        document.getElementById('total-scope2').textContent = totalScope2.toFixed(4);
        document.getElementById('total-scope3').textContent = totalScope3.toFixed(4);
        document.getElementById('total-ghg').textContent = (totalScope1 + totalScope2 + totalScope3).toFixed(4);
    }

    function addGhgEntry(scope, type, activity, amount, factorKey, unit) {
        const factorInfo = ghgEmissionFactors[factorKey];
        if (!factorInfo || !amount) {
            alert('請輸入有效的活動數據！');
            return;
        }

        // The calculation is done in kgCO2e, then converted to tonnes (tCO2e) for display
        const emissionsInKg = amount * factorInfo.factor;
        const emissionsInTonnes = emissionsInKg / 1000;

        ghgData.push({
            scope: scope,
            type: type,
            activity: `${amount} ${unit}`,
            emissions: emissionsInTonnes
        });

        renderGhgTable();
    }

    // Event Listener for adding Scope 1 Stationary source
    document.getElementById('add-s1-stationary').addEventListener('click', () => {
        const fuelType = document.getElementById('s1-fuel-type').value;
        const fuelAmount = parseFloat(document.getElementById('s1-fuel-amount').value);
        const fuelUnit = document.getElementById('s1-fuel-unit').options[document.getElementById('s1-fuel-unit').selectedIndex].text;
        const typeName = document.getElementById('s1-fuel-type').options[document.getElementById('s1-fuel-type').selectedIndex].text;

        addGhgEntry('範疇一', `固定源: ${typeName}`, `${fuelAmount} ${fuelUnit}`, fuelAmount, fuelType, fuelUnit);
        document.getElementById('ghg-scope1-stationary-form').reset();
    });

    // Event Listener for adding Scope 1 Mobile source
    document.getElementById('add-s1-mobile').addEventListener('click', () => {
        const fuelType = document.getElementById('s1-mobile-fuel-type').value;
        const fuelAmount = parseFloat(document.getElementById('s1-mobile-fuel-amount').value);
        const typeName = document.getElementById('s1-mobile-fuel-type').options[document.getElementById('s1-mobile-fuel-type').selectedIndex].text;

        addGhgEntry('範疇一', `移動源: ${typeName}`, `${fuelAmount} 公升 (L)`, fuelAmount, fuelType, '公升 (L)');
        document.getElementById('ghg-scope1-mobile-form').reset();
    });

    // Event Listener for adding Scope 2 Electricity
    document.getElementById('add-s2-electricity').addEventListener('click', () => {
        const amount = parseFloat(document.getElementById('s2-electricity-amount').value);
        addGhgEntry('範疇二', '外購電力', `${amount} 度 (kWh)`, amount, 'electricity', '度 (kWh)');
        document.getElementById('ghg-scope2-form').reset();
    });

    // Event Listener for adding Scope 3 Waste
    document.getElementById('add-s3-waste').addEventListener('click', () => {
        const amount = parseFloat(document.getElementById('s3-waste-amount').value);
        addGhgEntry('範疇三', '委外處理廢棄物', `${amount} 公噸`, amount, 'mixed-waste', '公噸');
        document.getElementById('ghg-scope3-waste-form').reset();
    });

    // Event listener for deleting GHG entries (using event delegation)
    ghgDataTableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-ghg-entry')) {
            const indexToDelete = parseInt(event.target.dataset.index, 10);
            ghgData.splice(indexToDelete, 1); // Remove the entry from the array
            renderGhgTable(); // Re-render the table and totals
        }
    });

    // --- Form Data Handling Logic ---

    // Helper function to handle form submission and table update
    function handleFormSubmit(formId, tableBodyId, fieldNames) {
        const form = document.getElementById(formId);
        const tableBody = document.getElementById(tableBodyId).getElementsByTagName('tbody')[0];

        if (!form || !tableBody) {
            console.error(`Form or table body not found for ${formId}/${tableBodyId}`);
            return;
        }

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const newRow = tableBody.insertRow();

            fieldNames.forEach(fieldName => {
                const cell = newRow.insertCell();
                const inputElement = form.elements[fieldName];
                if (inputElement) {
                    cell.textContent = inputElement.value;
                } else {
                    console.warn(`Input field ${fieldName} not found in form ${formId}`);
                    cell.textContent = ''; // Add empty string if field not found
                }
            });

            form.reset(); // Reset form fields
        });
    }

    // Air Pollution Form
    handleFormSubmit('air-pollution-form', 'air-pollution-display', 
        ['air_point', 'air_date', 'air_pollutant', 'air_concentration', 'air_unit']);

    // Wastewater Pollution Form
    handleFormSubmit('wastewater-pollution-form', 'wastewater-pollution-display',
        ['water_point', 'water_date', 'water_parameter', 'water_value', 'water_unit']);

    // Waste Management Form
    handleFormSubmit('waste-management-form', 'waste-management-display',
        ['waste_type', 'waste_date', 'waste_quantity', 'waste_unit', 'waste_disposal_method', 'waste_responsible_person']);

    // Chemical Management Form
    handleFormSubmit('chemical-management-form', 'chemical-management-display',
        ['chem_name', 'chem_cas', 'chem_location', 'chem_quantity', 'chem_unit', 'chem_responsible_person']);

    // OSH Hazard Form
    handleFormSubmit('osh-hazard-form', 'osh-hazard-display',
        ['hazard_desc', 'hazard_location', 'hazard_risk_level', 'hazard_controls', 'hazard_responsible', 'hazard_target_date']);

    // OSH Machinery Form
    handleFormSubmit('osh-machinery-form', 'osh-machinery-display',
        ['machine_name', 'machine_asset_id', 'machine_inspection_item', 'machine_inspection_date', 'machine_status', 'machine_corrective_action']);

    // OSH Chemical Form
    handleFormSubmit('osh-chemical-form', 'osh-chemical-display',
        ['osh_chem_name', 'osh_chem_cas', 'osh_chem_ghs', 'osh_chem_sds_link', 'osh_chem_location', 'osh_chem_max_qty', 'osh_chem_unit']);

    // OSH Monitoring Form
    handleFormSubmit('osh-monitoring-form', 'osh-monitoring-display',
        ['monitoring_area', 'monitoring_item', 'monitoring_strategy', 'monitoring_date', 'monitoring_result', 'monitoring_unit_responsible']);

    // OSH Assessment Form
    handleFormSubmit('osh-assessment-form', 'osh-assessment-display',
        ['assessment_location', 'assessment_type', 'assessment_date', 'assessment_findings', 'assessment_recommendations', 'assessment_assessor']);

    // OSH Procurement, Contractor, Change Management Form
    handleFormSubmit('osh-pcm-form', 'osh-pcm-display',
        ['pcm_type', 'pcm_item_name', 'pcm_date', 'pcm_safety_review', 'pcm_review_result', 'pcm_responsible_person']);

    // OSH Safety Standards Form
    handleFormSubmit('osh-standards-form', 'osh-standards-display',
        ['standard_name', 'standard_id', 'standard_scope', 'standard_issue_date', 'standard_doc_link']);

    // OSH Inspections Form
    handleFormSubmit('osh-inspections-form', 'osh-inspections-display',
        ['inspection_type', 'inspection_area_item', 'inspection_date', 'inspection_findings', 'inspection_recommendations', 'inspection_inspector']);

    // OSH Training Form
    handleFormSubmit('osh-training-form', 'osh-training-display',
        ['training_course_name', 'training_date', 'training_trainer', 'training_attendees', 'training_duration', 'training_assessment']);

    // OSH PPE Form
    handleFormSubmit('osh-ppe-form', 'osh-ppe-display',
        ['ppe_type', 'ppe_item_name', 'ppe_recipient', 'ppe_issue_date', 'ppe_check_date', 'ppe_quantity']);

    // OSH Health Form
    handleFormSubmit('osh-health-form', 'osh-health-display',
        ['health_activity_name', 'health_activity_type', 'health_implementation_date', 'health_participants', 'health_content_results', 'health_responsible_person']);

    // OSH Information Form
    handleFormSubmit('osh-info-form', 'osh-info-display',
        ['info_topic', 'info_source', 'info_collection_date', 'info_sharing_method', 'info_application']);

    // OSH Emergency Response Form
    handleFormSubmit('osh-emergency-form', 'osh-emergency-display',
        ['emergency_scenario', 'emergency_plan_doc', 'emergency_drill_date', 'emergency_drill_results', 'emergency_responsible']);

    // OSH Incident Investigation Form
    handleFormSubmit('osh-incident-form', 'osh-incident-display',
        ['incident_type', 'incident_date', 'incident_description', 'incident_findings', 'incident_corrective_actions', 'incident_stats_category']);

    // OSH Records and Performance Form
    handleFormSubmit('osh-records-form', 'osh-records-display',
        ['record_indicator_name', 'record_eval_period', 'record_performance_result', 'record_improvement_suggestions', 'record_responsible']);

    // OSH Other Measures Form
    handleFormSubmit('osh-other-form', 'osh-other-display',
        ['other_measure_name', 'other_measure_description', 'other_measure_date', 'other_measure_effectiveness']);

});
