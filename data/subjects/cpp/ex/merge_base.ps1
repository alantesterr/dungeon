# Слияние новой базы C++ (сайт) с игрой: лекции + тесты. -Mode report | write
param([string]$Base, [string]$Game, [string]$Mode = 'report')
$ErrorActionPreference = 'Stop'
$U = [Text.Encoding]::UTF8; $enc = New-Object Text.UTF8Encoding($false)
function Norm([string]$s) { return (($s -replace '<tr>[\s\S]*?</tr>', '' -replace '\((repeat|повтор)\)', '' -replace '\s*\([^()]*[а-яА-ЯёЁ][^()]*\)\s*$', '') -replace '[\s ]+', ' ' -replace 'ё', 'е').Trim().ToLower() }
function StripNum([string]$t) { return ($t -replace '^\d+(\.\d+)*\.?\s+', '').Trim() }

# ---------- лекция: формат сайта -> формат игры ----------
function ConvLec([string]$txt, [int]$n, [string]$gameLec) {
  $out = New-Object Collections.Generic.List[string]
  $code = $false; $title = $null
  foreach ($raw in ($txt -replace "`r", '' -split "`n")) {
    $l = $raw.TrimEnd()
    if ($l -match '^```') { $code = -not $code; $out.Add($l); continue }
    if ($code) { $out.Add($raw.TrimEnd()); continue }
    if (-not $title -and $l -match '^## Лекция\s*\d+\.\s*(.+)$') { $title = $Matches[1]; continue }
    if ($l -match '^# ') { continue }
    if ($l -match '^## Конспект по вопросам УМКД') { $out.Add(''); $out.Add('## Конспект по вопросам УМКД'); $out.Add('Коротко по каждому вопросу УМКД — на эти разделы ссылаются тесты.'); continue }
    if ($l -match '^## (.+)$') { $out.Add(''); $out.Add('## ' + (StripNum $Matches[1])); continue }
    if ($l -match '^###\s+(.+)$') { $out.Add(''); $out.Add('## ' + (StripNum $Matches[1])); continue }
    if ($l -match '^\[На сайте[^\]]*\]$' -or $l -match '^\[[^\]]*(калькулятор|окно EWB|виджет)[^\]]*\]$') { continue }
    if ($l -match '^💡\s*\*\*(.+?)\*\*\s*(.*)$') { $t = $Matches[1] -replace '\s*·\s*', ': '; if ($t -notmatch '^[^:]{2,20}:') { $t = 'Дополнение: ' + $t }; $out.Add('! ' + $t + $(if ($Matches[2]) { ' ' + $Matches[2] } else { '' })); continue }
    if ($l -match '^💡\s*(.+)$') { $out.Add('! Дополнение: ' + $Matches[1]); continue }
    if ($l -match '^⚠\s*\*\*(.+?)\*\*\s*(.*)$') { $out.Add('! Поправка: ' + $Matches[1] + $(if ($Matches[2]) { ' — ' + $Matches[2] } else { '' })); continue }
    if ($l -match '^⚠\s*(.+)$') { $out.Add('! Поправка: ' + $Matches[1]); continue }
    if ($l -match '^❗\s*(.+)$') { $out.Add('! Ловушка: ' + $Matches[1]); continue }
    if ($l -match '^\|[-:| ]+\|$') { continue }
    $out.Add($l)
  }
  # из старой лекции игры: «Цель и план лекции (УМКД)» — в начало; ручные дополнения (Дополнение:, Задания СРО, Разбор…) — в конец
  $keep = @{}; $cur = $null; $order = @()
  foreach ($l in ($gameLec -replace "`r", '' -split "`n")) {
    if ($l -match '^## (.+)$') { $cur = $Matches[1].Trim(); $order += $cur; $keep[$cur] = New-Object Collections.Generic.List[string]; continue }
    if ($cur) { $keep[$cur].Add($l) }
  }
  $newTitles = @{}; foreach ($l in $out) { if ($l -match '^## (.+)$') { $newTitles[(Norm (StripNum $Matches[1]))] = 1 } }
  $head = New-Object Collections.Generic.List[string]
  $head.Add('Лекция ' + $n + '. ' + $title); $head.Add('')
  $tail = New-Object Collections.Generic.List[string]
  $script:moved = @()
  foreach ($t in $order) {
    $nt = Norm (StripNum $t)
    $isPlan = $t -match '^Цель и план'
    $isHand = $t -match '^(Дополнение|Задания СРО|Разбор|Шпаргалка|Лабораторн|Формулировки из теста)'
    if ($newTitles.ContainsKey($nt)) { continue }
    if ($isPlan) { $head.Add('## ' + $t); $keep[$t] | % { $head.Add($_) }; $head.Add(''); $script:moved += ('+plan ' + $t) }
    elseif ($isHand) { $tail.Add(''); $tail.Add('## ' + $t); $keep[$t] | % { $tail.Add($_) }; $script:moved += ('+tail ' + $t) }
    else { $tail.Add(''); $tail.Add('## ' + $t); $keep[$t] | % { $tail.Add($_) }; $script:moved += ('+keep ' + $t) }
  }
  $all = @($head) + @($out) + @($tail)
  return (($all -join "`n") -replace "`n{3,}", "`n`n").Trim() + "`n"
}

# ---------- тесты ----------
function ParseT([string]$txt) {
  $items = @()
  foreach ($blk in ([regex]::Split($txt, '(?m)^(?=<question>)'))) {
    if ($blk -notmatch '^<question>') { continue }
    $ex = ''; if ($blk -match '<explain>([\s\S]*?)</explain>') { $ex = $Matches[1] }
    $body = ($blk -replace '<explain>[\s\S]*?</explain>', '').TrimEnd()
    $parts = [regex]::Split($body, '<(?:variantright|variant)>')
    $q = $parts[0] -replace '^<question>\s*', ''
    $right = ''; if ($body -match '<variantright>\s*([^\r\n]*)') { $right = $Matches[1] }
    $items += [pscustomobject]@{ body = $body; ex = $ex; key = (Norm $q) + '||' + (Norm $right); qn = Norm $q }
  }
  return $items
}
$report = New-Object Collections.Generic.List[string]
foreach ($i in 1..15) {
  $nn = '{0:D2}' -f $i
  $bl = [IO.File]::ReadAllText((Join-Path $Base "l$nn.txt"), $U); $gl = [IO.File]::ReadAllText((Join-Path $Game "l$nn.txt"), $U)
  $newLec = ConvLec $bl $i $gl
  $secs = @{}; foreach ($l in ($newLec -split "`n")) { if ($l -match '^## (.+)$') { $secs[(Norm $Matches[1])] = $Matches[1] } }
  $bt = ParseT ([IO.File]::ReadAllText((Join-Path $Base "t$nn.txt"), $U)); $gt = ParseT ([IO.File]::ReadAllText((Join-Path $Game "t$nn.txt"), $U))
  $bk = @{}; foreach ($b in $bt) { $bk[$b.key] = $b }; $bq = @{}; foreach ($b in $bt) { if (-not $bq.ContainsKey($b.qn)) { $bq[$b.qn] = $b } }
  $used = @{}; $res = New-Object Collections.Generic.List[string]; $same = 0; $gameOnly = 0; $badRef = 0
  foreach ($g in $gt) {
    $b = $bk[$g.key]; if (-not $b -and $bq.ContainsKey($g.qn)) { $b = $bq[$g.qn] }
    if ($b -and -not $used[$b.key]) {
      $used[$b.key] = 1; $same++
      $ex = $b.ex
    } else {
      $gameOnly++; $ex = $g.ex; $report.Add("   ИГРА: " + $g.body.Substring(0,[Math]::Min(150,$g.body.Length)).Replace("`n"," / "))
    }
    # «По лекции: … раздел «N. Заголовок»» -> заголовок без номера, если такой раздел есть
    $ex = [regex]::Replace($ex, '«([^»]+)»', { param($m) $t = StripNum $m.Groups[1].Value; if ($secs.ContainsKey((Norm $t))) { '«' + $secs[(Norm $t)] + '»' } else { $m.Value } })
    if ($ex -match 'По лекции:[^\n]*«([^»]+)»') { if (-not $secs.ContainsKey((Norm $Matches[1]))) { $badRef++ } }
    $res.Add($g.body + "`n<explain>" + $ex.Trim() + "</explain>`n")
  }
  $added = 0
  foreach ($b in $bt) { if (-not $used[$b.key]) { $added++; if ($Mode -eq "dbg") { $report.Add("   БАЗА: " + $b.body.Substring(0,[Math]::Min(150,$b.body.Length)).Replace("`n"," / ")) }; $ex = $b.ex; if ($ex -match 'По лекции:[^\n]*«([^»]+)»') { if (-not $secs.ContainsKey((Norm $Matches[1]))) { $badRef++ } }; $res.Add($b.body + "`n<explain>" + $ex.Trim() + "</explain>`n") } }
  $report.Add("t$nn  игра=$($gt.Count) база=$($bt.Count)  совпало=$same  только-игра=$gameOnly  добавлено=$added  итого=$($res.Count)  ссылок-мимо=$badRef  | лекция: " + ($script:moved -join '; '))
  if ($Mode -eq 'write') {
    [IO.File]::WriteAllText((Join-Path $Game "l$nn.txt"), $newLec, $enc)
    [IO.File]::WriteAllText((Join-Path $Game "t$nn.txt"), ($res -join "`n"), $enc)
  }
}
$report
