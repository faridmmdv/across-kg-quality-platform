import requests
from rdflib import Graph

FUSEKI_ENDPOINTS = {
    "TU Chemnitz": {
        "update": "http://localhost:3030/tuc/update",
        "query":  "http://localhost:3030/tuc/query",
        "data":   "http://localhost:3030/tuc/data",
    },
    "University of Girona": {
        "update": "http://localhost:3031/girona/update",
        "query":  "http://localhost:3031/girona/query",
        "data":   "http://localhost:3031/girona/data",
    },
    "University of Udine": {
        "update": "http://localhost:3032/udine/update",
        "query":  "http://localhost:3032/udine/query",
        "data":   "http://localhost:3032/udine/data",
    },
}

PROVIDER_NAME_ALIASES = {

    "TU Chemnitz":"TU Chemnitz",
    "TUC":  "TU Chemnitz",
    "Chemnitz": "TU Chemnitz",
    "Technische Universitat Chemnitz":"TU Chemnitz",
    "University of Girona":"University of Girona",
    "Uni Girona": "University of Girona",
    "Girona": "University of Girona",
    "UdG": "University of Girona",
    "Universitat de Girona":"University of Girona",
    "University of Udine": "University of Udine",
    "Uni Udine": "University of Udine",
    "Udine":  "University of Udine",
    "Uniud": "University of Udine",
    "Università di Udine":  "University of Udine",
}

def normalise_provider(name: str) -> str:
    return PROVIDER_NAME_ALIASES.get(name.strip(), name.strip())

def get_endpoints(university_name: str) -> dict:
    return FUSEKI_ENDPOINTS.get(normalise_provider(university_name))

def push_graph_to_fuseki(graph: Graph, university_name: str) -> bool:
    
    endpoints = get_endpoints(university_name)
    if not endpoints:
        print(f"No Fuseki endpoint configured for: {university_name}")
        return False

    turtle_data = graph.serialize(format="turtle")

    try:
        response = requests.post(
            endpoints["data"],
            data=turtle_data,
            headers={"Content-Type": "text/turtle"},
            timeout=10,
        )
        if response.status_code in (200, 201, 204):
            return True
        else:
            print(f"Fuseki push failed for {university_name}: {response.status_code} {response.text}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"Fuseki server not available for {university_name} — skipping RDF push.")
        return False
    except Exception as e:
        print(f"Fuseki error for {university_name}: {e}")
        return False

def query_fuseki(university_name: str, sparql_query: str) -> dict:
    endpoints = get_endpoints(university_name)
    if not endpoints:
        return {"results": {"bindings": []}}

    try:
        response = requests.post(
            endpoints["query"],
            data={"query": sparql_query},
            headers={"Accept": "application/sparql-results+json"},
            timeout=15,
        )
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Fuseki query failed for {university_name}: {response.status_code}")
            return {"results": {"bindings": []}}
    except requests.exceptions.ConnectionError:
        print(f"Fuseki server not available for {university_name}")
        return {"results": {"bindings": []}}
    except Exception as e:
        print(f"Fuseki query error for {university_name}: {e}")
        return {"results": {"bindings": []}}


def ask_fuseki(university_name: str, sparql_query: str) -> bool:
    endpoints = get_endpoints(university_name)
    if not endpoints:
        return False
    try:
        response = requests.post(
            endpoints["query"],
            data={"query": sparql_query},
            headers={"Accept": "application/sparql-results+json"},
            timeout=15,
        )
        if response.status_code == 200:
            return response.json().get("boolean", False)
        return False
    except Exception:
        return False


def get_all_triples(university_name: str) -> Graph:
    query = "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }"
    endpoints = get_endpoints(university_name)
    if not endpoints:
        return Graph()
    try:
        response = requests.post(
            endpoints["query"],
            data={"query": query},
            headers={"Accept": "text/turtle"},
            timeout=30,
        )
        if response.status_code == 200:
            g = Graph()
            g.parse(data=response.text, format="turtle")
            return g
        return Graph()
    except requests.exceptions.ConnectionError:
        print(f"Fuseki not available for {university_name} — returning empty graph.")
        return Graph()
    except Exception as e:
        print(f"Error fetching triples from {university_name}: {e}")
        return Graph()


def check_fuseki_available(university_name: str) -> bool:
    endpoints = get_endpoints(university_name)
    if not endpoints:
        return False
    try:
        r = requests.get(endpoints["query"], timeout=3)
        return r.status_code < 500
    except Exception:
        return False

def get_federation_status() -> dict:
    status = {}
    for uni in FUSEKI_ENDPOINTS:
        status[uni] = check_fuseki_available(uni)
    return status