# --- START PROJECT SCRIPT ---
# Arranque automático del entorno "video-programmer"

# --- EJECUCIÓN ---
# 1. Abrir PowerShell
# 2. Navegar a la carpeta del proyecto
# 3. Ejecutar: Set-ExecutionPolicy Bypass -Scope Process -Force
# 4. Ejecutar: ./start_project.ps1

# Rutas base
$projectPath = "D:\Documentos\Repositories\Canva-app\video-programmer"
$pythonPath = "C:\Users\RYZEN 5 3600\AppData\Local\Programs\Python\Python311\python.exe"

# Agregar Poetry al PATH (por si no está cargado)
$env:Path += ";$env:APPDATA\Python\Scripts;$env:APPDATA\pypoetry\venv\Scripts"

# Ir al proyecto
Set-Location $projectPath

Write-Host "🔧 Verificando entorno de Python y Poetry..." -ForegroundColor Cyan
poetry env use "$pythonPath"
poetry install --no-root

# Crear credentials.json si no existe
if (-not (Test-Path "$projectPath\credentials.json")) {
    Write-Host "⚙️  Creando credentials.json a partir del .env..." -ForegroundColor Yellow
    $envFile = Get-Content "$projectPath\.env" | Where-Object {$_ -match "YT_CLIENT_ID|YT_CLIENT_SECRET|YT_REDIRECT_URI"}
    $clientId = ($envFile | Where-Object {$_ -match "YT_CLIENT_ID"}).Split("=")[1].Trim()
    $clientSecret = ($envFile | Where-Object {$_ -match "YT_CLIENT_SECRET"}).Split("=")[1].Trim()
    $redirectUri = ($envFile | Where-Object {$_ -match "YT_REDIRECT_URI"}).Split("=")[1].Trim()
    $payload = @{
        web = @{
            client_id = $clientId
            client_secret = $clientSecret
            auth_uri = "https://accounts.google.com/o/oauth2/auth"
            token_uri = "https://oauth2.googleapis.com/token"
            auth_provider_x509_cert_url = "https://www.googleapis.com/oauth2/v1/certs"
            redirect_uris = @($redirectUri)
            javascript_origins = @("http://localhost:8000","http://127.0.0.1:8000")
            project_id = "video-programmer"
        }
    }
    $payload | ConvertTo-Json -Depth 6 | Out-File "$projectPath\credentials.json" -Encoding utf8
    Write-Host "✅ credentials.json creado correctamente."
}

Write-Host "🚀 Iniciando servidor FastAPI..." -ForegroundColor Green
poetry run uvicorn app.main:app --reload
