# PHARMACEUTICAL MANAGEMENT SYSTEMS OPERATIONS MANUAL
*Authoritative Workflow Guide for Zack Chemists / Orvella Pharmacy System Deployments*

---

## VOLUME 1: END-USER OPERATIONS MANUAL
*A non-technical guide to running daily pharmacy workflows, checkout terminals, and inventory controls.*

### 1. Daily System Initialization
To launch the pharmacy operations platform at the start of a business shift:
1. Navigate to your Windows 11 Desktop.
2. Double-click the **Launch Pharmacy System** shortcut icon.
3. The system will initialize all database engines invisibly in the background. Within 5 seconds, your default web browser will automatically open directly to the login dashboard (`http://127.0.0.1:8000`).

### 2. Point of Sale (POS) Register Desk Workflow
The checkout register terminal manages rapid retail drug dispensation:
* **Attaching a Patient:** Use the search bar in the right-hand panel to lookup an existing patient chart profile by name or phone number. Linking a profile is legally required if the order contains prescription-only (Rx) molecules.
* **Dispensing Medications:** Type a drug name or scan the box barcode SKU. Click **Dispense** to add it to the active basket. The system automatically pulls stock from the nearest expiring batch lot using strict FEFO (First-Expired, First-Out) logic.
* **Discounts & Splits:** Apply flat cash discounts in the field provided. If a customer wishes to split payment (e.g., partial Cash and partial M-Pesa), tick **Split Payment Between Modes** and allocate the exact amounts.
* **Thermal Receipt Printing:** Click **Finalise Invoice**. An interactive preview modal will pop up. Click **Print Thermal Receipt** to output a formatted 80mm cash ticket.
* **Shift Closure:** At the end of an operating shift, click **End Operational Shift**. Cashiers must declare the exact physical cash, M-Pesa statements, and card slips counted in the drawer to complete the reconciliation audit.

### 3. Patient Care & Clinical Script Queue
* **Enrolling Patients:** Navigate to **Patient Care Registry**. Enter the client's name and telephone contact. Leave the Chart Number field blank; the system automatically assigns a consecutive identifier (e.g., `PAT-2026-0001`).
* **Queueing a Prescription:** Click the **Raise Script** tab. Select the patient file, enter the prescribing doctor's name, and append your medication items along with clear clinical dosage instructions (*Sig*). Click **Queue Multi-Script to Billing** to send it instantly to the cashier's active POS screen ribbon.

### 4. Low-Stock Reordering & Inward Consignment Intakes
* **Predictive Procurement:** When inventory drops below safety margins, items appear on the **Low Stock Threshold Replenishment Hub**. Click **Run Predictive Replenishment** to calculate necessary restocks and auto-group them into ready-to-receive supplier purchase orders.
* **Receiving Supplier Shipments:** Navigate to the **Inbound Purchase Orders** page. Select your sourcing wholesaler from the dropdown menu. Click the yellow **Load Staged Auto-PO** button to auto-fill the grid. Type in the physical manufacturer batch lot numbers and expiration dates printed on the boxes, then click **Ingest Inbound Consignment PO** to update live shelf stock levels.

---

## VOLUME 2: TECHNICAL REFERENCE & TROUBLESHOOTING MANUAL
*An administrative and engineering guide for system maintenance, infrastructure architecture, and database triage.*

### 1. Architectural Stack & Directory Mapping
The system leverages a hybrid Windows 11 and Ubuntu WSL (Windows Subsystem for Linux) runtime architecture:
* **Backend Core Engine:** Laravel 11 framework running inside the WSL environment (`/home/zach/projects/pharmacy-app`).
* **Database Management System:** PostgreSQL database engine (`pharmacy_db`).
* **Frontend View Layer:** React.js components compiled dynamically by Vite.
* **Persistent Assets/White-Labeling:** Public file storage links map brand logo assets directly through `public/branding/` using local system symlinks.

### 2. Database Schema Reference
Core transactional operations rely on the following primary tables inside PostgreSQL:
* `purchases`: Tracks procurement invoices. Active staged drafts utilize `status = 'Pending_Delivery'` to prevent duplicate order stacking, flipping atomically to `'Received'` on final stock intake.
* `supplier_ledgers`: Double-entry accounting tracking credit lines and debit pay-downs chronologically.
* `ip_whitelists`: Holds network terminal hardware security records used by the global intermediate middleware layer to validate access boundaries.

### 3. Administrative Triage & Troubleshooting Playbook

#### Scenario A: Browser throws `ERR_CONNECTION_REFUSED` on startup
* **Root Cause:** The invisible background initialization process was interrupted, or the local project directory mapping failed to spin up.
* **Resolution:** Verify if the background server nodes are alive by checking active ports via your WSL command console:
  ```bash
  netstat -tuln | grep 8000
  ```
  If ports are closed, force a manual server reset using your desktop **Stop Pharmacy Servers** tool, then double-click the primary launch icon again to rebuild the background process tunnels.

#### Scenario B: Layout elements display properly but CSS styling/React views appear broken or unstyled
* **Root Cause:** The Vite asset watcher compilation stream is offline or missing execution paths.
* **Resolution:** Check the persistent invisible compilation process status by explicitly launching an interactive development shell terminal:
  ```bash
  cd ~/projects/pharmacy-app
  npm run dev
  ```
  Review the terminal output lines to ensure Vite successfully hooks into port `5173`.

#### Scenario C: Low-stock medications keep reloading on the Inward Purchases page even after stock check-in
* **Root Cause:** A data conflict occurred where old duplicate testing rows remained stuck with a `Pending_Delivery` state status.
* **Resolution:** Connect directly to your PostgreSQL database instance using your terminal shell and purge the duplicate testing logs from your queue:
  ```bash
  sudo -u postgres psql -d pharmacy_db -c "DELETE FROM purchases WHERE purchase_order_number LIKE 'AUTO-PO-%' AND status = 'Pending_Delivery';"
  ```
  This flushes the queue completely. Running a fresh cycle will now compute a clean, single-entry restock workflow.

#### Scenario D: A worker accidentally locks themselves out or gets an "Access Denied" network boundary block
* **Root Cause:** The terminal's local IP address changed or was altered across the router network, violating active white-list rules.
* **Resolution:** Log into the backend database from your server terminal and append an emergency access exception rule, or temporarily clear the whitelist table to recover entry access:
  ```bash
  # To view active whitelist entries and assigned addresses
  sudo -u postgres psql -d pharmacy_db -c "SELECT * FROM ip_whitelists;"
  
  # Emergency fallback: Empty the table to allow access until reconfigured
  sudo -u postgres psql -d pharmacy_db -c "TRUNCATE TABLE ip_whitelists CASCADE;"

  sudo -u postgres psql -d pharmacy_db -c "TRUNCATE TABLE sales, sales_items, batches, purchase_items, purchases, supplier_ledgers, supplier_payments, audit_logs, activity_logs, shift_reconciliations RESTART IDENTITY CASCADE;"
  ```

