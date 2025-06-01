import { NextResponse } from "next/server"
import { getFusekiConfig, saveFusekiConfig } from "@/lib/fuseki-config"

export async function GET() {
  try {
    const config = getFusekiConfig()
    // Don't return sensitive information like passwords
    const safeConfig = { ...config, password: config.password ? "********" : "" }

    return NextResponse.json({ config: safeConfig })
  } catch (error) {
    console.error("Error getting Fuseki config:", error)
    return NextResponse.json({ error: "Failed to get configuration" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const config = await request.json()
    const savedConfig = saveFusekiConfig(config)
    // Don't return sensitive information like passwords
    const safeConfig = { ...savedConfig, password: savedConfig.password ? "********" : "" }

    return NextResponse.json({
      success: true,
      message: "Configuration saved successfully",
      config: safeConfig,
    })
  } catch (error) {
    console.error("Error saving Fuseki config:", error)
    return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 })
  }
}
