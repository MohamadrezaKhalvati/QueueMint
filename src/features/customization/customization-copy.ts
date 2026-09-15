import type { AppLocale } from "@/types"

export function customizationCopy(locale: AppLocale) {
  return locale === "fa" ? {
    eyebrow: "استودیوی ظاهر",
    title: "QueueMint را برای خودت تنظیم کن",
    hint: "گزینه ها را امتحان کن، روی هر مورد برو تا پیش نمایش را ببینی و فقط وقتی راضی بودی تغییرات را اعمال کن.",
    theme: "تم", accent: "رنگ اصلی", custom: "سفارشی", tone: "رنگ زمینه", bodyFont: "فونت متن", headingFont: "فونت تیتر",
    radius: "گردی گوشه ها", density: "تراکم", sidebar: "استایل منو", menuAccent: "حالت انتخاب منو", surface: "استایل کارت ها",
    layout: "نمای پیش فرض", columns: "ستون های کارت", light: "روشن", dark: "تیره", system: "سیستم",
    mist: "مه", slate: "اسلیت", zinc: "زینک", gray: "خاکستری", neutral: "خنثی", stone: "سنگی", sand: "شنی", paper: "کاغذ", systemFont: "سیستمی", humanist: "خوانا", geometric: "هندسی", rounded: "گرد", mono: "تک عرض", serif: "سریف", display: "نمایشی",
    vazirmatn: "وزیرمتن", mikhak: "میخک", samim: "صمیم", shabnam: "شبنم", sahel: "ساحل", naskh: "نسخ عربی", lalezar: "لاله زار",
    fontPresets: "پریست ها", fontSans: "بدون سریف", fontMono: "تک عرض", fontSerif: "سریف", fontPersian: "فارسی و عربی",
    none: "بدون گردی", small: "کم", medium: "متوسط", large: "زیاد", compact: "فشرده", comfortable: "راحت", spacious: "باز",
    soft: "نرم", solid: "تیره", outline: "خطی", subtle: "ملایم", filled: "پررنگ", flat: "تخت", bordered: "مرزبندی", raised: "برجسته",
    board: "برد", grid: "کارت", list: "لیست", preview: "پیش نمایش زنده", reset: "بازنشانی", shuffle: "ترکیب تصادفی", export: "دانلود پریست", import: "ورود پریست",
    advanced: "تنظیمات بیشتر", preset: "پریست", copy: "کپی کد", copied: "کد پریست کپی شد", exported: "پریست ظاهر دانلود شد", imported: "پریست برای پیش نمایش بارگذاری شد", invalid: "فایل پریست معتبر نیست",
    apply: "اعمال تغییرات", applied: "تغییرات ظاهر ذخیره شد", cancel: "لغو تغییرات", unsaved: "تغییرات ذخیره نشده", saved: "همه تغییرات ذخیره شده", hoverHint: "روی گزینه های داخل منو برو تا فقط در پیش نمایش سمت راست نتیجه را ببینی. فونت های انتخابی در صورت نیاز از منبع ابری بارگذاری می شوند و در حالت آفلاین از فونت جایگزین استفاده می شود.",
  } : {
    eyebrow: "Appearance studio",
    title: "Make QueueMint feel like yours",
    hint: "Try options, hover any choice to preview it, and apply only when the combination feels right.",
    theme: "Theme", accent: "Accent", custom: "Custom", tone: "Neutral tone", bodyFont: "Body font", headingFont: "Heading font",
    radius: "Corner radius", density: "Density", sidebar: "Menu style", menuAccent: "Menu accent", surface: "Surface style",
    layout: "Default issue view", columns: "Card columns", light: "Light", dark: "Dark", system: "System",
    mist: "Mist", slate: "Slate", zinc: "Zinc", gray: "Gray", neutral: "Neutral", stone: "Stone", sand: "Sand", paper: "Paper", systemFont: "System", humanist: "Humanist", geometric: "Geometric", rounded: "Rounded", mono: "Mono", serif: "Serif", display: "Display",
    vazirmatn: "Vazirmatn", mikhak: "Mikhak", samim: "Samim", shabnam: "Shabnam", sahel: "Sahel", naskh: "Arabic Naskh", lalezar: "Lalezar",
    fontPresets: "Presets", fontSans: "Sans", fontMono: "Mono", fontSerif: "Serif", fontPersian: "Persian / Arabic",
    none: "None", small: "Small", medium: "Medium", large: "Large", compact: "Compact", comfortable: "Comfortable", spacious: "Spacious",
    soft: "Soft", solid: "Solid", outline: "Outline", subtle: "Subtle", filled: "Filled", flat: "Flat", bordered: "Bordered", raised: "Raised",
    board: "Board", grid: "Cards", list: "List", preview: "Live preview", reset: "Reset", shuffle: "Shuffle", export: "Download preset", import: "Import preset",
    advanced: "More settings", preset: "Preset", copy: "Copy code", copied: "Preset code copied", exported: "Appearance preset downloaded", imported: "Preset loaded for preview", invalid: "That preset file is not valid",
    apply: "Apply changes", applied: "Appearance changes saved", cancel: "Discard changes", unsaved: "Unsaved changes", saved: "All changes saved", hoverHint: "Hover choices to preview only on the right. Selected web fonts load on demand, with a local/system fallback when offline.",
  }
}
