param()

$ErrorActionPreference = 'Stop'
$plannerRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$serviceSource = Join-Path $plannerRoot 'services\interpretation-student-v06'
$artifactRoot = Join-Path $plannerRoot 'core\training-artifacts\gcc4z'
$handoffName = 'PA-INTERPRETATION-STUDENT-v0.6-GCC4Z-RUN2-HANDOFF'
$stage = Join-Path $artifactRoot $handoffName
$archive = Join-Path $artifactRoot ($handoffName + '.zip')

$resolvedArtifactRoot = (Resolve-Path $artifactRoot).Path
if (-not $stage.StartsWith($resolvedArtifactRoot + [IO.Path]::DirectorySeparatorChar)) { throw 'UNSAFE_RUN2_STAGE_PATH' }
if (-not $archive.StartsWith($resolvedArtifactRoot + [IO.Path]::DirectorySeparatorChar)) { throw 'UNSAFE_RUN2_ARCHIVE_PATH' }

git -C $plannerRoot diff --quiet 4e8ee5c -- services/interpretation-student-v06
if ($LASTEXITCODE -ne 0) { throw 'GCC4Y_SERVICE_SOURCE_DIFFERS_FROM_4E8EE5C' }

if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
if (Test-Path -LiteralPath $archive) { Remove-Item -LiteralPath $archive -Force }
New-Item -ItemType Directory -Path (Join-Path $stage 'scripts') -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stage 'service') -Force | Out-Null

Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'RUN2_README.md') -Destination (Join-Path $stage 'README.md')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'SERVICE_SOURCE_COMMIT.txt') -Destination $stage
foreach ($name in @('qualify.py','evidence_writer.py','test_qualifier_policy.py','setup_external_gpu.sh','start_service.sh')) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot $name) -Destination (Join-Path (Join-Path $stage 'scripts') $name)
}
foreach ($name in @('Dockerfile','README.md','requirements.lock')) {
    Copy-Item -LiteralPath (Join-Path $serviceSource $name) -Destination (Join-Path (Join-Path $stage 'service') $name)
}
Copy-Item -LiteralPath (Join-Path $serviceSource 'app') -Destination (Join-Path $stage 'service') -Recurse
Copy-Item -LiteralPath (Join-Path $serviceSource 'tests') -Destination (Join-Path $stage 'service') -Recurse

$payload = Get-ChildItem -LiteralPath $stage -Recurse -File | Sort-Object { $_.FullName.Substring($stage.Length + 1).Replace('\','/') }
$sumLines = foreach ($file in $payload) {
    $relative = $file.FullName.Substring($stage.Length + 1).Replace('\','/')
    $digest = (Get-FileHash -Algorithm SHA256 -LiteralPath $file.FullName).Hash.ToLowerInvariant()
    "$digest  $relative"
}
[IO.File]::WriteAllLines((Join-Path $stage 'SHA256SUMS'), $sumLines, [Text.UTF8Encoding]::new($false))

& tar.exe -a -c -f $archive -C $artifactRoot $handoffName
if ($LASTEXITCODE -ne 0) { throw 'RUN2_ARCHIVE_CREATION_FAILED' }
$archiveHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $archive).Hash.ToLowerInvariant()
$fileCount = (Get-ChildItem -LiteralPath $stage -Recurse -File).Count
[pscustomobject]@{ filename = [IO.Path]::GetFileName($archive); size = (Get-Item -LiteralPath $archive).Length; sha256 = $archiveHash; file_count = $fileCount; payload_hash_count = $sumLines.Count; service_source_commit = '4e8ee5c' }
