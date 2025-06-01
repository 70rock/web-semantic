"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe } from "lucide-react"
import { DbpediaSearch } from "@/components/dbpedia-search"
import { DbpediaImportForm } from "@/components/dbpedia-import-form"
import { DbpediaMapping } from "@/components/dbpedia-mapping"

export default function DBpediaPage() {
  const [language, setLanguage] = useState("es")

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {language === "es" ? "Conexión con DBpedia" : "DBpedia Connection"}
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

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="search">{language === "es" ? "Búsqueda" : "Search"}</TabsTrigger>
          <TabsTrigger value="import">{language === "es" ? "Importación" : "Import"}</TabsTrigger>
          <TabsTrigger value="mapping">{language === "es" ? "Mapeo" : "Mapping"}</TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <DbpediaSearch language={language} />
        </TabsContent>

        <TabsContent value="import">
          <DbpediaImportForm language={language} />
        </TabsContent>

        <TabsContent value="mapping">
          <DbpediaMapping language={language} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
