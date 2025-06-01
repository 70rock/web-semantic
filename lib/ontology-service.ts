/**
 * Service for interacting with the local ontology (via Fuseki or other triple store)
 */

import { executeSparqlQuery as executeQuery, executeSparqlUpdate as executeUpdate } from "./sparql-client"
import { readFile, writeFile } from "fs/promises"
import { join } from "path"
import { Parser, Store, Quad } from "n3"

interface HistoricalPerson {
  id: string
  uri: string
  name: string
  description: string
  thumbnail: string
  fechaNacimiento?: string
  fechaFallecimiento?: string
  lugarNacimiento?: string
  lugarFallecimiento?: string
  nacionalidad?: string
  ocupacion?: string
  source: string
  type: string
}

interface OntologyResult {
  id: string
  uri: string
  name: string
  description: string
  thumbnail: string
  fechaNacimiento?: string
  fechaFallecimiento?: string
  lugarNacimiento?: string
  lugarFallecimiento?: string
  nacionalidad?: string
  ocupacion?: string
  imagenReferencia?: string
  source: string
}

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

interface Entity {
  id: string
  label: string
  description?: string
  tipoVegetal?: string
  fechaNacimiento?: string
  fechaFallecimiento?: string
  lugarNacimiento?: string
  lugarFallecimiento?: string
  nacionalidad?: string
  ocupacion?: string
  imagenReferencia?: string
}

/**
 * Execute a SPARQL query against the local endpoint
 */
export async function executeSparqlQuery(query: string): Promise<any> {
  if (!query) {
    throw new Error("La consulta SPARQL no puede estar vacía");
  }

  try {
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    console.log("Enviando consulta SPARQL a:", `${baseUrl}/api/sparql`);
    console.log("Contenido de la consulta:", query);

    const response = await fetch(`${baseUrl}/api/sparql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: query.trim() }),
    });

    const data = await response.json();
    console.log("Respuesta del servidor:", data);

    if (!response.ok) {
      throw new Error(data.error || `Error en la consulta SPARQL: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error("Error ejecutando consulta SPARQL:", error);
    throw error;
  }
}

/**
 * Execute a SPARQL update against the local endpoint
 */
export async function executeSparqlUpdate(update: string) {
  try {
    return await executeUpdate(update)
  } catch (error) {
    console.error("Error executing SPARQL update:", error)


    console.log("SPARQL Update (mock):", update)
    return { success: true, message: "Update successful (mock)", mock: true }
  }
}

/**
 * Import entities into the ontology
 */
export async function importEntitiesToOntology(entities: any[], entityType: string): Promise<void> {
  if (!entities || entities.length === 0) {
    console.log("❌ No hay entidades para importar");
    return;
  }

  console.log(`📥 Importando ${entities.length} entidades de tipo ${entityType}...`);

  const insertStatements = entities.map(entity => {
    
    if (!entity.id || !entity.label) {
      console.warn(`⚠️ Entidad inválida:`, entity);
      return null;
    }

    
    const entityUri = `http://example.org/personasHistoricasBolivianas#${entity.id}`;

   
    
    const resumen = escapeLiteral((entity.description || '').slice(0, 50));
    const triples = [
      `<${entityUri}> rdf:type phb:${entityType} .`,
      `<${entityUri}> phb:nombre "${escapeLiteral(entity.label)}" .`,
      `<${entityUri}> phb:resumen "${resumen}" .`
    ];

    
      if (entity.fechaNacimiento) {
      triples.push(`<${entityUri}> phb:fechaNacimiento "${escapeLiteral(entity.fechaNacimiento)}" .`);
      }
      if (entity.fechaFallecimiento) {
      triples.push(`<${entityUri}> phb:fechaFallecimiento "${escapeLiteral(entity.fechaFallecimiento)}" .`);
      }
      if (entity.lugarNacimiento) {
      triples.push(`<${entityUri}> phb:lugarNacimiento "${escapeLiteral(entity.lugarNacimiento)}" .`);
      }
      if (entity.lugarFallecimiento) {
      triples.push(`<${entityUri}> phb:lugarFallecimiento "${escapeLiteral(entity.lugarFallecimiento)}" .`);
      }
      if (entity.nacionalidad) {
      triples.push(`<${entityUri}> phb:nacionalidad "${escapeLiteral(entity.nacionalidad)}" .`);
    }
    if (entity.ocupacion && entity.ocupacion.length > 0) {
      entity.ocupacion.forEach((ocup: string) => {
        triples.push(`<${entityUri}> phb:ocupacion "${escapeLiteral(ocup)}" .`);
      });
      }
      if (entity.imagenReferencia) {
      triples.push(`<${entityUri}> phb:imagenReferencia "${escapeLiteral(entity.imagenReferencia)}" .`);
    }

    // Construir la consulta INSERT
    const insertQuery = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX phb: <http://example.org/personasHistoricasBolivianas#>

INSERT DATA {
  ${triples.join(' ')}
}`;

    console.log("Consulta generada:", insertQuery);
    return insertQuery;
  }).filter((query): query is string => query !== null);

  if (insertStatements.length === 0) {
    console.log("⚠️ No se generaron declaraciones INSERT válidas");
    return;
  }

  console.log(`✅ Generadas ${insertStatements.length} declaraciones INSERT`);

  
  for (const query of insertStatements) {
    try {
      const response = await executeSparqlQuery(query);
      if (!response.success) {
        throw new Error(response.error || "Error desconocido al ejecutar la consulta");
      }
      console.log("✅ Consulta INSERT ejecutada exitosamente");
    } catch (error) {
      console.error("❌ Error al ejecutar consulta INSERT:", error);
      throw error;
    }
  }

  console.log(`✅ Importación completada: ${insertStatements.length} entidades importadas`);
}

/**
 * Search for historical figures in the local ontology
 */
export async function searchHistoricalFigures(
  searchTerm: string,
  language: "es" | "en" | "both" = "es"
): Promise<HistoricalPerson[]> {
  try {
    console.log("🔍 Buscando en ontología local:", searchTerm);
    
    const normalizedSearchTerm = normalize(searchTerm);
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX phb: <http://example.org/personasHistoricasBolivianas#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

      SELECT ?persona ?nombre ?descripcion ?fechaNacimiento ?fechaFallecimiento 
             ?lugarNacimiento ?lugarFallecimiento ?nacionalidad ?ocupacion ?imagenReferencia
      WHERE {
        ?persona rdf:type phb:PersonaHistoricaBoliviana .
        ?persona phb:nombre ?nombre .
        OPTIONAL { ?persona phb:resumen ?descripcion }
        OPTIONAL { ?persona phb:fechaNacimiento ?fechaNacimiento }
        OPTIONAL { ?persona phb:fechaFallecimiento ?fechaFallecimiento }
        OPTIONAL { ?persona phb:lugarNacimiento ?lugarNacimiento }
        OPTIONAL { ?persona phb:lugarFallecimiento ?lugarFallecimiento }
        OPTIONAL { ?persona phb:nacionalidad ?nacionalidad }
        OPTIONAL { ?persona phb:ocupacion ?ocupacion }
        OPTIONAL { ?persona phb:imagenReferencia ?imagenReferencia }
        
        FILTER(
          CONTAINS(REPLACE(LCASE(?nombre), "[\\u0300-\\u036f]", ""), "${normalizedSearchTerm}") || 
          CONTAINS(REPLACE(LCASE(?descripcion), "[\\u0300-\\u036f]", ""), "${normalizedSearchTerm}")
        )
      }
      ORDER BY ?nombre
      LIMIT 50
    `;

    console.log("📝 Consulta SPARQL para ontología local:");
    console.log(query);

    const result = await executeSparqlQuery(query);
    console.log("📦 Respuesta de ontología local:", JSON.stringify(result, null, 2));

    const processedResults: HistoricalPerson[] = [];
    if (result.results && result.results.bindings) {
      console.log(`🔢 Número de resultados de ontología local: ${result.results.bindings.length}`);
      for (const binding of result.results.bindings) {
        const id = binding.persona?.value.split("#").pop() || "";
        if (!processedResults.some(p => p.id === id)) {
          const person: HistoricalPerson = {
            id,
            uri: binding.persona?.value || "",
            name: binding.nombre?.value || "",
            description: binding.descripcion?.value || "",
            thumbnail: binding.imagenReferencia?.value || "",
            fechaNacimiento: binding.fechaNacimiento?.value || "",
            fechaFallecimiento: binding.fechaFallecimiento?.value || "",
            lugarNacimiento: binding.lugarNacimiento?.value || "",
            lugarFallecimiento: binding.lugarFallecimiento?.value || "",
            nacionalidad: binding.nacionalidad?.value || "",
            ocupacion: binding.ocupacion?.value || "",
            source: "ontology",
            type: "PersonaHistoricaBoliviana",
          };
          
          console.log("📝 Transformando persona:", {
            id: person.id,
            name: person.name,
            descriptionLength: person.description.length,
            fechaNacimiento: person.fechaNacimiento,
            fechaFallecimiento: person.fechaFallecimiento,
            nacionalidad: person.nacionalidad,
            lugarNacimiento: person.lugarNacimiento,
            ocupacion: person.ocupacion
          });
          
          processedResults.push(person);
        }
      }
    }

    console.log(`✅ Se transformaron ${processedResults.length} resultados únicos de ontología local`);
    return processedResults;
  } catch (error) {
    console.error("❌ Error al buscar en ontología local:", error);
    return [];
  }
}

/**
 * Process ontology query results into a standardized format
 */
function processOntologyResults(result: SparqlResult, language: string): OntologyResult[] {
  if (!result.results?.bindings) {
    console.log("No hay resultados para procesar")
    return []
  }

  const processedResults = result.results.bindings.map((binding) => {
    const processed = {
      id: (binding.persona?.value.split("/").pop() || binding.nombre?.value || Math.random().toString()).replace(/[^a-zA-Z0-9-_]/g, ""),
      uri: binding.persona?.value || "",
      name: binding.nombre?.value || "",
      description: binding.descripcion?.value || "",
      thumbnail: binding.imagenReferencia?.value || "",
      fechaNacimiento: binding.fechaNacimiento?.value || "",
      fechaFallecimiento: binding.fechaFallecimiento?.value || "",
      lugarNacimiento: binding.lugarNacimiento?.value || "",
      lugarFallecimiento: binding.lugarFallecimiento?.value || "",
      nacionalidad: binding.nacionalidad?.value || "",
      ocupacion: binding.ocupacion?.value || "",
      source: "ontology",
    }
    console.log("Resultado procesado:", processed)
    return processed
  })

  console.log("Total de resultados procesados:", processedResults.length)
  return processedResults
}

function escapeLiteral(str: string): string {
  return (str || "")
    .replace(/\\/g, '\\\\')   
    .replace(/"/g, '\\"')     
    .replace(/[\r\n]+/g, ' ')   
    .replace(/\t/g, ' ');       
}


function normalize(str: string): string {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
