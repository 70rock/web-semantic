"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play } from "lucide-react"

type SparqlResults = {
  head: { vars: string[] },
  results: { bindings: any[] }
} | null;

export function SparqlEditor({ language = "es" }) {
  const [query, setQuery] = useState(`PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX phb: <http://example.org/personasHistoricasBolivianas#>

SELECT ?persona ?nombre ?fechaNacimiento ?ocupacion
WHERE {
  ?persona rdf:type phb:PersonaHistoricaBoliviana .
  ?persona phb:nombre ?nombre .
  OPTIONAL { ?persona phb:fechaNacimiento ?fechaNacimiento }
  OPTIONAL { ?persona phb:ocupacion ?ocupacion }
}
ORDER BY ?nombre
LIMIT 10`)

  const [results, setResults] = useState<SparqlResults>(null)
  const [loading, setLoading] = useState(false)
  const [endpoint, setEndpoint] = useState("local")

  const executeQuery = async () => {
    setLoading(true)

    setTimeout(() => {
      setResults({
        head: {
          vars: ["persona", "nombre", "fechaNacimiento", "ocupacion"],
        },
        results: {
          bindings: [
            {
              persona: { type: "uri", value: "http://example.org/personasHistoricasBolivianas#SimonBolivar" },
              nombre: { type: "literal", value: "Simón Bolívar" },
              fechaNacimiento: { type: "literal", value: "1783-07-24" },
              ocupacion: { type: "literal", value: "Militar, Político" },
            },
            {
              persona: { type: "uri", value: "http://example.org/personasHistoricasBolivianas#JuanaAzurduy" },
              nombre: { type: "literal", value: "Juana Azurduy de Padilla" },
              fechaNacimiento: { type: "literal", value: "1780-07-12" },
              ocupacion: { type: "literal", value: "Heroína, Guerrillera" },
            },
            {
              persona: { type: "uri", value: "http://example.org/personasHistoricasBolivianas#AndresSantaCruz" },
              nombre: { type: "literal", value: "Andrés de Santa Cruz" },
              fechaNacimiento: { type: "literal", value: "1792-12-05" },
              ocupacion: { type: "literal", value: "Militar, Presidente" },
            },
          ],
        },
      })
      setLoading(false)
    }, 1000)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{language === "es" ? "Editor SPARQL" : "SPARQL Editor"}</CardTitle>
        <CardDescription>
          {language === "es"
            ? "Consulta la ontología de personas históricas bolivianas usando SPARQL"
            : "Query the Bolivian historical figures ontology using SPARQL"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Select value={endpoint} onValueChange={setEndpoint}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={language === "es" ? "Seleccionar endpoint" : "Select endpoint"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">{language === "es" ? "Endpoint Local" : "Local Endpoint"}</SelectItem>
              <SelectItem value="dbpedia">DBpedia SPARQL</SelectItem>
              <SelectItem value="fuseki">Apache Jena Fuseki</SelectItem>
            </SelectContent>
          </Select>

          <Button className="ml-auto flex items-center gap-2" onClick={executeQuery} disabled={loading}>
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
            ) : (
              <Play className="h-4 w-4" />
            )}
            {language === "es" ? "Ejecutar" : "Execute"}
          </Button>
        </div>

        <Textarea className="font-mono text-sm h-[200px]" value={query} onChange={(e) => setQuery(e.target.value)} />

        {results && (
          <div className="border rounded-md overflow-hidden">
            <div className="bg-muted p-2 text-sm font-medium">
              {language === "es" ? "Resultados" : "Results"}({results.results.bindings.length})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {results.head.vars.map((variable: string) => (
                      <th key={variable} className="px-4 py-2 text-left text-sm font-medium">
                        {variable}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.results.bindings.map((binding: any, index: number) => (
                    <tr key={index} className="border-b">
                      {results.head.vars.map((variable: string) => (
                        <td key={variable} className="px-4 py-2 text-sm">
                          {binding[variable] ? (
                            <span className="font-mono text-xs">{binding[variable].value}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
