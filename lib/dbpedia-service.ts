/**
 * Servicio para interactuar con los endpoints SPARQL de DBpedia y Wikidata
 */

import { NextResponse } from 'next/server';


interface DbpediaBinding {
  person?: { value: string }
  name?: { value: string }
  abstract?: { value: string }
  thumbnail?: { value: string }
  birthDate?: { value: string }
  deathDate?: { value: string }
  birthPlace?: { value: string }
  deathPlace?: { value: string }
  nationality?: { value: string }
  occupation?: { value: string }
  notableWork?: { value: string }
  award?: { value: string }
  education?: { value: string }
  almaMater?: { value: string }
  party?: { value: string }
  position?: { value: string }
  [key: string]: any
}

interface DbpediaResults {
  results: {
    bindings: DbpediaBinding[]
  }
}

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
  obraNotable?: string[]
  premios?: string[]
  educacion?: string[]
  universidad?: string[]
  partidoPolitico?: string[]
  cargo?: string[]
  source: string
  type: string
}

// Constantes
const DBPEDIA_ENDPOINT = "https://dbpedia.org/sparql"
const ES_DBPEDIA_ENDPOINT = "https://es.dbpedia.org/sparql"

/**
 * Ejecuta una consulta SPARQL contra DBpedia
 */
export async function executeDbpediaSparqlQuery(query: string, language = "es") {
  const endpoint = language === "es" ? ES_DBPEDIA_ENDPOINT : DBPEDIA_ENDPOINT;
  try {
    console.log("📡 Ejecutando consulta SPARQL en DBpedia:", endpoint);
    console.log("🔍 Query:", query);

    const params = new URLSearchParams({
      query,
      format: "json",
      timeout: "30000",
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/sparql-results+json",
      },
      body: params,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error response:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      throw new Error(`Error en consulta DBpedia (${response.status}): ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Respuesta recibida:", {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      resultsCount: data.results?.bindings?.length || 0
    });
    return data;
  } catch (error) {
    console.error("❌ Error al ejecutar consulta SPARQL:", {
      error,
      endpoint,
      query
    });
    throw error;
  }
}

/**
 * Obtiene los detalles adicionales de una persona
 */
async function getPersonDetails(personUri: string, language = "es"): Promise<Partial<HistoricalPerson>> {
  const query = `
    PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX dcterms: <http://purl.org/dc/terms/>

    SELECT ?birthPlace ?birthPlaceLabel ?deathPlace ?deathPlaceLabel ?nationality ?nationalityLabel ?occupation ?occupationLabel ?thumbnail
WHERE {
      <${personUri}> dbo:birthPlace ?birthPlace .
      OPTIONAL { 
        ?birthPlace rdfs:label ?birthPlaceLabel .
        FILTER(LANG(?birthPlaceLabel) = "${language}")
      }
      
      OPTIONAL {
        <${personUri}> dbo:deathPlace ?deathPlace .
        OPTIONAL { 
          ?deathPlace rdfs:label ?deathPlaceLabel .
          FILTER(LANG(?deathPlaceLabel) = "${language}")
        }
      }
  
  OPTIONAL { 
        <${personUri}> dbo:nationality ?nationality .
        OPTIONAL { 
          ?nationality rdfs:label ?nationalityLabel .
          FILTER(LANG(?nationalityLabel) = "${language}")
  }
      }

      OPTIONAL {
        <${personUri}> dbo:occupation ?occupation .
  OPTIONAL { 
          ?occupation rdfs:label ?occupationLabel .
          FILTER(LANG(?occupationLabel) = "${language}")
  }
      }

  OPTIONAL { 
        <${personUri}> dbo:thumbnail ?thumbnail
  }
}
  `;

  try {
    const result: DbpediaResults = await executeDbpediaSparqlQuery(query, language);
    if (!result.results?.bindings || result.results.bindings.length === 0) {
      return {};
    }

    const binding = result.results.bindings[0];
    return {
      lugarNacimiento: binding.birthPlaceLabel?.value || binding.birthPlace?.value.split("/").pop() || "",
      lugarFallecimiento: binding.deathPlaceLabel?.value || binding.deathPlace?.value.split("/").pop() || "",
      nacionalidad: binding.nationalityLabel?.value || binding.nationality?.value.split("/").pop() || "",
      ocupacion: binding.occupationLabel?.value || binding.occupation?.value.split("/").pop() || "",
      thumbnail: binding.thumbnail?.value || "",
    };
  } catch (error) {
    console.error(`❌ Error al obtener detalles de ${personUri}:`, error);
    return {};
  }
}

/**
 * Busca figuras históricas bolivianas en DBpedia
 */
export async function searchHistoricalFigures(
  searchTerm: string,
  language: "es" | "en" | "both" = "es",
  endpoint: "es" | "en" = "es",
  limit = 10
): Promise<HistoricalPerson[]> {
  try {
    console.log("🔍 Iniciando búsqueda en DBpedia con término:", searchTerm);
    const endpointUrl = endpoint === "es" ? ES_DBPEDIA_ENDPOINT : DBPEDIA_ENDPOINT;
    let langFilter = "";
    if (language === "both") {
      langFilter = 'FILTER((LANG(?name) = "es" || LANG(?name) = "en"))\n      FILTER((LANG(?abstract) = "es" || LANG(?abstract) = "en"))';
    } else {
      langFilter = `FILTER(LANG(?name) = "${language}")\n      FILTER(LANG(?abstract) = "${language}")`;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const specificFilterClauses: string[] = [];
    const patterns: { [key: string]: string[] } = {
      "nacido en": ["birthPlace"],
      "nacida en": ["birthPlace"],
      "ocupacion": ["occupation"],
      "fallecido en": ["deathPlace"],
      "fallecida en": ["deathPlace"],
      "nacionalidad": ["nationality"],
    };

    let unprocessedSearchTerm = lowerSearchTerm;

    
    for (const pattern in patterns) {
      const properties = patterns[pattern];
      const regex = new RegExp(pattern + "\\s+(.*?)(?=" + Object.keys(patterns).filter(p => p !== pattern).map(p => '|\\s+' + p).join('') + '|$)', 'gi');
      let match;
      while ((match = regex.exec(unprocessedSearchTerm)) !== null) {
        const value = match[1].trim();
        if (value) {
          const propertyFilters = properties.map(prop => 
             `CONTAINS(LCASE(?${prop}), LCASE("${value}"))`
          );
          specificFilterClauses.push(`(${propertyFilters.join(' || ')})`);
          unprocessedSearchTerm = unprocessedSearchTerm.substring(0, match.index) +
                                    ' '.repeat(match[0].length) +
                                    unprocessedSearchTerm.substring(match.index + match[0].length);
        }
      }
    }

    let mainFilterClause = "";

    if (specificFilterClauses.length > 0) {
       mainFilterClause = specificFilterClauses.join(' && ');
    }

    
    if (mainFilterClause === "" && searchTerm.trim() !== "") {
      mainFilterClause = `CONTAINS(LCASE(?name), LCASE("${searchTerm}")) || CONTAINS(LCASE(?abstract), LCASE("${searchTerm}"))`;
    }

    
    const bolivianityFilterClause = `
       FILTER EXISTS {
          { ?person dbo:nationality dbr:Bolivia } UNION
          { ?person dbp:nationality dbr:Bolivia } UNION
          { ?person dbo:birthPlace dbr:Bolivia } UNION
          { ?person dbp:birthPlace dbr:Bolivia } UNION
          { ?person dbo:deathPlace dbr:Bolivia } UNION
          { ?person dbp:deathPlace dbr:Bolivia } UNION
          { ?person dbo:birthPlace ?birthPlace . FILTER(CONTAINS(LCASE(?birthPlace), LCASE("bolivia"))) } UNION
          { ?person dbo:deathPlace ?deathPlace . FILTER(CONTAINS(LCASE(?deathPlace), LCASE("bolivia"))) } UNION
          { ?person dbo:abstract ?abstract . FILTER(CONTAINS(LCASE(?abstract), LCASE("bolivian")) || CONTAINS(LCASE(?abstract), LCASE("boliviana"))) }
       }
    `;

    let finalFilterClause = bolivianityFilterClause;

    if (mainFilterClause) {
      finalFilterClause = `FILTER(${mainFilterClause})\n${bolivianityFilterClause}`;
    }

    
    const finalQuery = `
      PREFIX dbo: <http://dbpedia.org/ontology/>
      PREFIX dbr: <http://dbpedia.org/resource/>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX dcterms: <http://purl.org/dc/terms/>

      SELECT DISTINCT ?person ?name ?abstract ?thumbnail ?birthPlace ?deathPlace ?nationality ?occupation
      WHERE {
        ?person a dbo:Person ;
                rdfs:label ?name ;
                dbo:abstract ?abstract .

        ${langFilter}

        FILTER(
          (CONTAINS(LCASE(STR(?name)), LCASE("${searchTerm}")) || 
           CONTAINS(LCASE(STR(?abstract)), LCASE("${searchTerm}")) ||
           CONTAINS(LCASE(STR(?abstract)), LCASE("${searchTerm.toLowerCase()}")) ||
           CONTAINS(LCASE(STR(?abstract)), LCASE("${searchTerm.toUpperCase()}")) ||
           CONTAINS(LCASE(STR(?abstract)), LCASE("${searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1)}")))
        )

        FILTER EXISTS {
          { ?person dbo:nationality dbr:Bolivia } UNION
          { ?person dbp:nationality dbr:Bolivia } UNION
          { ?person dbo:birthPlace dbr:Bolivia } UNION
          { ?person dbp:birthPlace dbr:Bolivia } UNION
          { ?person dbo:deathPlace dbr:Bolivia } UNION
          { ?person dbp:deathPlace dbr:Bolivia } UNION
          { ?person dbo:birthPlace ?birthPlace . FILTER(CONTAINS(LCASE(STR(?birthPlace)), LCASE("bolivia"))) } UNION
          { ?person dbo:deathPlace ?deathPlace . FILTER(CONTAINS(LCASE(STR(?deathPlace)), LCASE("bolivia"))) } UNION
          { ?person dbo:abstract ?abstract . FILTER(CONTAINS(LCASE(STR(?abstract)), LCASE("bolivian")) || CONTAINS(LCASE(STR(?abstract)), LCASE("boliviana"))) }
        }

        OPTIONAL { ?person dbo:thumbnail ?thumbnail }
        OPTIONAL { ?person dbo:birthPlace ?birthPlace }
        OPTIONAL { ?person dbo:deathPlace ?deathPlace }
        OPTIONAL { ?person dbo:nationality ?nationality }
        OPTIONAL { ?person dbo:occupation ?occupation }
      }
      ORDER BY ?name
      LIMIT ${limit}
    `;

    console.log("📝 Consulta SPARQL para DBpedia:");
    console.log(finalQuery);

    const result: DbpediaResults = await executeDbpediaSparqlQuery(finalQuery, endpoint);
    console.log("📦 Respuesta de DBpedia:", JSON.stringify(result, null, 2));

    // Procesar los resultados para el formato estándar
    const processedResults: HistoricalPerson[] = [];
    if (result.results && result.results.bindings) {
      console.log(`🔢 Número de resultados de DBpedia: ${result.results.bindings.length}`);
      for (const binding of result.results.bindings) {
        const id = binding.person?.value.split("/").pop() || "";
        if (!processedResults.some(p => p.id === id)) {
          const person: HistoricalPerson = {
            id,
      uri: binding.person?.value || "",
      name: binding.name?.value || "",
      description: binding.abstract?.value || "",
      thumbnail: binding.thumbnail?.value || "",
      fechaNacimiento: binding.birthDate?.value || "",
      fechaFallecimiento: binding.deathDate?.value || "",
      lugarNacimiento: binding.birthPlace?.value || "",
      lugarFallecimiento: binding.deathPlace?.value || "",
      nacionalidad: binding.nationality?.value || "",
      ocupacion: binding.occupation?.value || "",
      source: "dbpedia",
      type: "PersonaHistoricaBoliviana",
          };
          
          // Obtener detalles adicionales
          console.log(`🔍 Obteniendo detalles para ${person.name}...`);
          const details = await getPersonDetails(person.uri, endpoint === "es" ? "es" : "en");
          
          // Actualizar persona con los detalles
          Object.assign(person, details);
          
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

    console.log(`✅ Se transformaron ${processedResults.length} resultados únicos de DBpedia`);
    return processedResults;
  } catch (error) {
    console.error("❌ Error al buscar en DBpedia:", error);
    return [];
  }
}

/**
 * Alias para searchHistoricalFigures para mantener compatibilidad
 */
export const searchBolivianPeople = searchHistoricalFigures;

/**
 * Obtiene información detallada de una figura histórica
 */
export async function getHistoricalFigureDetails(personUri: string, language = "es"): Promise<HistoricalPerson | null> {
  const query = `
    PREFIX dbo: <http://dbpedia.org/ontology/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX dcterms: <http://purl.org/dc/terms/>
    
    SELECT ?name ?abstract ?thumbnail ?birthDate ?deathDate ?birthPlace ?deathPlace ?nationality ?occupation 
           ?notableWork ?award ?education ?almaMater ?party ?position
    WHERE {
      <${personUri}> rdfs:label ?name ;
                    rdfs:comment ?abstract .
      
      FILTER(LANG(?name) = "${language}")
      FILTER(LANG(?abstract) = "${language}")
      
      OPTIONAL { <${personUri}> dbo:thumbnail ?thumbnail }
      OPTIONAL { <${personUri}> dbo:birthDate ?birthDate }
      OPTIONAL { <${personUri}> dbo:deathDate ?deathDate }
      OPTIONAL { <${personUri}> dbo:birthPlace ?birthPlace }
      OPTIONAL { <${personUri}> dbo:deathPlace ?deathPlace }
      OPTIONAL { <${personUri}> dbo:nationality ?nationality }
      OPTIONAL { <${personUri}> dbo:occupation ?occupation }
      OPTIONAL { <${personUri}> dbo:notableWork ?notableWork }
      OPTIONAL { <${personUri}> dbo:award ?award }
      OPTIONAL { <${personUri}> dbo:education ?education }
      OPTIONAL { <${personUri}> dbo:almaMater ?almaMater }
      OPTIONAL { <${personUri}> dbo:party ?party }
      OPTIONAL { <${personUri}> dbo:position ?position }
    }
  `;

  try {
    const result: DbpediaResults = await executeDbpediaSparqlQuery(query, language);
    if (!result.results?.bindings || result.results.bindings.length === 0) {
      return null;
    }

    const binding = result.results.bindings[0];
    return {
      id: personUri.split("/").pop() || "",
      uri: personUri,
      name: binding.name?.value || "",
      description: binding.abstract?.value || "",
      thumbnail: binding.thumbnail?.value || "",
      fechaNacimiento: binding.birthDate?.value || "",
      fechaFallecimiento: binding.deathDate?.value || "",
      lugarNacimiento: binding.birthPlace?.value || "",
      lugarFallecimiento: binding.deathPlace?.value || "",
      nacionalidad: binding.nationality?.value || "",
      ocupacion: binding.occupation?.value || "",
      obraNotable: binding.notableWork ? [binding.notableWork.value] : [],
      premios: binding.award ? [binding.award.value] : [],
      educacion: binding.education ? [binding.education.value] : [],
      universidad: binding.almaMater ? [binding.almaMater.value] : [],
      partidoPolitico: binding.party ? [binding.party.value] : [],
      cargo: binding.position ? [binding.position.value] : [],
      source: "dbpedia",
      type: "PersonaHistoricaBoliviana",
    };
  } catch (error) {
    console.error("❌ Error al obtener detalles de la figura histórica:", error);
    return null;
  }
} 