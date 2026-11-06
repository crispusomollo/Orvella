# 💊 PharmaCore OS: Enterprise Pharmacy Management & Security Suite

<p align="center">
  <img src="https://shields.io" alt="Laravel Version" />
  <img src="https://shields.io" alt="React Version" />
  <img src="https://shields.io" alt="PostgreSQL" />
  <img src="https://shields.io" alt="Runtime Environment" />
  <img src="https://shields.io" alt="System Stability" />
</p>



PharmaCore OS is a high-performance, white-labeled, enterprise-grade Pharmacy Operations and Point-of-Sale (POS) ecosystem. It is specifically architected to run seamlessly inside a hybrid Windows 11 and Ubuntu Linux WSL2 environment. The platform automates clinical workflows, coordinates predictive multi-vendor procurements, and enforces high-security network perimeters natively out-of-the-box.

---

## 🚀 Key System Features

### 🛒 High-Velocity POS Register Desk
* **FEFO Lot Allocation:** Automated inventory checkout streams pull exclusively from the nearest expiring batch lots via strict *First-Expired, First-Out* logic.
* **Flexible Payments:** Supports counter discount provisions and complex real-time cashier split payment matrix maps (Cash, M-Pesa reference trackers, and Credit Cards).
* **Thermal Receipt Output:** Native integration with standard 80mm formatting templates for instant point-of-sale customer receipt generation.

### 📦 Predictive Reordering & Intake Logistics
* **Predictive Procurement Engine:** Automatically groups inventory threshold deficit lines and drafts supplier purchase orders without multi-row stacking conflicts.
* **Staged Intake Queue:** Simplifies restock check-ins by auto-loading temporary auto-PO lots, directly appending liabilities to wholesaler ledgers.

### 🛡️ Administrative Security & Infrastructure Telemetry
* **Terminal IP Whitelisting:** A global middleware layer monitors incoming terminal addresses, instantly locking out unauthorized hardware.
* **Invisible Background Operations:** Hidden execution scripts background the Laravel Artisan and React Vite engines, preventing accidental user console closures.
* **Live System Telemetry:** Centralized dashboard charts reveal real-time disk partition volumes, WSL RAM capacities, and active PostgreSQL query threads.

---

## 🛠️ Technology Stack Architecture

* **Backend Framework:** Laravel 11 (PHP 8.3/8.5 optimized)
* **Frontend View Layer:** React.js integrated with Inertia.js (Zero-API state synchronization)
* **Database Engine:** PostgreSQL 16+ relational schema with cascaded integrity constraints
* **Asset Compilation Pipeline:** Vite Dev Server with hot module replacement
* **Styling Framework:** Tailwind CSS with modern UI configurations
* **Operational Control Icons:** Lucide React suite indicators

## 📦 Setup & Deployment Instruction Runbook

### 1. Prerequisites Configuration
Ensure your modern target computer environment has Windows 11 with WSL2 (Ubuntu Linux) turned on. Run this command chain inside your Ubuntu shell to provision core extensions:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y php-cli php-xml php-mbstring php-pgsql php-curl php-zip unzip nodejs npm postgresql postgresql-contrib
```

### 2. Database Schema Initialization
Connect directly to your active PostgreSQL cluster instance:
```bash
sudo service postgresql start
sudo -u postgres psql
```
Execute these configuration commands to set up your isolated schema:
```sql
CREATE DATABASE pharmacy_app_production;
CREATE USER postgres_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE pharmacy_app_production TO postgres_user;
\q
```

### 3. Repository Cloning & Environmental Provisioning
Pull the codebase down from your GitHub cloud storage vault:
```bash
cd ~/projects
git clone https://github.com
cd pharmacy-app

# Sync application libraries dependencies
composer install --no-dev --optimize-autoloader
npm install
npm run build

# Configure environment settings keys
cp .env.example .env
```
Open your newly created `.env` file via `nano .env`, map your `DB_DATABASE=pharmacy_app_production` and matching database user credentials, then compile your structural layouts:
```bash
php artisan key:generate
php artisan migrate --force
```

### 4. Background Server Execution
To run the system completely invisibly without open terminal prompts on the screen, copy your `Run_Pharmacy_Invisibly.vbs` script onto the Windows Desktop and double-click it. The app will launch smoothly on your dedicated channel: `http://127.0.0.1:8080`.

---

## ⚡ Automated Maintenance & Updates Workflow

The repository includes a single-click deployment script (`deploy.sh`) to simplify synchronizing remote target computers when code revisions are merged into production.

To update any live client counter station machine instantly, simply navigate to the app directory and execute the runbook script file:
```bash
./deploy.sh
```

---

## 📂 Primary Structural Directory Map
```text
pharmacy-app/
├── app/
│   ├── Http/Controllers/       # Authoritative Transactional Controllers
│   ├── Http/Middleware/        # Whitelist IP Security Access Guards
│   └── Models/                 # Relational Database Eloquent Models
├── config/                     # Core System Configuration Sheets
├── database/
│   ├── migrations/             # Database Relational Table Blueprints
│   └── seeders/                # Insurance Provider Directory Seeders
├── resources/js/
│   ├── Layouts/                # Sidebar Component Navigation Shells
│   └── Pages/                  # React Interface Canvas Dashboard Panels
├── routes/
│   └── web.php                 # Synced Application Endpoint Map Registries
├── deploy.sh                   # Single-Click Automated Update Script
└── README.md                   # Repository Documentation Dashboard
```

---

## 📄 License & Distribution Terms
Commercial Proprietary Source Code Framework. All exploitation, modification, and reproduction distribution rights belong strictly to **Orvella Pharmacy System Deployments**.
