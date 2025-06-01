"use client"

import { useState } from "react"
import { Search, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MainNav } from "@/components/main-nav"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")
  const [language, setLanguage] = useState("es")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-2 font-semibold">
            <span className="hidden sm:inline-block">Bolivian Historical Figures Search</span>
          </div>
          <MainNav language={language} />
          <div className="flex flex-1 items-center gap-2 justify-end">
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
        </div>
      </header>

      <div className="container py-12 flex-1 flex flex-col">
        <div className="flex flex-col items-center justify-center flex-1 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6">
            {language === "es" ? "Buscador Semántico de Personas Históricas Bolivianas" : "Bolivian Historical Figures Semantic Search"}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
            {language === "es"
              ? "Explora y descubre personas históricas bolivianas utilizando tecnologías semánticas, ontologías y conexión con DBpedia."
              : "Explore and discover Bolivian historical figures using semantic technologies, ontologies, and DBpedia connection."}
          </p>

          <form onSubmit={handleSearch} className="w-full max-w-md mb-8">
            <div className="flex w-full max-w-md items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={language === "es" ? "Buscar personas históricas..." : "Search historical figures..."}
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={!searchQuery.trim()}>
                {language === "es" ? "Buscar" : "Search"}
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Badge variant="outline" className="text-sm py-1 px-3">
              {language === "es" ? "Ontologías OWL" : "OWL Ontologies"}
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              {language === "es" ? "Datos RDF" : "RDF Data"}
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              {language === "es" ? "Consultas SPARQL" : "SPARQL Queries"}
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              {language === "es" ? "Conexión DBpedia" : "DBpedia Connection"}
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              {language === "es" ? "Multilingüe" : "Multilingual"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <Card>
              <CardHeader>
                <CardTitle>{language === "es" ? "Búsqueda Semántica" : "Semantic Search"}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  {language === "es"
                    ? "Busca personas históricas bolivianas utilizando relaciones semánticas y ontologías."
                    : "Search Bolivian historical figures using semantic relationships and ontologies."}
                </p>
                <Link href="/search">
                  <Button variant="outline" className="w-full">
                    {language === "es" ? "Ir al buscador" : "Go to search"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{language === "es" ? "Explorar Ontología" : "Explore Ontology"}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  {language === "es"
                    ? "Visualiza la estructura de la ontología de personas históricas bolivianas."
                    : "Visualize the ontology structure of Bolivian historical figures."}
                </p>
                <Link href="/ontology">
                  <Button variant="outline" className="w-full">
                    {language === "es" ? "Explorar ontología" : "Explore ontology"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{language === "es" ? "Conexión DBpedia" : "DBpedia Connection"}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  {language === "es"
                    ? "Importa y enriquece datos de personas históricas bolivianas desde DBpedia."
                    : "Import and enrich data of Bolivian historical figures from DBpedia."}
                </p>
                <Link href="/dbpedia">
                  <Button variant="outline" className="w-full">
                    {language === "es" ? "Conectar con DBpedia" : "Connect to DBpedia"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
