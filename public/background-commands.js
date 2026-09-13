chrome.commands?.onCommand.addListener((command) => {
  if (command !== "open-command-palette") return
  chrome.runtime.sendMessage({ type: "QUEUEMINT_OPEN_COMMAND_PALETTE" }).catch(() => {
    // QueueMint workspace is not currently open.
  })
})
