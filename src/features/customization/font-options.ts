export type FontChoiceDefinition = { value: string; label: string; group: "sans" | "mono" | "serif" }

export const SHADCN_FONT_CHOICES: FontChoiceDefinition[] = [
  { value: "geist", label: "Geist", group: "sans" },
  { value: "inter", label: "Inter", group: "sans" },
  { value: "noto-sans", label: "Noto Sans", group: "sans" },
  { value: "nunito-sans", label: "Nunito Sans", group: "sans" },
  { value: "figtree", label: "Figtree", group: "sans" },
  { value: "roboto", label: "Roboto", group: "sans" },
  { value: "raleway", label: "Raleway", group: "sans" },
  { value: "dm-sans", label: "DM Sans", group: "sans" },
  { value: "public-sans", label: "Public Sans", group: "sans" },
  { value: "outfit", label: "Outfit", group: "sans" },
  { value: "oxanium", label: "Oxanium", group: "sans" },
  { value: "manrope", label: "Manrope", group: "sans" },
  { value: "space-grotesk", label: "Space Grotesk", group: "sans" },
  { value: "montserrat", label: "Montserrat", group: "sans" },
  { value: "ibm-plex-sans", label: "IBM Plex Sans", group: "sans" },
  { value: "source-sans-3", label: "Source Sans 3", group: "sans" },
  { value: "instrument-sans", label: "Instrument Sans", group: "sans" },
  { value: "geist-mono", label: "Geist Mono", group: "mono" },
  { value: "jetbrains-mono", label: "JetBrains Mono", group: "mono" },
  { value: "noto-serif", label: "Noto Serif", group: "serif" },
  { value: "roboto-slab", label: "Roboto Slab", group: "serif" },
  { value: "merriweather", label: "Merriweather", group: "serif" },
  { value: "lora", label: "Lora", group: "serif" },
  { value: "playfair-display", label: "Playfair Display", group: "serif" },
  { value: "eb-garamond", label: "EB Garamond", group: "serif" },
  { value: "instrument-serif", label: "Instrument Serif", group: "serif" },
]

export const SHADCN_FONT_VALUES = SHADCN_FONT_CHOICES.map((font) => font.value)
