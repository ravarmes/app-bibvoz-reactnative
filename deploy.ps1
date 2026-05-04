# deploy.ps1 - BibVoz build & deploy helper
#
# Uso:
#   .\deploy.ps1              - instala no emulador E gera AAB (padrao)
#   .\deploy.ps1 emulator     - somente instala no emulador aberto
#   .\deploy.ps1 aab          - somente gera AAB para o Google Play

param(
    [ValidateSet('emulator', 'aab', 'all')]
    [string]$Target = 'all'
)

$ErrorActionPreference = 'Stop'
$AndroidDir = "$PSScriptRoot\android"
$Package    = 'br.com.vargascode.bibvoz'

function Test-EmulatorConnected {
    $devices = adb devices 2>&1 | Select-String -Pattern '(emulator|device)$'
    return $devices.Count -gt 0
}

function Install-Emulator {
    Write-Host ''
    Write-Host '>>> Instalando no emulador...' -ForegroundColor Cyan

    if (-not (Test-EmulatorConnected)) {
        Write-Host 'ERRO: Nenhum emulador/dispositivo conectado. Abra um emulador primeiro.' -ForegroundColor Red
        return $false
    }

    Push-Location $AndroidDir
    try {
        $output   = .\gradlew.bat app:installDebug 2>&1
        $exitCode = $LASTEXITCODE

        if ($exitCode -ne 0 -and ($output | Select-String 'INSTALL_FAILED_UPDATE_INCOMPATIBLE')) {
            Write-Host 'Assinatura incompativel - desinstalando versao anterior...' -ForegroundColor Yellow
            adb uninstall $Package | Out-Null
            $output   = .\gradlew.bat app:installDebug 2>&1
            $exitCode = $LASTEXITCODE
        }

        $output | Select-String -Pattern 'BUILD|Installing|error:|FAILURE' | ForEach-Object { Write-Host $_.Line }

        if ($exitCode -eq 0) {
            adb shell am start -n "$Package/.MainActivity" | Out-Null
            Write-Host 'App instalado e iniciado com sucesso.' -ForegroundColor Green
            return $true
        } else {
            Write-Host 'Falha no build.' -ForegroundColor Red
            return $false
        }
    } finally {
        Pop-Location
    }
}

function Build-AAB {
    Write-Host ''
    Write-Host '>>> Gerando AAB para o Google Play...' -ForegroundColor Cyan

    Push-Location $AndroidDir
    try {
        .\gradlew.bat bundleRelease 2>&1 |
            Select-String -Pattern 'BUILD|Task :app:bundle|error:|FAILURE' |
            ForEach-Object { Write-Host $_.Line }

        if ($LASTEXITCODE -eq 0) {
            $aabPath = "$AndroidDir\app\build\outputs\bundle\release\app-release.aab"
            $sizeMB  = [math]::Round((Get-Item $aabPath).Length / 1MB, 1)
            Write-Host ''
            Write-Host 'AAB gerado com sucesso!' -ForegroundColor Green
            Write-Host "Caminho : $aabPath" -ForegroundColor White
            Write-Host "Tamanho : $sizeMB MB" -ForegroundColor White
            return $true
        } else {
            Write-Host 'Falha ao gerar AAB.' -ForegroundColor Red
            return $false
        }
    } finally {
        Pop-Location
    }
}

switch ($Target) {
    'emulator' { Install-Emulator | Out-Null }
    'aab'      { Build-AAB | Out-Null }
    'all' {
        $ok = Install-Emulator
        if ($ok) { Build-AAB | Out-Null }
    }
}
