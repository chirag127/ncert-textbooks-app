param(
    [switch]$ProjectToo,
    [switch]$Individual,
    [switch]$Copy,
    [switch]$UpdateOnly,
    [switch]$DryRun,
    [string[]]$Agent,
    [string[]]$Skill
)

$ErrorActionPreference = "Stop"

$Source = "vercel-labs/agent-skills"
$Agents = @(
    "aider-desk", "amp", "antigravity", "antigravity-cli", "astrbot",
    "autohand-code", "augment", "bob", "claude-code", "openclaw", "cline",
    "dexto", "kimi-code-cli", "loaf", "warp", "zed", "codearts-agent",
    "codebuddy", "codemaker", "codestudio", "codex", "command-code",
    "continue", "cortex", "crush", "cursor", "deepagents", "devin",
    "droid", "firebender", "forgecode", "gemini-cli", "github-copilot",
    "goose", "hermes-agent", "inference-sh", "jazz", "junie", "iflow-cli",
    "kilo", "kiro-cli", "kode", "lingma", "mcpjam", "mistral-vibe",
    "moxby", "mux", "opencode", "openhands", "ona", "pi", "qoder",
    "qoder-cn", "qwen-code", "reasonix", "rovodev", "roo", "tabnine-cli",
    "terramind", "tinycloud", "trae", "trae-cn", "windsurf", "zencoder",
    "zenflow", "neovate", "pochi", "adal"
)

$AllSkills = @(
    "frontend-design", "agent-browser", "agents-sdk", "cloudflare",
    "cloudflare-email-service", "durable-objects", "firebase-firestore-standard",
    "next-best-practices", "plan", "playwright", "research", "sandbox-sdk",
    "skill-creator", "nonstop-agent", "smithery-ai-cli", "turnstile-spin",
    "web-perf", "workers-best-practices", "wrangler", "writing-shape",
    "youtube-api", "youtube-full", "accidental-data-loss-prevention",
    "bigquery-data-transfer-service", "building-data-apps", "data-autocleaning",
    "dataform-bigquery", "dbt-bigquery", "developing-with-bigquery",
    "discovering-gcp-data-assets", "gcloud-auth-verification",
    "gcp-composer-troubleshooting", "gcp-data-pipelines", "gcp-dataflow",
    "gcp-pipeline-orchestration", "gcp-pipeline-resource-provisioning",
    "gcp-spark", "managing-python-dependencies", "ml-best-practices",
    "notebook-guidance", "skill-repair", "mcp-builder", "webapp-testing",
    "xlsx", "dogfood", "yuanbao"
)

function Invoke-Command {
    param([string[]]$Arguments)

    $joined = ($Arguments | ForEach-Object { "`"$($_ -replace '"', '\"')`"" }) -join " "
    Write-Host "npx $joined"

    if ($DryRun) {
        return
    }

    & npx @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: npx $joined"
    }
}

function Invoke-InstallForScope {
    param(
        [string]$Scope,
        [bool]$Global,
        [string[]]$Skills,
        [string[]]$Agents
    )

    if ($UpdateOnly) {
        $base = @("skills", "update")
        if ($Global) {
            $base += "-g"
        }
        $base += "-y"
        Invoke-Command $base
        return
    }

    if ($Individual) {
        foreach ($agent in $Agents) {
            foreach ($skill in $Skills) {
                $args = @("skills", "add", $Source)
                if ($Global) { $args += "-g" }
                if ($Copy) { $args += "--copy" }
                $args += @("-a", $agent, "-s", $skill, "-y")
                Invoke-Command $args
            }
        }
        return
    }

    foreach ($agent in $Agents) {
        $args = @("skills", "add", $Source)
        if ($Global) { $args += "-g" }
        if ($Copy) { $args += "--copy" }
        $args += @("-a", $agent)
        foreach ($skill in $Skills) {
            $args += @("-s", $skill)
        }
        $args += "-y"
        Invoke-Command $args
    }
}

if (-not $DryRun -and -not (Get-Command npx -ErrorAction SilentlyContinue)) {
    throw "npx was not found in PATH. Open a terminal where Node.js/npm is installed, then run this script again."
}

$targetAgents = if ($PSBoundParameters.ContainsKey("Agent")) { $Agent } else { $Agents }
$targetSkills = if ($PSBoundParameters.ContainsKey("Skill")) { $Skill } else { $AllSkills }

Invoke-InstallForScope -Scope "global" -Global:$true -Skills $targetSkills -Agents $targetAgents

if ($ProjectToo) {
    Invoke-InstallForScope -Scope "project" -Global:$false -Skills $targetSkills -Agents $targetAgents
}

Write-Host "Done."
