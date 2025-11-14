@echo off
REM Script to replace old forms with optimized versions
REM Run this from the project root: replace-forms.bat

echo 🔄 Replacing forms with optimized versions...
echo.

REM Students Form
echo 📝 Processing students form...
if exist "src\components\platform\students\form-optimized.tsx" (
    if exist "src\components\platform\students\form.tsx" (
        move /Y "src\components\platform\students\form.tsx" "src\components\platform\students\form-old.tsx.bak" >nul
        echo   ✅ Backed up old form to form-old.tsx.bak
    )
    move /Y "src\components\platform\students\form-optimized.tsx" "src\components\platform\students\form.tsx" >nul
    echo   ✅ Replaced with optimized version
) else (
    echo   ⚠️  form-optimized.tsx not found, skipping
)

REM Teachers Form
echo 📝 Processing teachers form...
if exist "src\components\platform\teachers\form-optimized.tsx" (
    if exist "src\components\platform\teachers\form.tsx" (
        move /Y "src\components\platform\teachers\form.tsx" "src\components\platform\teachers\form-old.tsx.bak" >nul
        echo   ✅ Backed up old form to form-old.tsx.bak
    )
    move /Y "src\components\platform\teachers\form-optimized.tsx" "src\components\platform\teachers\form.tsx" >nul
    echo   ✅ Replaced with optimized version
) else (
    echo   ⚠️  form-optimized.tsx not found, skipping
)

REM Parents Form
echo 📝 Processing parents form...
if exist "src\components\platform\parents\form-optimized.tsx" (
    if exist "src\components\platform\parents\form.tsx" (
        move /Y "src\components\platform\parents\form.tsx" "src\components\platform\parents\form-old.tsx.bak" >nul
        echo   ✅ Backed up old form to form-old.tsx.bak
    )
    move /Y "src\components\platform\parents\form-optimized.tsx" "src\components\platform\parents\form.tsx" >nul
    echo   ✅ Replaced with optimized version
) else (
    echo   ⚠️  form-optimized.tsx not found, skipping
)

REM Subjects Form
echo 📝 Processing subjects form...
if exist "src\components\platform\subjects\form-optimized.tsx" (
    if exist "src\components\platform\subjects\form.tsx" (
        move /Y "src\components\platform\subjects\form.tsx" "src\components\platform\subjects\form-old.tsx.bak" >nul
        echo   ✅ Backed up old form to form-old.tsx.bak
    )
    move /Y "src\components\platform\subjects\form-optimized.tsx" "src\components\platform\subjects\form.tsx" >nul
    echo   ✅ Replaced with optimized version
) else (
    echo   ⚠️  form-optimized.tsx not found, skipping
)

REM Classes Form
echo 📝 Processing classes form...
if exist "src\components\platform\classes\form-optimized.tsx" (
    if exist "src\components\platform\classes\form.tsx" (
        move /Y "src\components\platform\classes\form.tsx" "src\components\platform\classes\form-old.tsx.bak" >nul
        echo   ✅ Backed up old form to form-old.tsx.bak
    )
    move /Y "src\components\platform\classes\form-optimized.tsx" "src\components\platform\classes\form.tsx" >nul
    echo   ✅ Replaced with optimized version
) else (
    echo   ⚠️  form-optimized.tsx not found, skipping
)

echo.
echo ✅ All forms replaced!
echo.
echo Next steps:
echo 1. Run: pnpm tsc --noEmit  (to check TypeScript)
echo 2. Run: pnpm build  (to test build)
echo 3. Test each form in development
echo.
echo To rollback if needed, manually restore from form-old.tsx.bak files
pause
