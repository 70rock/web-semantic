import { NextResponse } from "next/server"
import { getFusekiEndpoints, getFusekiAuthHeaders } from "@/lib/fuseki-config"

export async function POST(request: Request) {
  try {
    const { query, config } = await request.json()
    const { queryUrl } = getFusekiEndpoints(config)
    const authHeaders = getFusekiAuthHeaders(config)

    // Forzar datos de prueba en desarrollo
    if (process.env.NODE_ENV === "development") {
      console.log("🔧 Modo desarrollo: devolviendo datos de prueba");
      if (query.includes("SELECT") && query.includes("PersonaHistoricaBoliviana")) {
        return NextResponse.json(mockHistoricalPersonQueryResponse());
      }
    }

    const params = new URLSearchParams({
      query,
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
          ...(authHeaders as Record<string, string>),
        },
        signal: controller.signal,
      })

      // Clear the timeout
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (fetchError: unknown) {
      // Clear the timeout if it hasn't fired yet
      clearTimeout(timeoutId)

      // Handle abort errors specifically
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
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
  } catch (error: unknown) {
    console.error("Error executing SPARQL query:", error)

    // For development, return mock data if the connection fails
    if (error instanceof Error && (error.message.includes("Failed to fetch") || error.message.includes("ECONNREFUSED"))) {
      // Check if the query is for personas históricas bolivianas and return appropriate mock data
      const { query } = await request.json();
      if (query.includes("SELECT") && query.includes("PersonaHistoricaBoliviana")) {
        return NextResponse.json(mockHistoricalPersonQueryResponse());
      } else {
        return NextResponse.json({ head: { vars: [] }, results: { bindings: [] } });
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to execute query",
      },
      { status: 500 },
    )
  }
}

// Mock responses for testing
function mockHistoricalPersonQueryResponse() {
  return {
    head: {
      vars: ["persona", "nombre", "descripcion", "fechaNacimiento", "fechaFallecimiento", "lugarNacimiento", "lugarFallecimiento", "nacionalidad", "ocupacion", "imagenReferencia"],
    },
    results: {
      bindings: [
        {
          persona: {
            type: "uri",
            value: "http://example.org/personasHistoricasBolivianas#Persona1",
          },
          nombre: { type: "literal", value: "Simón Bolívar" },
          descripcion: {
            type: "literal",
            value: "Libertador de América del Sur, conocido como El Libertador.",
          },
          fechaNacimiento: { type: "literal", value: "1783-07-24" },
          fechaFallecimiento: { type: "literal", value: "1830-12-17" },
          lugarNacimiento: { type: "literal", value: "Caracas, Venezuela" },
          lugarFallecimiento: { type: "literal", value: "Santa Marta, Colombia" },
          nacionalidad: { type: "literal", value: "Venezolano" },
          ocupacion: { type: "literal", value: "Militar y político" },
          imagenReferencia: { type: "literal", value: "https://example.com/simon-bolivar.jpg" },
        },
        {
          persona: {
            type: "uri",
            value: "http://example.org/personasHistoricasBolivianas#Persona2",
          },
          nombre: { type: "literal", value: "Juana Azurduy" },
          descripcion: {
            type: "literal",
            value: "Heroína de la independencia de Bolivia y Argentina.",
          },
          fechaNacimiento: { type: "literal", value: "1780-07-12" },
          fechaFallecimiento: { type: "literal", value: "1862-05-25" },
          lugarNacimiento: { type: "literal", value: "Chuquisaca, Bolivia" },
          lugarFallecimiento: { type: "literal", value: "Sucre, Bolivia" },
          nacionalidad: { type: "literal", value: "Boliviana" },
          ocupacion: { type: "literal", value: "Militar y líder independentista" },
          imagenReferencia: { type: "literal", value: "https://example.com/juana-azurduy.jpg" },
        },
      ],
    },
    mock: true,
  }
}
