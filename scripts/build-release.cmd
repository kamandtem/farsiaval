@echo off
setlocal EnableExtensions EnableDelayedExpansion
rem Build signed release APK for Cafe Bazaar (Windows)
rem Requires: Node 22, JDK 21, Android SDK (Android Studio)
rem Signing files must be in release-secrets next to package.json:
rem   release-secrets\alfba-release.jks and release-secrets\keystore.properties

cd /d "%~dp0.."
set "ROOT=%CD%"
set "SECRETS=%ROOT%\release-secrets"

if not exist "%SECRETS%\keystore.properties" (
  echo [ERROR] release-secrets\keystore.properties not found.
  exit /b 1
)
for /f "usebackq tokens=1,* delims==" %%a in ("%SECRETS%\keystore.properties") do (
  set "line=%%a"
  if not "!line:~0,1!"=="#" set "%%a=%%b"
)
if not exist "%SECRETS%\%RELEASE_STORE_FILE%" (
  echo [ERROR] Key file %RELEASE_STORE_FILE% not found in release-secrets.
  exit /b 1
)
set "RELEASE_STORE_FILE=%SECRETS%\%RELEASE_STORE_FILE%"

if not exist node_modules ( call npm install --no-audit --no-fund || exit /b 1 )
call npm run lint || exit /b 1
call npm run build || exit /b 1
if not exist android ( call npx cap add android || exit /b 1 )
call npm run assets:generate || exit /b 1
call npx cap sync android || exit /b 1
call node scripts\patch-android.mjs || exit /b 1

pushd android
call gradlew.bat -I "%ROOT%\scripts\release.gradle" assembleRelease || ( popd & exit /b 1 )
popd

if not exist release mkdir release
set "OUT=release\alfba-island-%RELEASE_VERSION_NAME%.apk"
copy /y "android\app\build\outputs\apk\release\app-release.apk" "%OUT%" >nul || exit /b 1
echo.
echo [DONE] Bazaar-ready APK: %OUT%
echo Next release: increase RELEASE_VERSION_CODE by 1.
endlocal
