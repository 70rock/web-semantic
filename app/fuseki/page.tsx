"use client"

import { useState } from "react"
import { FusekiConnectionForm } from "@/components/fuseki-connection-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe } from "lucide-react"

export default function FusekiPage() {
  const [language, setLanguage] = useState("es")

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {language === "es" ? "Configuración de Fuseki" : "Fuseki Configuration"}
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

      <div className="grid gap-6">
        <FusekiConnectionForm language={language} />
      </div>
    </div>
  )
}
