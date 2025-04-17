# Define the output file
$outputFile = "project_dump.txt"
Set-Content -Path $outputFile -Value ""

# Define the extensions you want to include
$extensions = @("js", "json", "ts", "sh")

foreach ($ext in $extensions) {
    Get-ChildItem -Path . -Recurse -Include "*.$ext" | ForEach-Object {
        Add-Content -Path $outputFile -Value "===== FILE: $($_.FullName) ====="
        Add-Content -Path $outputFile -Value (Get-Content $_.FullName -Raw)
        Add-Content -Path $outputFile -Value "`n`n"
    }
}

Write-Host "Done. All code dumped to $outputFile"