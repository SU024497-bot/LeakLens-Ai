# LeakLens AI

> **Automated Dataset Auditing & Potential Data-Leakage Detection Platform for Machine-Learning Workflows**  
> **Team:** Neural Nexus  
> **Authors:** Aayush Varshney & Sonali  
> **Brand Palette:** Midnight Indigo (`#282B4A`) & Vanilla (`#EEEBDA`)

---

## Live link - https://leaklens-aii.streamlit.app/

---
## 1. Overview

**LeakLens AI** is a local-first, privacy-preserving dataset auditing platform engineered to inspect tabular datasets before they are used to train machine-learning models.

Machine learning estimators are greedy optimizers: if training data contains target replicas, post-outcome measurements, or split contamination, models achieve artificial 99%+ validation scores that immediately collapse when deployed into real-world production.

LeakLens AI rigorously distinguishes between:
- **Confirmed Data-Quality Observations** (e.g. exact duplicate rows, zero-variance columns, severe missingness).
- **Potential Leakage Indicators** (e.g. identical target replicas, bivariate statistical associations $\ge 0.88$, post-outcome feature keywords).
- **Heuristic Warnings Requiring Human Review** (e.g. high-cardinality nominal identifiers, mixed string/numeric tokens).
- **Checks Unavailable Due to Missing Context** (e.g. target-dependent checks when no target is designated, or train/test contamination checks when only a single dataset is provided).

The entire engine operates **100% locally** on your machine—without external LLMs, cloud databases, GPU requirements, or paid APIs.

---

## 2. Technology Stack & Verified Versions

| Component | Technology | Verified Version |
| :--- | :--- | :--- |
| **Operating System** | Windows (PowerShell / Command Prompt) | Windows 10/11 x64 |
| **Streamlit Entrypoint**| Streamlit Application (`app.py`) | Streamlit 1.66.1+ |
| **Backend Runtime** | Python | 3.14.7 |
| **Web Framework** | FastAPI + Uvicorn | FastAPI 0.115+, Uvicorn 0.30+ |
| **Data Processing** | Pandas, NumPy, openpyxl | Pandas 2.2+, NumPy 1.26+, openpyxl 3.1.5 |
| **Backend Testing** | Pytest, HTTPX | Pytest 9.1.1, HTTPX 0.28+ |
| **Frontend Runtime**| Node.js & npm | Node.js v20.18.0+, npm 10.8.2+ |
| **UI Framework** | React 18 + TypeScript | React 18.3.1, TypeScript 5.6.3 |
| **Build Tool** | Vite | Vite 5.4.11 |
| **Styling** | Tailwind CSS + Custom PostCSS | Tailwind CSS 3.4.15 |
| **Icons & Visuals** | Lucide React | Lucide React 0.460+ |
| **Frontend Testing**| Vitest + Happy-DOM | Vitest 2.1.9, Happy-DOM 15+ |

---

## 3. Streamlit Cloud Ready Entrypoint (`app.py`)

LeakLens AI includes a **Streamlit application entry point** (`app.py`) ready for immediate one-click deployment on **Streamlit Community Cloud**:

- **Main File Path:** `app.py`
- **Root Dependencies:** `requirements.txt`
- **Brand Theme:** `.streamlit/config.toml` (Midnight Indigo `#282B4A` & Vanilla `#EEEBDA`)
- **Dual Engine Interface:**
  1. **🔐 Secret & Credential Scanner:** Upload source files or `.zip` repositories to detect exposed API keys, tokens, AWS credentials, and cryptographic keys with guaranteed value redaction (`sk_****abcd`). Includes Zip-Slip path traversal protection.
  2. **📊 Dataset & ML Data-Leakage Auditor:** Direct integration with the existing Python audit engine for tabular quality checks, target replicas, post-outcome lookahead, and correlation analysis.
  3. **ℹ️ Security Specifications & Rule Catalog:** Full documentation of regex patterns, Shannon entropy thresholds, and remediation guides.

### How to Run Streamlit Locally:
```bash
streamlit run app.py
```
*(The Streamlit interface opens at `http://localhost:8501`)*

### How to Deploy on Streamlit Community Cloud:
1. Push your repository to GitHub.
2. Sign in to [share.streamlit.io](https://share.streamlit.io).
3. Click **"New app"**.
4. Select your repository and branch (`main`).
5. Set **Main file path** to:
   ```text
   app.py
   ```
6. (Optional) In Advanced Settings, add variables from `.streamlit/secrets.toml.example` if required.
7. Click **"Deploy!"**. Streamlit will automatically read `requirements.txt` and launch the application.

---

## 3. Project Directory Structure

```text
LeakLens-AI/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── endpoints.py          # REST endpoints (/health, /audit, /worksheets, /reports/*)
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py             # Limits (50MB, 250k rows), CORS, Brand colors
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── audit.py              # Typed Pydantic data schemas & contracts
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── cleanup.py            # Temporary file context manager & lifecycle
│   │   │   ├── parser.py             # CSV multi-encoding & XLSX sheet parser
│   │   │   └── audit_engine/
│   │   │       ├── __init__.py
│   │   │       ├── engine.py         # Audit orchestrator & transparent risk calculation
│   │   │       ├── profiler.py       # Dimensions, type inference, stats, correlations
│   │   │       ├── quality_checker.py# Duplicate rows, constant cols, missing values, headers
│   │   │       ├── leakage_checker.py# Target duplicates, high associations, post-outcome
│   │   │       └── report_generator.py# HTML, CSV, and JSON report exporters
│   │   ├── __init__.py
│   │   └── main.py                   # FastAPI application & lifespan startup cleanup
│   ├── sample_data/
│   │   ├── sample_clean_churn.csv    # Benchmark 1: Clean customer churn baseline
│   │   ├── sample_leaky_credit.csv   # Benchmark 2: High-leakage credit default dataset
│   │   └── sample_multisheet_sales.xlsx # Benchmark 3: Multi-sheet retail sales workbook
│   ├── tests/
│   │   ├── test_api.py               # REST API integration tests
│   │   ├── test_cleanup.py           # Temporary file deletion & privacy tests
│   │   ├── test_leakage_checks.py    # Leakage rules & contamination tests
│   │   ├── test_parser.py            # CSV & XLSX parsing edge-case tests
│   │   └── test_quality_checks.py    # Profiler & data quality rules tests
│   └── requirements.txt              # Pinned Python dependencies
├── frontend/
│   ├── public/
│   │   └── logo.svg                  # Vector optical lens inspection mark
│   ├── src/
│   │   ├── components/
│   │   │   ├── BrandLogo.tsx         # Vector lens & dataset brand mark
│   │   │   ├── Charts.tsx            # Real-data missingness & correlation charts
│   │   │   ├── DataTable.tsx         # Searchable, paginated data dictionary
│   │   │   ├── Dropzone.tsx          # Drag-and-drop, Excel sheet picker, benchmarks
│   │   │   ├── FindingCard.tsx       # Severity badges, evidence viewer, recommendations
│   │   │   ├── MetricCard.tsx        # Minimalist metric display with status pills
│   │   │   ├── Navbar.tsx            # Public landing page navigation header
│   │   │   ├── RiskGauge.tsx         # Documented risk penalty gauge & formula rationale
│   │   │   └── Sidebar.tsx           # Collapsible dashboard navigation
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx       # 8-section public landing page
│   │   │   └── dashboard/
│   │   │       ├── DashboardView.tsx # Active audit status, risk gauge, quick metrics
│   │   │       ├── UploadView.tsx    # File ingestion & benchmark presets
│   │   │       ├── DataAnalysisView.tsx # Data dictionary, type inferences, stats
│   │   │       ├── LeakageDetectionView.tsx # Target duplication, correlation anomalies
│   │   │       ├── ResultsView.tsx   # Searchable & filterable findings catalog
│   │   │       ├── ReportsView.tsx   # HTML, CSV, and JSON deliverables
│   │   │       ├── SettingsView.tsx  # Ingestion limits & local privacy disclosures
│   │   │       └── HelpView.tsx      # Rule documentation catalog & FAQs
│   │   ├── services/
│   │   │   └── api.ts                # Typed fetch client connecting to FastAPI
│   │   ├── styles/
│   │   │   └── index.css             # Tailwind directives & glassmorphism classes
│   │   ├── types/
│   │   │   └── audit.ts              # TypeScript contracts matching backend schemas
│   │   ├── App.tsx                   # Master router & state container
│   │   ├── App.test.tsx              # Frontend unit tests
│   │   └── main.tsx                  # React DOM mount entrypoint
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js            # Midnight Indigo & Vanilla color tokens
│   ├── tsconfig.json
│   └── vite.config.ts                # Vite dev server & test configuration
├── .gitignore
├── pytest.ini                        # Pytest configuration
└── README.md
```

---

## 4. Local Installation & Startup Guide

### Prerequisites
1. **Python 3.12+ (or 3.14)**: Ensure `python` and `pip` are in your PATH.
2. **Node.js v20.18+**: Ensure `node` and `npm` are in your PATH.

---

### Step 1: Backend Setup & Startup

1. Open PowerShell or Command Prompt in the repository root:
   ```powershell
   cd c:\Users\SONALI\OneDrive\Desktop\LeakLens-AI
   ```

2. (Optional) Create and activate a Python virtual environment:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

3. Install required Python packages:
   ```powershell
   pip install -r backend/requirements.txt
   ```

4. Run the FastAPI development server:
   ```powershell
   python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *The backend will be live at `http://127.0.0.1:8000`. You can inspect the interactive OpenAPI documentation at `http://127.0.0.1:8000/docs`.*

---

### Step 2: Frontend Setup & Startup

1. Open a second terminal window in the `frontend` directory:
   ```powershell
   cd c:\Users\SONALI\OneDrive\Desktop\LeakLens-AI\frontend
   ```

2. Install npm dependencies:
   ```powershell
   npm install
   ```

3. Start the Vite development server:
   ```powershell
   npm run dev
   ```
   *The frontend will launch at `http://localhost:5173/`.*

---

## 5. Running Automated Tests

Testing is mandatory and automated on both sides of the application.

### A. Run Backend Unit & Integration Tests (Pytest)
From the repository root:
```powershell
python -m pytest backend/tests -v
```
**Results:** 22/22 tests passing (100%):
- `test_parser.py`: CSV multi-encoding, delimiters, empty files, size limits, Excel multi-sheet discovery.
- `test_profiler.py`: Type inference, memory calculation, matrix missingness.
- `test_quality_checks.py`: Duplicate rows, constant features, duplicate headers, high-cardinality IDs.
- `test_leakage_checks.py`: Direct target duplication, suspicious correlation, post-outcome names, split overlap.
- `test_cleanup.py`: Temporary file lifecycle unlinking on success and exceptions.
- `test_api.py`: Endpoint health, sample audits, CSV uploads, JSON/CSV/HTML report generation.

### B. Run Frontend Unit Tests (Vitest)
From the `frontend` directory:
```powershell
cd frontend
npm test
```
**Results:** All component unit tests passing (BrandLogo, MetricCard, RiskGauge).

### C. Build Production Bundle Verification
From the `frontend` directory:
```powershell
cd frontend
npm run build
```
**Results:** TypeScript compilation (`tsc`) succeeds with zero errors, producing optimized production bundles in `frontend/dist/`.

---

## 6. Supported File Formats, Ingestion Limits & Safety

| Parameter | Default Configuration | Rationale / Safety Behavior |
| :--- | :--- | :--- |
| **Supported Formats** | `.csv`, `.xlsx` | Validated by file content signature and extension. Binary `.xls` is safely rejected. |
| **Maximum File Size** | 50 MB | Enforced during streaming to prevent RAM exhaustion on 8 GB systems. |
| **Maximum Rows** | 250,000 Rows | Enforced in parser; prevents CPU starvation during statistical profiling. |
| **Maximum Columns** | 500 Columns | Guards against $O(N^2)$ combinatorial explosion in pairwise correlation matrices. |
| **Execution Timeout** | 60 Seconds | Hard safety boundary on CPU analysis threads. |
| **Formula Safety** | `data_only=True` | Excel formulas are never executed; only evaluated static cell values are ingested. |

---

## 7. Audit Rule Catalog & Honest Limitations

| Rule ID | Category | Severity | Description | Known Heuristic Boundary |
| :--- | :--- | :--- | :--- | :--- |
| `SCHEMA_DUPLICATE_COLUMNS` | Schema | High / Info | Identifies identical column header names in raw files. | Evaluates exact case-sensitive string matches. |
| `DQ_DUPLICATE_ROWS` | Quality | High / Med / Info | Detects exact cell-for-cell identical records across all columns. | Does not flag near-duplicates or minor typos. |
| `DQ_CONSTANT_COLUMNS` | Quality | Medium / Info | Identifies features with zero variance or all null values. | Rare production values might not appear in local samples. |
| `DQ_MISSING_VALUES` | Quality | High / Med / Info | Measures column-level and matrix-level null ratios (>25% / >70%). | Cannot determine if missingness is MCAR, MAR, or MNAR. |
| `DQ_HIGH_CARDINALITY_IDENTIFIERS` | Quality | Medium | Flags non-continuous columns with unique ratio > 95% (IDs, UUIDs). | High cardinality is valid for continuous target variables. |
| `LEAK_EXACT_TARGET_DUPLICATION` | Leakage | **Critical** | Identifies features possessing identical values to the target column. | Requires an explicitly designated target column. |
| `LEAK_SUSPICIOUS_TARGET_CORRELATION` | Leakage | **Critical / High** | Flags bivariate association $\ge 0.88$ (Pearson \|r\|, Cramér’s V, $\eta$). | High correlation can exist in deterministic physics; human review required. |
| `LEAK_POST_OUTCOME_FEATURE_NAMES` | Leakage | **High / Warning**| Scans column names for post-event tokens (cancellation, payout, etc.). | Nomenclature heuristic; cannot detect lookahead if names are obfuscated. |
| `LEAK_TRAIN_TEST_CONTAMINATION` | Split | **Critical** | Measures exact record overlap between training and holdout partitions. | Only executable when separate train and test partitions are supplied. |

---

## 8. Transparent Risk Score Calculation

LeakLens AI does **not** generate arbitrary black-box scores or imply calibrated statistical probabilities. 

The **Overall Risk Score** (0 to 100) is an empirical heuristic penalty index calculated transparently as:
$$\text{Risk Score} = \min\left(100, \; (N_{\text{critical}} \times 30) + (N_{\text{high}} \times 15) + (N_{\text{medium}} \times 5) + (N_{\text{low}} \times 1)\right)$$

- **0 – 10 Points**: `LOW RISK` — Quality checks passed with minimal or standard anomalies.
- **11 – 35 Points**: `MODERATE RISK` — Notable missingness, ID candidates, or constant features detected.
- **36 – 65 Points**: `ELEVATED RISK` — High target correlations or suspicious post-outcome names warrant review.
- **66 – 100 Points**: `CRITICAL RISK` — Confirmed direct target replicas, near-deterministic proxies ($\ge 98\%$), or train/test contamination.

---

## 9. Temporary File Lifecycle & Privacy Guarantees

1. **Random Isolation**: Every upload is streamed to an isolated temporary file named with a cryptographically secure random UUID (`upload_<uuid>.tmp`).
2. **Guaranteed Unlinking**: The temporary path is managed inside a Python context manager with a guaranteed `try/finally` block. The file is unlinked immediately upon audit completion, error, or request cancellation.
3. **Startup Pruning**: When the backend boots up, it automatically cleans any orphaned temporary files older than 30 minutes.
4. **Physical Storage Disclosure**: Application-level deletion removes directory pointers. Solid-state drive block reallocation, TRIM, and operating system caches operate below user-space applications; application-level unlinking does not constitute DoD-grade physical storage degaussing.

---

## 10. Preparing for Production Deployment

While LeakLens AI is designed as a local-first desktop application, it can be deployed for internal team networks:

1. **Docker Containerization**:
   - Create a multi-stage `Dockerfile`: Stage 1 builds the Vite static assets (`npm run build`), Stage 2 serves FastAPI with Uvicorn and mounts the built frontend via `StaticFiles`.
2. **Reverse Proxy & TLS**:
   - Deploy behind an internal NGINX or Caddy reverse proxy with SSL/TLS certificates.
   - Configure CORS in `backend/app/core/config.py` to allow the corporate intranet domain.
3. **Resource Capping**:
   - Enforce container memory limits (e.g. `--memory=2g`) to prevent out-of-memory cascading.

---

## 11. Troubleshooting Common Issues

- **`node` or `npm` command not found**: Ensure `C:\Users\SONALI\AppData\Local\Programs\nodejs` is included in your user `PATH` variable and open a fresh terminal.
- **CSV Encoding Failure**: If a CSV has non-standard characters, LeakLens AI tries UTF-8, Latin-1, and CP1252. Verify the CSV does not contain unbalanced quotes or truncated lines.
- **Excel Sheet Empty Error**: If an Excel file contains multiple worksheets, select the desired sheet from the interactive sheet dropdown in the Upload view.
- **Target Leakage Unavailable**: If you do not specify a target variable, target-dependent checks cannot run. Re-audit the dataset with your target column name designated in the upload form.

---

## 12. Authors & Team Acknowledgement

Developed by **Neural Nexus**:
- **Aayush Varshney**
- **Sonali**
