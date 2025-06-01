"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Plus, Trash2, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function DbpediaMapping({ language = "es" }) {
  const [activeTab, setActiveTab] = useState("classes")

  
  const [classMappings, setClassMappings] = useState([
    { ontologyClass: "PersonaHistoricaBoliviana", dbpediaClass: "dbo:Person", enabled: true },
  ])

  
  const [propertyMappings, setPropertyMappings] = useState([
    { ontologyProperty: "nombre", dbpediaProperty: "rdfs:label", enabled: true },
    { ontologyProperty: "resumen", dbpediaProperty: "dbo:abstract", enabled: true },
    { ontologyProperty: "fechaNacimiento", dbpediaProperty: "dbo:birthDate", enabled: true },
    { ontologyProperty: "fechaFallecimiento", dbpediaProperty: "dbo:deathDate", enabled: true },
    { ontologyProperty: "lugarNacimiento", dbpediaProperty: "dbo:birthPlace", enabled: true },
    { ontologyProperty: "lugarFallecimiento", dbpediaProperty: "dbo:deathPlace", enabled: true },
    { ontologyProperty: "nacionalidad", dbpediaProperty: "dbo:nationality", enabled: true },
    { ontologyProperty: "ocupacion", dbpediaProperty: "dbo:occupation", enabled: true },
    { ontologyProperty: "imagenReferencia", dbpediaProperty: "dbo:thumbnail", enabled: true },
  ])

  
  const [languageMappings, setLanguageMappings] = useState([
    { code: "es", name: "Español", primary: true, enabled: true },
    { code: "en", name: "English", primary: false, enabled: true },
    { code: "fr", name: "Français", primary: false, enabled: true },
  ])

  
  const [newMapping, setNewMapping] = useState({
    ontologyClass: "",
    dbpediaClass: "",
    ontologyProperty: "",
    dbpediaProperty: "",
  })

  
  const toggleClassMapping = (index: number) => {
    const updated = [...classMappings]
    updated[index].enabled = !updated[index].enabled
    setClassMappings(updated)
  }

  const togglePropertyMapping = (index: number) => {
    const updated = [...propertyMappings]
    updated[index].enabled = !updated[index].enabled
    setPropertyMappings(updated)
  }

  const toggleLanguageMapping = (index: number) => {
    const updated = [...languageMappings]
    updated[index].enabled = !updated[index].enabled
    setLanguageMappings(updated)
  }

 
  const setPrimaryLanguage = (index: number) => {
    const updated = languageMappings.map((lang, i) => ({
      ...lang,
      primary: i === index,
    }))
    setLanguageMappings(updated)
  }

  
  const addNewMapping = () => {
    if (activeTab === "classes" && newMapping.ontologyClass && newMapping.dbpediaClass) {
      setClassMappings([
        ...classMappings,
        {
          ontologyClass: newMapping.ontologyClass,
          dbpediaClass: newMapping.dbpediaClass,
          enabled: true,
        },
      ])
      setNewMapping({ ...newMapping, ontologyClass: "", dbpediaClass: "" })
    } else if (activeTab === "properties" && newMapping.ontologyProperty && newMapping.dbpediaProperty) {
      setPropertyMappings([
        ...propertyMappings,
        {
          ontologyProperty: newMapping.ontologyProperty,
          dbpediaProperty: newMapping.dbpediaProperty,
          enabled: true,
        },
      ])
      setNewMapping({ ...newMapping, ontologyProperty: "", dbpediaProperty: "" })
    }
  }

 
  const removeClassMapping = (index: number) => {
    setClassMappings(classMappings.filter((_, i) => i !== index))
  }

  const removePropertyMapping = (index: number) => {
    setPropertyMappings(propertyMappings.filter((_, i) => i !== index))
  }

 
  const saveMappings = async () => {
    try {
      const response = await fetch("/api/save-mappings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classMappings,
          propertyMappings,
          languageMappings,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save configuration: ${response.statusText}`);
      }

      // Optionally, show a success message
      alert(language === "es" ? "Configuración guardada con éxito." : "Configuration saved successfully.");

    } catch (error: any) {
      console.error("Error saving mappings:", error);
      alert(language === "es" ? `Error al guardar la configuración: ${error.message}` : `Error saving configuration: ${error.message}`);
    }
  }

  
  useEffect(() => {
    const loadMappings = async () => {
      try {
        const response = await fetch("/api/load-mappings");
        if (!response.ok) {
          
          console.error(`Failed to load configuration: ${response.statusText}`);
         
          return; 
        }
        const data = await response.json();
        
        if (data.classMappings) setClassMappings(data.classMappings);
        if (data.propertyMappings) setPropertyMappings(data.propertyMappings);
        if (data.languageMappings) setLanguageMappings(data.languageMappings);
      } catch (error) {
        console.error("Error loading mappings:", error);
        
      }
    };

    loadMappings();
  }, []); 

  return (
    <Card>
      <CardHeader>
        <CardTitle>{language === "es" ? "Mapeo de ontologías" : "Ontology mapping"}</CardTitle>
        <CardDescription>
          {language === "es"
            ? "Configura el mapeo entre tu ontología de personas históricas bolivianas y DBpedia"
            : "Configure the mapping between your Bolivian historical figures ontology and DBpedia"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="classes">{language === "es" ? "Clases" : "Classes"}</TabsTrigger>
            <TabsTrigger value="properties">{language === "es" ? "Propiedades" : "Properties"}</TabsTrigger>
            <TabsTrigger value="languages">{language === "es" ? "Idiomas" : "Languages"}</TabsTrigger>
          </TabsList>

          <TabsContent value="classes" className="space-y-4">
            <div className="space-y-2">
              {classMappings.map((mapping, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 border rounded-md">
                  <div className="flex-1 grid grid-cols-3 items-center">
                    <div className="font-medium">{mapping.ontologyClass}</div>
                    <div className="text-center">
                      <ArrowRight className="mx-auto h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="font-mono text-sm">{mapping.dbpediaClass}</div>
                  </div>
                  <Switch checked={mapping.enabled} onCheckedChange={() => toggleClassMapping(index)} />
                  <Button variant="ghost" size="icon" onClick={() => removeClassMapping(index)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-end space-x-2 pt-2">
              <div className="space-y-2 flex-1">
                <Label>{language === "es" ? "Clase de ontología" : "Ontology class"}</Label>
                <Input
                  placeholder={language === "es" ? "Ej: NuevaClase" : "Ex: NewClass"}
                  value={newMapping.ontologyClass}
                  onChange={(e) => setNewMapping({ ...newMapping, ontologyClass: e.target.value })}
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label>{language === "es" ? "Clase de DBpedia" : "DBpedia class"}</Label>
                <Input
                  placeholder={language === "es" ? "Ej: dbo:NuevaClase" : "Ex: dbo:NewClass"}
                  value={newMapping.dbpediaClass}
                  onChange={(e) => setNewMapping({ ...newMapping, dbpediaClass: e.target.value })}
                />
              </div>
              <Button onClick={addNewMapping} disabled={!newMapping.ontologyClass || !newMapping.dbpediaClass}>
                <Plus className="h-4 w-4 mr-1" />
                {language === "es" ? "Añadir" : "Add"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="properties" className="space-y-4">
            <div className="space-y-2">
              {propertyMappings.map((mapping, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 border rounded-md">
                  <div className="flex-1 grid grid-cols-3 items-center">
                    <div className="font-medium">{mapping.ontologyProperty}</div>
                    <div className="text-center">
                      <ArrowRight className="mx-auto h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="font-mono text-sm">{mapping.dbpediaProperty}</div>
                  </div>
                  <Switch checked={mapping.enabled} onCheckedChange={() => togglePropertyMapping(index)} />
                  <Button variant="ghost" size="icon" onClick={() => removePropertyMapping(index)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-end space-x-2 pt-2">
              <div className="space-y-2 flex-1">
                <Label>{language === "es" ? "Propiedad de ontología" : "Ontology property"}</Label>
                <Input
                  placeholder={language === "es" ? "Ej: nuevaPropiedad" : "Ex: newProperty"}
                  value={newMapping.ontologyProperty}
                  onChange={(e) => setNewMapping({ ...newMapping, ontologyProperty: e.target.value })}
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label>{language === "es" ? "Propiedad de DBpedia" : "DBpedia property"}</Label>
                <Input
                  placeholder={language === "es" ? "Ej: dbo:nuevaPropiedad" : "Ex: dbo:newProperty"}
                  value={newMapping.dbpediaProperty}
                  onChange={(e) => setNewMapping({ ...newMapping, dbpediaProperty: e.target.value })}
                />
              </div>
              <Button onClick={addNewMapping} disabled={!newMapping.ontologyProperty || !newMapping.dbpediaProperty}>
                <Plus className="h-4 w-4 mr-1" />
                {language === "es" ? "Añadir" : "Add"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="languages" className="space-y-4">
            <div className="space-y-2">
              {languageMappings.map((lang, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 border rounded-md">
                  <div className="flex-1">
                    <div className="font-medium">
                      {lang.name} ({lang.code})
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {lang.primary ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        {language === "es" ? "Principal" : "Primary"}
                      </Badge>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setPrimaryLanguage(index)}>
                        {language === "es" ? "Hacer principal" : "Make primary"}
                      </Button>
                    )}
                    <Switch checked={lang.enabled} onCheckedChange={() => toggleLanguageMapping(index)} />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="pt-4 border-t">
          <Button onClick={saveMappings} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {language === "es" ? "Guardar configuración" : "Save configuration"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
