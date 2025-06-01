"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Database, Plus, ExternalLink, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DbpediaSearchResult {
  uri?: string;
  label?: string;
  description?: string;
  thumbnail?: string;
}

interface SelectedItem extends DbpediaSearchResult {}

interface ErrorState {
  type: "error" | "info";
  message: string;
}

export function DbpediaSearch({ language = "es" }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchLanguage, setSearchLanguage] = useState(language)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<DbpediaSearchResult[]>([])
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [error, setError] = useState<ErrorState | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setLoading(true)
    setResults([])
    setError(null)

    try {
      const response = await fetch(
        `/api/dbpedia/search?q=${encodeURIComponent(searchTerm)}&lang=${searchLanguage}&limit=10`,
      )

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const data = await response.json()

      
      if (data.mock) {
        setError({
          type: "info",
          message:
            language === "es"
              ? "Mostrando resultados simulados debido a problemas de conexión con DBpedia."
              : "Showing simulated results due to connection issues with DBpedia.",
        })
      }

      
      const formattedResults =
        data.results?.bindings?.map((item: any) => ({
          uri: item.item?.value,
          label: item.label?.value,
          description: item.abstract?.value,
          thumbnail: item.thumbnail?.value,
        })) || []

      setResults(formattedResults)
    } catch (error) {
      console.error("Search error:", error)
      const errorMessage = (error instanceof Error) ? error.message : String(error)
      
      let displayMessage = language === "es" ? `Error al buscar en DBpedia: ${errorMessage}` : `Error searching DBpedia: ${errorMessage}`;
      if (errorMessage.includes("Request Timeout")) {
        displayMessage = language === "es" ? "La búsqueda en DBpedia tardó demasiado. Intente con un término más específico." : "DBpedia search took too long. Try a more specific term.";
      }
      
      setError({ type: "error", message: displayMessage });
    } finally {
      setLoading(false)
    }
  }

  const toggleItemSelection = (item: DbpediaSearchResult) => {
    if (selectedItems.some((selected) => selected.uri === item.uri)) {
      setSelectedItems(selectedItems.filter((selected) => selected.uri !== item.uri))
    } else {
      setSelectedItems([...selectedItems, item])
    }
  }

  const isItemSelected = (item: DbpediaSearchResult): boolean => {
    return selectedItems.some((selected) => selected.uri === item.uri)
  }

  const importSelectedItems = async () => {
    if (selectedItems.length === 0) return

    
    alert(`Importing ${selectedItems.length} items`)
    setSelectedItems([])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{language === "es" ? "Buscar en DBpedia" : "Search DBpedia"}</CardTitle>
        <CardDescription>
          {language === "es"
            ? "Busca conceptos en DBpedia para enriquecer tu ontología"
            : "Search for concepts in DBpedia to enrich your ontology"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={language === "es" ? "Buscar concepto..." : "Search concept..."}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={searchLanguage} onValueChange={setSearchLanguage}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={loading || !searchTerm.trim()}>
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              ) : language === "es" ? (
                "Buscar"
              ) : (
                "Search"
              )}
            </Button>
          </div>
        </form>

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

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-4 p-4 border rounded-md">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[300px]" />
                  <Skeleton className="h-4 w-[250px]" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            {results.map((item, index) => (
              <div key={index} className="flex space-x-4 p-4 border rounded-md">
                {item.thumbnail && (
                  <div className="flex-shrink-0">
                    <img
                      src={item.thumbnail || "/placeholder.svg"}
                      alt={item.label}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=64&width=64"
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium truncate">{item.label}</h4>
                    <Button
                      variant={isItemSelected(item) ? "default" : "outline"}
                      size="sm"
                      className="ml-2 flex-shrink-0"
                      onClick={() => toggleItemSelection(item)}
                    >
                      {isItemSelected(item) ? (
                        language === "es" ? (
                          "Seleccionado"
                        ) : (
                          "Selected"
                        )
                      ) : (
                        <>
                          <Plus className="h-3 w-3 mr-1" />
                          {language === "es" ? "Seleccionar" : "Select"}
                        </>
                      )}
                    </Button>
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                  )}
                  <div className="flex items-center mt-2">
                    <Badge variant="outline" className="mr-2">
                      DBpedia
                    </Badge>
                    <a
                      href={item.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary flex items-center"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      {language === "es" ? "Ver en DBpedia" : "View on DBpedia"}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : searchTerm ? (
          <div className="text-center py-8">
            <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">
              {language === "es" ? "No se encontraron resultados" : "No results found"}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {language === "es"
                ? "Intenta con otros términos de búsqueda o cambia el idioma"
                : "Try different search terms or change the language"}
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">
              {language === "es" ? "Busca conceptos en DBpedia" : "Search for concepts in DBpedia"}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {language === "es"
                ? "Introduce un término de búsqueda para encontrar conceptos relacionados"
                : "Enter a search term to find related concepts"}
            </p>
          </div>
        )}
      </CardContent>
      {selectedItems.length > 0 && (
        <CardFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm">
              {selectedItems.length} {language === "es" ? "elementos seleccionados" : "items selected"}
            </div>
            <Button onClick={importSelectedItems}>
              <Database className="mr-2 h-4 w-4" />
              {language === "es" ? "Importar seleccionados" : "Import selected"}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
