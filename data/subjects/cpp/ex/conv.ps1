param([string]$Src, [string]$Out)
# Конвертер: большой txt «лекции 1-15, вопросы УМКД и тесты» -> data/subjects/cpp (lNN.txt, tNN.txt, topics.json)
$enc = New-Object Text.UTF8Encoding $false
$lines = [IO.File]::ReadAllLines($Src, [Text.Encoding]::UTF8)
New-Item -ItemType Directory -Force $Out | Out-Null
$cyr = '[А-Яа-яЁё]'

# --- разбить на лекции и секции ---
$lec = @{}; $titles = @{}; $cur = 0; $sec = ''
for ($i = 0; $i -lt $lines.Length; $i++) {
  $l = $lines[$i]
  if ($l -cmatch '^ЛЕКЦИЯ (\d+)\. (.+)$') { $cur = [int]$matches[1]; $titles[$cur] = $matches[2].Trim(); $lec[$cur] = @{ th = New-Object System.Collections.ArrayList; um = New-Object System.Collections.ArrayList; ts = New-Object System.Collections.ArrayList }; $sec = ''; continue }
  if ($l -cmatch '^-{5,} ЛЕКЦИЯ \d+: (ТЕОРИЯ|ВОПРОСЫ УМКД|ТЕСТЫ)') { $sec = @{ 'ТЕОРИЯ' = 'th'; 'ВОПРОСЫ УМКД' = 'um'; 'ТЕСТЫ' = 'ts' }[$matches[1]]; continue }
  if ($l -match '^={5,}$') { continue }
  if ($cur -and $sec) { [void]$lec[$cur][$sec].Add($l) }
}

$LatFix = @{ 'C++BUILDER' = 'C++Builder'; 'BORLAND' = 'Borland'; 'UNIT1.H' = 'Unit1.h'; 'TOBJECT' = 'TObject'; 'SHOWMODAL' = 'ShowModal'; 'SHOW' = 'Show'; 'CLOSE' = 'Close'; 'HIDE' = 'Hide'; 'BUTTON' = 'Button'; 'EDIT' = 'Edit'; 'LABEL' = 'Label'; 'ESCAPE' = 'Escape'; 'ENUM' = 'enum'; 'VIRTUAL' = 'virtual'; 'PUBLIC' = 'public'; 'PROTECTED' = 'protected'; 'PRIVATE' = 'private'; '__PROPERTY' = '__property'; 'GET' = 'get'; 'SET' = 'set'; 'WHILE' = 'while'; 'SWITCH' = 'switch'; 'STRING' = 'string'; 'IF' = 'if'; 'GOTO' = 'goto'; 'FOR' = 'for'; 'DO' = 'do'; 'ELSE' = 'else'; 'CHAR' = 'char'; 'BREAK' = 'break'; 'CONTINUE' = 'continue'; 'RETURN' = 'return'; 'CONST' = 'const'; 'INLINE' = 'inline'; 'CLASS' = 'class'; 'NEW' = 'new'; 'DELETE' = 'delete'; 'THIS' = 'this'; 'STATIC' = 'static'; 'TFORM' = 'TForm'; 'TIMER' = 'Timer'; 'MEMO' = 'Memo' }
function TitleCase([string]$s) { $s = [regex]::Replace($s, '[А-ЯЁ]', { param($m) $m.Value.ToLower() }); $s = [regex]::Replace($s, '(?<![A-Za-z0-9_])[A-Z][A-Z0-9+_.]*[A-Z0-9+.]', { param($m) $v = $m.Value; $k = $v.TrimEnd('.'); if ($LatFix.ContainsKey($k)) { $LatFix[$k] + $v.Substring($k.Length) } else { $v } }); $s = $s.Replace('__PROPERTY', '__property'); foreach ($a in 'МГУ','УМКД','ООП','СРС','ЭВМ','ИКТ','РК') { $s = [regex]::Replace($s, '(?<![а-яё])' + $a.ToLower() + '(?![а-яё])', $a) }; if ($s.Length) { return $s.Substring(0,1).ToUpper() + $s.Substring(1) } return $s }
function IsCode([string]$raw) {
  $t = $raw.Trim(); if (-not $t -or $raw -match "`t") { return $false }
  if ($t -match '^[└├│]' -or $raw -match '^TObject\s{3,}') { return $true }
  $x = $t -replace '/\*.*?\*/', '' -replace '//.*$', '' -replace '"[^"]*"', '""' -replace "'[^']*'", "''"
  if ($x -match $cyr) { return $false }
  if (([regex]::Matches($x, '[A-Za-z]{3,}')).Count -ge 8 -and $x -notmatch '::|->|;\s*$|[{}]|^\s*(void|int|bool|class|double|char|float|long)\b') { return $false }
  if ($x -match '^\s*$') { return ($t -match '^//') }
  if ($x -match '[;{}]' -or $x -match '^#' -or $x -match '^(int|void|class|struct|enum|for|while|if|else|return|cout|cin|double|char|float|bool|const|public:|private:|protected:|__published:|__property|case |default:|switch|do\b|DYNAMIC|__fastcall|PACKAGE|namespace|template|typedef|unsigned|long|short)') { return $true }
  return $false
}

# --- лекция -> разметка parseLecture (## раздел, абзацы, - пункт, | таблица |, ```код```, ! заметка) ---
function LTok([string]$s) {
  $set = @{}; $s = $s.ToLower()
  $stop = @{ 'the'=1; 'and'=1; 'what'=1; 'how'=1; 'this'=1; 'что'=1; 'такое'=1; 'это'=1; 'какие'=1; 'когда'=1; 'зачем'=1; 'чтобы'=1; 'можно'=1; 'нужно'=1; 'котор'=1; 'основн'=1; 'други'=1; 'других'=1; 'только'=1; 'между'=1; 'разниц'=1 }
  foreach ($m in [regex]::Matches($s, '[a-z_][a-z0-9_+]{1,}')) { if (-not $stop[$m.Value]) { $set[$m.Value] = 2 } }
  foreach ($m in [regex]::Matches($s, '[а-яё]{4,}')) { $w = $m.Value; if ($w.Length -gt 6) { $w = $w.Substring(0, 6) }; if (-not $stop[$w]) { $set[$w] = 1 } }
  return $set
}
function LoadRu {
  $map = @{}; $f = Join-Path $Out 'ex\ru.txt'; if (-not (Test-Path $f)) { return $map }
  $old = $null
  foreach ($l in [IO.File]::ReadAllLines($f, [Text.Encoding]::UTF8)) {
    if ($l -match '^= (.*)$') { $old = $matches[1].Trim() } elseif ($l -match '^>\s?(.*)$' -and $null -ne $old) { $map[$old] = $matches[1].Trim(); $old = $null }
  }
  return $map
}
$RuMap = LoadRu
$UmPlace = @(); $pf = Join-Path $Out 'ex\umkd_place.txt'; if (Test-Path $pf) { foreach ($l in [IO.File]::ReadAllLines($pf, [Text.Encoding]::UTF8)) { if ($l -match '^\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*$') { $UmPlace += , @([int]$matches[1], $matches[2], $matches[3]) } } }
function IsEnProse([string]$t) {
  if (-not $t -or $t -match '^(\||- |\*\*|##|!|```)') { return $false }
  $en = ([regex]::Matches($t, '[A-Za-z][A-Za-z''-]{2,}')).Count; $ru = ([regex]::Matches($t, '[А-Яа-яЁё]{2,}')).Count
  return ($en -ge 5 -and $en -gt $ru * 2)
}
function IsRuProse([string]$t) {
  if (-not $t -or $t -match '^(\||- |##|!|```)') { return $false }
  $en = ([regex]::Matches($t, '[A-Za-z][A-Za-z''-]{2,}')).Count; $ru = ([regex]::Matches($t, '[А-Яа-яЁё]{2,}')).Count
  return ($ru -ge 3 -and $ru -ge $en)
}
function ConvLecture($n) {
  $o = New-Object System.Collections.ArrayList; $umItems = New-Object System.Collections.ArrayList; $srs = New-Object System.Collections.ArrayList
  $th = $lec[$n].th; $mode = ''; $code = $false; $tbl = $false; $planN = 0
  [void]$o.Add('Лекция ' + $n + '. ' + $titles[$n]); [void]$o.Add('')
  $started = $false
  foreach ($raw in $th) {
    $t = $raw.Trim()
    if ($t -match '^О МАТЕРИАЛАХ') { continue }
    if ($mode -eq 'skipEn') { if (-not $t -or ($t -notmatch $cyr)) { continue } else { $mode = '' } }
    if ($t -match '^Оригинал') { $mode = 'skipEn'; continue }
    # код: строка-код, а внутри блока кода — любая строка без кириллицы (try, catch, WINAPI WinMain(…), { })
    $plain = $t -replace '/\*.*?\*/', '' -replace '//.*$', '' -replace '"[^"]*"', '""' -replace "'[^']*'", "''"
    if ((IsCode $raw) -or ($code -and $t -and $raw -notmatch "`t" -and $plain -notmatch $cyr -and ([regex]::Matches($plain, '[A-Za-z]{3,}')).Count -lt 8)) {
      if (-not $code) { $tbl = $false; [void]$o.Add('```'); $code = $true }
      [void]$o.Add($raw.TrimEnd()); continue
    } elseif ($code) { if (-not $t) { continue }; [void]$o.Add('```'); $code = $false }
    if (-not $t) { [void]$o.Add(''); $tbl = $false; if ($mode -eq 'plan' -and $planN -gt 0) { $mode = '' }; continue }
    if ($t -match '^Лекция \d+\.' -and -not $started) { continue }
    if ($t -match '^Цель:') { [void]$o.Add('## Цель и план лекции (УМКД)'); [void]$o.Add($t); $started = $true; continue }
    if ($t -match '^Основные пункты[^:]*:\s*(.*)$') { $rest = $matches[1].Trim(); [void]$o.Add('**Основные пункты лекции:**'); $planN = 0; if ($rest) { foreach ($p in ($rest.TrimEnd('.') -split ';\s*')) { $p = $p.Trim(); if ($p) { [void]$o.Add('- ' + $p.Substring(0,1).ToUpper() + $p.Substring(1)) } } } else { $mode = 'plan' }; continue }
    if ($t -match '^\d{1,2}\.\s+\S' -and $t.Length -le 90 -and $t -notmatch ' — ' -and $t -notmatch ':$' -and $t -match $cyr) { $mode = ''; [void]$o.Add(''); [void]$o.Add('## ' + $t); $started = $true; continue }
    if ($t -match '^Вопросы УМКД к теме') { $mode = 'umkd'; continue }
    if ($t -match '^СРС К ТЕМЕ') { $mode = 'srs'; continue }
    if ($mode -eq 'umkd' -and $t -match '^ОТВЕТЫ\s*·') { continue }
    if ($t -match '^(ДОПОЛНЕНИЕ|ОТВЕТЫ|ПРИМЕР|ВАЖНО|ЛАБА|ЗАДАНИЕ)\s*·\s*(.+)$') { $tt = TitleCase $matches[2]; $prev = ($o | Where-Object { $_ -ne '' } | Select-Object -Last 1); if ($prev -match '^## ') { [void]$o.Add('**' + $tt + '**') } else { $mode = ''; [void]$o.Add(''); [void]$o.Add('## ' + $tt) }; $tbl = $false; continue }
    if ($mode -eq 'umkd') { if ($t -match '^([^—]+\?[^—]*?)\s+—\s+(.+)$') { [void]$umItems.Add(@($matches[1].Trim(), $matches[2].Trim())) }; continue }
    if ($mode -eq 'srs') { [void]$srs.Add($t); continue }
    if ($t -cnotmatch '[a-zа-яё]' -and $t -match $cyr -and $t.Length -gt 3) { [void]$o.Add('**' + (TitleCase $t) + '**'); continue }
    if ($raw -match "`t") { $cells = $t -split "`t"; [void]$o.Add('| ' + (($cells | ForEach-Object { $_.Trim() }) -join ' | ') + ' |'); $tbl = $true; continue }
    $tbl = $false
    if ($mode -eq 'plan') { [void]$o.Add('- ' + $t); $planN++; continue }
    [void]$o.Add($t)
  }
  if ($code) { [void]$o.Add('```') }
  # вопросы УМКД (лекции 2–15 — отдельная часть исходника) и СРС
  $m2 = ''
  foreach ($raw in $lec[$n].um) {
    $t = $raw.Trim(); if (-not $t) { continue }
    if ($t -match '^СРС К ТЕМЕ') { $m2 = 'srs'; continue }
    if ($m2 -eq 'srs') { [void]$srs.Add($t); continue }
    if ($t -match '^\d+\.\s+(.+?)\s+—\s+(.+)$') { [void]$umItems.Add(@($matches[1].Trim(), $matches[2].Trim())) }
  }
  # дополнение к лекции (ex\addNN.txt) — в конец лекции
  $af = Join-Path $Out ('ex\add{0:D2}.txt' -f $n)
  if (Test-Path $af) { [void]$o.Add(''); foreach ($l in ([IO.File]::ReadAllText($af, [Text.Encoding]::UTF8).Trim() -split "`n")) { [void]$o.Add($l.TrimEnd()) } }
  # русские замены (ex\ru.txt), «Для теста на английском» → «Формулировки из теста»
  for ($k = $o.Count - 1; $k -ge 0; $k--) {
    $l = $o[$k].Trim()
    if ($RuMap.ContainsKey($l)) { if ($RuMap[$l]) { $o[$k] = $RuMap[$l] } else { $o.RemoveAt($k) }; continue }
    if ($l -match '^(##|\*\*)\s*Для теста на английском') { $o[$k] = $o[$k] -replace 'Для теста на английском', 'Формулировки из теста (англ. — с переводом)' }
  }
  # пары «английское определение → русский перевод»: русский — основной текст, английский — заметкой «Как в тесте»
  $inCode = $false
  for ($k = 0; $k -lt $o.Count; $k++) {
    if ($o[$k] -match '^```') { $inCode = -not $inCode; continue }
    if ($inCode -or -not (IsEnProse $o[$k].Trim())) { continue }
    $j = $k + 1; while ($j -lt $o.Count -and -not $o[$j].Trim()) { $j++ }
    if ($j -lt $o.Count -and (IsRuProse $o[$j].Trim())) { $en = $o[$k].Trim(); $o[$k] = $o[$j]; $o[$j] = '! Как в тесте: ' + $en; $k = $j } else { $script:enLeft += ("l{0:D2}: " -f $n) + $o[$k].Trim().Substring(0, [Math]::Min(80, $o[$k].Trim().Length)) }
  }
  # вопросы УМКД — внутрь самых подходящих разделов (в конец раздела, заметкой «Вопрос УМКД»)
  $secs = @(); for ($k = 0; $k -lt $o.Count; $k++) { if ($o[$k] -match '^## (.+)$') { $secs += , @($k, $matches[1]) } }
  $secTok = @{}; $secEnd = @{}
  for ($s = 0; $s -lt $secs.Count; $s++) {
    $a = $secs[$s][0]; $b = $(if ($s + 1 -lt $secs.Count) { $secs[$s + 1][0] } else { $o.Count })
    $secEnd[$s] = $b; $secTok[$s] = LTok (($o[$a..($b - 1)]) -join ' ')
  }
  $bucket = @{}
  foreach ($it in $umItems) {
    $qt = LTok ($it[0] + ' ' + $it[0] + ' ' + $it[1]); $best = -1; $bs = -1
    foreach ($pl in $UmPlace) { if ($pl[0] -eq $n -and $it[0].StartsWith($pl[1])) { for ($s = 0; $s -lt $secs.Count; $s++) { if ($secs[$s][1].StartsWith($pl[2])) { $best = $s; $bs = 999; break } } } }
    for ($s = 0; $s -lt $secs.Count; $s++) {
      if ($bs -eq 999) { break }; if ($secs[$s][1] -match '^(Цель и план|Формулировки из теста|Определения ООП)') { continue }
      $sc = 0; foreach ($w in $qt.Keys) { if ($secTok[$s].ContainsKey($w)) { $sc += $qt[$w] } }
      if ($sc -gt $bs) { $bs = $sc; $best = $s }
    }
    if (-not $bucket.ContainsKey($best)) { $bucket[$best] = New-Object System.Collections.ArrayList }
    [void]$bucket[$best].Add('! Вопрос УМКД: **' + $it[0] + '** — ' + $it[1])
    $script:umLog += ("тема {0}: «{1}» → «{2}»" -f $n, $it[0], $secs[$best][1])
  }
  foreach ($s in ($bucket.Keys | Sort-Object -Descending)) {
    $ins = $secEnd[$s]; while ($ins -gt 0 -and -not $o[$ins - 1].Trim()) { $ins-- }
    $o.Insert($ins, ''); $o.InsertRange($ins + 1, $bucket[$s])
  }
  # СРС — в конец
  if ($srs.Count) { [void]$o.Add(''); [void]$o.Add('## СРС к теме ' + $n + ' — что сдать'); foreach ($l in $srs) { [void]$o.Add('- ' + $l) } }
  $txt = ($o -join "`n") -replace "`n{3,}", "`n`n"
  return $txt.Trim() + "`n"
}

# --- перевод в скобках в конце строки: «EN text (RU текст)» -> EN, RU ---
function SplitTr([string]$s) {
  $s = $s.Trim()
  if (-not $s.EndsWith(')')) { return @($s, '') }
  $depth = 0
  for ($k = $s.Length - 1; $k -ge 0; $k--) {
    $c = $s[$k]
    if ($c -eq ')') { $depth++ } elseif ($c -eq '(') { $depth--; if ($depth -eq 0) { break } }
  }
  if ($k -lt 1) { return @($s, '') }
  $inner = $s.Substring($k + 1, $s.Length - $k - 2); $head = $s.Substring(0, $k).Trim()
  if ($inner -match $cyr -and $head -match '[A-Za-z0-9`"''#]' -and ($head -notmatch $cyr)) { return @($head, $inner.Trim()) }
  return @($s, '')
}

function LoadEx($n) {
  $m = @{}; $f = Join-Path $Out ('ex\ex{0:D2}.txt' -f $n); if (-not (Test-Path $f)) { return $m }
  $cur = 0; $buf = @()
  foreach ($l in [IO.File]::ReadAllLines($f, [Text.Encoding]::UTF8)) { if ($l -match '^#(\d+)\s*$') { if ($cur) { $m[$cur] = ($buf -join "`n").Trim() }; $cur = [int]$matches[1]; $buf = @() } else { $buf += $l } }
  if ($cur) { $m[$cur] = ($buf -join "`n").Trim() }
  return $m
}
function ConvTests($n) {
  $o = New-Object System.Collections.ArrayList; $q = $null; $inCode = $false; $exm = LoadEx $n; $qi = 0
  $flush = {
    if ($q) {
      [void]$o.Add('<question> ' + ($q.qt -join "`n"))
      if ($q.tr) { [void]$o.Add('<tr>' + $q.tr + '</tr>') }
      foreach ($op in $q.opts) { [void]$o.Add(($(if ($op.r) { '<variantright> ' } else { '<variant> ' })) + $op.t + $(if ($op.tr) { ' <tr>' + $op.tr + '</tr>' } else { '' })) }
      $script:qi2++; $e = $exm[$script:qi2]; if (-not $e) { $e = $q.ex; if ($e) { $script:noEx += 0 } else { $script:noEx++ } }
      if ($e) { [void]$o.Add('<explain>' + $e + '</explain>') }
      [void]$o.Add('')
    }
  }
  foreach ($raw in $lec[$n].ts) {
    $t = $raw.Trim()
    if ($t -match '^Источники:') { continue }
    if ($q -and $raw -match '^```') { $q.qt += $raw.TrimEnd(); $inCode = -not $inCode; continue }
    if ($inCode) { $q.qt += $raw.TrimEnd(); continue }
    if ($raw -match '^(\d+)\.\s+(.+)$' -and -not ($q -and $q.opts.Count -eq 0 -and $q.qt.Count -gt 1)) {
      & $flush
      $p = SplitTr ($matches[2] -replace '\s*\(repeat\)', '' -replace '\s*\(повтор\)', '')
      $q = @{ num = [int]$matches[1]; qt = @($p[0]); tr = $p[1]; opts = New-Object System.Collections.ArrayList; ex = '' }
      continue
    }
    if (-not $q) { continue }
    if ($raw -match '^\s+(✔|•)\s*(.*)$') { $p = SplitTr $matches[2]; [void]$q.opts.Add(@{ r = ($matches[1] -eq '✔'); t = $p[0]; tr = $p[1] }); continue }
    if ($t -match '^Пояснение:\s*(.+)$') { $q.ex = $matches[1]; continue }
    if ($t -and $q.opts.Count -eq 0) { $q.qt += $raw.TrimEnd() }
  }
  & $flush
  $uf = Join-Path $Out ('ex\umkd{0:D2}.txt' -f $n); if (Test-Path $uf) { [void]$o.Add(''); [void]$o.Add([IO.File]::ReadAllText($uf, [Text.Encoding]::UTF8).Trim()) }
  return (($o -join "`n").Trim() + "`n")
}

$topics = @()
$script:noEx = 0; $script:enLeft = @(); $script:umLog = @()
foreach ($n in ($lec.Keys | Sort-Object)) {
  $script:qi2 = 0
  $nn = '{0:D2}' -f $n
  [IO.File]::WriteAllText((Join-Path $Out "l$nn.txt"), (ConvLecture $n), $enc)
  [IO.File]::WriteAllText((Join-Path $Out "t$nn.txt"), (ConvTests $n), $enc)
  $rk = $(if ($n -le 6) { 1 } else { 2 })
  $topics += [ordered]@{ n = $n; rk = $rk; title = $titles[$n]; file = "t$nn.txt"; lecture = "l$nn.txt" }
}
$meta = [ordered]@{ id = 'cpp'; title = 'C++ (ООП)'; note = 'Программирование C++ (Borland C++Builder 6): 15 тем УМКД. Вопросы — база 417 тестов (английский оригинал, перевод в <tr>), пояснения в <explain>. Лекции lNN.txt — по плану УМКД с ответами на вопросы УМКД. РК1 — темы 1–6, РК2 — темы 7–14, экзамен — 1–15.'; units = @(@(1, 6, 'Темы 1–6 · основы C++', 'Алгоритмы, операции, ветвления и циклы, массивы, функции, строки'), @(7, 15, 'Темы 7–15 · ООП и C++Builder', 'ООП, классы, C++Builder: формы, события, иерархия, конструкторы, свойства, компоненты'), @(17, 17, 'Практика', 'Пишем код: задания по темам, по порядку')); topics = $topics }
[IO.File]::WriteAllText((Join-Path $Out 'topics.json'), ($meta | ConvertTo-Json -Depth 6), $enc)
'ok ' + $lec.Keys.Count + ' без пояснения: ' + $script:noEx
[IO.File]::WriteAllLines((Join-Path $env:TEMP 'cpp_umkd_log.txt'), [string[]]($script:umLog + '--- английский без перевода:' + $script:enLeft), (New-Object Text.UTF8Encoding $false))
