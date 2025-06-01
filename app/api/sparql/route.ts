import { NextResponse } from "next/server"
import { join } from "path"
import { readFile, writeFile } from "fs/promises"
import { Parser, Store } from "n3"

interface SparqlBinding {
  [key: string]: {
    value: string;
    type: string;
  };
}

function normalize(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}


export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: "La consulta SPARQL es requerida" },
        { status: 400 }
      )
    }

    console.log("Recibida consulta SPARQL:", query)

   
    const ttlPath = join(process.cwd(), "app", "ontologia_personas_historicas_bolivianas.ttl")
    let ttlContent = ""

    try {
      ttlContent = await readFile(ttlPath, "utf-8")
      console.log("Contenido actual del archivo TTL:", ttlContent)
    } catch (error: any) {
      if (error.code === "ENOENT") {
        
        ttlContent = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix phb: <http://example.org/personasHistoricasBolivianas#> .\n\n`;
        await writeFile(ttlPath, ttlContent)
        console.log("Archivo TTL creado con prefijos")
      } else {
        throw error
      }
    }

   
    const parser = new Parser({ format: "text/turtle" })
    const store = new Store()

    if (ttlContent) {
      try {
        const quads = parser.parse(ttlContent)
        store.addQuads(quads)
        console.log("Contenido TTL parseado exitosamente")
       
        const allQuads = store.getQuads(null, null, null, null)
        console.log("[DEPURACIÓN] Todos los quads en el store:")
        allQuads.forEach(q => {
          console.log(`  S: ${q.subject.value}`)
          console.log(`  P: ${q.predicate.value}`)
          console.log(`  O: ${q.object.value}`)
        })
      } catch (parseError) {
        console.error("Error parsing TTL:", parseError)
        return NextResponse.json(
          { error: "Error al parsear el archivo TTL" },
          { status: 500 }
        )
      }
    }

    
    const tipoPred = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
    const tipoObj = "http://example.org/personasHistoricasBolivianas#PersonaHistoricaBoliviana"
    const personas = store.getQuads(null, tipoPred, tipoObj, null)
      .filter(q => q.subject.value !== tipoObj)
    console.log("[DEPURACIÓN] Sujeto(s) instancias encontradas:")
    personas.forEach(q => console.log("  " + q.subject.value))

   
    const queryTrimmed = query.trim()
    const queryUpper = queryTrimmed.toUpperCase()
    console.log("Tipo de consulta detectado:", queryUpper)

    if (queryUpper.includes("INSERT DATA")) {
      // Solo permitir escritura en desarrollo
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "La escritura en la ontología local no está permitida en producción (solo lectura)" },
          { status: 403 }
        )
      }
      
      const insertMatch = queryTrimmed.match(/INSERT\s+DATA\s*{([^}]*)}/i)
      if (insertMatch) {
        
        const triples = insertMatch[1]
          .split(/(?<=\.)\s+/)
          .map((t: string) => t.trim())
          .filter((t: string) => t && !t.startsWith("PREFIX"))

        console.log("Tripletas a insertar:", triples)

        
        for (const triple of triples) {
          try {
            
            const decodedTriple = triple.replace(/"([A-Za-z0-9+/=]+)"/g, (match: string, base64: string) => {
              try {
                const decoded = Buffer.from(base64, 'base64').toString('utf-8');
                return `"${decoded.replace(/"/g, '\\"')}"`;
              } catch (e) {
                return match; 
              }
            });

            
            const tripleWithDot = decodedTriple.endsWith(".") ? decodedTriple : decodedTriple + " ."
            console.log("Procesando tripleta:", tripleWithDot)
            
            
            const tripleWithPrefixes = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix phb: <http://example.org/personasHistoricasBolivianas#> .

${tripleWithDot}`
            
            try {
              const quads = parser.parse(tripleWithPrefixes)
              
              if (quads.length === 0) {
                console.error("No se pudo parsear la tripleta:", triple)
                continue
              }

              
              const quad = quads[0]
              if (!quad.subject || !quad.predicate || !quad.object) {
                console.error("Tripleta inválida:", triple)
                continue
              }

              store.addQuad(quad)
              console.log("Tripleta añadida:", triple)
            } catch (parseError) {
             
              console.log("Error en parsing inicial, intentando con versión simplificada")
              
              
              const match = triple.match(/<([^>]+)>\s+([^<]+)\s+"([^"]+)"/);
              if (match) {
                const [_, subject, predicate, object] = match;
                const simplifiedTriple = `<${subject}> ${predicate.trim()} "${object.replace(/"/g, '\\"')}" .`;
                
                const simplifiedWithPrefixes = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix phb: <http://example.org/personasHistoricasBolivianas#> .

${simplifiedTriple}`;
                
                const quads = parser.parse(simplifiedWithPrefixes);
                if (quads.length > 0) {
                  store.addQuad(quads[0]);
                  console.log("Tripleta añadida (versión simplificada):", simplifiedTriple);
                } else {
                  throw new Error("No se pudo parsear la tripleta simplificada");
                }
              } else {
                throw parseError;
              }
            }
          } catch (error) {
            console.error("Error parsing triple:", triple, error)
            return NextResponse.json(
              { error: `Error al parsear tripleta: ${triple}` },
              { status: 400 }
            )
          }
        }

        
        try {
          const writer = new Store()
          writer.addQuads(store.getQuads(null, null, null, null))
          const updatedContent = writer.toString()
          await writeFile(ttlPath, updatedContent)
          console.log("Archivo TTL actualizado exitosamente")
        } catch (writeError) {
          console.error("Error al escribir el archivo TTL:", writeError)
          return NextResponse.json(
            { error: "Error al guardar los cambios" },
            { status: 500 }
          )
        }

        return NextResponse.json({ success: true })
      } else {
        console.error("Formato de consulta INSERT inválido:", query)
        return NextResponse.json(
          { error: "Formato de consulta INSERT inválido" },
          { status: 400 }
        )
      }
    } else if (queryUpper.includes("SELECT")) {
      
      try {
        ttlContent = await readFile(ttlPath, "utf-8");
        const quads = parser.parse(ttlContent);
        store.removeQuads(store.getQuads(null, null, null, null));
        store.addQuads(quads);
        console.log("Store recargado desde TTL para SELECT");
      } catch (parseError) {
        console.error("Error recargando TTL para SELECT:", parseError);
        return NextResponse.json(
          { error: "Error al recargar el archivo TTL para SELECT" },
          { status: 500 }
        );
      }

      
      const selectMatch = queryTrimmed.match(/SELECT\s+([\s\S]*?)\s+WHERE/i)
      let variables: string[] = []
      
  const results = {
    results: {
          bindings: [] as SparqlBinding[],
        },
      }
      if (selectMatch) {
        variables = selectMatch[1]
          .split(" ")
          .map((v: string) => v.trim())
          .filter((v: string) => v.startsWith("?"))
      }
      
      if (variables.length === 0) {
        variables = ["?nombre", "?descripcion"]
        console.log("[DEPURACIÓN] No se detectaron variables en SELECT, usando ?nombre y ?descripcion por defecto para depuración.")
      }

      
      let searchTerm = ""
      const filterMatch = queryTrimmed.match(/FILTER\s*\((?:.|\n)*?"([^"]+)"\)/i)
      if (filterMatch) {
        searchTerm = normalize(filterMatch[1])
        console.log("[DEPURACIÓN] Término de búsqueda original:", filterMatch[1])
        console.log("[DEPURACIÓN] Término de búsqueda normalizado:", searchTerm)
      }

      
      const subjectMatch = queryTrimmed.match(/<([^>]+)>\s+\?predicado\s+\?valor/i)
      let targetSubject = null
      if (subjectMatch) {
        targetSubject = subjectMatch[1]
        console.log("[DEPURACIÓN] URI del sujeto a buscar:", targetSubject)
      }
      
      const personas = store.getQuads(
        null,
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        "http://example.org/personasHistoricasBolivianas#PersonaHistoricaBoliviana",
        null
      ).filter(q => {
        
        if (targetSubject) {
          return q.subject.value === targetSubject
        }
        
        return q.subject.value !== "http://example.org/personasHistoricasBolivianas#PersonaHistoricaBoliviana"
      })

      console.log("[DEPURACIÓN] Número total de personas encontradas:", personas.length)

      
      const variableToPredicate: Record<string, string> = {
        nombre: "nombre",
        descripcion: "resumen",
        resumen: "resumen",
        fechaNacimiento: "fechaNacimiento",
        fechaFallecimiento: "fechaFallecimiento",
        lugarNacimiento: "lugarNacimiento",
        lugarFallecimiento: "lugarFallecimiento",
        nacionalidad: "nacionalidad",
        ocupacion: "ocupacion",
        imagenReferencia: "imagenReferencia",
        persona: "" 
      }

      for (const persona of personas) {
        const subject = persona.subject.value
        console.log(`\n[DEPURACIÓN] Procesando persona: ${subject}`)
        
       
        const nombreQuad = store.getQuads(subject, "http://example.org/personasHistoricasBolivianas#nombre", null, null)
        const descripcionQuad = store.getQuads(subject, "http://example.org/personasHistoricasBolivianas#resumen", null, null)
        const nombreValor = nombreQuad.length > 0 ? nombreQuad[0].object.value : "(sin nombre)"
        const descripcionValor = descripcionQuad.length > 0 ? descripcionQuad[0].object.value : "(sin descripción)"
        console.log(`[DEPURACIÓN] Nombre original: '${nombreValor}'`)
        console.log(`[DEPURACIÓN] Descripción original: '${descripcionValor}'`)
        console.log(`[DEPURACIÓN] Nombre normalizado: '${normalize(nombreValor)}'`)
        console.log(`[DEPURACIÓN] Descripción normalizada: '${normalize(descripcionValor)}'`)
        console.log(`[DEPURACIÓN] Término de búsqueda: '${searchTerm}'`)

        
        const binding: SparqlBinding = {}
        for (const variable of variables) {
          const varName = variable.substring(1)
          const predKey = variableToPredicate[varName]
          if (predKey !== "") {
            const predicate = `http://example.org/personasHistoricasBolivianas#${predKey}`
            const quads = store.getQuads(subject, predicate, null, null)
            if (quads.length > 0) {
              binding[varName] = {
                value: quads[0].object.value,
                type: quads[0].object.termType === "Literal" ? "literal" : "uri",
              }
              console.log(`[DEPURACIÓN] Variable '${varName}' mapeada a valor: '${quads[0].object.value}'`)
            } else {
              console.log(`[DEPURACIÓN] No se encontró valor para variable '${varName}'`)
            }
          }
        }

        
        const nombre = normalize(nombreValor) || "";
        const descripcion = normalize(descripcionValor) || "";
        const hayCoincidencia = nombre.includes(searchTerm) || descripcion.includes(searchTerm)
        console.log(`[DEPURACIÓN] ¿Hay coincidencia?: ${hayCoincidencia}`)

        if (hayCoincidencia) {
          console.log(`[DEPURACIÓN] ¡Coincidencia encontrada para ${subject}!`)
          if (variables.includes("?persona")) {
            binding.persona = {
              value: subject,
              type: "uri",
            }
          }
          results.results.bindings.push(binding)
        }

        
        if (
          variables.length === 2 &&
          variables.includes("?predicado") &&
          variables.includes("?valor")
        ) {
          const quads = store.getQuads(subject, null, null, null);
          for (const quad of quads) {
           
            if (quad.predicate.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") continue;
            results.results.bindings.push({
              predicado: { value: quad.predicate.value, type: "uri" },
              valor: { value: quad.object.value, type: quad.object.termType === "Literal" ? "literal" : "uri" },
            });
          }
          
          continue;
        }
      }

      if (selectMatch) {
        console.log(`\n[DEPURACIÓN] Resumen final:`)
        console.log(`  Total de personas procesadas: ${personas.length}`)
        console.log(`  Resultados encontrados: ${results.results.bindings.length}`)
  return NextResponse.json(results)
      } else {
        return NextResponse.json(
          { error: "No se pudo interpretar la consulta SELECT" },
          { status: 400 }
        )
      }
    }
  } catch (error: any) {
    console.error("Error procesando consulta SPARQL:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
