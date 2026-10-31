@echo off
chcp 65001 > nul
title تشغيل نظام حِفظ - إدارة الحلقات القرآنية

echo ===================================================
echo     جاري تشغيل خادم نظام حِفظ (Tahfeez System)
echo ===================================================
echo.

cd /d "%~dp0\server"
if not exist node_modules (
    echo [تنبيه] جاري تثبيت حزم الخادم لأول مرة...
    call npm install
)

echo [1/2] بناء واجهة المستخدم (Client Build)...
cd /d "%~dp0\client"
if not exist dist (
    echo [تنبيه] بناء ملفات الواجهة...
    call npm run build
)

cd /d "%~dp0\server"
echo [2/2] بدء تشغيل الخادم على الرابط: http://localhost:5000
echo.
echo ===================================================
echo  النظام يعمل الآن! يتم فتح المتصفح تلقائياً على:
echo  http://localhost:5000
echo ===================================================
echo.

start http://localhost:5000
node server.js
pause
