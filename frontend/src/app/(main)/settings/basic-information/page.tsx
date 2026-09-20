import { loadBasicInformationPageData } from "@/services/settings/basic-information-page-data"
import { BasicInformationContent } from "@/components/settings/basic-information/basic-information-content"

export default async function BasicInformationSettingsPage() {
  const { detailsPromise } = await loadBasicInformationPageData()

  return <BasicInformationContent detailsPromise={detailsPromise} />
}
