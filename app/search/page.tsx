"use client"

import { useState, useEffect } from "react"
import { Search, ArrowRight, AlertCircle, Database, Globe, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useSearchParams } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

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

interface ErrorState {
  type: "error" | "info"
  message: string
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [language, setLanguage] = useState("es")
  const [searchResults, setSearchResults] = useState<HistoricalPerson[]>([])
  const [loading, setLoading] = useState(false)
  const [searchType, setSearchType] = useState("simple")
  const [activeTab, setActiveTab] = useState("simple")
  const [error, setError] = useState<ErrorState | null>(null)
  const [searchSource, setSearchSource] = useState("all")
  const [sparqlQuery, setSparqlQuery] = useState(`PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX phb: <http://www.semanticweb.org/ontologies/2024/0/personasHistoricasBolivianas#>

SELECT ?persona ?nombre ?descripcion ?fechaNacimiento ?fechaFallecimiento ?lugarNacimiento ?lugarFallecimiento ?nacionalidad ?ocupacion
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
  
  FILTER(CONTAINS(LCASE(?nombre), LCASE("bolivia")))
}
ORDER BY ?nombre
LIMIT 20`)

  
  const [yearRange, setYearRange] = useState([1500, 2024])
  const [occupationFilter, setOccupationFilter] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const searchParams = useSearchParams()

  
  useEffect(() => {
    const queryParam = searchParams.get("q")
    if (queryParam) {
      setSearchQuery(queryParam)
    }
  }, [searchParams])

  
  useEffect(() => {
    const queryParam = searchParams.get("q")
    if (queryParam && queryParam.trim() !== "") {
      const initialSearch = async () => {
        setLoading(true)
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(queryParam)}&lang=${language}`)
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const responseData = await response.json();
          setSearchResults(responseData.results || []);
          
          console.log("Resultados recibidos del backend (initialSearch):", responseData.results);
          
          if (responseData.results.length > 0) {
            setError({
              type: "info",
              message: language === "es" 
                ? `Se encontraron ${responseData.results.length} resultados en DBpedia`
                : `Found ${responseData.results.length} results in DBpedia`
            })
          }
        } catch (error) {
          console.error("Error executing search:", error)
          setError({
            type: "error",
            message: language === "es"
              ? "Error al ejecutar la búsqueda. Por favor, inténtelo de nuevo."
              : "Error executing search. Please try again."
          })
        } finally {
          setLoading(false)
        }
      }

      initialSearch()
    }
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    setSearchResults([])
    setError(null)

    try {
      let results: HistoricalPerson[] = [];
      let sourceInfo = { dbpedia: false, ontology: false };

      if (activeTab === "simple") {
        
        if (!searchQuery.trim()) return; 
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&lang=${language}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const responseData = await response.json();
        results = responseData.results || [];
        sourceInfo = responseData.sources || { dbpedia: false, ontology: false };
      } else if (activeTab === "advanced") {
        // Lógica de búsqueda avanzada con SPARQL
        if (!sparqlQuery.trim()) {
          setError({ type: "error", message: language === "es" ? "La consulta SPARQL no puede estar vacía." : "SPARQL query cannot be empty." });
          setLoading(false);
          return;
        }
        const response = await fetch(`/api/advanced-sparql-search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: sparqlQuery, language })
        });
        if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const responseData = await response.json();
        results = responseData.results || [];
        sourceInfo = responseData.sources || { dbpedia: false, ontology: false }; // Esperamos este formato del nuevo endpoint
      }

      setSearchResults(results);

      console.log("Resultados recibidos del backend (handleSearch):", results);

      if (results.length > 0) {
        setError({
          type: "info",
          message: language === "es" 
            ? `Se encontraron ${results.length} resultados`
            : `Found ${results.length} results`
        })
      }
    } catch (err: any) {
      console.error("Error en la búsqueda:", err)
      setError({
        type: "error",
        message: language === "es"
          ? "Error al realizar la búsqueda. Por favor, intente nuevamente."
          : "Error executing search. Please try again."
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para cambiar a la pestaña de resultados
  const goToResultsTab = () => {
    setActiveTab("results")
  }

  // Aplicar filtros a los resultados
  const filteredResults = searchResults.filter((person) => {
    // Filtro de año de nacimiento
    let birthYear = 0;
    if (person.fechaNacimiento) {
      const date = new Date(person.fechaNacimiento);
      if (!isNaN(date.getTime())) { // Check if date is valid
        birthYear = date.getFullYear();
      }
    }
    if (birthYear > 0 && (birthYear < yearRange[0] || birthYear > yearRange[1])) return false;

    // Filtro de ocupación
    if (occupationFilter.trim() !== "") {
      // Ensure person.ocupacion is a string before calling toLowerCase()
      const occupation = typeof person.ocupacion === 'string' ? person.ocupacion.toLowerCase() : '';
      if (!occupation.includes(occupationFilter.toLowerCase())) return false;
    }

    // Filtro de ubicación
    if (locationFilter.trim() !== "") {
      // Ensure place names are strings before calling toLowerCase()
      const birthPlace = typeof person.lugarNacimiento === 'string' ? person.lugarNacimiento.toLowerCase() : '';
      const deathPlace = typeof person.lugarFallecimiento === 'string' ? person.lugarFallecimiento.toLowerCase() : '';
      if (!birthPlace.includes(locationFilter.toLowerCase()) && !deathPlace.includes(locationFilter.toLowerCase())) {
        return false;
      }
    }

    return true
  })

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {language === "es" ? "Buscador de Personas Históricas Bolivianas" : "Bolivian Historical Figures Search"}
        </h1>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="es">Español</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value)
          setSearchType(value === "advanced" ? "advanced" : "simple")
        }}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="simple">{language === "es" ? "Búsqueda Simple" : "Simple Search"}</TabsTrigger>
          <TabsTrigger value="advanced">{language === "es" ? "Búsqueda Avanzada" : "Advanced Search"}</TabsTrigger>
          <TabsTrigger value="results">{language === "es" ? "Resultados" : "Results"}</TabsTrigger>
        </TabsList>

        <TabsContent value="simple" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === "es" ? "Búsqueda por Nombre" : "Search by Name"}</CardTitle>
              <CardDescription>
                {language === "es"
                  ? "Busca personas históricas bolivianas por nombre en DBpedia"
                  : "Search for Bolivian historical figures by name in DBpedia"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder={
                        language === "es" ? "Buscar personas históricas..." : "Search historical figures..."
                      }
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      maxLength={1000}
                    />
                  </div>
                  <Button type="submit" disabled={loading || !searchQuery.trim()}>
                    {loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    {language === "es" ? "Buscar" : "Search"}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="outline" className="cursor-pointer" onClick={() => setSearchQuery("Simón Bolívar")}>
                    Simón Bolívar
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer" onClick={() => setSearchQuery("Andrés de Santa Cruz")}>
                    Andrés de Santa Cruz
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer" onClick={() => setSearchQuery("Juana Azurduy")}>
                    Juana Azurduy
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer" onClick={() => setSearchQuery("Túpac Katari")}>
                    Túpac Katari
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer" onClick={() => setSearchQuery("Bartolina Sisa")}>
                    Bartolina Sisa
                  </Badge>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <div className="text-sm text-muted-foreground">
                {language === "es"
                  ? "Haz clic en las etiquetas para realizar búsquedas rápidas"
                  : "Click on tags for quick searches"}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === "es" ? "Consulta SPARQL" : "SPARQL Query"}</CardTitle>
              <CardDescription>
                {language === "es"
                  ? "Busca personas históricas usando consultas SPARQL personalizadas"
                  : "Search for historical figures using custom SPARQL queries"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    className="w-full min-h-[300px] p-3 font-mono text-sm border rounded-md"
                    value={sparqlQuery}
                    onChange={(e) => setSparqlQuery(e.target.value)}
                    maxLength={5000}
                  />
                </div>
                <Button type="submit" disabled={loading || !sparqlQuery.trim()}>
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  {language === "es" ? "Ejecutar consulta" : "Execute query"}
                </Button>
              </form>
            </CardContent>
            <CardFooter>
              <div className="text-sm text-muted-foreground">
                {language === "es"
                  ? "Usa los prefijos rdf, rdfs y phb para consultar la ontología"
                  : "Use rdf, rdfs and phb prefixes to query the ontology"}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">
              {language === "es" ? "Resultados de búsqueda" : "Search Results"}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {language === "es" ? "Filtros" : "Filters"}
              </Button>
              <Select defaultValue="relevance">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={language === "es" ? "Ordenar por" : "Sort by"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">{language === "es" ? "Relevancia" : "Relevance"}</SelectItem>
                  <SelectItem value="birthDate">{language === "es" ? "Fecha de nacimiento" : "Birth date"}</SelectItem>
                  <SelectItem value="name">{language === "es" ? "Nombre" : "Name"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert className={error.type === "error" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}>
              <AlertCircle className={error.type === "error" ? "h-4 w-4 text-red-600" : "h-4 w-4 text-blue-600"} />
              <AlertTitle>
                {error.type === "error"
                  ? language === "es"
                    ? "Error"
                    : "Error"
                  : language === "es"
                    ? "Información"
                    : "Information"}
              </AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          {showFilters && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>{language === "es" ? "Filtros avanzados" : "Advanced filters"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-2 text-sm font-medium">
                        {language === "es" ? "Rango de años" : "Year range"}
                      </h3>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">{yearRange[0]}</span>
                        <span className="text-sm">{yearRange[1]}</span>
                      </div>
                      <Slider value={yearRange} min={1500} max={2024} step={1} onValueChange={setYearRange} />
                    </div>
                    <div>
                      <h3 className="mb-2 text-sm font-medium">
                        {language === "es" ? "Filtrar por ocupación" : "Filter by occupation"}
                      </h3>
                      <Input
                        placeholder={language === "es" ? "Ej: político" : "Ex: politician"}
                        value={occupationFilter}
                        onChange={(e) => setOccupationFilter(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-2 text-sm font-medium">
                        {language === "es" ? "Filtrar por ubicación" : "Filter by location"}
                      </h3>
                      <Input
                        placeholder={language === "es" ? "Ej: La Paz" : "Ex: La Paz"}
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredResults.map((person) => (
                <Card key={person.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="mr-2">{person.name}</CardTitle>
                      <Badge variant="secondary" className={`capitalize ${person.source === 'ontology' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        <div className="flex items-center">
                          {person.source === 'ontology' ? <Database className="mr-1 h-3 w-3" /> : <Globe className="mr-1 h-3 w-3" />}
                          {person.source === 'ontology' ? (language === "es" ? "Ontología Local" : "Local Ontology") : "DBpedia"}
                        </div>
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-3">{person.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {person.thumbnail && (
                      <div className="mb-4 flex justify-center">
                        <img
                          src={person.thumbnail}
                          alt={person.name}
                          className="h-32 w-auto object-cover rounded-md"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=128&width=128"
                          }}
                        />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {person.fechaNacimiento && (
                        <Badge variant="outline">
                          {language === "es" ? "Nacimiento:" : "Birth:"} {person.fechaNacimiento}
                        </Badge>
                      )}
                      {person.fechaFallecimiento && (
                        <Badge variant="outline">
                          {language === "es" ? "Fallecimiento:" : "Death:"} {person.fechaFallecimiento}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      {person.lugarNacimiento && (
                        <div className="text-sm">
                          <span className="font-medium">{language === "es" ? "Lugar de nacimiento:" : "Birth place:"}</span>{" "}
                          {person.lugarNacimiento}
                        </div>
                      )}
                      {person.lugarFallecimiento && (
                        <div className="text-sm">
                          <span className="font-medium">
                            {language === "es" ? "Lugar de fallecimiento:" : "Death place:"}
                          </span>{" "}
                          {person.lugarFallecimiento}
                        </div>
                      )}
                      {person.nacionalidad && (
                        <div className="text-sm">
                          <span className="font-medium">{language === "es" ? "Nacionalidad:" : "Nationality:"}</span>{" "}
                          {person.nacionalidad}
                        </div>
                      )}
                      {person.ocupacion && (
                        <div className="text-sm">
                          <span className="font-medium">{language === "es" ? "Ocupación:" : "Occupation:"}</span>{" "}
                          {person.ocupacion}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    {person.source === 'dbpedia' ? (
                      <a
                        href={person.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-full rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                      >
                        {language === "es" ? "Ver en DBpedia" : "View on DBpedia"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    ) : (
                      <Link
                        href={`/person/${encodeURIComponent(person.uri.split('#')[1])}`}
                        className="inline-flex items-center justify-center w-full rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                      >
                        {language === "es" ? "Ver detalles" : "View details"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="text-center py-8">
              <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">
                {language === "es"
                  ? "No hay resultados que coincidan con los filtros"
                  : "No results match your filters"}
              </h3>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                {language === "es"
                  ? "Intenta ajustar los filtros para ver más resultados"
                  : "Try adjusting your filters to see more results"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">
                {language === "es" ? "No hay resultados disponibles" : "No results available"}
              </h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                {language === "es"
                  ? "Realiza una búsqueda para ver los resultados aquí"
                  : "Perform a search to see results here"}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
