# Optional local fonts

QueueMint does not bundle third-party font binaries in the source package. Appearance Studio can use locally installed font families and falls back safely when a family is not installed.

The shadcn/create-compatible choices include Geist, Inter, Noto Sans, Nunito Sans, Figtree, Roboto, Raleway, DM Sans, Public Sans, Outfit, Oxanium, Manrope, Space Grotesk, Montserrat, IBM Plex Sans, Source Sans 3, Instrument Sans, Geist Mono, JetBrains Mono, Noto Serif, Roboto Slab, Merriweather, Lora, Playfair Display, EB Garamond, and Instrument Serif.

Supported Persian/Arabic-oriented choices include Vazirmatn/Vazir, Mikhak, Samim, Shabnam, Sahel, Noto Naskh Arabic/Amiri, plus Lalezar for headings.

The choices are deliberately font-family based, so installing any of these fonts at operating-system level makes the corresponding preview and QueueMint UI use that family without changing extension permissions or loading a remote font at runtime.
