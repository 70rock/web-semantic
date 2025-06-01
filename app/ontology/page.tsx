"use client"

import { useState } from "react"
import { OntologyViewer } from "@/components/ontology-viewer"
import { SparqlEditor } from "@/components/sparql-editor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe } from "lucide-react"

export default function OntologyPage() {
  const [language, setLanguage] = useState("es")

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {language === "es" ? "Explorador de Ontología" : "Ontology Explorer"}
        </h1>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-[100px]">
            <Globe className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="es">Español</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="viewer" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="viewer">{language === "es" ? "Visualizador" : "Viewer"}</TabsTrigger>
          <TabsTrigger value="sparql">SPARQL</TabsTrigger>
          <TabsTrigger value="dbpedia">DBpedia</TabsTrigger>
        </TabsList>

        <TabsContent value="viewer">
          <OntologyViewer language={language} />
        </TabsContent>

        <TabsContent value="sparql">
          <SparqlEditor language={language} />
        </TabsContent>

        <TabsContent value="dbpedia">
          <div className="grid gap-6">
            <div className="bg-muted rounded-lg p-6 text-center">
              <h2 className="text-xl font-bold mb-2">
                {language === "es" ? "Conexión con DBpedia" : "DBpedia Connection"}
              </h2>
              <p className="text-muted-foreground mb-4">
                {language === "es"
                  ? "Enriquecimiento de datos de personas históricas bolivianas desde DBpedia"
                  : "Data enrichment of Bolivian historical figures from DBpedia"}
              </p>
              <div className="inline-flex items-center justify-center rounded-full bg-green-100 p-2 text-green-600">
                <div className="h-2 w-2 rounded-full bg-green-600 mr-2"></div>
                <span className="text-sm font-medium">{language === "es" ? "Conectado" : "Connected"}</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">{language === "es" ? "Mapeo de Conceptos" : "Concept Mapping"}</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between p-2 bg-muted/50 rounded">
                    <span>{language === "es" ? "Persona Histórica" : "Historical Person"}</span>
                    <span className="text-sm font-mono">dbo:Person</span>
                  </li>
                  <li className="flex justify-between p-2 bg-muted/50 rounded">
                    <span>{language === "es" ? "Lugar de Nacimiento" : "Birth Place"}</span>
                    <span className="text-sm font-mono">dbo:birthPlace</span>
                  </li>
                  <li className="flex justify-between p-2 bg-muted/50 rounded">
                    <span>{language === "es" ? "Ocupación" : "Occupation"}</span>
                    <span className="text-sm font-mono">dbo:occupation</span>
                  </li>
                  <li className="flex justify-between p-2 bg-muted/50 rounded">
                    <span>{language === "es" ? "Nacionalidad" : "Nationality"}</span>
                    <span className="text-sm font-mono">dbo:nationality</span>
                  </li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">
                  {language === "es" ? "Estadísticas de Enriquecimiento" : "Enrichment Statistics"}
                </h3>
                <ul className="space-y-2">
                  <li className="flex justify-between p-2 bg-muted/50 rounded">
                    <span>{language === "es" ? "Personas enriquecidas" : "Enriched people"}</span>
                    <span className="font-medium">15</span>
                  </li>
                  <li className="flex justify-between p-2 bg-muted/50 rounded">
                    <span>{language === "es" ? "Propiedades añadidas" : "Added properties"}</span>
                    <span className="font-medium">40</span>
                  </li>
                  <li className="flex justify-between p-2 bg-muted/50 rounded">
                    <span>{language === "es" ? "Última actualización" : "Last update"}</span>
                    <span className="font-medium">2024-06-07</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
