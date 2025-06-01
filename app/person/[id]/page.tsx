"use client"

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface SparqlBinding {
  predicado: { value: string };
  valor: { value: string };
}

export default function PersonDetailPage() {
  const params = useParams();
  const { id } = params as { id: string };
  const [data, setData] = useState<SparqlBinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const uri = `http://example.org/personasHistoricasBolivianas#${id}`;
    console.log("Consultando detalles para URI:", uri);
    const query = `SELECT ?predicado ?valor WHERE { <${uri}> ?predicado ?valor . }`;
    fetch("/api/sparql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then((res) => res.json())
      .then((res) => {
        setData(res.results?.bindings || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Error al cargar los detalles");
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="container py-8">
      <Link href="/search" className="text-blue-600 hover:underline mb-4 inline-block">← Volver a la búsqueda</Link>
      <h1 className="text-3xl font-bold mb-6">Detalles de la persona</h1>
      {loading ? (
        <div>Cargando...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="bg-white rounded shadow p-6">
          {data.filter(item => item.predicado && item.predicado.value && item.valor && item.valor.value).length === 0 ? (
            <div>No hay datos disponibles.</div>
          ) : (
            <ul className="space-y-2">
              {data.map((item, idx) => {
                if (!item.predicado || !item.predicado.value || !item.valor || !item.valor.value) return null;
                return (
                  <li key={idx}>
                    <b>{item.predicado.value.split("#")[1] || item.predicado.value}:</b> {item.valor.value}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
} 