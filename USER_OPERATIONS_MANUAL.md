# Orvella Pharmacy System: User Operations Manual & Training Guide

Welcome to your new Pharmacy Management System! This guide is designed for pharmacists, cashiers, and store managers. It explains how to complete daily pharmacy tasks efficiently and safely from scratch.

---

## 1. System Navigation & Logging In
1. Open your web browser and navigate to the system login page.
2. Enter your unique **Email Address** and **Password** provided by your system administrator.
3. Click **Log In**. 

*Security Note: The system records all logins, logouts, and failed attempts inside a protected security ledger to monitor and prevent unauthorized access.*

---

## 2. Dynamic Operations Dashboard
The main landing page is your **Command Center**. It displays real-time pharmacy metrics at a glance:
*   **Low Stock Alerts (Amber Banner):** Lists medications that have dropped below their minimum safety threshold levels and need reordering.
*   **Near-Expiry Warnings (Red Banner):** Flags medication batch lots that are expiring within the next 30 days or have already expired.
*   **Financial Trends Charts:** A live interactive graph charting daily or weekly revenues (sales), overhead operational expenses, and net profit margins side-by-side.
*   **Inventory Velocity:** Displays your top 5 fast-moving drugs vs. slow-moving stock lines to optimize purchasing.

---

## 3. Managing the Medication Catalog & Inventory Stock
Navigate to the **Inventory Console** page on your sidebar menu to manage pharmacy products.

### A. Expanding a Product Profile
Click anywhere on a product row in the list to reveal its full batch-tracking details and available stock control actions.

### B. Dynamic Barcode Sticker Label Printing
1. Expand any product formulation row.
2. You will see a high-contrast **Dynamic Shelf Barcode Label** card on your screen.
3. Click the **Print Sticker Label** helper text shortcut.
4. A small dedicated browser window will open containing the vector barcode—this window will trigger your barcode label printing machine natively.

### C. Manual Batch Inventory Adjustments (Damages & Expiries)
If physical inventory items are damaged during transit or expire on the shelves, process an adjustment to update system balances:
1. Click the **Batch Adjustments** button inside an expanded product row.
2. Select the specific **Target Product Batch Lot** from the dropdown menu.
3. Input the **Quantity Delta** variance integer (e.g., type `-12` to deduct 12 ruined items).
4. Select the **Adjustment Type** classification (Correction, Damaged, or Expired).
5. Type an explicit **Justification Reason** explaining the variance (e.g., *"Broken bottle during stock count"*).
6. Click **Post Adjustment Log** to instantly update the shelf total balance.

---

## 4. Centralized Bulk Spreadsheet Data Migration Hub
If your facility is onboarding hundreds of product lines, supplier profiles, or historical patient charts, you can upload them at high speed using formatted `.csv` template files.

1. Go to the **Bulk Data Migration Hub** on the sidebar menu.
2. Choose your active data entity category tab: **Users, Patients, Products,** or **Suppliers**.
3. Review the dark **Structure Rules Manifest** code box helper block visible on the left section of your dashboard.
4. Open your blank data template in Microsoft Excel, enter your records under the correct column headers, and save the document as a comma-delimited **.CSV** file.
5. Drag and drop or browse to select your populated data sheet file inside the right panel wrapper box.
6. Click the blue button: **Finalize Migration Ingestion**. A notification box will appear to confirm how many row records were successfully written into the tables!

---

## 5. Exporting Compliant System Reports
The platform supports live filtering and high-contrast, professional report extractions for compliance audits.

### A. Generating a Report Document
1. Navigate to the target report screen (e.g., **Patient Registry Pipeline** or **Security Audit Trails**).
2. Apply your specific filter criteria, keyword searches, or custom date limits using the filter toolbar.
3. Click **Query Trails** or **Search** to dynamically filter your records on-screen.

### B. High-Speed File Extractions
*   **Export Excel/CSV Button:** Generates a structured data spreadsheet prepended with your dynamic corporate branding layout info block (Company Name, Address, Tel, and Email).
*   **Export PDF Button:** Launches a high-contrast, modern, browser-printable window interface layout that embeds your company logo and specific primary hex brand color lines seamlessly onto the top header banner of the official data grid sheet. Click **Print PDF Document** to print physical copies or save it digitally to your machine.

---

## 6. Automated Off-Site Disaster Recovery Backups
To protect your pharmacy records from unexpected computer or hardware terminal crashes, the system handles database storage protection automatically:
*   **Nightly Automation:** Every single night at exactly midnight, an automated helper task takes a complete snapshot of your data records.
*   **Off-site Secure Storage:** This data snapshot file is securely sent straight to your organization's administrative email address layout caches, providing a permanent off-site recovery archive.

