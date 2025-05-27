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
