import type { QueueMintPageDiagnostics } from "@/features/capture-pro/types"
import type { QueueMintPageContext } from "@/lib/capture"
import type { SmartAssistantDraft, SmartAssistantMetadata, SmartAssistantSuggestion } from "@/lib/smart-assistant"
import type { AppLocale } from "@/types"
import { SmartAssistantPanel } from "./SmartAssistantPanel"
import { useSmartAssistant } from "./useSmartAssistant"

export function SmartAssistantCard({ locale, projectKey, draft, metadata, pageContext, screenshot, diagnostics, onApply, onOpenIssue }: {
  locale: AppLocale
  projectKey: string
  draft: SmartAssistantDraft
  metadata?: SmartAssistantMetadata
  pageContext?: QueueMintPageContext | null
  screenshot?: string | null
  diagnostics?: QueueMintPageDiagnostics | null
  onApply: (suggestion: SmartAssistantSuggestion) => void
  onOpenIssue?: (key: string) => void
}) {
  const assistant = useSmartAssistant({ locale, projectKey, draft, metadata, pageContext, screenshot, diagnostics })
  return <SmartAssistantPanel
    locale={locale} configured={assistant.configured} model={assistant.settings?.model} options={assistant.options} available={assistant.available}
    suggestion={assistant.suggestion} loading={assistant.loading} error={assistant.error} onOption={assistant.updateOption}
    onGenerate={() => void assistant.generate()} onApply={onApply} onRefresh={() => void assistant.refreshSettings()} onOpenIssue={onOpenIssue}
  />
}
