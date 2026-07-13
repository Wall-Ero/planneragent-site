$ErrorActionPreference = "Stop"

$originalLocation = Get-Location

try {
    $repoRoot = (git rev-parse --show-toplevel).Trim()
    $plannerAgentRoot = Join-Path $repoRoot "planneragent"

    if (-not (Test-Path $plannerAgentRoot)) {
        throw "PlannerAgent directory not found: $plannerAgentRoot"
    }

    $stateFile = Join-Path $plannerAgentRoot "project-memory/state/CURRENT_STATE.md"
    $treeFile = Join-Path $plannerAgentRoot "project-memory/generated/REPOSITORY_TREE.txt"

    if (-not (Test-Path $stateFile)) {
        throw "Current-state file not found: $stateFile"
    }

    Set-Location $repoRoot

    # ---------------------------------------------------------
    # Repository tree
    # ---------------------------------------------------------

    $allFiles = @(
        git ls-files --cached --others --exclude-standard |
            Where-Object {
                $_ -notmatch '(^|/)node_modules(/|$)' -and
                $_ -notmatch '(^|/)(dist|build|coverage)(/|$)'
            } |
            Sort-Object
    )

    $prefix = "planneragent/"

    $plannerFiles = @(
        $allFiles |
            Where-Object { $_ -like "$prefix*" } |
            ForEach-Object { $_.Substring($prefix.Length) }
    )

    $plannerFiles |
        Set-Content -Encoding utf8 $treeFile

    # ---------------------------------------------------------
    # Git state
    # ---------------------------------------------------------

    $branch = (git branch --show-current).Trim()
    $head = (git rev-parse --short HEAD).Trim()
    $headFull = (git rev-parse HEAD).Trim()

    $lastCommit = (
        git log -1 --pretty=format:"%h | %ad | %s" --date=iso-strict
    ).Trim()

    $recentCommits = @(
        git log -5 --pretty=format:"- %h - %s"
    )

    $statusLines = @(
        git status --short
    )

    $workingTreeStatus = if ($statusLines.Count -eq 0) {
        "CLEAN"
    } else {
        "DIRTY"
    }

    $stagedCount = @(
        $statusLines | Where-Object {
            $_.Length -ge 2 -and
            $_[0] -ne ' ' -and
            $_[0] -ne '?'
        }
    ).Count

    $unstagedCount = @(
        $statusLines | Where-Object {
            $_.Length -ge 2 -and
            $_[1] -ne ' '
        }
    ).Count

    $untrackedCount = @(
        $statusLines | Where-Object {
            $_ -match '^\?\?'
        }
    ).Count

    $modifiedCount = @(
        $statusLines | Where-Object {
            $_ -match '^( M|M |MM)'
        }
    ).Count

    $addedCount = @(
        $statusLines | Where-Object {
            $_ -match '^(A | A|\?\?)'
        }
    ).Count

    $deletedCount = @(
        $statusLines | Where-Object {
            $_ -match '^(D | D)'
        }
    ).Count

    $renamedCount = @(
        $statusLines | Where-Object {
            $_ -match '^R '
        }
    ).Count

    # ---------------------------------------------------------
    # Repository inventory
    # ---------------------------------------------------------

    $sourceCount = @(
        $plannerFiles | Where-Object {
            $_ -match '\.(ts|tsx|js|jsx)$'
        }
    ).Count

    $testCount = @(
        $plannerFiles | Where-Object {
            $_ -match '(__tests__|\.test\.|\.spec\.|runner)'
        }
    ).Count

    $sqlCount = @(
        $plannerFiles | Where-Object {
            $_ -match '\.sql$'
        }
    ).Count

    $jsonCount = @(
        $plannerFiles | Where-Object {
            $_ -match '\.json$'
        }
    ).Count

    # ---------------------------------------------------------
    # P9 family discovery
    # ---------------------------------------------------------

    $p9Families = @(
        $plannerFiles |
            ForEach-Object {
                $matches = [regex]::Matches(
                    $_,
                    '(?<![A-Z0-9])P9([A-Z])(?=[0-9._-]|$)'
                )

                foreach ($match in $matches) {
                    "P9$($match.Groups[1].Value)"
                }
            } |
            Sort-Object -Unique
    )

    $p9FamilyLines = New-Object System.Collections.Generic.List[string]

    if ($p9Families.Count -eq 0) {
        $p9FamilyLines.Add(
            "- No P9 families detected from repository paths."
        )
    } else {
        foreach ($family in $p9Families) {
            $escapedFamily = [regex]::Escape($family)

            $familyFiles = @(
                $plannerFiles | Where-Object {
                    $_ -match "(?<![A-Z0-9])$escapedFamily(?=[0-9._-]|$)"
                }
            )

            $sourceFiles = @(
                $familyFiles | Where-Object {
                    $_ -notmatch '(__tests__|\.test\.|\.spec\.|runner)'
                }
            )

            $runnerFiles = @(
                $familyFiles | Where-Object {
                    $_ -match '(__tests__|\.test\.|\.spec\.|runner)'
                }
            )

            $p9FamilyLines.Add(
                "- **$family** — $($sourceFiles.Count) source file(s), $($runnerFiles.Count) runner/test file(s)"
            )
        }
    }

    # ---------------------------------------------------------
    # Current P9 changes
    # ---------------------------------------------------------

    $p9Changes = @(
        $statusLines | Where-Object {
            $_ -match 'P9[A-Z]'
        }
    )

    $p9ChangeLines = New-Object System.Collections.Generic.List[string]

    if ($p9Changes.Count -eq 0) {
        $p9ChangeLines.Add(
            "- No current Git changes containing a P9 family identifier."
        )
    } else {
        foreach ($change in $p9Changes) {
            $p9ChangeLines.Add(
                "- ``$($change.Trim())``"
            )
        }
    }

    # ---------------------------------------------------------
    # Build generated Markdown
    # ---------------------------------------------------------

    $generatedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"

    $autoLines = New-Object System.Collections.Generic.List[string]

    $autoLines.Add("<!-- AUTO:START -->")
    $autoLines.Add("")
    $autoLines.Add("## Automatically generated repository state")
    $autoLines.Add("")
    $autoLines.Add("**Generated:** $generatedAt")
    $autoLines.Add("")
    $autoLines.Add("### Git")
    $autoLines.Add("")
    $autoLines.Add("- Branch: ``$branch``")
    $autoLines.Add("- HEAD: ``$head``")
    $autoLines.Add("- Full commit: ``$headFull``")
    $autoLines.Add("- Working tree: **$workingTreeStatus**")
    $autoLines.Add("- Staged changes: $stagedCount")
    $autoLines.Add("- Unstaged changes: $unstagedCount")
    $autoLines.Add("- Untracked entries: $untrackedCount")
    $autoLines.Add("- Modified entries: $modifiedCount")
    $autoLines.Add("- Added/untracked entries: $addedCount")
    $autoLines.Add("- Deleted entries: $deletedCount")
    $autoLines.Add("- Renamed entries: $renamedCount")
    $autoLines.Add("")
    $autoLines.Add("Latest commit:")
    $autoLines.Add("")
    $autoLines.Add("- $lastCommit")
    $autoLines.Add("")
    $autoLines.Add("Recent commits:")
    $autoLines.Add("")

    foreach ($commit in $recentCommits) {
        $autoLines.Add($commit)
    }

    $autoLines.Add("")
    $autoLines.Add("### Repository inventory")
    $autoLines.Add("")
    $autoLines.Add("- Indexed PlannerAgent paths: $($plannerFiles.Count)")
    $autoLines.Add("- TypeScript/JavaScript source paths: $sourceCount")
    $autoLines.Add("- Test/runner paths: $testCount")
    $autoLines.Add("- SQL paths: $sqlCount")
    $autoLines.Add("- JSON paths: $jsonCount")
    $autoLines.Add("- Repository tree: ``project-memory/generated/REPOSITORY_TREE.txt``")
    $autoLines.Add("")
    $autoLines.Add("### Detected P9 families")
    $autoLines.Add("")

    foreach ($line in $p9FamilyLines) {
        $autoLines.Add($line)
    }

    $autoLines.Add("")
    $autoLines.Add("Presence in the repository does not by itself prove successful verification.")
    $autoLines.Add("Runner results and Git history must still be inspected before declaring a family complete.")
    $autoLines.Add("")
    $autoLines.Add("### Current P9-related working-tree changes")
    $autoLines.Add("")

    foreach ($line in $p9ChangeLines) {
        $autoLines.Add($line)
    }

    $autoLines.Add("")
    $autoLines.Add("<!-- AUTO:END -->")

    $autoBlock = $autoLines -join [Environment]::NewLine

    # ---------------------------------------------------------
    # Replace only AUTO block
    # ---------------------------------------------------------

    $existingContent = Get-Content $stateFile -Raw
    $pattern = '(?s)<!-- AUTO:START -->.*?<!-- AUTO:END -->'

    if ($existingContent -notmatch $pattern) {
        throw "AUTO markers not found in $stateFile"
    }

    $updatedContent = [regex]::Replace(
        $existingContent,
        $pattern,
        [System.Text.RegularExpressions.MatchEvaluator]{
            param($match)
            return $autoBlock
        },
        1
    )

    $updatedContent |
        Set-Content -Encoding utf8 $stateFile

    Write-Host ""
    Write-Host "PlannerAgent current state updated."
    Write-Host "Branch:       $branch"
    Write-Host "HEAD:         $head"
    Write-Host "Working tree: $workingTreeStatus"
    Write-Host "Tree entries: $($plannerFiles.Count)"
    Write-Host "P9 families:  $($p9Families.Count)"
    Write-Host "State file:   $stateFile"
    Write-Host ""
}
finally {
    Set-Location $originalLocation
}

