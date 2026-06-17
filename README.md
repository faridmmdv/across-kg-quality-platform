# Across KG Quality Platform

Federated quality assessment for university knowledge graphs. Validates, scores, and compares course data across three independent SPARQL endpoints using SHACL validation, custom SPARQL tests, and FAIR scoring.

MSc thesis project, TU Chemnitz — *Quality Assessment for Federated University Knowledge Graphs Using Machine-Learning-Based Anomaly Detection: A Case Study on the Across Alliance.*

## Architecture

```
Django backend (REST API)
   ├── quality_engine/   SHACL validation, SPARQL test suite, FAIR scoring
   └── federation/       Fuseki client, cross-university conflict detection

React frontend (Vite)
   └── submit/review course data + quality reports

3x Apache Jena Fuseki (SPARQL endpoints, one per university)
   ├── tuc      :3030
   ├── girona   :3031
   └── udine    :3032
```

Data flow: Django DB → RDF export (Turtle) → Fuseki → SPARQL query on demand → SHACL + SPARQL tests + FAIR scoring → JSON report. If a Fuseki endpoint is unreachable, the backend builds the RDF graph directly from the DB as a fallback. Federation comparison requires all three endpoints to be reachable.

## Quality checks

- **SHACL** — structural constraints (`backend/api/shacl_shapes.ttl`): required fields, datatypes, ECTS range (1–30), course code pattern `^[A-Z]{2,4}-[A-Z]{2,6}-[0-9]{3}[B]?$`
- **SPARQL test suite** — 24 ASK-query tests (`backend/api/api/quality_engine/sparql_tests.py`), severity-tagged (ERROR/WARNING), dimension-tagged (Completeness, Consistency, Accuracy, Timeliness, Interoperability)
- **FAIR scoring** — per-instance score across F/A/I/R dimensions (`backend/api/api/quality_engine/report.py`)
- **Federation** — cross-university diff on matching course codes: ECTS mismatches, name mismatches, systematic field gaps (`backend/api/api/federation/federated_runner.py`)

## Stack

Backend: Django REST Framework, RDFLib, pySHACL
Triple store: Apache Jena Fuseki
Frontend: React, Vite

## Setup

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev
```

Start 3 local Fuseki instances (ports 3030/3031/3032, datasets `tuc`/`girona`/`udine`) for full federation. Without them, the API still runs via DB fallback, but cross-university comparison won't have data to compare.

## Repo structure

```
backend/
├── api/api/quality_engine/   SHACL + SPARQL + FAIR logic
├── api/api/federation/       Fuseki client + conflict detection
├── data/rdf/                 sample Turtle exports (tuc/girona/udine)
├── course_instances.csv       sample course data
└── export_rdf.py               regenerate Turtle exports from DB

frontend/
└── src/                       React dashboard
```

## Demo login

The frontend has a staff login screen, scoped per university. These are local test accounts only, not real credentials for any external system:

- `staff@udg.edu` / `staff123` — University of Girona
- `staff@uniud.it` / `staff123` — University of Udine
- `staff@tu-chemnitz` / `staff123` — TU Chemnitz

## Notes

`DEBUG=True` and `CORS_ALLOW_ALL_ORIGINS=True` are intentional — local dev/demo only, not deployed. `SECRET_KEY` reads from a `DJANGO_SECRET_KEY` env var with a dev fallback.

## Author

Farid Mammadov — MSc Web Engineering, TU Chemnitz
