param([string]$Src, [string]$Out, [string]$Umkd)
# Конвертер: «Архитектура ЭВМ — лекции, вопросы УМКД и тесты.txt» -> data/subjects/arch (lNN.txt, tNN.txt, topics.json)
# Дописанное вручную — в $Out\ex: ru.txt (замены строк), sh.txt (перевод шпаргалок), addNN.txt (дополнения лекций),
# exNN.txt (свои пояснения), extraNN.txt (доп. тесты, например с картинками), umkd_place.txt.
$enc = New-Object Text.UTF8Encoding $false
$lines = [IO.File]::ReadAllLines($Src, [Text.Encoding]::UTF8)
New-Item -ItemType Directory -Force $Out | Out-Null
$cyr = '[А-Яа-яЁё]'

# перевод шпаргалок «для теста на английском»: EN<TAB>перевод<TAB>ответ по-русски
$Sh = @{}; $shf = Join-Path $Out 'ex\sh.txt'
if (Test-Path $shf) { foreach ($l in [IO.File]::ReadAllLines($shf, [Text.Encoding]::UTF8)) { $p = $l -split "`t"; if ($p.Count -ge 3 -and $l -notmatch '^#') { $Sh[$p[0].Trim()] = @($p[1].Trim(), $p[2].Trim(), $(if ($p.Count -ge 4) { $p[3].Trim() } else { '' })) } } }
$script:shMiss = @()

# --- разбить на лекции и секции ---
$lec = @{}; $titles = @{}; $cur = 0; $sec = ''; $inSh = $false; $umQ = $null
for ($i = 0; $i -lt $lines.Length; $i++) {
  $l = $lines[$i]
  if ($l -cmatch '^ЛЕКЦИЯ (\d+)\. (.+)$') { $cur = [int]$matches[1]; $titles[$cur] = $matches[2].Trim(); $lec[$cur] = @{ th = New-Object System.Collections.ArrayList; um = New-Object System.Collections.ArrayList; ts = New-Object System.Collections.ArrayList; umRaw = New-Object System.Collections.ArrayList }; $sec = 'th'; continue }
  if ($l -cmatch '^ВОПРОСЫ УМКД К ТЕМЕ') { $sec = 'um'; continue }
  if ($l -cmatch '^ТЕСТЫ ТЕМЫ') { $sec = 'ts'; continue }
  if ($l -match '^[=-]{5,}$') { continue }
  if (-not $cur -or -not $sec) { continue }
  if ($sec -eq 'um') {
    if ($l -match '^\d+\.\s+(.+)$') { $umQ = $matches[1].Trim(); $ra = $umQ; if ($ra -match '^[^?]{3,140}\?\s+(.+)$') { $ra = $matches[1] }; [void]$lec[$cur].umRaw.Add($ra.Substring(0,1).ToUpper() + $ra.Substring(1)); continue }
    if ($l -match '^\s+Ответ:\s*(.+)$' -and $umQ) { [void]$lec[$cur].um.Add(('{0}. {1} — {2}' -f ($lec[$cur].um.Count + 1), $umQ, $matches[1].Trim())); $umQ = $null; continue }
    continue
  }
  if ($sec -eq 'th') {
    if ($l -match 'ШПАРГАЛКА ДЛЯ ТЕСТА НА АНГЛИЙСКОМ') { $inSh = $true; [void]$lec[$cur].th.Add($l); continue }
    if ($inSh) {
      if ($l -notmatch "`t") { $inSh = $false }
      elseif ($l -match '^Формулировка') { [void]$lec[$cur].th.Add("Как в тесте (англ.)`tПеревод`tОтвет"); continue }
      else { $p = $l -split "`t"; $k = $p[0].Trim(); if ($Sh.ContainsKey($k)) { [void]$lec[$cur].th.Add($(if ($Sh[$k][2]) { $Sh[$k][2] } else { $k }) + "`t" + $Sh[$k][0] + "`t" + $Sh[$k][1]) } else { $script:shMiss += $l; [void]$lec[$cur].th.Add($l) }; continue }
    }
  }
  [void]$lec[$cur][$sec].Add($l)
}



# --- УМКД (официальный текст): цель и тезисы лекций, задания СРО, 150 экзаменационных вопросов ---
$Bul = [string][char]0xF0B7
$UP = @{}; $USro = @{}; $UQ = @{}
if ($Umkd -and (Test-Path $Umkd)) {
  $U = [IO.File]::ReadAllLines($Umkd, [Text.Encoding]::UTF8); $part = 'lec'; $n = 0; $field = ''
  foreach ($raw in $U) {
    $l = $raw.Trim(); if (-not $l) { continue }
    if ($l -match '^План лабораторных') { $part = 'lab'; continue }
    if ($l -match '^Тема 1\.' -and $part -eq 'lab') { $part = 'sro' }
    if ($l -match '^Список вопросов') { $part = 'q'; $n = 0; continue }
    if ($l -match '^Литература') { break }
    if ($part -eq 'lec') {
      if ($l -match '^Лекция (\d+)\.\s*(.*)$') { $n = [int]$matches[1]; $UP[$n] = @{ goal = ''; items = New-Object System.Collections.ArrayList }; $field = 'title'; continue }
      if (-not $n) { continue }
      if ($l -match '^Цель лекции:\s*(.*)$') { $UP[$n].goal = $matches[1]; $field = 'goal'; continue }
      if ($l -match '^Основные тезисы') { $field = 'items'; continue }
      if ($l.StartsWith($Bul)) { [void]$UP[$n].items.Add($l.Substring(1).Trim()); $field = 'items'; continue }
      if ($field -eq 'goal') { $UP[$n].goal += ' ' + $l } elseif ($field -eq 'items' -and $UP[$n].items.Count) { $k = $UP[$n].items.Count - 1; $UP[$n].items[$k] = ($UP[$n].items[$k] + ' ' + $l) }
    } elseif ($part -eq 'sro') {
      if ($l -match '^Тема (\d+)\.') { $n = [int]$matches[1]; $USro[$n] = @{ task = ''; form = '' }; $field = ''; continue }
      if (-not $n) { continue }
      if ($l -match '^Задания для СРО:\s*(.*)$') { $USro[$n].task = $matches[1]; $field = 'task'; continue }
      if ($l -match '^Форма отчётности:\s*(.*)$') { $USro[$n].form = $matches[1]; $field = 'form'; continue }
      if ($field) { $USro[$n][$field] += ' ' + $l }
    } elseif ($part -eq 'q') {
      if ($l -match '^Тема (\d+)\.') { $n = [int]$matches[1]; $UQ[$n] = New-Object System.Collections.ArrayList; continue }
      if (-not $n) { continue }
      if ($l -match '^(\d+)\.\s+(.+)$') { [void]$UQ[$n].Add($matches[2]) } elseif ($UQ[$n].Count) { $k = $UQ[$n].Count - 1; $UQ[$n][$k] = $UQ[$n][$k] + ' ' + $l }
    }
  }
}
foreach ($n in @($lec.Keys)) {
  # план из УМКД, если в лекции его нет
  if ($UP.ContainsKey($n) -and -not ($lec[$n].th | Where-Object { $_ -match '^\s*Цель( лекции)?:' })) {
    $pre = @('Цель лекции: ' + $UP[$n].goal.Trim(), 'Основные тезисы:') + @($UP[$n].items) + @('')
    $lec[$n].th.InsertRange(0, [string[]]$pre)
  }
  # задания СРО из УМКД — отдельным разделом в конце лекции (решения — в ex\addNN.txt)
  if ($USro.ContainsKey($n) -and $USro[$n].task) {
    [void]$lec[$n].th.AddRange([string[]]@('', 'ДОПОЛНЕНИЕ · ЗАДАНИЯ СРО ПО УМКД', ('Задание: ' + $USro[$n].task.Trim()), ('Форма отчётности: ' + $USro[$n].form.Trim()), ''))
  }
  # вопросы УМКД: формулировка — из УМКД, ответ — из файла с ответами (по номеру)
  if ($UQ.ContainsKey($n)) {
    $ans = @($lec[$n].um | ForEach-Object { if ($_ -match '^\d+\.\s+.+?\s+—\s+(.+)$') { $matches[1] } })
    if (-not $ans.Count) { $ans = @($lec[$n].umRaw) }
    $new = New-Object System.Collections.ArrayList
    for ($k = 0; $k -lt $UQ[$n].Count; $k++) { if ($k -lt $ans.Count -and $ans[$k]) { [void]$new.Add(('{0}. {1} — {2}' -f ($k + 1), $UQ[$n][$k].Trim(), $ans[$k])) } }
    $lec[$n].um = $new
  }
}

$LatFix = @{ 'C++BUILDER' = 'C++Builder'; 'BORLAND' = 'Borland'; 'UNIT1.H' = 'Unit1.h'; 'TOBJECT' = 'TObject'; 'SHOWMODAL' = 'ShowModal'; 'SHOW' = 'Show'; 'CLOSE' = 'Close'; 'HIDE' = 'Hide'; 'BUTTON' = 'Button'; 'EDIT' = 'Edit'; 'LABEL' = 'Label'; 'ESCAPE' = 'Escape'; 'ENUM' = 'enum'; 'VIRTUAL' = 'virtual'; 'PUBLIC' = 'public'; 'PROTECTED' = 'protected'; 'PRIVATE' = 'private'; '__PROPERTY' = '__property'; 'GET' = 'get'; 'SET' = 'set'; 'WHILE' = 'while'; 'SWITCH' = 'switch'; 'STRING' = 'string'; 'IF' = 'if'; 'GOTO' = 'goto'; 'FOR' = 'for'; 'DO' = 'do'; 'ELSE' = 'else'; 'CHAR' = 'char'; 'BREAK' = 'break'; 'CONTINUE' = 'continue'; 'RETURN' = 'return'; 'CONST' = 'const'; 'INLINE' = 'inline'; 'CLASS' = 'class'; 'NEW' = 'new'; 'DELETE' = 'delete'; 'THIS' = 'this'; 'STATIC' = 'static'; 'TFORM' = 'TForm'; 'TIMER' = 'Timer'; 'MEMO' = 'Memo' }
function TitleCase([string]$s) { $s = [regex]::Replace($s, '[А-ЯЁ]', { param($m) $m.Value.ToLower() }); $s = [regex]::Replace($s, '(?<![A-Za-z0-9_])[A-Z][A-Z0-9+_.]*[A-Z0-9+.]', { param($m) $v = $m.Value; $k = $v.TrimEnd('.'); if ($LatFix.ContainsKey($k)) { $LatFix[$k] + $v.Substring($k.Length) } else { $v } }); $s = $s.Replace('__PROPERTY', '__property'); foreach ($pn in 'Хэмминга','Карно','Моргана','Гарвард','Нейман') { $s = [regex]::Replace($s, '(?<![а-яё])' + $pn.ToLower(), $pn) }; foreach ($a in 'МГУ','УМКД','ООП','СРС','СРО','ЭВМ','ИКТ','РК','СДНФ','СКНФ','ДНФ','КНФ','ОЗУ','ПЗУ','АЛУ','УУ','ЦП','ПК','БИОС') { $s = [regex]::Replace($s, '(?<![а-яё])' + $a.ToLower() + '(?![а-яё])', $a) }; if ($s.Length) { return $s.Substring(0,1).ToUpper() + $s.Substring(1) } return $s }
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
    if ($l -match '^=(\d\d) (.*)$') { $old = $matches[1] + '|' + $matches[2].Trim() } elseif ($l -match '^= (.*)$') { $old = $matches[1].Trim() } elseif ($l -match '^>\s?(.*)$' -and $null -ne $old) { $map[$old] = $matches[1].Trim().Replace('\n', "`n"); $old = $null }
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
  # простые заголовки без номера: короткая строка без точки/двоеточия, за ней — текст длиннее
  $isHead = @{}
  for ($hi = 0; $hi -lt $th.Count; $hi++) { $h = $th[$hi].Trim(); if ($h -match '[=×]' -or $h.Length -lt 8 -or $h.Length -gt 75 -or $h -match '[:;,.]$' -or $h -match ':' -or $h -match "`t" -or $h -notmatch '^[А-ЯЁA-Z]' -or $h -notmatch $cyr -or ($h -split '\s+').Count -lt 2 -or $h -match '^(Цель|Основные|О МАТЕРИАЛАХ|ДОПОЛНЕНИЕ|ПОПРАВКА|Рисунок|Таблица)' -or (IsCode $th[$hi])) { continue }; $nx = $hi + 1; while ($nx -lt $th.Count -and -not $th[$nx].Trim()) { $nx++ }; if ($nx -lt $th.Count -and $th[$nx].Trim().Length -gt [Math]::Max(60, $h.Length + 20)) { $isHead[$hi] = 1 } }
  $ri = -1
  foreach ($raw in $th) {
    $ri++; $t = $raw.Trim()
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
    if ($t -match '^Цель( лекции)?:') { [void]$o.Add('## Цель и план лекции (УМКД)'); [void]$o.Add($t); $started = $true; continue }
    if ($t -match '^Основные (пункты|тезисы)[^:]*:\s*(.*)$') { $rest = $matches[2].Trim(); [void]$o.Add('**Основные пункты лекции:**'); $planN = 0; if ($rest) { foreach ($p in ($rest.TrimEnd('.') -split ';\s*')) { $p = $p.Trim(); if ($p) { [void]$o.Add('- ' + $p.Substring(0,1).ToUpper() + $p.Substring(1)) } } } else { $mode = 'plan' }; continue }
    if ($t -match '^\d{1,2}\.\s+\S' -and $t.Length -le 90 -and $t -notmatch ' — ' -and $t -notmatch ':$' -and $t -match $cyr) { $mode = ''; [void]$o.Add(''); [void]$o.Add('## ' + $t); $started = $true; continue }
    if ($isHead[$ri] -and $mode -ne 'plan') { $mode = ''; [void]$o.Add(''); [void]$o.Add('## ' + $t.TrimEnd('?') + $(if ($t.EndsWith('?')) { '?' } else { '' })); $started = $true; continue }
    if ($t -match '^Вопросы УМКД к теме') { $mode = 'umkd'; continue }
    if ($t -match '^СРС К ТЕМЕ') { $mode = 'srs'; continue }
    if ($mode -eq 'umkd' -and $t -match '^ОТВЕТЫ\s*·') { continue }
    if ($t -match '^(ДОПОЛНЕНИЕ|ОТВЕТЫ|ПРИМЕР|ВАЖНО|ЛАБА|ЗАДАНИЕ)\s*·\s*(.+)$') { $tt = TitleCase $matches[2]; $prev = ($o | Where-Object { $_ -ne '' } | Select-Object -Last 1); if ($prev -match '^## ') { [void]$o.Add('**' + $tt + '**') } else { $mode = ''; [void]$o.Add(''); [void]$o.Add('## ' + $tt) }; $tbl = $false; continue }
    if ($mode -eq 'umkd') { if ($t -match '^([^—]+\?[^—]*?)\s+—\s+(.+)$') { [void]$umItems.Add(@($matches[1].Trim(), $matches[2].Trim())) }; continue }
    if ($mode -eq 'srs') { [void]$srs.Add($t); continue }
    if ($raw -match "`t") { $cells = $t -split "`t"; [void]$o.Add('| ' + (($cells | ForEach-Object { $_.Trim() }) -join ' | ') + ' |'); $tbl = $true; continue }
    if ($t -cnotmatch '[a-zа-яё]' -and $t -match $cyr -and $t.Length -gt 3) { [void]$o.Add('**' + (TitleCase $t) + '**'); continue }
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
    $lk = ('{0:D2}|' -f $n) + $l; if (-not $RuMap.ContainsKey($lk)) { $lk = $l }
    if ($RuMap.ContainsKey($lk)) { if ($RuMap[$lk]) { $o[$k] = $RuMap[$lk] } else { $o.RemoveAt($k) }; continue }
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


function LoadEx($n) {
  $m = @{}; $f = Join-Path $Out ('ex\ex{0:D2}.txt' -f $n); if (-not (Test-Path $f)) { return $m }
  $cur = 0; $buf = @()
  foreach ($l in [IO.File]::ReadAllLines($f, [Text.Encoding]::UTF8)) { if ($l -match '^#(\d+)\s*$') { if ($cur) { $m[$cur] = ($buf -join "`n").Trim() }; $cur = [int]$matches[1]; $buf = @() } else { $buf += $l } }
  if ($cur) { $m[$cur] = ($buf -join "`n").Trim() }
  return $m
}
# разделы лекции для ссылки «По лекции»: заголовок и токены текста раздела
function LecSections([string]$lecText) {
  $res = @(); $title = $null; $buf = New-Object System.Collections.ArrayList
  foreach ($l in ($lecText -split "`n")) {
    if ($l -match '^## (.+)$') { if ($title) { $res += , @($title, (LTok ($buf -join ' '))) }; $title = $matches[1].Trim(); $buf.Clear() } elseif ($title) { [void]$buf.Add($l) }
  }
  if ($title) { $res += , @($title, (LTok ($buf -join ' '))) }
  return , $res
}
function BestSection($secs, [string]$text) {
  $qt = LTok $text; $best = $null; $bs = 0
  foreach ($s in $secs) {
    if ($s[0] -match '^(Цель и план|Шпаргалка|СРС)') { continue }
    $sc = 0; foreach ($w in $qt.Keys) { if ($s[1].ContainsKey($w)) { $sc += $qt[$w] } }
    if ($sc -gt $bs) { $bs = $sc; $best = $s[0] }
  }
  return $best
}
# таблица истинности в тексте вопроса: «… истинности: A B → Выход: 0 0 → 0; 0 1 → 1; …» -> блок-таблица
function TruthTable([string]$q) {
  if ($q -notmatch '^(.*?истинности):\s*A B → Выход:\s*(.+)$') { return $q }
  $head = $matches[1] + '?'; $rows = $matches[2] -split ';\s*' | ForEach-Object { if ($_ -match '^\s*(\d)\s+(\d)\s*→\s*(\d)') { '  {0}   {1}  |  {2}' -f $matches[1], $matches[2], $matches[3] } }
  return $head + "`n``````n  A   B  | Выход`n" + ($rows -join "`n") + "`n``````"
}
function ConvTests($n, $secs) {
  $o = New-Object System.Collections.ArrayList; $q = $null; $exm = LoadEx $n; $qi = 0; $grp = 'base'
  $flush = {
    if ($q) {
      $script:qi2++
      $right = ($q.opts | Where-Object { $_.r } | Select-Object -First 1).t
      $e = $exm[$script:qi2]
      if (-not $e) {
        $e = 'Ответ: ' + $right + '.' + $(if ($q.ex) { "`n" + $q.ex } else { '' })
        $sec = BestSection $secs ($q.qt + ' ' + $right + ' ' + $q.ex)
        $e += "`n" + $(if ($sec) { 'По лекции: тема ' + $n + ', раздел «' + $sec + '».' } else { 'По лекции: тема ' + $n + '.' })
      }
      if ($q.base) { $e = '⭐ Вопрос из базы экзамена (150 вопросов).' + "`n" + $e }
      if ($q.en) { $e += "`nКак в тесте (англ.): " + $q.en }
      [void]$o.Add('<question> ' + (TruthTable $q.qt))
      foreach ($op in $q.opts) { [void]$o.Add($(if ($op.r) { '<variantright> ' } else { '<variant> ' }) + $op.t) }
      [void]$o.Add('<explain>' + $e + '</explain>'); [void]$o.Add('')
    }
  }
  foreach ($raw in $lec[$n].ts) {
    $t = $raw.Trim()
    if ($t -match '^\[Из базы') { $grp = 'base'; continue }
    if ($t -match '^\[Дополнительн') { $grp = 'add'; continue }
    if ($t -match '^(Источники:|\[)') { continue }
    if ($t -match '^Вопрос\s+\d+\.\d+\.\s+(.+)$') { & $flush; $q = @{ qt = $matches[1].Trim(); en = ''; opts = New-Object System.Collections.ArrayList; ex = ''; base = ($grp -eq 'base') }; continue }
    if (-not $q) { continue }
    if ($t -match '^\(EN\)\s*(.+)$') { $q.en = $matches[1].Trim(); continue }
    if ($raw -match '^\s+(✔\s+)?[а-яa-e]\)\s+(.*)$') { [void]$q.opts.Add(@{ r = [bool]$matches[1]; t = $matches[2].Trim() }); continue }
    if ($t -match '^Пояснение:\s*(.+)$') { $q.ex = $matches[1].Trim(); continue }
    if ($t -and $q.opts.Count -eq 0) { $q.qt += ' ' + $t }
  }
  & $flush
  $xf = Join-Path $Out ('ex\extra{0:D2}.txt' -f $n); if (Test-Path $xf) { [void]$o.Add([IO.File]::ReadAllText($xf, [Text.Encoding]::UTF8).Trim()) }
  return (($o -join "`n").Trim() + "`n")
}

$script:noEx = 0; $script:enLeft = @(); $script:umLog = @()
$old = @{}; $oldMeta = Join-Path $Out 'topics.json'
if (Test-Path $oldMeta) { $om = [IO.File]::ReadAllText($oldMeta, [Text.Encoding]::UTF8) | ConvertFrom-Json; foreach ($t in $om.topics) { $old[[int]$t.n] = $t } }
$topics = @()
foreach ($n in ($lec.Keys | Sort-Object)) {
  $nn = '{0:D2}' -f $n; $script:qi2 = 0
  # тема собрана вручную (есть ex\handNN.txt) — её lNN/tNN не трогаем
  if (Test-Path (Join-Path $Out "ex\hand$nn.txt")) { $topics += [ordered]@{ n = $n; rk = $(if ($n -le 5) { 1 } else { 2 }); title = $titles[$n]; file = "t$nn.txt"; lecture = "l$nn.txt" }; continue }
  $lt = ConvLecture $n
  [IO.File]::WriteAllText((Join-Path $Out "l$nn.txt"), $lt, $enc)
  [IO.File]::WriteAllText((Join-Path $Out "t$nn.txt"), (ConvTests $n (LecSections $lt)), $enc)
  $topics += [ordered]@{ n = $n; rk = $(if ($n -le 5) { 1 } else { 2 }); title = $titles[$n]; file = "t$nn.txt"; lecture = "l$nn.txt" }
}
# лабораторные EWB (тема 16) — как были
if ($old.ContainsKey(16)) { $topics += [ordered]@{ n = 16; rk = 0; lab = $true; title = $old[16].title; file = $old[16].file; lecture = $old[16].lecture } }
$meta = [ordered]@{ id = 'arch'; title = 'Архитектура ЭВМ'; note = 'Архитектура ЭВМ по УМКД: 15 лекций (тезисы УМКД, лекция, ответы на 150 экзаменационных вопросов УМКД внутри разделов, разбор заданий СРО), тесты с пояснениями; ⭐ — вопросы из базы экзамена (150). Собирается скриптом ex\conv.ps1 из «Архитектура ЭВМ — лекции, вопросы УМКД и тесты.txt».'; units = @(@(1, 15, 'Темы 1–15 по УМКД', 'Числа, логика, схемы, процессор, память, шины, прерывания'), @(16, 16, 'Лабораторные', 'Программа Electronics Workbench (EWB)')); topics = $topics }
[IO.File]::WriteAllText((Join-Path $Out 'topics.json'), ($meta | ConvertTo-Json -Depth 6), $enc)
'ok ' + $lec.Keys.Count
[IO.File]::WriteAllLines((Join-Path $env:TEMP 'arch_log.txt'), [string[]]($script:umLog + '--- английский без перевода:' + $script:enLeft + '--- шпаргалки без перевода:' + $script:shMiss), (New-Object Text.UTF8Encoding $false))
