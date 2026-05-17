import { loadDashboardPageData } from "@/services/dashboard/dashboard-page-data"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default function DashboardPage() {
  const { indexesPromise, kpiPromise, heatmapPromise, newsPromise } =
    loadDashboardPageData()

  return (
    <DashboardContent
      indexesPromise={indexesPromise}
      kpiPromise={kpiPromise}
      heatmapPromise={heatmapPromise}
      newsPromise={newsPromise}
    />
  )
}
