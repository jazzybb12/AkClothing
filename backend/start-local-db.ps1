$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$dataPath = Join-Path $projectRoot '.local/mysql-data'
$serverPath = 'C:/Program Files/MySQL/MySQL Server 8.4/bin/mysqld.exe'
if (!(Test-Path -LiteralPath $dataPath)) { throw 'Local data folder is missing. Do not initialize over an existing database.' }
if (Get-NetTCPConnection -State Listen -LocalPort 3306 -ErrorAction SilentlyContinue) {
  Write-Output 'Port 3306 is already in use. No additional database was started.'
  exit 0
}
$dataArgument = '--datadir="' + $dataPath + '"'
$logArgument = '--log-error="' + (Join-Path $projectRoot '.local/mysql-error.log') + '"'
Start-Process -FilePath $serverPath -ArgumentList '--no-defaults',$dataArgument,'--bind-address=127.0.0.1','--port=3306','--mysqlx=OFF',$logArgument -WindowStyle Hidden
Write-Output 'Local MySQL is starting on 127.0.0.1:3306.'
