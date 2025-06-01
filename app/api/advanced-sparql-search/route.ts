import { NextResponse } from "next/server";
import { executeSparqlQuery } from "@/lib/ontology-service";

interface OntologyResult {
  id: string;
  uri: string;
  name: string;
  description: string;
  thumbnail: string;
  fechaNacimiento?: string;
  fechaFallecimiento?: string;
  lugarNacimiento?: string;
  lugarFallecimiento?: string;
  nacionalidad?: string;
  ocupacion?: string;
  imagenReferencia?: string;
  source: string;
}

interface SparqlResult {
    results: {
      bindings: Array<{
        [key: string]: {
          value: string;
          type: string;
        };
      }>;
    };
  }

function processSparqlBindingsToHistoricalPerson(bindings: any[], language: string): OntologyResult[] {
    if (!bindings) {
        return [];
    }

    return bindings.map(binding => {
        
        const decodeIfBase64 = (value: string | undefined) => {
          if (!value) return '';
          try {
            
            return Buffer.from(value, 'base64').toString('utf-8');
          } catch (e) {
            return value; 
          }
        };

        const uri = binding.persona?.value || binding.s?.value || ''; 

        return {
            id: (uri.split('/').pop() || binding.nombre?.value || Math.random().toString()).replace(/[^a-zA-Z0-9-_]/g, ""),
            uri: uri,
            name: decodeIfBase64(binding.nombre?.value || binding.label?.value) || (language === 'es' ? 'Sin nombre' : 'No name'),
            description: decodeIfBase64(binding.descripcion?.value || binding.abstract?.value || binding.comment?.value) || (language === 'es' ? 'Sin descripción' : 'No description'),
            thumbnail: binding.thumbnail?.value || binding.imagenReferencia?.value || '',
            fechaNacimiento: binding.fechaNacimiento?.value || '',
            fechaFallecimiento: binding.fechaFallecimiento?.value || '',
            lugarNacimiento: decodeIfBase64(binding.lugarNacimiento?.value) || '',
            lugarFallecimiento: decodeIfBase64(binding.lugarFallecimiento?.value) || '',
            nacionalidad: decodeIfBase64(binding.nacionalidad?.value) || '',
            ocupacion: decodeIfBase64(binding.ocupacion?.value) || '',
            source: 'ontology', 
            
        };
    });
}

export async function POST(request: Request) {
  try {
    const { query, language = "es" } = await request.json();
    console.log("Consulta SPARQL avanzada recibida:", { query, language });

    if (!query || query.trim() === "") {
      return NextResponse.json({ error: "La consulta SPARQL no puede estar vacía." }, { status: 400 });
    }

    
    const sparqlResponse: SparqlResult = await executeSparqlQuery(query);

    
    const processedResults = processSparqlBindingsToHistoricalPerson(sparqlResponse.results.bindings, language);

    console.log("Resultados de consulta avanzada procesados:", processedResults.length);

    return NextResponse.json({
      results: processedResults,
      sources: { ontology: true, dbpedia: false }, 
    });

  } catch (error: any) {
    console.error("Error en endpoint /api/advanced-sparql-search:", error);
    return NextResponse.json(
      {
        error: error.message || "Error al ejecutar la consulta SPARQL avanzada",
      },
      { status: 500 }
    );
  }
} 