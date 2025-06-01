import { NextResponse } from "next/server"

interface CategoryName {
  es: string;
  en: string;
}

interface CategoryDescription {
  es: string;
  en: string;
}

interface AvailableCategory {
  id: string;
  name: CategoryName;
  dbpediaClass: string;
  ontologyClass: string;
  description: CategoryDescription;
}


const AVAILABLE_CATEGORIES: AvailableCategory[] = [
  {
    id: "historical-bolivian-person",
    name: {
      es: "Personas Históricas Bolivianas",
      en: "Bolivian Historical Figures",
    },
    dbpediaClass: "dbo:Person",
    ontologyClass: "PersonaHistoricaBoliviana",
    description: {
      es: "Personas destacadas en la historia de Bolivia",
      en: "Prominent figures in Bolivian history",
    },
  },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lang = searchParams.get("lang") as keyof CategoryName || "es"

  return NextResponse.json({
    categories: AVAILABLE_CATEGORIES.map((category) => ({
      ...category,
      name: category.name[lang] || category.name.en,
      description: category.description[lang] || category.description.en,
    })),
  })
}
