"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, AlertCircle, Database, RefreshCw, Server, Lock, Key } from "lucide-react"
import { DEFAULT_FUSEKI_CONFIG } from "@/lib/fuseki-config"

export function FusekiConnectionForm({ language = "es" }) {
  const [config, setConfig] = useState(DEFAULT_FUSEKI_CONFIG)
  const [loading, setLoading] = useState(true)
  const [testingConnection, setTestingConnection] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [stats, setStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(false)

  
  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch("/api/fuseki/config")
        if (response.ok) {
          const data = await response.json()
          
          const { password, ...rest } = data.config
          setConfig((prev) => ({ ...prev, ...rest }))
        }
      } catch (error) {
        console.error("Error loading config:", error)
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [])

  
  const handleChange = (e) => {
    const { name, value } = e.target
    setConfig((prev) => ({ ...prev, [name]: value }))
  }

  
  const testConnection = async () => {
    setTestingConnection(true)
    setConnectionStatus(null)

    try {
      const response = await fetch("/api/fuseki/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })

      const result = await response.json()
      setConnectionStatus(result)
    } catch (error) {
      console.error("Error testing connection:", error)
      setConnectionStatus({
        success: false,
        message: error.message || "Connection test failed",
      })
    } finally {
      setTestingConnection(false)
    }
  }

  
  const saveConfig = async () => {
    setSavingConfig(true)

    try {
      const response = await fetch("/api/fuseki/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        throw new Error("Failed to save configuration")
      }

      
      await testConnection()
    } catch (error) {
      console.error("Error saving config:", error)
      setConnectionStatus({
        success: false,
        message: error.message || "Failed to save configuration",
      })
    } finally {
      setSavingConfig(false)
    }
  }

  const loadStats = async () => {
    setLoadingStats(true)
    setStats(null)

    try {
      const response = await fetch("/api/fuseki/stats")
      if (!response.ok) {
        throw new Error("Failed to load statistics")
      }

      const data = await response.json()

      
      if (data.mock) {
        setStats({
          ...data,
          message:
            language === "es"
              ? "Usando datos de ejemplo (no hay conexión real)"
              : "Using sample data (no real connection)",
        })
      } else {
        setStats(data)
      }
    } catch (error) {
      console.error("Error loading stats:", error)
      setStats({
        success: false,
        message: error.message || (language === "es" ? "Error al cargar estadísticas" : "Error loading statistics"),
      })
    } finally {
      setLoadingStats(false)
    }
  }

  
  const resetConfig = () => {
    setConfig(DEFAULT_FUSEKI_CONFIG)
    setConnectionStatus(null)
  }

  return (
    <Tabs defaultValue="connection" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="connection">{language === "es" ? "Conexión" : "Connection"}</TabsTrigger>
        <TabsTrigger value="statistics">{language === "es" ? "Estadísticas" : "Statistics"}</TabsTrigger>
      </TabsList>

      <TabsContent value="connection">
        <Card>
          <CardHeader>
            <CardTitle>
              {language === "es" ? "Configuración de Apache Jena Fuseki" : "Apache Jena Fuseki Configuration"}
            </CardTitle>
            <CardDescription>
              {language === "es"
                ? "Configura la conexión al endpoint SPARQL de Fuseki"
                : "Configure the connection to the Fuseki SPARQL endpoint"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="baseUrl">{language === "es" ? "URL base del servidor" : "Server base URL"}</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground">
                        <Server className="h-4 w-4" />
                      </span>
                      <Input
                        id="baseUrl"
                        name="baseUrl"
                        value={config.baseUrl}
                        onChange={handleChange}
                        placeholder="http://localhost:3030"
                        className="rounded-l-none"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {language === "es"
                        ? "URL base del servidor Fuseki, sin el nombre del dataset"
                        : "Base URL of the Fuseki server, without the dataset name"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="datasetName">{language === "es" ? "Nombre del dataset" : "Dataset name"}</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground">
                        <Database className="h-4 w-4" />
                      </span>
                      <Input
                        id="datasetName"
                        name="datasetName"
                        value={config.datasetName}
                        onChange={handleChange}
                        placeholder="recipes"
                        className="rounded-l-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">{language === "es" ? "Nombre de usuario" : "Username"}</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground">
                          <Key className="h-4 w-4" />
                        </span>
                        <Input
                          id="username"
                          name="username"
                          value={config.username}
                          onChange={handleChange}
                          placeholder={language === "es" ? "Opcional" : "Optional"}
                          className="rounded-l-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">{language === "es" ? "Contraseña" : "Password"}</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground">
                          <Lock className="h-4 w-4" />
                        </span>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          value={config.password}
                          onChange={handleChange}
                          placeholder={language === "es" ? "Opcional" : "Optional"}
                          className="rounded-l-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeout">{language === "es" ? "Tiempo de espera (ms)" : "Timeout (ms)"}</Label>
                    <Input
                      id="timeout"
                      name="timeout"
                      type="number"
                      value={config.timeout}
                      onChange={handleChange}
                      min="1000"
                      step="1000"
                    />
                  </div>
                </div>

                {connectionStatus && (
                  <div className="mt-4">
                    {connectionStatus.success ? (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">
                          {language === "es" ? "Conexión exitosa" : "Connection successful"}
                        </AlertTitle>
                        <AlertDescription className="text-green-700">
                          {language === "es"
                            ? "La conexión al endpoint SPARQL de Fuseki se ha establecido correctamente."
                            : "The connection to the Fuseki SPARQL endpoint has been established successfully."}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{language === "es" ? "Error de conexión" : "Connection error"}</AlertTitle>
                        <AlertDescription>{connectionStatus.message}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={resetConfig} disabled={loading}>
              {language === "es" ? "Restablecer" : "Reset"}
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={testConnection} disabled={loading || testingConnection}>
                {testingConnection ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Database className="mr-2 h-4 w-4" />
                )}
                {language === "es" ? "Probar conexión" : "Test connection"}
              </Button>
              <Button onClick={saveConfig} disabled={loading || savingConfig}>
                {savingConfig ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                {language === "es" ? "Guardar configuración" : "Save configuration"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="statistics">
        <Card>
          <CardHeader>
            <CardTitle>{language === "es" ? "Estadísticas del dataset" : "Dataset statistics"}</CardTitle>
            <CardDescription>
              {language === "es"
                ? "Información sobre el dataset en el endpoint SPARQL"
                : "Information about the dataset in the SPARQL endpoint"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4">
              <Button variant="outline" size="sm" onClick={loadStats} disabled={loadingStats}>
                {loadingStats ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {language === "es" ? "Actualizar" : "Refresh"}
              </Button>
            </div>

            {loadingStats ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : stats ? (
              <div className="space-y-6">
                {stats && stats.message && (
                  <Alert
                    className={stats.success ? "bg-blue-50 border-blue-200 mb-4" : "bg-red-50 border-red-200 mb-4"}
                  >
                    <AlertCircle className={`h-4 w-4 ${stats.success ? "text-blue-600" : "text-red-600"}`} />
                    <AlertTitle className={stats.success ? "text-blue-800" : "text-red-800"}>
                      {language === "es" ? "Información" : "Information"}
                    </AlertTitle>
                    <AlertDescription className={stats.success ? "text-blue-700" : "text-red-700"}>
                      {stats.message}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold">{stats.stats.triples.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">{language === "es" ? "Tripletas" : "Triples"}</div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold">{stats.stats.subjects.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">{language === "es" ? "Sujetos" : "Subjects"}</div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold">{stats.stats.predicates.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">
                      {language === "es" ? "Predicados" : "Predicates"}
                    </div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold">{stats.stats.objects.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">{language === "es" ? "Objetos" : "Objects"}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">
                    {language === "es" ? "Grafos disponibles" : "Available graphs"}
                  </h3>
                  {stats.graphs.length > 0 ? (
                    <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                      <div className="space-y-2">
                        {stats.graphs.map((graph, index) => (
                          <div key={index} className="flex items-center p-2 bg-muted/30 rounded-md">
                            <Database className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-sm font-mono truncate">{graph}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 border rounded-md">
                      <p className="text-muted-foreground">
                        {language === "es" ? "No hay grafos disponibles" : "No graphs available"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground text-right">
                  {language === "es" ? "Última actualización: " : "Last updated: "}
                  {new Date(stats.timestamp).toLocaleString(language === "es" ? "es-ES" : "en-US")}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-1">
                  {language === "es" ? "No hay datos disponibles" : "No data available"}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-4">
                  {language === "es"
                    ? "Haz clic en 'Actualizar' para cargar las estadísticas del dataset"
                    : "Click 'Refresh' to load dataset statistics"}
                </p>
                <Button onClick={loadStats}>{language === "es" ? "Cargar estadísticas" : "Load statistics"}</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
