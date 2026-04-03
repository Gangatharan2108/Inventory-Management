# 📦 Inventory Management System

A full-stack **Inventory Management System** built with **Django REST Framework** (backend) and **React + Vite** (frontend). Designed to help businesses manage products, sales, purchases, parties (customers & suppliers), payments, and user roles — all from a clean, responsive UI.

---

## 🚀 Features

- 🔐 **Authentication & Role-Based Access Control** — Owner, Manager, Supervisor, Employee roles with granular module permissions
- 📊 **Dashboard** — Sales, purchases, stock summary with interactive charts (Recharts)
- 🛒 **Product Management** — Categories, units (integer/decimal), stock tracking, product images, sub-unit conversion
- 🤝 **Party Management** — Customers and Suppliers with contact details
- 📥 **Purchase Management** — Record purchases with due/paid amount tracking
- 📤 **Sales Management** — Invoice generation, sale items, per-item pricing
- 💳 **Payment Tracking** — Payment history with processing overlay
- 🏭 **Damaged Stock** — Track and manage damaged inventory
- 📋 **Activity Log** — Full audit trail of all user actions
- 📈 **Reports** — Export to Excel (ExcelJS + file-saver)
- 🔑 **User Management** — Create users, assign roles, manage permissions per module
- 🔄 **Password Change Requests** — Workflow for password reset requests

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Python / Django | Core framework |
| Django REST Framework | REST API |
| SimpleJWT | JWT Authentication |
| SQLite (default) | Database |

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI Library |
| Vite | Build tool |
| React Router v7 | Routing |
| Axios | HTTP client |
| Bootstrap 5 + React-Bootstrap | UI components |
| Tailwind CSS | Utility styling |
| Recharts | Charts & graphs |
| ExcelJS + file-saver | Excel export |

---

## 📁 Project Structure

```
inventory_system/
├── backend/
│   ├── inventory/           # Main Django app
│   │   ├── models.py        # DB models (Product, Sale, Purchase, Party...)
│   │   ├── views.py         # API views
│   │   ├── serializers.py   # DRF serializers
│   │   ├── urls.py          # API routes
│   │   ├── permissions.py   # Custom permission classes
│   │   └── views_reports.py # Report generation
│   └── inventory_system/    # Django project settings
│       └── settings.py
└── frontend/
    └── src/
        ├── api/             # Axios service files
        ├── components/      # Reusable UI components
        ├── context/         # Auth & Toast context
        ├── layouts/         # Sidebar, Topbar, Layout
        └── pages/           # Feature pages (Dashboard, Products, Sales...)
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- pip

### Backend Setup

```bash
cd inventory_system/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# Install dependencies
pip install django djangorestframework djangorestframework-simplejwt Pillow django-cors-headers

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### Frontend Setup

```bash
cd inventory_system/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The frontend runs at `http://localhost:5173` and the backend API at `http://localhost:8000`.

---

## 🔑 Default Roles

| Role | Access Level |
|---|---|
| **Owner** | Full access to all modules |
| **Manager** | Manage inventory, sales, purchases |
| **Supervisor** | View and create records |
| **Employee** | Limited view access |

---

## 📸 Screenshots

> *(Add your screenshots here)*

| Dashboard | Products | Sales |
|---|---|---|
| ![Dashboard](screenshots/dashboard.png) | ![Products](screenshots/products.png) | ![Sales](screenshots/sales.png) |

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

## 📄 License

This project is licensed under the MIT License.