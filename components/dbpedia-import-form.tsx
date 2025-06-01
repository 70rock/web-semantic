"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertCircle, Database, RefreshCw, Info } from "lucide-react"

interface ImportHistoryItem {
  timestamp: string;
  searchTerm: string;
  limit: number;
  status: 'started' | 'success' | 'failed';
  importedCount?: number;
  message?: string;
  id: string;
}

type ImportStatus =
  | null
  | { status: 'importing'; progress: number }
  | { status: 'success'; message: string; importedCount: number; details?: any; mock?: boolean }
  | { status: 'error'; message: string; details?: any };

export function DbpediaImportForm({ language = "es" }) {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [importLanguage, setImportLanguage] = useState(language)
  const [limit, setLimit] = useState("20")
  const [loading, setLoading] = useState(false)
  const [importStatus, setImportStatus] = useState<ImportStatus>(null)
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(true)

  
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch(`/api/dbpedia/categories?lang=${language}`)
        const data = await response.json()
        setCategories(data.categories)
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [language])

  
  useEffect(() => {
    async function fetchImportHistory() {
      try {
        const response = await fetch("/api/import-history")
        const data: ImportHistoryItem[] = await response.json()
        if (Array.isArray(data)) {
          setImportHistory(data.map((item, index) => ({ ...item, id: item.id || `hist-${item.timestamp}-${index}` })))
        } else {
          console.error("API did not return an array for import history:", data)
          setImportHistory([])
        }
      } catch (error) {
        console.error("Error fetching import history:", error)
        setImportHistory([])
      } finally {
        setLoadingHistory(false)
      }
    }

    fetchImportHistory()
  }, [])

  const handleImport = async () => {
    setLoading(true)
    setImportStatus({ status: "importing", progress: 0 })

    try {
      
      const progressInterval = setInterval(() => {
        setImportStatus((prev) => {
          if (prev && prev.status === 'importing') {
            return {
          ...prev,
          progress: Math.min(prev.progress + Math.random() * 10, 95),
            }
          }
          return prev
        })
      }, 300)

      
      const response = await fetch("/api/dbpedia/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: Number.parseInt(limit, 10),
        }),
      })

      clearInterval(progressInterval)

      const result: { success: boolean; importedCount?: number; message?: string; details?: any } = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Import failed")
      }

      
      const historyResponse = await fetch("/api/import-history")
      const historyData: ImportHistoryItem[] = await historyResponse.json()
      setImportHistory(historyData.map((item, index) => ({ ...item, id: `hist-${item.timestamp}-${index}` })))

      setImportStatus({
        status: "success",
        message:
          language === "es"
            ? `Se importaron ${result.importedCount || 0} entidades correctamente.`
            : `Successfully imported ${result.importedCount || 0} entities.`,
        importedCount: result.importedCount || 0,
        details: result.details,
      })
    } catch (error: any) {
      console.error("Import error:", error)
      setImportStatus({
        status: "error",
        message: language === "es" ? `Error al importar: ${error.message}` : `Import error: ${error.message}`,
        details: error,
      })
    } finally {
      setLoading(false)
    }
  }

  const resetStatus = () => {
    setImportStatus(null)
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{language === "es" ? "Importar datos de DBpedia" : "Import data from DBpedia"}</CardTitle>
          <CardDescription>
            {language === "es"
              ? "Selecciona una categoría para importar datos desde DBpedia a tu ontología"
              : "Select a category to import data from DBpedia to your ontology"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{language === "es" ? "Categoría" : "Category"}</label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                  disabled={loading || loadingCategories}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingCategories
                          ? language === "es"
                            ? "Cargando..."
                            : "Loading..."
                          : language === "es"
                            ? "Seleccionar categoría"
                            : "Select category"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{language === "es" ? "Idioma" : "Language"}</label>
                <Select value={importLanguage} onValueChange={setImportLanguage} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === "es" ? "Seleccionar idioma" : "Select language"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === "es" ? "Límite de entidades" : "Entity limit"}
              </label>
              <Select value={limit} onValueChange={setLimit} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder={language === "es" ? "Seleccionar límite" : "Select limit"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {importStatus && (
            <div className="mt-4">
              {importStatus.status === "importing" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{language === "es" ? "Importando datos..." : "Importing data..."}</span>
                    <span>{Math.round(importStatus.progress)}%</span>
                  </div>
                  <Progress value={importStatus.progress} className="h-2" />
                </div>
              )}

              {importStatus.status === "success" && (
                <>
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">
                      {language === "es" ? "Importación exitosa" : "Import successful"}
                    </AlertTitle>
                    <AlertDescription className="text-green-700">{importStatus.message}</AlertDescription>
                  </Alert>
                </>
              )}

              {importStatus.status === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{language === "es" ? "Error" : "Error"}</AlertTitle>
                  <AlertDescription>{importStatus.message}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {importStatus && importStatus.status !== "importing" ? (
            <Button variant="outline" onClick={resetStatus}>
              {language === "es" ? "Limpiar" : "Clear"}
            </Button>
          ) : (
            <div></div>
          )}
          <Button onClick={handleImport} disabled={!selectedCategory || loading}>
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {language === "es" ? "Importando..." : "Importing..."}
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                {language === "es" ? "Importar datos" : "Import data"}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{language === "es" ? "Historial de importaciones" : "Import history"}</CardTitle>
          <CardDescription>
            {language === "es"
              ? "Registro de importaciones previas desde DBpedia"
              : "Record of previous imports from DBpedia"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : importHistory.length > 0 ? (
            <div className="space-y-4">
              {importHistory.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <div className="font-medium">
                      Importación: {new Date(item.timestamp).toLocaleString(language === "es" ? "es-ES" : "en-US")}
                    </div>
                    {item.status === 'failed' && item.message && (
                      <div className="text-sm text-red-500">
                        Error: {item.message}
                      </div>
                    )}
                    {item.status !== 'failed' && (
                    <div className="text-sm text-muted-foreground">
                        Estado: {item.status === 'success' ? (language === "es" ? "Exitosa" : "Success") : (language === "es" ? "Iniciada" : "Started")}
                    </div>
                    )}
                  </div>
                  <div className="flex items-center">
                    {item.status === 'success' && item.importedCount !== undefined && (
                    <div className="text-sm font-medium mr-2">
                        {item.importedCount} {language === "es" ? "entidades" : "entities"}
                    </div>
                    )}
                    {item.status === 'success' ? (
                      <div className="h-2 w-2 rounded-full bg-green-500" title={language === "es" ? "Exitosa" : "Success"}></div>
                    ) : item.status === 'failed' ? (
                      <div className="h-2 w-2 rounded-full bg-red-500" title={language === "es" ? "Fallida" : "Failed"}></div>
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-amber-500" title={language === "es" ? "Iniciada" : "Started"}></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {language === "es" ? "No hay importaciones previas" : "No previous imports"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
