# نصب دستی QueueMint v1.0.0

QueueMint برای نصب داخلی تیم به Chrome Web Store نیاز ندارد. فایل رسمی نسخه `v1.0.0` را دانلود و از حالت ZIP خارج کنید، سپس پوشه بازشده را به Chrome یا Edge معرفی کنید.

## نصب در Chrome

1. فایل `queuemint-v1.0.0.zip` را از GitHub Release دریافت کنید.
2. فایل ZIP را در یک پوشه ثابت Extract کنید. خود فایل ZIP را به Chrome ندهید.
3. در Chrome این آدرس را باز کنید: `chrome://extensions`
4. گزینه **Developer mode** را روشن کنید.
5. روی **Load unpacked** بزنید.
6. پوشه Extract شده‌ای را انتخاب کنید که فایل `manifest.json` داخل آن است.
7. QueueMint را از منوی Extensions پین کنید تا همیشه در Toolbar دیده شود.
8. Jira را در یک Tab معمولی باز کنید و QueueMint را متصل کنید.

## نصب در Edge

1. فایل ZIP را Extract کنید.
2. این آدرس را باز کنید: `edge://extensions`
3. **Developer mode** را روشن کنید.
4. **Load unpacked** را بزنید.
5. پوشه‌ای را انتخاب کنید که `manifest.json` داخل آن است.

## آپدیت نسخه نصب شده

برای اینکه تنظیمات QueueMint حفظ شوند، بهتر است همیشه همان پوشه‌ای را که قبلا با **Load unpacked** نصب کرده‌اید به‌روزرسانی کنید.

1. QueueMint قبلی را حذف نکنید.
2. فایل‌های نسخه جدید را جایگزین فایل‌های همان پوشه قبلی کنید.
3. وارد `chrome://extensions` شوید.
4. روی **Reload** کارت QueueMint بزنید.

اگر نسخه جدید را از یک پوشه کاملا متفاوت به عنوان Extension جدید Load کنید، Chrome ممکن است آن را یک نصب جدا در نظر بگیرد و اطلاعات ذخیره شده نصب قبلی در آن دیده نشود.

## میانبر Command Layer

- Windows / Linux: `Ctrl+Shift+K`
- macOS: `Command+Shift+K`
- میانبر جایگزین: `Alt+Shift+K`

اگر میانبر توسط Chrome یا Extension دیگری گرفته شده باشد، از `chrome://extensions/shortcuts` می‌توانید میانبر QueueMint را بررسی یا تغییر دهید.

## Smart Assistant و API Key

Smart Assistant اجباری نیست. قابلیت Local بدون API Key قابل استفاده است. اگر کاربر OpenAI mode را فعال کند، هر کاربر باید API Key خودش را وارد کند. API Key مشترک تیمی را داخل سورس، Git یا فایل نصب قرار ندهید.

## نکات امنیتی برای تیم

- اطلاعات ورود Jira را برای دیگران ارسال نکنید.
- API Key را داخل Screenshot، Log یا Issue قرار ندهید.
- فایل‌های Evidence ممکن است اطلاعات حساس داشته باشند، قبل از ارسال بررسی‌شان کنید.
- برای گزارش خطا از `SUPPORT.md` استفاده کنید.

## ساخت از Source

نیازمندی: Node.js 22.12 یا جدیدتر.

```bash
npm install
npm run check:architecture
npm run typecheck
npm run build
npm run check:release
```

بعد پوشه `dist/` را با **Load unpacked** نصب کنید.

## English quick install

Extract `queuemint-v1.0.0.zip`, open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select the extracted folder that contains `manifest.json`.
