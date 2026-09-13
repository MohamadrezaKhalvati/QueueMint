import { useEffect, useMemo, useState } from "react"

import type { QueueMintPageDiagnostics } from "@/features/capture-pro/types"
import type { QueueMintPageContext } from "@/lib/capture"
import { searchRecentProjectIssues } from "@/lib/jira"
import {
  DEFAULT_SMART_ASSISTANT_OPTIONS,
  generateSmartAssistant,
  loadSmartAssistantSettings,
  requestSmartAssistantPermission,
  type GenerateSmartAssistantInput,
  type SmartAssistantDataOptions,
  type SmartAssistantDraft,
  type SmartAssistantMetadata,
  type SmartAssistantSettings,
  type SmartAssistantSuggestion,
} from "@/lib/smart-assistant"

export type SmartAssistantSource = {
  locale: "en" | "fa"
  projectKey: string
  draft: SmartAssistantDraft
  metadata?: SmartAssistantMetadata
  pageContext?: QueueMintPageContext | null
  screenshot?: string | null
  diagnostics?: QueueMintPageDiagnostics | null
}

export function useSmartAssistant(source: SmartAssistantSource) {
  const [settings, setSettings] = useState<SmartAssistantSettings | null>(null)
  const [options, setOptions] = useState<SmartAssistantDataOptions>(DEFAULT_SMART_ASSISTANT_OPTIONS)
  const [suggestion, setSuggestion] = useState<SmartAssistantSuggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const reload = () => void loadSmartAssistantSettings().then((value) => { if (!cancelled) setSettings(value) })
    reload()
    if (typeof chrome !== "undefined" && chrome.storage?.onChanged) chrome.storage.onChanged.addListener(reload)
    return () => {
      cancelled = true
      if (typeof chrome !== "undefined" && chrome.storage?.onChanged) chrome.storage.onChanged.removeListener(reload)
    }
  }, [])

  useEffect(() => { setSuggestion(null); setError(null) }, [source.projectKey])

  const configured = settings?.provider === "openai" && Boolean(settings.apiKey.trim())
  const available = useMemo(() => ({
    currentDraft: true,
    pageContext: Boolean(source.pageContext),
    screenshot: Boolean(source.screenshot),
    diagnostics: Boolean(source.diagnostics),
    jiraMetadata: Boolean(source.metadata),
    duplicateCandidates: Boolean(source.projectKey),
  }), [source.pageContext, source.screenshot, source.diagnostics, source.metadata, source.projectKey])

  function updateOption(key: keyof SmartAssistantDataOptions, value: boolean) {
    setOptions((current) => ({ ...current, [key]: value }))
  }

  async function generate() {
    if (!settings) return
    setLoading(true); setError(null)
    try {
      if (!(await requestSmartAssistantPermission(settings))) throw new Error("OpenAI network permission was not granted.")
      const effective: SmartAssistantDataOptions = {
        currentDraft: options.currentDraft && available.currentDraft,
        pageContext: options.pageContext && available.pageContext,
        screenshot: options.screenshot && available.screenshot,
        diagnostics: options.diagnostics && available.diagnostics,
        jiraMetadata: options.jiraMetadata && available.jiraMetadata,
        duplicateCandidates: options.duplicateCandidates && available.duplicateCandidates,
      }
      const duplicateCandidates = effective.duplicateCandidates ? await searchRecentProjectIssues(source.projectKey, 120) : undefined
      const input: GenerateSmartAssistantInput = { ...source, options: effective, duplicateCandidates }
      setSuggestion(await generateSmartAssistant(settings, input))
    } catch (value) {
      setSuggestion(null); setError(value instanceof Error ? value.message : "Smart Assistant failed.")
    } finally { setLoading(false) }
  }

  async function refreshSettings() {
    setSettings(await loadSmartAssistantSettings())
  }

  return { settings, configured, options, available, suggestion, loading, error, updateOption, generate, refreshSettings, clear: () => setSuggestion(null) }
}
