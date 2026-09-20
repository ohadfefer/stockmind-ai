"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/format"
import type { UserProfile } from "@/services/user-profile-service"
import {
  CHOICE_OPTIONS,
  INTEREST_OPTIONS,
  PROFILE_QUESTIONS,
} from "@/components/profile/profile-options"
import { describeProfile } from "./describe-profile"
import { EditProfileDialog, type ProfileField } from "./edit-profile-dialog"

// Same order as the onboarding wizard asks them.
const FIELDS: ProfileField[] = [
  "experienceLevel",
  "motivation",
  "interests",
  "investorStyle",
  "engagementCadence",
]

function answerLabels(profile: UserProfile, field: ProfileField): string[] {
  if (field === "interests") {
    return profile.interests.map(
      (value) => INTEREST_OPTIONS.find((o) => o.value === value)?.label ?? value,
    )
  }
  const value = profile[field]
  return [CHOICE_OPTIONS[field].find((o) => o.value === value)?.title ?? value]
}

export function StrategySettings({ initialProfile }: { initialProfile: UserProfile }) {
  // The PATCH returns the whole updated row, so a save replaces this outright
  // and the summary and "Last updated" line follow without a refresh.
  const [profile, setProfile] = useState(initialProfile)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-base font-semibold text-foreground md:text-lg">My Summary</h2>
          <p className="text-[10px] text-muted-foreground md:text-xs">
            Last updated: {formatDate(profile.updatedAt)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-gradient-to-br from-primary/10 via-card to-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="size-4 text-primary" />
            About You
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            {describeProfile(profile)}
          </p>
        </div>
      </div>

      <div className="divide-y divide-border">
        {FIELDS.map((field) => {
          const labels = answerLabels(profile, field)
          return (
            <div key={field} className="flex items-start justify-between gap-4 py-5">
              <div className="flex min-w-0 flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-foreground md:text-base">
                    {PROFILE_QUESTIONS[field].title}
                  </p>
                  <p className="text-xs text-muted-foreground md:text-sm">
                    {PROFILE_QUESTIONS[field].subtitle}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {labels.length > 0 ? (
                    labels.map((label) => (
                      <Badge
                        key={label}
                        variant="secondary"
                        className="px-2.5 py-1 text-xs md:text-sm"
                      >
                        {label}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground md:text-sm">
                      None selected
                    </span>
                  )}
                </div>
              </div>
              <EditProfileDialog field={field} profile={profile} onSaved={setProfile} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
