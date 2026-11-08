# Pharmacy Management System: Technical Architecture & Operational Guide

This document serves as the foundational technical brief and operational reference manual for the core pharmacy application deployed within a **WSL2 (Ubuntu) on Windows 11** development footprint.

---

## 1. System Architecture & Stack Profile

The application utilizes a **monolithic hyper-responsive client-server model** handled via server-side routing controllers rendering client views natively.

*   **Backend Core Framework:** Laravel 11.x (PHP 8.3 Runtime)
*   **Frontend User Interface:** React 18.x (Inertia.js Monolith Linkage)
*   **Database Infrastructure:** PostgreSQL 16+ (Normalized Relational Layout)
*   **Compilation Engine Stack:** Vite + TailwindCSS 3.x / 4.x

---

## 2. Infrastructure & Application Management

### Local Service Controls (WSL2 Command Line Interface)
Manage development environment dependencies within your active WSL Ubuntu session:

```bash
# Initialize core system service endpoints
sudo service postgresql start

# Start the concurrent hot-reloading asset compiler
npm run dev

# Spin up local development server instance
php artisan serve
```

### Critical Environment Matrix Variables (`.env`)
The database connection, mail tracking layer, and system paths are controlled via the root configuration file:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=pharmacy_system
DB_USERNAME=pharmacy_admin
DB_PASSWORD=SecurePass123!

MAIL_MAILER=log
MAIL_FROM_ADDRESS="vault-backups@orvella.com"
```

---

## 3. Core Technical Features & Commands

### 📊 Security & Operations Audit Logging Pipeline
All administrative modifications and report extractions flow through a centralized, automated helper class. Authentication steps like successful logins, sign-out commands, or unauthorized intrusion exceptions hook directly into the core engine event listeners. Report generations automatically trigger an HTTP interception route path middleware that extracts metadata tags on the fly.

### 💾 Disaster Recovery & Off-Site Vault Snapshots
The snapshot system dumps tables cleanly via a shell command loop invoking the native `pg_dump` binary. Snapshots format using optimized compression targets (`-F c`), output into an insulated local folder directory structure (`storage/app/backups/`), log an entry inside the database registry rows, and stream the raw file straight out to the administrative contact inbox. 
*   **Manual Trigger CLI Command:**
    ```bash
    php artisan system:database-offsite-backup
    ```

### 🔁 The Ingestion Hub & Sequence Recalibration Tools
The application implements an **Administrative Testing & Data Reset Daemon Script**. This utility runs cascading table truncations to clean transactional layers without touching master staff registry roles. It syncs the PostgreSQL serial tables index key sequences back to 1 to block key collisions, and clears the application view cache.
*   **Unified Development Hard-Reset Command:**
    ```bash
    php artisan system:hard-reset
    ```

---

## 4. Centralized Bulk Migration File Blueprint Schema

When loading bulk assets using the **Centralized Migration Panel Interface**, ensure your uploaded `.csv` formatting rows possess these exact case-sensitive header naming conventions in Line #1:

### A. Staff Identity Template (`users`)
```csv
Full Name,Email,Role,Default Password
```

### B. Registered Patient Template (`patients`)
```csv
Patient Name,Phone Number,Patient Number
```

### C. Medication Formulary Template (`products`)
```csv
Medication Name,Generic Formulation,Form Category,Safety Reorder Level,Requires Rx Script
```

### D. Wholesaler Supplier Template (`suppliers`)
```csv
Wholesaler Name,Contact Person,Telephone,Email Address,Physical Address
```

---

## 5. Directory Layout & Key Component Registry

*   **Database Migrations & Seeders:** `/database/migrations/`, `/database/seeders/PharmacyEcosystemSeeder.php`
*   **Central Activity Logger Service:** `/app/Services/ActivityLogger.php`
*   **File Stream Controllers:** `/app/Http/Controllers/DataMigrationHubController.php`, `/app/Http/Controllers/ReportingController.php`
*   **Interfaced Frontend Page Matrix Components:** `/resources/js/Pages/Admin/DataMigrationHub.jsx`, `/resources/js/Pages/Stock/ManagementConsole.jsx`

