import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import Popup from "./Popup"
import "./index.css"
import "./popup.css"

const standaloneCapture = new URLSearchParams(window.location.search).has("captureDraft")
document.body.classList.toggle("qm-popup-page", !standaloneCapture)
document.body.classList.toggle("qm-capture-page", standaloneCapture)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Popup />
  </StrictMode>,
)
