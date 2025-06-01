
export const DEFAULT_FUSEKI_CONFIG = {
  baseUrl: "http://localhost:3030",
  datasetName: "recipes",
  queryEndpoint: "/query",
  updateEndpoint: "/update",
  dataEndpoint: "/data",
  username: "",
  password: "",
  timeout: 30000, // 30 seconds
}


export function getFusekiConfig() {
  
  if (typeof window !== "undefined") {
    const storedConfig = localStorage.getItem("fuseki_config")
    if (storedConfig) {
      try {
        return { ...DEFAULT_FUSEKI_CONFIG, ...JSON.parse(storedConfig) }
      } catch (e) {
        console.error("Error parsing stored Fuseki config:", e)
      }
    }
  }
  return DEFAULT_FUSEKI_CONFIG
}

// Save the configuration
export function saveFusekiConfig(config:any) {
  if (typeof window !== "undefined") {
    localStorage.setItem(
      "fuseki_config",
      JSON.stringify({
        ...DEFAULT_FUSEKI_CONFIG,
        ...config,
      }),
    )
  }
  return config
}


export function getFusekiEndpoints(config = getFusekiConfig()) {
  const baseUrl = config.baseUrl.endsWith("/") ? config.baseUrl.slice(0, -1) : config.baseUrl
  const dataset = config.datasetName

  return {
    queryUrl: `${baseUrl}/${dataset}${config.queryEndpoint}`,
    updateUrl: `${baseUrl}/${dataset}${config.updateEndpoint}`,
    dataUrl: `${baseUrl}/${dataset}${config.dataEndpoint}`,
  }
}

// Create authentication headers if credentials are provided
export function getFusekiAuthHeaders(config = getFusekiConfig()) {
  if (config.username && config.password) {
    const credentials = btoa(`${config.username}:${config.password}`)
    return {
      Authorization: `Basic ${credentials}`,
    }
  }
  return {}
}

// Test the connection to the Fuseki endpoint
export async function testFusekiConnection(config = getFusekiConfig()) {
  // Instead of connecting directly to Fuseki, we'll use our API route
  try {
    const response = await fetch("/api/fuseki/test-connection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error testing Fuseki connection:", error)
    return {
      success: false,
      message: (error as Error).message || "Connection failed",
      error,
    }
  }
}
