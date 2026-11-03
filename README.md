# دأب — خطوة كل يوم

الموقع **نسخة طبق الأصل** من التصميم في ملف HTML واحد (`index.html`).  
كل الصفحات والتصميم والسكربت داخل هذا الملف — **لا** تعتمد على `styles.css` أو `script.js` القديمة (KineAI).

## المصدر (للتحديث)

لاستبدال الموقع بتصميم جديد من عندك:

```bash
cp ~/Downloads/"دأب (1).html" ~/Desktop/aidab/index.html
```

ثم أعد النشر على Cloudflare (انظر أدناه).

## تشغيل محلي

```bash
cd ~/Desktop/aidab
python3 serve.py
```

افتح: [http://localhost:8080](http://localhost:8080)

## نشر Cloudflare Pages

```bash
./deploy-cloudflare.sh
```

## أرشيف

ملفات **KineAI** السابقة محفوظة في `archive/kineai/` للرجوع فقط — لا تُستخدم في موقع دأب.
