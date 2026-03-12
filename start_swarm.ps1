# Swarm AI - Multi-Terminal Start Script (Windows)

Write-Host "🚀 Launching Event Swarm AI System..." -ForegroundColor Cyan

# 1. Start the Backend API
Write-Host "Starting Backend API on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PSScriptRoot; python backend/main.py" -WindowStyle Normal

# 2. Start the Frontend Dev Server
Write-Host "Starting Frontend Dev Server on port 8082..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PSScriptRoot; npm run dev -- --port 8082" -WindowStyle Normal

# 3. Start a dedicated Log Monitor for Swarm Controller
Write-Host "Starting Swarm Controller Log Monitor..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PSScriptRoot; while(1) { cls; Write-Host '--- Swarm Controller Active ---' -ForegroundColor Magenta; try { Invoke-RestMethod http://localhost:8000/api/logs } catch { Write-Host 'Waiting for Backend...' -ForegroundColor Gray }; Start-Sleep -Seconds 2 }" -WindowStyle Normal

Write-Host "✅ All processes launched in separate windows." -ForegroundColor Cyan
