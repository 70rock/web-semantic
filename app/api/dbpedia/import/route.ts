import { NextResponse } from "next/server"
import { searchBolivianPeople } from "@/lib/dbpedia-service"
import { importEntitiesToOntology } from "@/lib/ontology-service"
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';


function transformHistoricalFiguresToOntologyFormat(dbpediaResults: any[]): any[] {
  if (!dbpediaResults || !Array.isArray(dbpediaResults)) {
    console.log("❌ No hay resultados para transformar");
    return [];
  }

  console.log(`🔄 Transformando ${dbpediaResults.length} resultados...`);

  return dbpediaResults.map((person) => {
    
    const id = person.name.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    
    const fechaNacimiento = person.fechaNacimiento ? new Date(person.fechaNacimiento).toISOString().split('T')[0] : '';
    const fechaFallecimiento = person.fechaFallecimiento ? new Date(person.fechaFallecimiento).toISOString().split('T')[0] : '';

    
    const ocupacion = person.ocupacion ? 
      (Array.isArray(person.ocupacion) ? person.ocupacion : [person.ocupacion]) : 
      [];

    
    const transformed = {
      id,
      label: person.name,
      description: person.description || '',
      fechaNacimiento,
      fechaFallecimiento,
      lugarNacimiento: person.lugarNacimiento || '',
      lugarFallecimiento: person.lugarFallecimiento || '',
      nacionalidad: person.nacionalidad || 'Boliviana',
      ocupacion,
      imagenReferencia: person.thumbnail || '',
      type: 'PersonaHistoricaBoliviana'
    };

    console.log(`✅ Transformado: ${person.name} -> ${id}`);
    return transformed;
  });
}


export async function POST(request: Request) {
  const historyFilePath = join(process.cwd(), 'import-history.json');
  let importDetails = {};

  try {
    const { searchTerm = "", limit = 20 } = await request.json();
    console.log(`🔍 Buscando figuras históricas con término: ${searchTerm}, límite: ${limit}`);
    
    importDetails = { 
      timestamp: new Date().toISOString(), 
      searchTerm, 
      limit, 
      status: 'started' 
    };

    // Buscar en DBpedia
    const dbpediaResults = await searchBolivianPeople(searchTerm, "es", "es", limit);
    console.log(`📥 Obtenidas ${dbpediaResults.length} entidades de DBpedia`);

    
    const ontologyEntities = transformHistoricalFiguresToOntologyFormat(dbpediaResults);
    console.log(`🔄 Transformadas ${ontologyEntities.length} entidades para la ontología`);

    if (ontologyEntities.length === 0) {
      throw new Error("No se encontraron entidades válidas para importar");
    }

    // Importar a la ontología
    await importEntitiesToOntology(ontologyEntities, "PersonaHistoricaBoliviana");
    console.log(`✅ Importadas ${ontologyEntities.length} entidades exitosamente`);

    // Actualizar historial
    importDetails = { 
      ...importDetails, 
      status: 'success', 
      importedCount: ontologyEntities.length 
    };

    return NextResponse.json({ 
      success: true, 
      importedCount: ontologyEntities.length,
      entities: ontologyEntities 
    });

  } catch (error: any) {
    console.error("❌ Error durante la importación:", error);
    importDetails = { 
      ...importDetails, 
      status: 'failed', 
      error: error.message 
    };
    
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || "Error durante la importación",
        details: importDetails
      },
      { status: 500 }
    );
  } finally {
    
    try {
      let history = [];
      try {
        const historyData = await readFile(historyFilePath, 'utf-8');
        history = JSON.parse(historyData);
      } catch (readError: any) {
        
        if (readError.code !== 'ENOENT' && readError.name !== 'SyntaxError') {
          console.error('Error reading import history file:', readError);
        }
      }
      history.push(importDetails);
      await writeFile(historyFilePath, JSON.stringify(history, null, 2));
      console.log('Import history logged.');
    } catch (logError) {
      console.error('Error logging import history:', logError);
    }
  }
}
