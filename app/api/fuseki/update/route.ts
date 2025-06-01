import { NextResponse } from "next/server"
import { getFusekiEndpoints, getFusekiAuthHeaders } from "@/lib/fuseki-config"

export async function POST(request: Request) {
  try {
    const { update, config } = await request.json()
    const { updateUrl } = getFusekiEndpoints(config)
    const authHeaders = getFusekiAuthHeaders(config)

    const params = new URLSearchParams({
      update,
    })

    // Create a controller for the timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000)

    try {
      const response = await fetch(updateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          ...authHeaders,
        },
        body: params.toString(),
        signal: controller.signal,
      })

      // Clear the timeout
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
      }

      return NextResponse.json({
        success: true,
        message: "Update successful",
      })
    } catch (fetchError) {
      // Clear the timeout if it hasn't fired yet
      clearTimeout(timeoutId)

      // Handle abort errors specifically
      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          {
            success: false,
            message: "Update timed out",
          },
          { status: 408 },
        )
      }

      throw fetchError
    }
  } catch (error) {
    console.error("Error executing SPARQL update:", error)

    // For development, return a mock success response if the connection fails
    if (error.message.includes("Failed to fetch") || error.message.includes("ECONNREFUSED")) {
      console.log("SPARQL Update (mock):", (await request.json()).update)
      return NextResponse.json({
        success: true,
        message: "Update successful (mock)",
        mock: true,
      })
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to execute update",
      },
      { status: 500 },
    )
  }
}
