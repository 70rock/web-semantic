import { NextResponse } from "next/server"
import { searchHistoricalFigures as searchDbpedia } from "@/lib/dbpedia-service"
import { searchHistoricalFigures as searchOntology } from "@/lib/ontology-service"

interface SparqlResult {
  results: {
    bindings: Array<{
      [key: string]: {
        value: string
        type: string
      }
    }>
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const langParam = searchParams.get('lang');
    const language: "es" | "en" | "both" = (langParam === 'es' || langParam === 'en' || langParam === 'both') ? langParam : 'es';
    console.log("🔍 Búsqueda recibida:", { query, language })

    const results = []
    const sources = {
      dbpedia: false,
      ontology: false,
    }

    // Buscar en DBpedia
    try {
      console.log("🌐 Iniciando búsqueda en DBpedia...")
      const dbpediaResults = await searchDbpedia(query, language)
      console.log("📦 Resultados de DBpedia recibidos:", {
        count: dbpediaResults.length,
        results: dbpediaResults.map(r => ({ name: r.name, source: r.source }))
      });
      
      // Unificar estructura
      const dbpediaUnified = dbpediaResults.map((p: any) => ({
        id: p.id,
        uri: p.uri,
        name: p.name,
        description: p.description,
        fechaNacimiento: p.fechaNacimiento || '',
        fechaFallecimiento: p.fechaFallecimiento || '',
        lugarNacimiento: p.lugarNacimiento || '',
        lugarFallecimiento: p.lugarFallecimiento || '',
        nacionalidad: p.nacionalidad || '',
        ocupacion: p.ocupacion || '',
        thumbnail: p.thumbnail || '',
        source: 'dbpedia',
        type: 'PersonaHistoricaBoliviana',
      }))
      results.push(...dbpediaUnified)
      sources.dbpedia = true
      console.log("✅ Búsqueda en DBpedia completada")
    } catch (error) {
      console.error("❌ Error en búsqueda DBpedia:", error)
      if (error instanceof Error) {
        console.error("Detalles del error:", {
          message: error.message,
          stack: error.stack
        })
      }
    }

    // Buscar en ontología local
    try {
      console.log("📚 Iniciando búsqueda en ontología local...")
      const ontologyResults = await searchOntology(query, language)
      console.log("📦 Resultados de Ontología recibidos:", {
        count: ontologyResults.length,
        results: ontologyResults.map(r => ({ name: r.name, source: r.source }))
      });
      
      
      const ontologyUnified = ontologyResults.map((p: any) => ({
        id: p.id,
        uri: p.uri,
        name: p.name,
        description: p.description,
        fechaNacimiento: p.fechaNacimiento || '',
        fechaFallecimiento: p.fechaFallecimiento || '',
        lugarNacimiento: p.lugarNacimiento || '',
        lugarFallecimiento: p.lugarFallecimiento || '',
        nacionalidad: p.nacionalidad || '',
        ocupacion: p.ocupacion || '',
        thumbnail: p.thumbnail || '',
        source: 'ontology',
        type: 'PersonaHistoricaBoliviana',
      }))
      results.push(...ontologyUnified)
      sources.ontology = true
      console.log("✅ Búsqueda en ontología local completada")
    } catch (error) {
      console.error("❌ Error en búsqueda Ontología:", error)
      if (error instanceof Error) {
        console.error("Detalles del error:", {
          message: error.message,
          stack: error.stack
        })
      }
    }

    console.log("📊 Resumen de búsqueda:", {
      totalResultados: results.length,
      fuentesConsultadas: sources,
      resultadosPorFuente: {
        dbpedia: results.filter(r => r.source === 'dbpedia').length,
        ontology: results.filter(r => r.source === 'ontology').length
      }
    })

    return NextResponse.json({
      results,
      sources,
    })
  } catch (error) {
    console.error("❌ Error en endpoint de búsqueda:", error)
    if (error instanceof Error) {
      console.error("Detalles del error:", {
        message: error.message,
        stack: error.stack
      })
    }
    return NextResponse.json(
      {
        error: "Error al procesar la búsqueda",
      },
      { status: 500 }
    )
  }
}


function processOntologyResults(result: SparqlResult, language: string) {
  if (result && result.results && result.results.bindings) {
    return result.results.bindings.map((binding) => {
      const personaUri = binding.persona?.value || ""
      const id = personaUri.split("#").pop() || "unknown"

      return {
        id,
        uri: personaUri,
        name: binding.nombre?.value || (language === "es" ? "Sin nombre" : "No name"),
        description: binding.descripcion?.value || (language === "es" ? "Sin descripción" : "No description"),
        fechaNacimiento: binding.fechaNacimiento?.value || "",
        fechaFallecimiento: binding.fechaFallecimiento?.value || "",
        lugarNacimiento: binding.lugarNacimiento?.value || "",
        lugarFallecimiento: binding.lugarFallecimiento?.value || "",
        nacionalidad: binding.nacionalidad?.value || "",
        ocupacion: binding.ocupacion?.value || "",
        thumbnail: binding.imagenReferencia?.value || "",
        source: "ontology",
      }
    })
  }
  return []
}


async function processDbpediaResults(dbpediaData: SparqlResult, language: string) {
  
  const limitedBindings = dbpediaData.results.bindings.slice(0, 5)
  const results = []

  for (const item of limitedBindings) {
    const uri = item.item?.value
    if (!uri) continue

    const id = uri.split("/").pop()

    // Simplificamos para evitar llamadas adicionales que pueden causar problemas
    results.push({
      id,
      uri,
      name: item.label?.value || (language === "es" ? "Sin nombre" : "No name"),
      description: item.abstract?.value || (language === "es" ? "Sin descripción" : "No description"),
      thumbnail: item.thumbnail?.value || null,
      calories: "N/A",
      source: "dbpedia",
      ingredients: [],
      difficulty: language === "es" ? "No especificada" : "Not specified",
      time: "N/A",
    })
  }

  return results
}
