# PowerShell script to start the development server with correct environment variables
$env:DANGEROUSLY_DISABLE_HOST_CHECK = "true"
$env:HOST = "127.0.0.1"
$env:PORT = "3000"

Write-Host "Starting development server with environment variables:"
Write-Host "DANGEROUSLY_DISABLE_HOST_CHECK: $env:DANGEROUSLY_DISABLE_HOST_CHECK"
Write-Host "HOST: $env:HOST"
Write-Host "PORT: $env:PORT"

npm start
