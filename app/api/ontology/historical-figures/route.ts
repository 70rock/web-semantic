import { NextResponse } from "next/server";
import { executeSparqlQuery } from "@/lib/ontology-service";

function decodeBase64IfNeeded(text: string): string {
  try {
    if (/^[A-Za-z0-9+/=]+$/.test(text) && text.length % 4 === 0) {
      const decoded = Buffer.from(text, 'base64').toString('utf-8');
      if (/[ -\u001F]/.test(decoded)) return text;
      return decoded;
    }
    return text;
  } catch {
    return text;
  }
}


export async function GET() {
  
  if (process.env.NODE_ENV === "development") {
    console.log("🔧 Modo desarrollo: devolviendo datos de prueba");
    return NextResponse.json([
      {
        id: "Persona1",
        uri: "http://example.org/personasHistoricasBolivianas#Persona1",
        name: "Simón Bolívar",
        description: "Libertador de América del Sur, conocido como El Libertador.",
        fechaNacimiento: "1783-07-24",
        fechaFallecimiento: "1830-12-17",
        lugarNacimiento: "Caracas, Venezuela",
        lugarFallecimiento: "Santa Marta, Colombia",
        nacionalidad: "Venezolano",
        ocupacion: "Militar y político",
        thumbnail: "https://example.com/simon-bolivar.jpg",
        source: "ontology",
        type: "PersonaHistoricaBoliviana",
      },
      {
        id: "Persona2",
        uri: "http://example.org/personasHistoricasBolivianas#Persona2",
        name: "Juana Azurduy",
        description: "Heroína de la independencia de Bolivia y Argentina.",
        fechaNacimiento: "1780-07-12",
        fechaFallecimiento: "1862-05-25",
        lugarNacimiento: "Chuquisaca, Bolivia",
        lugarFallecimiento: "Sucre, Bolivia",
        nacionalidad: "Boliviana",
        ocupacion: "Militar y líder independentista",
        thumbnail: "https://example.com/juana-azurduy.jpg",
        source: "ontology",
        type: "PersonaHistoricaBoliviana",
      },
    ]);
  }
  
  const query = `
    PREFIX phb: <http://example.org/personasHistoricasBolivianas#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX dbo: <http://dbpedia.org/ontology/>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>

    SELECT DISTINCT ?person ?nombre ?resumen ?fechaNacimiento ?fechaFallecimiento ?lugarNacimiento ?lugarFallecimiento ?nacionalidad ?ocupacion ?imagenReferencia WHERE {
      ?person rdf:type phb:PersonaHistoricaBoliviana .
      OPTIONAL { ?person phb:nombre ?nombre }.
      OPTIONAL { ?person phb:resumen ?resumen }.
      OPTIONAL { ?person phb:fechaNacimiento ?fechaNacimiento }.
      OPTIONAL { ?person phb:fechaFallecimiento ?fechaFallecimiento }.
      OPTIONAL { ?person phb:lugarNacimiento ?lugarNacimiento }.
      OPTIONAL { ?person phb:lugarFallecimiento ?lugarFallecimiento }.
      OPTIONAL { ?person phb:nacionalidad ?nacionalidad }.
      OPTIONAL { ?person phb:ocupacion ?ocupacion }.
      OPTIONAL { ?person phb:imagenReferencia ?imagenReferencia }.
    }
  `;

  try {
    
    const results = await executeSparqlQuery(query);

    
    const unified = (results.results.bindings || []).map((b: any) => ({
      id: b.person?.value?.split('#').pop() || b.person?.value || '',
      uri: b.person?.value || '',
      name: decodeBase64IfNeeded(b.nombre?.value || ''),
      description: decodeBase64IfNeeded(b.resumen?.value || ''),
      fechaNacimiento: decodeBase64IfNeeded(b.fechaNacimiento?.value || ''),
      fechaFallecimiento: decodeBase64IfNeeded(b.fechaFallecimiento?.value || ''),
      lugarNacimiento: decodeBase64IfNeeded(b.lugarNacimiento?.value || ''),
      lugarFallecimiento: decodeBase64IfNeeded(b.lugarFallecimiento?.value || ''),
      nacionalidad: decodeBase64IfNeeded(b.nacionalidad?.value || ''),
      ocupacion: decodeBase64IfNeeded(b.ocupacion?.value || ''),
      thumbnail: b.imagenReferencia?.value || '',
      source: 'ontology',
      type: 'PersonaHistoricaBoliviana',
    }));

    return NextResponse.json(unified);

  } catch (error: any) {
    console.error("Error fetching historical figures from ontology:", error);
    return NextResponse.json(
      { message: "Error al obtener personas históricas de la ontología", error: error.message },
      { status: 500 }
    );
  }
} 