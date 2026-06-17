@echo off
cd /d "D:\university\backend"

echo ================================================================
echo  Federated University KG — Load RDF Data into Fuseki
echo  Run this AFTER start_fuseki.bat and AFTER uploading CSV data
echo ================================================================
echo.

REM ── Step 1: Export TTL files from Django per university ──────────
echo [1/4] Exporting RDF graphs from Django database...
python export_rdf.py
if %errorlevel% neq 0 (
    echo ERROR: export_rdf.py failed. Make sure Django is set up and CSV data is uploaded.
    pause
    exit /b 1
)
echo       Done. TTL files created in: data\rdf\
echo.

REM ── Step 2: Check Fuseki is running ──────────────────────────────
echo [2/4] Checking Fuseki servers are online...
curl -s -o nul -w "  TUC     (3030): %%{http_code}\n" http://localhost:3030/tuc/query
curl -s -o nul -w "  Girona  (3031): %%{http_code}\n" http://localhost:3031/girona/query
curl -s -o nul -w "  Udine   (3032): %%{http_code}\n" http://localhost:3032/udine/query
echo.

REM ── Step 3: Push TTL files to each Fuseki server ─────────────────
echo [3/4] Pushing RDF data to Fuseki...

echo   Pushing TU Chemnitz...
curl -s -X POST http://localhost:3030/tuc/data ^
     -H "Content-Type: text/turtle" ^
     --data-binary @data\rdf\tuc.ttl
echo   TUC done.

echo   Pushing University of Girona...
curl -s -X POST http://localhost:3031/girona/data ^
     -H "Content-Type: text/turtle" ^
     --data-binary @data\rdf\girona.ttl
echo   Girona done.

echo   Pushing University of Udine...
curl -s -X POST http://localhost:3032/udine/data ^
     -H "Content-Type: text/turtle" ^
     --data-binary @data\rdf\udine.ttl
echo   Udine done.
echo.

REM ── Step 4: Quick triple count check ─────────────────────────────
echo [4/4] Verifying triple counts in Fuseki...
echo   TUC triple count:
curl -s -X POST http://localhost:3030/tuc/query ^
     -H "Accept: application/sparql-results+json" ^
     -d "query=SELECT (COUNT(*) AS ?n) WHERE { ?s ?p ?o }" | findstr "\"value\""
echo   Girona triple count:
curl -s -X POST http://localhost:3031/girona/query ^
     -H "Accept: application/sparql-results+json" ^
     -d "query=SELECT (COUNT(*) AS ?n) WHERE { ?s ?p ?o }" | findstr "\"value\""
echo   Udine triple count:
curl -s -X POST http://localhost:3032/udine/query ^
     -H "Accept: application/sparql-results+json" ^
     -d "query=SELECT (COUNT(*) AS ?n) WHERE { ?s ?p ?o }" | findstr "\"value\""
echo.

echo ================================================================
echo  All done! Fuseki servers loaded with fresh RDF data.
echo  TUC     -> http://localhost:3030/tuc/query
echo  Girona  -> http://localhost:3031/girona/query
echo  Udine   -> http://localhost:3032/udine/query
echo ================================================================
echo.
pause