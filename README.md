# 🛠️ FixLog - Full-Stack IT Support Ticket Log & Operations Dashboard

FixLog is an enterprise-grade, mobile-responsive IT operations workflow application and real-time analytics portal. Designed to modernize internal helpdesk systems, it provides a seamless user submission pathway paired with an analytical command center for system administrators to triage, track, and resolve system anomalies.

🌐 **Live Production Deployment:** [https://lovable.app](https://lovable.app)

---

## 🚀 Architectural & Functional Highlights

### 📊 Real-Time Operations Monitoring Cockpit
- **State Management Counters:** Dynamic micro-indicators actively refreshing current system metrics across critical ticket lifecycles (`OPEN`, `IN PROGRESS`, `RESOLVED`).
- **14-Day Velocity Tracking:** A historical data trend bar chart tracking daily ticket logging volumes to visualize technical team workload distribution.
- **Categorical Volume Distribution:** An interactive structural donut chart mapping incoming tickets across primary operational categories to identify systemic hardware or network failures.

### 🔍 Operational Ticket Processing Log
- **Granular Meta Tags:** Structural visual badges grouping incidents instantly by Ticket Status, Core Categories, and strict Impact Priorities (`LOW`, `MEDIUM`, `HIGH`).
- **Query String Filtering:** An instant search engine scanning dataset titles and descriptions dynamically to pull exact historical match records.
- **Lifecycle Sorting Triggers:** Integrated multi-tab navigation pills allowing administrators to switch views and isolate systemic backlogs instantly.

---

## ⚙️ Core Engineering Stack

- **Frontend Core Framework:** React (Vite-optimized builds)
- **Styling Architecture:** Tailwind CSS (Mobile-first, responsive grid wrappers)
- **Data Visualization Engine:** Recharts (SVG-driven vector rendering)
- **Database & Cloud Hosting:** Supabase (Cloud-provisioned PostgreSQL)
- **Object-Relational Mapping (ORM):** Drizzle ORM

---

## 📂 Active Relational Schema Blueprint

The application's relational data store maps operational workflows across structured schema tables managed via Drizzle migration tracks:

| Database Column | Data Type | Properties & Operational Scope |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, Auto-generated relational string |
| `title` | `Text` | Required summary header input string |
| `description` | `Text` | Detailed string area explaining the technical failure |
| `status` | `ENUM` | Lifecycle tracking states: `open`, `in_progress`, `resolved` |
| `priority` | `ENUM` | Severity impact vectors: `low`, `medium`, `high` |
| `category` | `ENUM` | Functional asset targets: `hardware`, `software`, `access` |
| `created_at` | `Timestamp`| Operational timestamp defaulting to system `now()` |

--
