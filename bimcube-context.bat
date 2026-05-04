@echo off
set OUTFILE=bimcube-context.txt

echo ⚙️ Generating Master Context File...

:: 1. Create the file and write the Header/Description
> "%OUTFILE%" (
    echo # 🧊 BimCube: Master Context Snapshot
    echo.
    echo **Project Overview:**
    echo BimCube is a web-native, modular CAD platform. It uses a strict decoupled architecture: React handles the UI, Zustand handles the global state bus, Three.js handles the 3D viewport, and isolated pure-javascript plugins handle the math/geometry generation.
    echo.
    echo ---
    echo.
)

:: 2. Append the critical Root files
call :WriteFile "index.html"
call :WriteFile "vite.config.js"
call :WriteFile "package.json"

:: 3. Recursively find and append all code files in the /src folder
for /R "src" %%F in (*.jsx *.js *.json) do (
    call :WriteFile "%%F"
)

echo.
echo ✅ Successfully created %OUTFILE%!
pause
goto :EOF

:: --- HELPER FUNCTION TO FORMAT AND APPEND FILES ---
:WriteFile
if exist "%~1" (
    echo 📄 Adding: %~1
    >> "%OUTFILE%" echo **%~1**
    >> "%OUTFILE%" echo ```text
    >> "%OUTFILE%" type "%~1"
    >> "%OUTFILE%" echo.
    >> "%OUTFILE%" echo ```
    >> "%OUTFILE%" echo.
)
exit /B