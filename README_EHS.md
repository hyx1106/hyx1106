# Basso EHS Management System - Development Guide

## Overview
This project is a customization of `yudao-ui-admin-vue3` for **Basso Industry Corp (鑽全實業股份有限公司)**.
It implements an EHS (Environment, Health, and Safety) Management System.

## Current Status
- **Frontend**: Vue 3 + Element Plus + Vite
- **Backend**: Mocked (Demo Mode enabled)

## Features Implemented
1. **Custom Branding**:
   - App Title: 鑽全實業股份有限公司 EHS 管理系統
   - Logo: Custom Basso EHS Logo
   - Login Page: Customized welcome message

2. **Dashboard**:
   - EHS Metrics: Safe Operation Days, Open Incidents, Pending Audits
   - Shortcuts: Quick access to EHS modules
   - Notices: Safety alerts and regulatory updates

3. **EHS Modules**:
   - **Incident Management (工安事故管理)**:
     - Path: `/ehs/incident`
     - Features: List incidents, "Create Incident" dialog (mock)
   - **SDS Management (SDS 管理)**:
     - Path: `/ehs/sds`
     - Features: List hazardous chemicals and SDS documents

## How to Run
1. Ensure Node.js (v16+) and pnpm are installed.
2. Run `pnpm install` to install dependencies.
3. Run `npm run dev` to start the development server.
4. Access the application at `http://localhost:80`.

## Demo Mode
Since the backend is not currently connected, the application is running in **Demo Mode**:
- **Login**: Click "Login" with any credentials (default: admin/admin123) to bypass authentication.
- **Data**: All data displayed is mock data defined in the frontend components.

## Next Steps
- Connect to real backend API.
- Implement full CRUD functionality for Incident and SDS modules.
- Add "Environment Management" and "Training" modules.
