"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Book, Search, Server, Globe, Database } from "lucide-react"

export function MainNav({ language = "es" }) {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/",
      label: language === "es" ? "Inicio" : "Home",
      icon: <Book className="h-4 w-4 mr-2" />,
      active: pathname === "/",
    },
    {
      href: "/search",
      label: language === "es" ? "Buscador" : "Search",
      icon: <Search className="h-4 w-4 mr-2" />,
      active: pathname === "/search",
    },
    {
      href: "/ontology",
      label: language === "es" ? "Ontología" : "Ontology",
      icon: <Database className="h-4 w-4 mr-2" />,
      active: pathname === "/ontology",
    },
    {
      href: "/dbpedia",
      label: "DBpedia",
      icon: <Globe className="h-4 w-4 mr-2" />,
      active: pathname === "/dbpedia",
    },
    {
      href: "/fuseki",
      label: "Fuseki",
      icon: <Server className="h-4 w-4 mr-2" />,
      active: pathname === "/fuseki",
    },
  ]

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center text-sm font-medium transition-colors hover:text-primary",
            item.active ? "text-primary" : "text-muted-foreground",
          )}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
