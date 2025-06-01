import { NextResponse } from "next/server"
import { getFusekiConfig, getFusekiEndpoints, getFusekiAuthHeaders } from "@/lib/fuseki-config"

export async function GET() {
  try {
    const config = getFusekiConfig()
    const { queryUrl } = getFusekiEndpoints(config)
    const authHeaders = getFusekiAuthHeaders(config)

    // Query for dataset statistics
    const statsQuery = `
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

    // Query for graphs
    const graphsQuery = `
      SELECT DISTINCT ?g 
      WHERE { 
        GRAPH ?g { ?s ?p ?o } 
      }
      ORDER BY ?g
    `

    // Create a controller for the timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000)

    try {
      // Execute stats query
      const statsParams = new URLSearchParams({
        query: statsQuery,
        format: "json",
      })

      const statsResponse = await fetch(`${queryUrl}?${statsParams.toString()}`, {
        method: "GET",
        headers: {
          Accept: "application/sparql-results+json",
          ...authHeaders,
        },
        signal: controller.signal,
      })

      if (!statsResponse.ok) {
        throw new Error(`HTTP error ${statsResponse.status}: ${statsResponse.statusText}`)
      }

      const statsData = await statsResponse.json()

      // Parse stats
      let stats = { subjects: 0, predicates: 0, objects: 0, triples: 0 }
      if (statsData.results.bindings.length > 0) {
        const binding = statsData.results.bindings[0]
        stats = {
          subjects: Number.parseInt(binding.subjects.value, 10),
          predicates: Number.parseInt(binding.predicates.value, 10),
          objects: Number.parseInt(binding.objects.value, 10),
          triples: Number.parseInt(binding.triples.value, 10),
        }
      }

      // Execute graphs query
      const graphsParams = new URLSearchParams({
        query: graphsQuery,
        format: "json",
      })

      const graphsResponse = await fetch(`${queryUrl}?${graphsParams.toString()}`, {
        method: "GET",
        headers: {
          Accept: "application/sparql-results+json",
          ...authHeaders,
        },
        signal: controller.signal,
      })

      // Clear the timeout
      clearTimeout(timeoutId)

      if (!graphsResponse.ok) {
        throw new Error(`HTTP error ${graphsResponse.status}: ${graphsResponse.statusText}`)
      }

      const graphsData = await graphsResponse.json()

      // Parse graphs
      const graphs = graphsData.results.bindings.map((binding) => binding.g.value)

      return NextResponse.json({
        success: true,
        stats,
        graphs,
        timestamp: new Date().toISOString(),
      })
    } catch (fetchError) {
      // Clear the timeout if it hasn't fired yet
      clearTimeout(timeoutId)

      // Handle abort errors specifically
      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          {
            success: false,
            message: "Query timed out",
          },
          { status: 408 },
        )
      }

      throw fetchError
    }
  } catch (error) {
    console.error("Error getting Fuseki stats:", error)

    // For development, return mock data if the connection fails
    if (error.message.includes("Failed to fetch") || error.message.includes("ECONNREFUSED")) {
      return NextResponse.json({
        success: true,
        mock: true,
        stats: {
          subjects: 42,
          predicates: 15,
          objects: 78,
          triples: 120,
        },
        graphs: ["http://example.org/recipes", "http://example.org/ingredients", "http://example.org/dbpedia-imports"],
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to get statistics",
      },
      { status: 500 },
    )
  }
}
