import { NextResponse } from "next/server"

// DBpedia SPARQL endpoint URL
const DBPEDIA_ENDPOINT = "https://dbpedia.org/sparql"


const DEFAULT_PARAMS = {
  format: "json",
  timeout: "30000", 
}

export async function POST(request: Request) {
  try {
    const { query, language = "es" } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    const params = new URLSearchParams({
      ...DEFAULT_PARAMS,
      query,
    })

    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await fetch(`${DBPEDIA_ENDPOINT}?${params.toString()}`, {
        method: "GET",
        headers: {
          Accept: "application/sparql-results+json",
        },
        signal: controller.signal,
      })

      
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`DBpedia query failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (fetchError) {
      
      clearTimeout(timeoutId)

      
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
  } catch (error) {
    console.error("Error executing DBpedia SPARQL query:", error)

    if (error instanceof Error && (error.message.includes("Failed to fetch") || error.message.includes("ECONNREFUSED"))) {
      return NextResponse.json(getMockDbpediaResponse())
    }

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to execute DBpedia query",
      },
      { status: 500 },
    )
  }
}


function getMockDbpediaResponse() {
  return {
    head: {
      vars: ["item", "label", "abstract", "thumbnail"],
    },
    results: {
      bindings: [
        {
          item: {
            type: "uri",
            value: "http://dbpedia.org/resource/Simón_Bolívar",
          },
          label: { type: "literal", value: "Simón Bolívar", "xml:lang": "es" },
          abstract: {
            type: "literal",
            value:
              "Simón Bolívar fue un militar y político venezolano, una de las figuras más destacadas de la independencia de América Latina.",
            "xml:lang": "es",
          },
          thumbnail: {
            type: "uri",
            value: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Simon_Bolivar.jpg",
          },
        },
        {
          item: {
            type: "uri",
            value: "http://dbpedia.org/resource/Juana_Azurduy_de_Padilla",
          },
          label: { type: "literal", value: "Juana Azurduy de Padilla", "xml:lang": "es" },
          abstract: {
            type: "literal",
            value:
              "Juana Azurduy de Padilla fue una heroína de la independencia del Alto Perú, actual Bolivia.",
            "xml:lang": "es",
          },
          thumbnail: {
            type: "uri",
            value: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Juana_Azurduy_de_Padilla.jpg",
          },
        },
        {
          item: {
            type: "uri",
            value: "http://dbpedia.org/resource/Andrés_de_Santa_Cruz",
          },
          label: { type: "literal", value: "Andrés de Santa Cruz", "xml:lang": "es" },
          abstract: {
            type: "literal",
            value:
              "Andrés de Santa Cruz fue un militar y político boliviano, presidente de Bolivia y protector de la Confederación Perú-Boliviana.",
            "xml:lang": "es",
          },
          thumbnail: {
            type: "uri",
            value: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Andres_de_Santa_Cruz.jpg",
          },
        },
      ],
    },
    mock: true,
  }
}
