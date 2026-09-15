import { useEffect, useRef, useState } from "react"
import { CircleStop, Mic, MicOff, MonitorPlay, Video } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

function recordingName() {
  return `queuemint-recording-${new Date().toISOString().replace(/[:.]/g, "-")}.webm`
}

export function CaptureRecorder({ standalone, labels, onRecorded, onOpenFullscreen }: {
  standalone: boolean
  labels: { record: string; stop: string; microphone: string; noMicrophone: string; fullscreenHint: string; ready: string }
  onRecorded: (file: File) => void
  onOpenFullscreen: () => void
}) {
  const [recording, setRecording] = useState(false)
  const [micEnabled, setMicEnabled] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamsRef = useRef<MediaStream[]>([])
  const timerRef = useRef<number | null>(null)

  function cleanup() {
    for (const stream of streamsRef.current) for (const track of stream.getTracks()) track.stop()
    streamsRef.current = []
    if (timerRef.current !== null) window.clearInterval(timerRef.current)
    timerRef.current = null
  }

  useEffect(() => cleanup, [])

  async function start() {
    if (!standalone) return onOpenFullscreen()
    if (!navigator.mediaDevices?.getDisplayMedia || typeof MediaRecorder === "undefined") {
      toast.error("Screen recording is not available in this browser.")
      return
    }
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      const streams = [display]
      let mic: MediaStream | null = null
      if (micEnabled) {
        try { mic = await navigator.mediaDevices.getUserMedia({ audio: true }); streams.push(mic) }
        catch { toast.warning("Microphone access was not granted. Recording continues without microphone audio.") }
      }
      streamsRef.current = streams
      const output = new MediaStream(display.getVideoTracks())
      const audioTracks = [...display.getAudioTracks(), ...(mic?.getAudioTracks() ?? [])]
      if (audioTracks.length === 1) output.addTrack(audioTracks[0])
      if (audioTracks.length > 1) {
        const AudioContextCtor = window.AudioContext
        const audio = new AudioContextCtor()
        const destination = audio.createMediaStreamDestination()
        for (const stream of streams) if (stream.getAudioTracks().length) audio.createMediaStreamSource(stream).connect(destination)
        const mixed = destination.stream.getAudioTracks()[0]
        if (mixed) output.addTrack(mixed)
      }
      const chunks: BlobPart[] = []
      const recorder = new MediaRecorder(output, MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? { mimeType: "video/webm;codecs=vp9,opus" } : undefined)
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" })
        if (blob.size > 12 * 1024 * 1024) toast.error("Recording is larger than 12 MB. Record a shorter clip and retry.")
        else if (blob.size) {
          onRecorded(new File([blob], recordingName(), { type: blob.type || "video/webm", lastModified: Date.now() }))
          toast.success(labels.ready)
        }
        cleanup(); setRecording(false); setSeconds(0); recorderRef.current = null
      }
      display.getVideoTracks()[0]?.addEventListener("ended", () => { if (recorder.state !== "inactive") recorder.stop() }, { once: true })
      recorder.start(1000); setRecording(true); setSeconds(0)
      timerRef.current = window.setInterval(() => setSeconds((value) => { if (value >= 59 && recorder.state !== "inactive") recorder.stop(); return value + 1 }), 1000)
    } catch (error) {
      cleanup(); setRecording(false)
      toast.error(error instanceof Error ? error.message : "Screen recording could not start.")
    }
  }

  function stop() {
    const recorder = recorderRef.current
    if (recorder && recorder.state !== "inactive") recorder.stop()
  }

  return (
    <div className="rounded-[var(--qm-panel-radius)] border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        {recording ? <Button variant="destructive" onClick={stop}><CircleStop className="size-4" />{labels.stop} · {seconds}s</Button> : <Button variant="outline" onClick={() => void start()}><Video className="size-4" />{labels.record}</Button>}
        <Button variant={micEnabled ? "secondary" : "ghost"} size="sm" disabled={recording} onClick={() => setMicEnabled((value) => !value)} title={micEnabled ? labels.microphone : labels.noMicrophone}>{micEnabled ? <Mic className="size-4" /> : <MicOff className="size-4" />}{micEnabled ? labels.microphone : labels.noMicrophone}</Button>
      </div>
      {!standalone ? <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground"><MonitorPlay className="size-3.5" />{labels.fullscreenHint}</div> : null}
    </div>
  )
}
