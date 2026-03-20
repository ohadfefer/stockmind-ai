import { AccountTabBar } from "@/components/account/account-tab-bar"
import { AccountTabContent } from "@/components/account/account-tab-content"

export default function AccountPage() {
  return (
    <div className="flex flex-col gap-6">
      <AccountTabBar />
      <AccountTabContent />
    </div>
  )
}
