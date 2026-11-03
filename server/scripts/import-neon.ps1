$ErrorActionPreference = 'Stop'

$serverRoot = Split-Path -Parent $PSScriptRoot
$backupPath = Join-Path $serverRoot 'backups\fashion_db_2026-11-03.dump'
$pgRestoreCommand = Get-Command pg_restore -ErrorAction SilentlyContinue
$pgRestore = if ($pgRestoreCommand) { $pgRestoreCommand.Source } else { $null }
if (-not $pgRestore) {
    $knownInstall = 'C:\Program Files\PostgreSQL\18\bin\pg_restore.exe'
    if (Test-Path $knownInstall) {
        $pgRestore = $knownInstall
    } else {
        throw 'Không tìm thấy pg_restore. Cài PostgreSQL command-line tools rồi chạy lại.'
    }
}
if (-not (Test-Path $backupPath)) {
    throw "Không tìm thấy bản sao lưu dữ liệu: $backupPath"
}

$secureUrl = Read-Host 'Dán Neon direct connection string (input được ẩn)' -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureUrl)
$environmentNames = @('DATABASE_URL', 'PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'PGSSLMODE')
$previousEnvironment = @{}
foreach ($name in $environmentNames) {
    $previousEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}

try {
    $env:DATABASE_URL = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    $connection = [Uri]$env:DATABASE_URL
    if ($connection.Scheme -notin @('postgres', 'postgresql')) {
        throw 'Connection string phải bắt đầu bằng postgres:// hoặc postgresql://.'
    }

    $userInfo = $connection.UserInfo.Split(':', 2)
    if ($userInfo.Count -ne 2) {
        throw 'Connection string Neon không có đủ username/password.'
    }

    $env:PGHOST = $connection.Host
    $env:PGPORT = if ($connection.Port -gt 0) { [string]$connection.Port } else { '5432' }
    $env:PGDATABASE = [Uri]::UnescapeDataString($connection.AbsolutePath.TrimStart('/'))
    $env:PGUSER = [Uri]::UnescapeDataString($userInfo[0])
    $env:PGPASSWORD = [Uri]::UnescapeDataString($userInfo[1])
    $env:PGSSLMODE = 'require'

    Push-Location $serverRoot
    try {
        Write-Host 'Đang tạo schema Neon từ các migration...'
        & npx prisma migrate deploy
        if ($LASTEXITCODE -ne 0) { throw 'Prisma migrate deploy thất bại.' }

        Write-Host 'Đang nhập dữ liệu sao lưu vào Neon...'
        & $pgRestore --data-only --no-owner --no-privileges --dbname=$env:PGDATABASE $backupPath
        if ($LASTEXITCODE -ne 0) { throw 'pg_restore thất bại; kiểm tra Neon project còn trống và connection string.' }
    } finally {
        Pop-Location
    }

    Write-Host 'Đã áp migrations và nhập dữ liệu vào Neon.'
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    foreach ($name in $environmentNames) {
        if ($null -eq $previousEnvironment[$name]) {
            Remove-Item "Env:$name" -ErrorAction SilentlyContinue
        } else {
            [Environment]::SetEnvironmentVariable($name, $previousEnvironment[$name], 'Process')
        }
    }
}
