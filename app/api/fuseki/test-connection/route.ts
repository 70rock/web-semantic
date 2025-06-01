import { NextResponse } from "next/server"
import { getFusekiEndpoints, getFusekiAuthHeaders } from "@/lib/fuseki-config"

export async function POST(request: Request) {
  try {
    const config = await request.json()
    const { queryUrl } = getFusekiEndpoints(config)
    const authHeaders = getFusekiAuthHeaders(config)

    // Simple SPARQL query to test the connection
    const testQuery = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      SELECT ?s WHERE { ?s ?p ?o } LIMIT 1
    `

    const params = new URLSearchParams({
      query: testQuery,
      format: "json",
    })

    // Create a controller for the timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000)

    try {
      const response = await fetch(`${queryUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          Accept: "application/sparql-results+json",
          ...authHeaders,
        },
        signal: controller.signal,
      })

      // Clear the timeout
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return NextResponse.json({
        success: true,
        message: "Connection successful",
        data,
      })
    } catch (fetchError) {
      // Clear the timeout if it hasn't fired yet
      clearTimeout(timeoutId)

      // Handle abort errors specifically
      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          {
            success: false,
            message: "Connection timed out",
          },
          { status: 408 },
        )
      }

      throw fetchError
    }
  } catch (error) {
    console.error("Error testing Fuseki connection:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to test connection",
      },
      { status: 500 },
    )
  }
}
