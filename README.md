# KineAI — تعافي الذكي

منصة إعادة تأهيل بالذكاء الاصطناعي. تحوّل كاميرا الجوال/الكمبيوتر إلى مساعد حركة يرصد وضعيتك ويعرض نقاط الحركة.

## التشغيل محلياً

```bash
python3 serve.py
```

افتح: [http://localhost:8080](http://localhost:8080)

### الجوال (HTTPS)

```bash
python3 serve_https.py
```

افتح من الجوال: `https://YOUR-IP:8443`

## الملفات

| ملف | الوظيفة |
|-----|---------|
| `index.html` | الصفحة الرئيسية |
| `styles.css` | التصميم |
| `script.js` | الترجمة والتفاعلات |
| `camera.js` | الكaméra + محلل MoveNet |
| `serve.py` | سيرver محلي |
| `serve_https.py` | سيرver HTTPS للجوال |

## المتطلبات

- Chrome أو Safari حديث
- إذن الكaméra
- اتصال إنternet (تحميل محلل الحركة أول مرة)
