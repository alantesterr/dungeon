# Конвертер: учебник «Философия» из StudyPlay (data/philo) → предмет игры (data/subjects/phil)
# lecture.md → lNN.txt (16 тем), questions.json → tNN.txt (500 тестов с пояснениями и «По лекции»), topics.json
param([string]$Src, [string]$Out)
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
$lines = [System.IO.File]::ReadAllLines((Join-Path $Src 'lecture.md'), [System.Text.Encoding]::UTF8)

$topics = @{}      # N -> title
$lec = @{}         # N -> List[string]
$anchorSec = @{}   # anchor id -> @(N, sectionTitle)
$cur = 0; $sec = $null; $pendingAnchor = @()
function Clean([string]$s) { return ($s -replace '\s*\{#[^}]+\}\s*$', '').TrimEnd() }

foreach ($raw in $lines) {
  $l = $raw.TrimEnd()
  if ($l -match '^# Тема (\d+)\.\s*(.+?)\s*\{#t\d+\}\s*$') {
    $cur = [int]$Matches[1]; $topics[$cur] = $Matches[2].Trim()
    $lec[$cur] = New-Object System.Collections.Generic.List[string]
    $lec[$cur].Add("Лекция $cur. " + $topics[$cur]); $lec[$cur].Add('')
    $sec = $null; $intro = New-Object System.Collections.Generic.List[string]; $pendingAnchor = @(); continue
  }
  if ($cur -eq 0) { continue }
  $LL = $lec[$cur]
  if ($l -match '^\{#([^}]+)\}$') {   # якорь абзаца — запомним, к какому разделу он относится
    $id = $Matches[1]
    if (-not $sec) { $pendingAnchor += $id } else { $anchorSec[$id] = @($cur, $sec) }
    continue
  }
  if ($l -match '^## (.+)$') {
    $title = (Clean $Matches[1]) -replace '^\d+\.\d+\s+', ''   # номер раздела игра ставит сама
    if ($raw -match '\{#([^}]+)\}') { $anchorSec[$Matches[1]] = @($cur, $title) }
    foreach ($p in $pendingAnchor) { $anchorSec[$p] = @($cur, $title) }; $pendingAnchor = @()
    $sec = $title; $LL.Add(''); $LL.Add('## ' + $title)
    if ($intro.Count) { $LL.Add('! Коротко: ' + ((($intro -join ' ') -replace '^Коротко:\s*', '').Trim())); $intro = New-Object System.Collections.Generic.List[string] }
    continue
  }
  if (-not $sec) { if ($l.Trim()) { $intro.Add($l.Trim()) }; continue }   # вступление темы — заметкой «Коротко» в первый раздел
  if ($l -match '^\|[-:| ]+\|$') { continue }                   # разделитель таблицы
  if ($l -match '^> ⚠️\s*(.*)$') { $t = $Matches[1]; if ($t -notmatch '^[^:]{2,20}:') { $t = 'Ловушка: ' + $t }; $LL.Add('! ' + $t); continue }
  if ($l -match '^> 💡\s*(.*)$') { $t = $Matches[1]; if ($t -notmatch '^[^:]{2,20}:') { $t = 'Запомни: ' + $t }; $LL.Add('! ' + $t); continue }
  if ($l -match '^> 👤\s*(.*)$') { $LL.Add('! Личность: ' + $Matches[1]); continue }
  if ($l -match '^>\s?(.*)$') { $LL.Add('! Запомни: ' + $Matches[1]); continue }
  $LL.Add($l)
}

New-Item -ItemType Directory -Force $Out | Out-Null
$nums = $topics.Keys | Sort-Object
foreach ($n in $nums) {
  $txt = ($lec[$n] -join "`n") -replace "`n{3,}", "`n`n"
  [System.IO.File]::WriteAllText((Join-Path $Out ('l{0:D2}.txt' -f $n)), $txt.Trim() + "`n", $utf8)
}

# --- тесты ---
$j = [System.IO.File]::ReadAllText((Join-Path $Src 'questions.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
$byT = @{}
foreach ($it in $j.items) {
  $n = [int]($it.t -replace 't', '')
  if (-not $byT[$n]) { $byT[$n] = New-Object System.Collections.Generic.List[string] }
  $T = $byT[$n]
  $T.Add('<question> ' + $it.q)
  for ($i = 0; $i -lt $it.o.Count; $i++) { if ($i -eq 0) { $T.Add('<variantright> ' + $it.o[$i]) } else { $T.Add('<variant> ' + $it.o[$i]) } }
  $ex = New-Object System.Collections.Generic.List[string]
  $ex.Add('Ответ: ' + $it.o[0] + '.')
  if ($it.k) { $ex.Add($it.k) }
  if ($it.y) { $ex.Add($it.y) }
  $why = @(); for ($i = 1; $i -lt $it.o.Count; $i++) { if ($it.e -and $it.e[$i]) { $why += ('— «' + $it.o[$i] + '»: ' + $it.e[$i]) } }
  if ($why.Count) { $ex.Add('Почему не другие:'); foreach ($w in $why) { $ex.Add($w) } }
  $ref = $null
  foreach ($a in @($it.l)) { if ($anchorSec.ContainsKey($a)) { $ref = $anchorSec[$a]; break } }
  if ($ref) { $ex.Add('По лекции: тема ' + $ref[0] + ', раздел «' + $ref[1] + '».') }
  $T.Add('<explain>' + ($ex -join "`n") + '</explain>')
  $T.Add('')
}
$miss = 0
foreach ($n in $nums) {
  if (-not $byT[$n]) { $miss++; continue }
  [System.IO.File]::WriteAllText((Join-Path $Out ('t{0:D2}.txt' -f $n)), ($byT[$n] -join "`n"), $utf8)
}

# --- topics.json ---
$tp = @()
foreach ($n in $nums) { $tp += [ordered]@{ n = [int]$n; rk = 1; title = $topics[$n]; file = ('t{0:D2}.txt' -f $n); lecture = ('l{0:D2}.txt' -f $n) } }
$meta = [ordered]@{
  id = 'phil'; title = 'Философия'
  note = 'Учебник и 500 тестов из StudyPlay (data/philo: lecture.md + questions.json). Собрано скриптом philconv.ps1: у каждого теста пояснение, разбор неверных вариантов и «По лекции: тема N, раздел …».'
  units = @(, @(1, 16, 'Темы 1–16', 'Весь курс философии: от истоков мышления до истории философии'))
  topics = $tp
}
[System.IO.File]::WriteAllText((Join-Path $Out 'topics.json'), ($meta | ConvertTo-Json -Depth 5), $utf8)
"topics: " + $nums.Count + "  anchors: " + $anchorSec.Count + "  questions: " + $j.items.Count
