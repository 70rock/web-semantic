import { NextResponse } from "next/server"


const DBPEDIA_ENDPOINT = "https://dbpedia.org/sparql"


const DEFAULT_PARAMS = {
  format: "json",
  timeout: "30000", 
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")
  const lang = searchParams.get("lang") || "es"
  const limit = Number.parseInt(searchParams.get("limit") || "10", 10)

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 })
  }

  try {
    
    const sparqlQuery = `
      PREFIX dbo: <http://dbpedia.org/ontology/>
      PREFIX dbr: <http://dbpedia.org/resource/>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX dcterms: <http://purl.org/dc/terms/>
      
      SELECT DISTINCT ?item ?label ?abstract ?thumbnail WHERE {
        ?item a dbo:Person ;
              rdfs:label ?label ;
              rdfs:comment ?abstract .
        OPTIONAL { ?item dbo:thumbnail ?thumbnail }

        # Hacer OPTIONAL las propiedades antes de usarlas en el FILTER
        OPTIONAL { ?item dbo:birthPlace ?birthPlace }
        OPTIONAL { ?item dbo:nationality ?nationality }
        
        FILTER(LANG(?label) = "${lang}")
        FILTER(LANG(?abstract) = "${lang}")
        FILTER(CONTAINS(LCASE(?label), LCASE("${query}")))

        # Filtro para personas relacionadas con Bolivia
        FILTER(
          (?birthPlace = dbr:Bolivia || ?nationality = dbr:Bolivia) ||
          EXISTS { ?item dcterms:subject <http://es.dbpedia.org/resource/Categoría:Historia_de_Bolivia> }
        )

      }
      LIMIT ${limit}
    `

    const params = new URLSearchParams({
      ...DEFAULT_PARAMS,
      query: sparqlQuery,
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
      console.log("DBpedia search response data:", JSON.stringify(data, null, 2));
      return NextResponse.json(data)
    } catch (fetchError: any) {
      
      clearTimeout(timeoutId)

      
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
    console.error("Error searching DBpedia:", error)

    
    if (error instanceof Error && (error.message.includes("Failed to fetch") || error.message.includes("ECONNREFUSED"))) {
      return NextResponse.json({
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
              label: { type: "literal", value: "Simón Bolívar", "xml:lang": lang },
              abstract: {
                type: "literal",
                value:
                  lang === "es"
                    ? "Simón Bolívar fue un militar y político venezolano, una de las figuras más destacadas de la independencia de América Latina."
                    : "Simón Bolívar was a Venezuelan military and political leader, one of the most prominent figures in the independence of Latin America.",
                "xml:lang": lang,
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
              label: { type: "literal", value: "Juana Azurduy de Padilla", "xml:lang": lang },
              abstract: {
                type: "literal",
                value:
                  lang === "es"
                    ? "Juana Azurduy de Padilla fue una heroína de la independencia del Alto Perú, actual Bolivia."
                    : "Juana Azurduy de Padilla was a heroine of the independence of Upper Peru, now Bolivia.",
                "xml:lang": lang,
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
              label: { type: "literal", value: "Andrés de Santa Cruz", "xml:lang": lang },
              abstract: {
                type: "literal",
                value:
                  lang === "es"
                    ? "Andrés de Santa Cruz fue un militar y político boliviano, presidente de Bolivia y protector de la Confederación Perú-Boliviana."
                    : "Andrés de Santa Cruz was a Bolivian military officer and politician, president of Bolivia and protector of the Peru-Bolivian Confederation.",
                "xml:lang": lang,
              },
              thumbnail: {
                type: "uri",
                value: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Andres_de_Santa_Cruz.jpg",
              },
            },
          ],
        },
        mock: true,
      })
    }

    return NextResponse.json({ error: "Failed to search DBpedia", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
