"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"

type ClassName = "PersonaHistoricaBoliviana"

// Definir una interfaz para los datos de la persona histórica
interface HistoricalFigure {
  person: { value: string; type: string };
  nombre: { value: string; type: string };
  resumen: { value: string; type: string };
  fechaNacimiento?: { value: string; type: string };
  fechaFallecimiento?: { value: string; type: string };
  lugarNacimiento?: { value: string; type: string };
  lugarFallecimiento?: { value: string; type: string };
  nacionalidad?: { value: string; type: string };
  ocupacion?: { value: string; type: string };
  imagenReferencia?: { value: string; type: string };
}


function decodeBase64IfNeeded(text: string): string {
  try {
    if (/^[A-Za-z0-9+/=]+$/.test(text) && text.length % 4 === 0) {
      const decoded = atob(text);

      if (/[ -\u001F]/.test(decoded)) return text;
      return decoded;
    }
    return text;
  } catch {
    return text;
  }
}

export function OntologyViewer({ language = "es" }) {
  const [expandedClasses, setExpandedClasses] = useState<Record<ClassName, boolean>>({
    PersonaHistoricaBoliviana: true
  })
  const [historicalFigures, setHistoricalFigures] = useState<HistoricalFigure[]>([]);
  const [loadingIndividuals, setLoadingIndividuals] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleClass = (className: ClassName) => {
    setExpandedClasses({
      ...expandedClasses,
      [className]: !expandedClasses[className],
    })
  }

  
  useEffect(() => {
    async function fetchHistoricalFigures() {
      try {
        setLoadingIndividuals(true);
        const response = await fetch("/api/ontology/historical-figures");
        if (!response.ok) {
          throw new Error(`Failed to fetch historical figures: ${response.statusText}`);
        }
        const data: HistoricalFigure[] = await response.json();
        setHistoricalFigures(data);
      } catch (error) {
        console.error("Error fetching historical figures:", error);
        
      } finally {
        setLoadingIndividuals(false);
      }
    }

    fetchHistoricalFigures();
  }, []); 

  
  const filteredFigures = historicalFigures.filter(figure => 
    
    figure && figure.nombre?.value && 
    figure.nombre.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{language === "es" ? "Visualizador de Ontología" : "Ontology Viewer"}</CardTitle>
        <CardDescription>
          {language === "es"
            ? "Explorar la estructura de la ontología de personas históricas bolivianas"
            : "Explore the Bolivian historical figures ontology structure"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="classes">
          <TabsList className="mb-4">
            <TabsTrigger value="classes">{language === "es" ? "Clases" : "Classes"}</TabsTrigger>
            <TabsTrigger value="properties">{language === "es" ? "Propiedades" : "Properties"}</TabsTrigger>
            <TabsTrigger value="individuals">{language === "es" ? "Individuos" : "Individuals"}</TabsTrigger>
          </TabsList>

          <TabsContent value="classes">
            <div className="space-y-2">
              <div className="border rounded-md">
                <Button
                  variant="ghost"
                  className="w-full justify-between font-medium"
                  onClick={() => toggleClass("PersonaHistoricaBoliviana")}
                >
                  Persona Histórica Boliviana
                  {expandedClasses["PersonaHistoricaBoliviana"] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>

                {expandedClasses["PersonaHistoricaBoliviana"] && (
                  <div className="p-3 pt-0 pl-6 space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {language === "es" ? "Propiedades de datos:" : "Data Properties:"}
                    </div>
                    <ul className="space-y-1 text-sm pl-4">
                      <li>nombre</li>
                      <li>fechaNacimiento</li>
                      <li>fechaFallecimiento</li>
                      <li>resumen</li>
                    </ul>

                    <div className="text-sm text-muted-foreground mt-2">
                      {language === "es" ? "Propiedades de objeto:" : "Object Properties:"}
                    </div>
                    <ul className="space-y-1 text-sm pl-4">
                      <li>lugarNacimiento</li>
                      <li>lugarFallecimiento</li>
                      <li>nacionalidad</li>
                      <li>ocupacion</li>
                      <li>imagenReferencia</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="properties">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">
                  {language === "es" ? "Propiedades de Datos" : "Data Properties"}
                </h3>
                <ul className="space-y-1 border rounded-md divide-y">
                  <li className="p-2">
                    <div className="font-medium">nombre</div>
                    <div className="text-sm text-muted-foreground">
                      {language === "es" ? "Dominio: Persona Histórica Boliviana" : "Domain: Bolivian Historical Person"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {language === "es" ? "Rango: string" : "Range: string"}
                    </div>
                  </li>
                  <li className="p-2">
                    <div className="font-medium">fechaNacimiento</div>
                    <div className="text-sm text-muted-foreground">
                      {language === "es" ? "Dominio: Persona Histórica Boliviana" : "Domain: Bolivian Historical Person"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {language === "es" ? "Rango: date" : "Range: date"}
                    </div>
                  </li>
                  <li className="p-2">
                    <div className="font-medium">fechaFallecimiento</div>
                    <div className="text-sm text-muted-foreground">
                      {language === "es" ? "Dominio: Persona Histórica Boliviana" : "Domain: Bolivian Historical Person"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {language === "es" ? "Rango: date" : "Range: date"}
                    </div>
                  </li>
                  <li className="p-2">
                    <div className="font-medium">resumen</div>
                    <div className="text-sm text-muted-foreground">
                      {language === "es" ? "Dominio: Persona Histórica Boliviana" : "Domain: Bolivian Historical Person"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {language === "es" ? "Rango: string" : "Range: string"}
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">
                  {language === "es" ? "Propiedades de Objeto" : "Object Properties"}
                </h3>
                <ul className="space-y-1 border rounded-md divide-y">
                  <li className="p-2">
                    <div className="font-medium">lugarNacimiento</div>
                    <div className="text-sm text-muted-foreground">
                      {language === "es" ? "Dominio: Persona Histórica Boliviana" : "Domain: Bolivian Historical Person"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {language === "es" ? "Rango: Place" : "Range: Place"}
                    </div>
                  </li>
                  <li className="p-2">
                    <div className="font-medium">lugarFallecimiento</div>
                    <div className="text-sm text-muted-foreground">
                      {language === "es" ? "Dominio: Persona Histórica Boliviana" : "Domain: Bolivian Historical Person"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {language === "es" ? "Rango: Place" : "Range: Place"}
                    </div>
                  </li>
                  <li className="p-2">
                    <div className="font-medium">nacionalidad</div>
                    <div className="text-sm text-muted-foreground">
                      {language === "es" ? "Dominio: Persona Histórica Boliviana" : "Domain: Bolivian Historical Person"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {language === "es" ? "Rango: Country" : "Range: Country"}
                    </div>
                  </li>
                  <li className="p-2">
                    <div className="font-medium">ocupacion</div>
                    <div className="text-sm text-muted-foreground">
                      {language === "es" ? "Dominio: Persona Histórica Boliviana" : "Domain: Bolivian Historical Person"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {language === "es" ? "Rango: Agent" : "Range: Agent"}
                    </div>
                  </li>
                  <li className="p-2">
                    <div className="font-medium">imagenReferencia</div>
                    <div className="text-sm text-muted-foreground">
                      {language === "es" ? "Dominio: Persona Histórica Boliviana" : "Domain: Bolivian Historical Person"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {language === "es" ? "Rango: Image" : "Range: Image"}
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="individuals">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">
                  {language === "es" ? "Personas Históricas Bolivianas" : "Bolivian Historical Figures"}
                </h3>
                <div className="mb-4">
                   <Input
                     placeholder={language === "es" ? "Buscar por nombre..." : "Search by name..."}
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>

                <ul className="space-y-1 border rounded-md divide-y">
                   {loadingIndividuals ? (
                     <div className="text-center py-4 text-muted-foreground">
                       {language === "es" ? "Cargando individuos..." : "Loading individuals..."}
                     </div>
                   ) : filteredFigures.length > 0 ? (
                     filteredFigures.map((figure, index) => {
                       const isValidKey = figure?.person?.value && typeof figure.person.value === 'string';
                       const keyId = isValidKey ? figure.person.value : `fallback-key-${index}`;
                       
                       if (!isValidKey) {
                          console.warn("Using fallback key for historical figure with invalid ID data:", figure);
                       }

                       return (
                         <li key={keyId} className="p-2"> 
                           {!isValidKey && (
                              <div className="text-sm text-red-500 mb-2">{language === "es" ? "Advertencia: Datos de individuo incompletos (usando clave de respaldo)." : "Warning: Incomplete individual data (using fallback key)."}</div>
                           )}
                           {figure?.nombre?.value && typeof figure.nombre.value === 'string' && (
                             <div className="font-medium">{decodeBase64IfNeeded(figure.nombre.value) || "Sin nombre"}</div> 
                           )}
                           {figure?.resumen?.value && typeof figure.resumen.value === 'string' && (
                             <div className="text-sm text-muted-foreground">
                               {language === "es" ? "Resumen:" : "Summary:"} {decodeBase64IfNeeded(figure.resumen.value)}
                             </div>
                           )}
                           {figure?.fechaNacimiento?.value && typeof figure.fechaNacimiento.value === 'string' && (
                             <div className="text-sm text-muted-foreground">
                                {language === "es" ? "Nacimiento:" : "Birth Date:"} {decodeBase64IfNeeded(figure.fechaNacimiento.value)}
                             </div>
                           )}
                            {figure?.fechaFallecimiento?.value && typeof figure.fechaFallecimiento.value === 'string' && (
                             <div className="text-sm text-muted-foreground">
                                {language === "es" ? "Fallecimiento:" : "Death Date:"} {decodeBase64IfNeeded(figure.fechaFallecimiento.value)}
                              </div>
                            )}
                              {figure?.lugarNacimiento?.value && typeof figure.lugarNacimiento.value === 'string' && (
                    <div className="text-sm text-muted-foreground">
                                 {language === "es" ? "Lugar de Nacimiento:" : "Birth Place:"} {decodeBase64IfNeeded(figure.lugarNacimiento.value)}
                    </div>
                            )}
                               {figure?.lugarFallecimiento?.value && typeof figure.lugarFallecimiento.value === 'string' && (
                    <div className="text-sm text-muted-foreground">
                                 {language === "es" ? "Lugar de Fallecimiento:" : "Death Place:"} {decodeBase64IfNeeded(figure.lugarFallecimiento.value)}
                    </div>
                            )}
                              {figure?.nacionalidad?.value && typeof figure.nacionalidad.value === 'string' && (
                    <div className="text-sm text-muted-foreground">
                                 {language === "es" ? "Nacionalidad:" : "Nationality:"} {decodeBase64IfNeeded(figure.nacionalidad.value)}
                    </div>
                            )}
                               {figure?.ocupacion?.value && typeof figure.ocupacion.value === 'string' && (
                    <div className="text-sm text-muted-foreground">
                                 {language === "es" ? "Ocupación:" : "Occupation:"} {decodeBase64IfNeeded(figure.ocupacion.value)}
                    </div>
                            )}
                  </li>
                       );
                     })
                   ) : (
                     <div className="text-center py-8 text-muted-foreground">
                       {searchTerm ? (language === "es" ? "No hay individuos que coincidan con la búsqueda" : "No individuals matching the search") : (language === "es" ? "No hay individuos en la ontología" : "No individuals in the ontology")}
                     </div>
                   )}
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
