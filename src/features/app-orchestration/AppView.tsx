import type { ChangeEvent } from "react"

import { AppMainShell } from "./AppMainShell"
import { AppOverlays } from "./AppOverlays"
import type { AppActionGroups, AppDerivedModel, AppStateModel } from "./app-view-model"

type Props = { state: AppStateModel; derived: AppDerivedModel; actions: AppActionGroups }

export function AppView({ state, derived, actions }: Props) {
  return (
    <div className="app-frame min-h-screen bg-background text-foreground" style={derived.appStyle}>
      <AppMainShell state={state} derived={derived} actions={actions} />
      <input
        ref={state.fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          actions.validation.importFile(event.target.files?.[0])
          event.target.value = ""
        }}
      />
      <AppOverlays state={state} derived={derived} actions={actions} />
    </div>
  )
}
