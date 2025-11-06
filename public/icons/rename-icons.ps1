# Icon Renaming Script
# Renames hashed SVG files to semantic names based on the mapping document

$ErrorActionPreference = "Stop"

# Define the icon directory and backup directory
$iconDir = "D:\repo\hogwarts\public\icons"
$backupDir = "D:\repo\hogwarts\public\icons\.backup"
$logFile = "$iconDir\rename-log.txt"

# Create backup directory if it doesn't exist
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "Created backup directory: $backupDir" -ForegroundColor Green
}

# Initialize log file
"Icon Rename Operation - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Out-File $logFile
"=" * 80 | Out-File $logFile -Append
"" | Out-File $logFile -Append

# Define the mapping (extracted from icon-renaming-mapping.md)
$renameMap = @{
    "07c019d3b2596ff9d1a70c4af1efd00b0a775510-1000x1000.svg" = "Hands-Gesture-01.svg"
    "036c01a9e427ea0f4d1e6c7221e4f6dce2259bf7-1000x1000.svg" = "Hands-Figure-01.svg"
    "0d259ed89e181ad18dea036804f50080ea61e77a-1680x1260.svg" = "Hands-Gesture-Background-01.svg"
    "0df729ce74e4c9dd62c3342c9549ce6c7cef1202-1000x1000.svg" = "People-Multiple-01.svg"
    "1576ae23eaf481f33bd36ab468171cc69d12361a-1000x1000.svg" = "Hands-Gesture-02.svg"
    "1c3d1af62032009538b8bf5864139ca124b06741-1000x1000.svg" = "Hands-Document.svg"
    "1c3e87fd90491089b2971dc34f9f75bb8a80f713-1000x1000.svg" = "Hands-Circular.svg"
    "2174acb37a84767550abfe2588eb5648f941a897-1000x1000.svg" = "Scene-Complex-01.svg"
    "33dbe8f783d4835a838b4c4ae85d3c04e352fee1-1000x1000.svg" = "Letter-W-Figure.svg"
    "33ddc751e21fb4b116b3f57dd553f0bc55ea09d1-1000x1000.svg" = "Objects-Document-02.svg"
    "39c40393e610cc0a5e65f50ad12ff5ada273f792-1000x1000.svg" = "Hands-Terrain.svg"
    "39db33950eb113e504a5b9fc56db490a64673e96-1000x1000.svg" = "Scene-Terrain.svg"
    "423062049d4676b41d52b16068cbb5e21603190e-1000x1000.svg" = "Scene-Complex-02.svg"
    "46e4aa7ea208ed440d5bd9e9e3a0ee66bc336ff1-1000x1000.svg" = "Abstract-Organic.svg"
    "4d663bd87c391c144b9bca513b3849ccfa00a3b9-1000x1000.svg" = "Scene-Organic-01.svg"
    "5f455d24ea80569b34eb4347f06152d8a5508722-1000x1000.svg" = "Letter-P-01.svg"
    "6457c34fbcb012acf0f27f15a6006f700d0f50de-1000x1000.svg" = "Hands-Interaction.svg"
    "6507d83d1197bb8630131d363fb8bea838d79ca7-1000x1000.svg" = "Letter-M-02.svg"
    "653e7474811cf768b6b0f628e253f98c60e2747e-1000x1000.svg" = "Scene-Complex-03.svg"
    "6905c83d0735e1bc430025fdd1748d1406079036-1000x1000.svg" = "People-Motion-01.svg"
    "6b1470e7fa2fb7280502291f204b88c412690076-1000x1000.svg" = "Letter-M-01.svg"
    "6e00dbffcddc82df5e471c43453abfc74ca94e8d-1000x1000.svg" = "Scene-Detailed-01.svg"
    "74409af25137110ac04cc39e4d5ea0a2fbcea421-1000x1000.svg" = "Hands-Complex-01.svg"
    "77dd9077412abc790bf2bc6fa3383b37724d6305-1000x1000.svg" = "Abstract-Letter-01.svg"
    "811dcfbdaac4ea3628e0a2a5a547b0a175d63bcf-1000x1000.svg" = "Hands-Gesture-04.svg"
    "84dfc3a6a5b8bf79a0cd430524c1f5a89e376531-1681x1261.svg" = "Scene-Wide-01.svg"
    "8925ac952fa2cb8eb5e845b2e44f3e71b33fd695-1000x1000.svg" = "Hands-Abstract-01.svg"
    "8d339ae8ecedecc1409db8f5bbb99c958db56946-1000x1000.svg" = "Letter-Abstract-01.svg"
    "92f0be286703b4b8c906bcf1c95c7f3bbee5bd38-1000x1000.svg" = "Hands-Document-02.svg"
    "97cf99624aa60f59b75f9e08cdf0f00d33c34804-1000x1000.svg" = "Abstract-Curves-02.svg"
    "9a2bdeafe0f8f92dcc062ba47cc0a1014c4ecbc0-1000x1000.svg" = "Abstract-Curves-01.svg"
    "9f6a378a1e3592cf8d27447457409ba12284faef-1000x1000.svg" = "Hands-Gesture-05.svg"
    "a62b6eb169818f14c35b7a192af269e283f8fa93-1000x1000.svg" = "Scene-Complex-04.svg"
    "a683fdcfe3e2c7c6532342a0fa4ff789c3fd4852-1000x1000.svg" = "Hands-Figure-02.svg"
    "a97733b3607b54a30778eb89de08afd9e02b9fb3-1000x1000.svg" = "Letter-Abstract-02.svg"
    "abc884c723daea810d2e986455358281a2f94102-1000x1000.svg" = "People-Figure-02.svg"
    "b1ce510c468b2920d4f8f61c17a50906801f939a-1000x1000.svg" = "Scene-Wavy-01.svg"
    "b5c98d26c46edc43193e7f7e28a00633a538bb9c-1000x1000.svg" = "Objects-Document-Layout-01.svg"
    "b68cbb43d7c8f56f0b14cc867e8d4d74445f78b0-1000x1000.svg" = "Abstract-Machinery-01.svg"
    "c0af2a56f56cf298ce5904f2901e9a36facd0dbe-1000x1000.svg" = "Letter-W-Person-01.svg"
    "c1ef4c0b6882dfe985555b52999d370ea88a3c50-1000x1000.svg" = "Hands-Abstract-Complex-01.svg"
    "c4a48972044d45df475f1dd84df3b74d221b6580-1000x1000.svg" = "Hands-Terrain-02.svg"
    "cd4fd51deacd067d4e30aee4f4b149f6cba1b97b-1000x1000.svg" = "Letter-E-01.svg"
    "cd9cf56a7f049285b7c1c8786c0a600cf3d7f317-1000x1000.svg" = "Scene-Complex-05.svg"
    "d3dd09ad16c68461dc3fb01df5e84cf7ccafda6c-1000x1000.svg" = "Scene-Detailed-02.svg"
    "ddad92700787ec1bf1d80359c0c5e6ca305682b0-1000x1000.svg" = "People-Figure-04.svg"
    "ee580919acaba2ddc07425f7a7390c8962cadc94-1000x1000.svg" = "People-Figure-03.svg"
    "f1d1a4c75433996f97b87ea0f3791022370e2765-1680x1260.svg" = "Scene-Wide-Orange-01.svg"
}

# Statistics
$totalFiles = $renameMap.Count
$successCount = 0
$failedCount = 0
$skippedCount = 0

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Icon Renaming Operation" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "Total files to rename: $totalFiles`n" -ForegroundColor Yellow

# Perform rename operations
foreach ($oldName in $renameMap.Keys) {
    $newName = $renameMap[$oldName]
    $oldPath = Join-Path $iconDir $oldName
    $newPath = Join-Path $iconDir $newName
    $backupPath = Join-Path $backupDir $oldName

    # Check if source file exists
    if (-not (Test-Path $oldPath)) {
        Write-Host "[SKIP] File not found: $oldName" -ForegroundColor Yellow
        "SKIPPED: $oldName (file not found)" | Out-File $logFile -Append
        $skippedCount++
        continue
    }

    # Check if target file already exists
    if (Test-Path $newPath) {
        Write-Host "[SKIP] Target already exists: $newName" -ForegroundColor Yellow
        "SKIPPED: $oldName -> $newName (target already exists)" | Out-File $logFile -Append
        $skippedCount++
        continue
    }

    try {
        # Create backup
        Copy-Item -Path $oldPath -Destination $backupPath -Force

        # Rename file
        Rename-Item -Path $oldPath -NewName $newName -Force

        Write-Host "[OK] $oldName -> $newName" -ForegroundColor Green
        "SUCCESS: $oldName -> $newName" | Out-File $logFile -Append
        $successCount++
    }
    catch {
        $errorMsg = $_.Exception.Message
        Write-Host "[FAIL] Failed to rename ${oldName}: $errorMsg" -ForegroundColor Red
        "FAILED: $oldName -> $newName ($errorMsg)" | Out-File $logFile -Append
        $failedCount++
    }
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Rename Operation Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total files:    $totalFiles" -ForegroundColor White
Write-Host "Successful:     $successCount" -ForegroundColor Green
Write-Host "Failed:         $failedCount" -ForegroundColor $(if ($failedCount -gt 0) { "Red" } else { "Gray" })
Write-Host "Skipped:        $skippedCount" -ForegroundColor Yellow
Write-Host "`nBackup location: $backupDir" -ForegroundColor Cyan
Write-Host "Log file:        $logFile`n" -ForegroundColor Cyan

# Write summary to log
"" | Out-File $logFile -Append
"=" * 80 | Out-File $logFile -Append
"SUMMARY" | Out-File $logFile -Append
"=" * 80 | Out-File $logFile -Append
"Total files:    $totalFiles" | Out-File $logFile -Append
"Successful:     $successCount" | Out-File $logFile -Append
"Failed:         $failedCount" | Out-File $logFile -Append
"Skipped:        $skippedCount" | Out-File $logFile -Append
"Completion:     $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Out-File $logFile -Append

Write-Host "Rename operation completed!" -ForegroundColor Green
