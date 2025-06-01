import { NextResponse } from "next/server";
import { executeSparqlUpdate } from "@/lib/sparql-client";

export async function POST() {
  const query = `
    DELETE WHERE { ?s ?p ?o }
  `;
  try {
    const result = await executeSparqlUpdate(query);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 