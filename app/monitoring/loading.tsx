import { RefreshCw } from "lucide-react"

export default function MonitoringLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-muted-foreground">Loading monitoring dashboard...</p>
      </div>
    </div>
  )
}
