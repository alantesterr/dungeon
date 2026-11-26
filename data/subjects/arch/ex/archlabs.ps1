# Лабы Архитектуры для «💻 Практики»: architecture_base.json (выгрузка с учебного сайта) -> data/subjects/arch/labs.json
# Оставляем только то, что нужно игре: тема, лаба, задания (условие, решение, источник, какие тренажёры есть, якорь на странице сайта).
param([string]$Json, [string]$Html, [string]$Out)
$U = [Text.Encoding]::UTF8
$j = [IO.File]::ReadAllText($Json, $U) | ConvertFrom-Json
$html = [IO.File]::ReadAllText($Html, $U)
$ids = @{}; foreach ($m in [regex]::Matches($html, 'id="([^"]+)"')) { $ids[$m.Groups[1].Value] = 1 }
$names = @{ ewb_circuit = 'схема EWB'; ewb_build_task = 'собери схему'; ewb_from_expression = 'схема по формуле'; ewb_from_expression_list = 'схема по формуле'; asm_step_simulator = 'ассемблер'; calculator = 'калькулятор'; image = 'рисунки' }
$labs = @()
foreach ($t in $j.topics) {
  $n = [int]$t.number
  foreach ($l in $t.labs) {
    $tasks = @()
    foreach ($k in $l.tasks) {
      if ($k.example) { $kind = 'пример' } else { $kind = '' }
      $vis = @(); foreach ($v in @($k.visuals)) { if ($v -and $names[$v.type] -and $v.type -ne 'image') { if ($vis -notcontains $names[$v.type]) { $vis += $names[$v.type] } } }
      $anchor = $(if ($ids.ContainsKey($k.id)) { $k.id } elseif ($ids.ContainsKey("t$n-lab")) { "t$n-lab" } else { "t$n" })
      $tasks += [ordered]@{ id = $k.id; name = [string]$k.title; text = [string]$k.condition; solution = [string]$k.solution; src = [string]$k.source; ex = [bool]$k.example; tools = $vis; anchor = $anchor }
    }
    $short = ([string]$l.title -replace '^Лабораторная работа\s*№?\s*', 'Лаба ' -replace '\..*$', '')
    if ($short.Length -gt 40) { $short = $short.Substring(0, 40) + '…' }
    $labs += [ordered]@{ topic = $n; id = $l.id; short = $short; title = [string]$l.title; src = [string]$l.source; tasks = $tasks }
  }
}
[IO.File]::WriteAllText($Out, ($labs | ConvertTo-Json -Depth 6 -Compress), (New-Object Text.UTF8Encoding $false))
"labs: " + $labs.Count + "  tasks: " + (($labs | % { $_.tasks.Count }) | Measure-Object -Sum).Sum
