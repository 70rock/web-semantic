/**
 * SPARQL client for interacting with Fuseki endpoint
 */

import { getFusekiConfig } from "./fuseki-config"

// Execute a SPARQL query
export async function executeSparqlQuery(query: string, config = getFusekiConfig()) {
  try {
    // Use our API route instead of connecting directly to Fuseki
    const response = await fetch("/api/fuseki/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, config }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `SPARQL query failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error executing SPARQL query:", error)
    throw error
  }
}

// Execute a SPARQL update
export async function executeSparqlUpdate(update: string, config = getFusekiConfig()) {
  try {
    // Use our API route instead of connecting directly to Fuseki
    const response = await fetch("/api/fuseki/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ update, config }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `SPARQL update failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error executing SPARQL update:", error)
    throw error
  }
}

// Upload RDF data to the endpoint
export async function uploadRdfData(data: string, graphUri = "", format = "text/turtle", config = getFusekiConfig()) {
  try {
    // Use our API route instead of connecting directly to Fuseki
    const response = await fetch("/api/fuseki/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data, graphUri, format, config }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `RDF upload failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error uploading RDF data:", error)
    throw error
  }
}

// Get all graphs in the dataset
export async function getGraphs(config = getFusekiConfig()) {
  const query = `
    SELECT DISTINCT ?g 
    WHERE { 
      GRAPH ?g { ?s ?p ?o } 
    }
    ORDER BY ?g
  `

  try {
    const result = await executeSparqlQuery(query, config)
    return result.results.bindings.map((binding) => binding.g.value)
  } catch (error) {
    console.error("Error getting graphs:", error)
    throw error
  }
}

// Get dataset statistics
export async function getDatasetStats(config = getFusekiConfig()) {
  const query = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX owl: <http://www.w3.org/2002/07/owl#>
    
    SELECT 
      (COUNT(DISTINCT ?s) AS ?subjects)
      (COUNT(DISTINCT ?p) AS ?predicates)
      (COUNT(DISTINCT ?o) AS ?objects)
      (COUNT(*) AS ?triples)
    WHERE {
      ?s ?p ?o
    }
  `

  try {
    const result = await executeSparqlQuery(query, config)
    if (result.results.bindings.length > 0) {
      const binding = result.results.bindings[0]
      return {
        subjects: Number.parseInt(binding.subjects.value, 10),
        predicates: Number.parseInt(binding.predicates.value, 10),
        objects: Number.parseInt(binding.objects.value, 10),
        triples: Number.parseInt(binding.triples.value, 10),
      }
    }
    return { subjects: 0, predicates: 0, objects: 0, triples: 0 }
  } catch (error) {
    console.error("Error getting dataset statistics:", error)
    throw error
  }
}

// Get ontology classes
export async function getOntologyClasses(config = getFusekiConfig()) {
  const query = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX owl: <http://www.w3.org/2002/07/owl#>
    
    SELECT DISTINCT ?class ?label ?comment (COUNT(?instance) AS ?instanceCount)
    WHERE {
      { ?class a owl:Class } UNION { ?class a rdfs:Class }
      OPTIONAL { ?class rdfs:label ?label }
      OPTIONAL { ?class rdfs:comment ?comment }
      OPTIONAL { ?instance a ?class }
    }
    GROUP BY ?class ?label ?comment
    ORDER BY ?label ?class
  `

  try {
    return await executeSparqlQuery(query, config)
  } catch (error) {
    console.error("Error getting ontology classes:", error)
    throw error
  }
}
