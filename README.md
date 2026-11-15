# 12 недель: тренировки и трекер (PWA)
Файлы: index.html, app.js, plan.js (план и тексты), config.js (твои ключи Firebase), sw.js, manifest.
Быстро: 1) создай проект Firebase, включи Authentication (Email/Password) и Firestore;
2) вставь конфиг в config.js; 3) залей папку на GitHub Pages и добавь домен в Authorized domains.
Правила Firestore:
rules_version = '2';
service cloud.firestore { match /databases/{d}/documents {
  match /users/{uid}/{document=**} { allow read, write: if request.auth != null && request.auth.uid == uid; } } }
Подробная инструкция будет отдельным шагом.
