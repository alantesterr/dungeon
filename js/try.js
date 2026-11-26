/* «🧪 Попробовать» — живые примеры к вопросам тестов.
   C++: код из вопроса запускается в интерпретаторе (js/cpp), в каждый цикл вставляется строка «проход N: x=…»,
        чтобы было видно, как меняются переменные; если кода нет — короткая программа про команду из вопроса
        (break, switch, %, ++, массив, указатель…) и «зачем это нужно».
   Архитектура: тренажёры — перевод чисел, сложение в двоичной, логические вентили и де Морган,
        код Хэмминга, знаковые числа в байте, числа с плавающей точкой (single/half).
   TRY.find(q, sid) → список примеров (пусто — кнопки нет); TRY.open(q, sid) — окно.
   ВНИМАНИЕ: в регулярках JS \w и \b не понимают русские буквы — пишем [а-яё] и функцию W(). */
(function () {
  var T = window.TRY = { active: false };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var plain = function (s) { return String(s || '').replace(/<[^>]+>/g, ' ').replace(/[*`]/g, '').replace(/\s+/g, ' ').trim(); };
  function rightOf(q) { return q.type === 'keyboard' ? String(q.answer || '') : (q.opts || []).filter(function (o) { return o.right; }).map(function (o) { return o.t; }).join(' '); }

  /* ================= C++: примеры про команды ================= */
  var H = '#include <iostream.h>\n\nint main()\n{\n';
  var DEMOS = [
    { re: /\bcontinue\b/, n: 'continue', why: '<b>continue</b> пропускает остаток тела цикла и сразу идёт к следующему проходу. Нужно, чтобы «не обрабатывать» лишние значения — например, пропустить чётные.', code: H + '  for (int i = 1; i <= 6; i++)\n  {\n    if (i % 2 == 0) continue;   // чётные пропускаем\n    cout << "i = " << i << endl;\n  }\n  return 0;\n}\n' },
    { re: /\bbreak\b|прерыва[а-яё]* цикл/i, n: 'break', why: '<b>break</b> сразу выходит из цикла (или из switch). Нужно, когда ответ уже найден и дальше крутить нет смысла — например, нашли первое отрицательное число.', code: H + '  int a[6] = {4, 7, -2, 9, -5, 1};\n  for (int i = 0; i < 6; i++)\n  {\n    cout << "смотрю a[" << i << "] = " << a[i] << endl;\n    if (a[i] < 0) { cout << "нашёл отрицательное — break!" << endl; break; }\n  }\n  return 0;\n}\n' },
    { re: /\bswitch\b|\bcase\b|\bdefault\b/, n: 'switch', why: '<b>switch</b> выбирает ветку по значению. Без <b>break</b> выполнение «проваливается» в следующие case — попробуй убрать break и запусти ещё раз. Нужно для меню: 1 — сложить, 2 — вычесть…', code: H + '  int day = 3;   // поменяй на 1…7\n  switch (day)\n  {\n    case 1: cout << "Понедельник" << endl; break;\n    case 2: cout << "Вторник" << endl; break;\n    case 3: cout << "Среда" << endl; break;\n    case 6:\n    case 7: cout << "Выходной" << endl; break;\n    default: cout << "Обычный день" << endl;\n  }\n  return 0;\n}\n' },
    { re: /do\s*\{|\bdo\b.*\bwhile\b|do-?while|с постусловием/i, n: 'do … while', why: '<b>do … while</b> сначала выполняет тело, потом проверяет условие — поэтому тело выполнится хотя бы один раз, даже если условие сразу ложно. Нужно для «спроси, пока не введут правильно».', code: H + '  int x = 10;\n  do\n  {\n    cout << "тело выполнилось, x = " << x << endl;\n    x++;\n  } while (x < 5);   // условие ложно сразу, но тело уже было\n\n  int y = 10;\n  while (y < 5) { cout << "while: это не напечатается" << endl; y++; }\n  cout << "while ни разу не выполнился" << endl;\n  return 0;\n}\n' },
    { re: /\bwhile\b|с предусловием/i, n: 'while', why: '<b>while</b> проверяет условие перед каждым проходом. Нужно, когда заранее неизвестно, сколько раз повторять — например, делить число на 10, пока оно не станет 0 (считаем цифры).', code: H + '  int n = 2024, k = 0;\n  while (n > 0)\n  {\n    cout << "n = " << n << ", последняя цифра " << n % 10 << endl;\n    n = n / 10;\n    k++;\n  }\n  cout << "цифр: " << k << endl;\n  return 0;\n}\n' },
    { re: /\bfor\b/i, n: 'for', why: '<b>for (начало; условие; шаг)</b> — цикл со счётчиком. Нужно, когда известно, сколько раз повторить: пройти массив, посчитать сумму 1..n.', code: H + '  int s = 0;\n  for (int i = 1; i <= 5; i++)\n  {\n    s = s + i;\n    cout << "i = " << i << ", сумма s = " << s << endl;\n  }\n  cout << "итог: " << s << endl;\n  return 0;\n}\n' },
    { re: /printf|scanf|%[-+0-9.]*[dfiscuxXeEgo]\b/, n: 'printf', why: '<b>printf("формат", значения)</b> печатает по шаблону: <b>%d</b> (или %i) — целое, <b>%f</b> — дробное, <b>%.2f</b> — 2 знака после запятой, <b>%c</b> — символ, <b>%s</b> — строка, <b>%x</b> — шестнадцатеричное, <b>%u</b> — без знака. Нужно, чтобы аккуратно выводить таблицы и числа.', code: '#include <stdio.h>\n\nint main()\n{\n  int n = 255; double x = 3.14159; char c = \'A\';\n  printf("%%d  -> %d\\n", n);\n  printf("%%x  -> %x\\n", n);\n  printf("%%u  -> %u\\n", n);\n  printf("%%f  -> %f\\n", x);\n  printf("%%.2f -> %.2f\\n", x);\n  printf("%%c  -> %c\\n", c);\n  printf("%%s  -> %s\\n", "привет");\n  printf("%%5d -> [%5d]\\n", 42);\n  return 0;\n}\n' },
    { re: /модул[ья] (целого |вещественного )?числ|абсолютн[а-яё]* значени|округлени|корень \d|корень из|квадратн[а-яё]* кор|корня|в степен|[а-яё]+-й степен|\d-й степен|математическ[а-яё]* библиотек|арктангенс|арккосинус|арксинус|\batan|\bacos|\basin|floor|ceil|sqrt|pow|fabs|\babs\b|\bcos\b|\bsin\b|math\.h|cmath/i, n: 'math.h', why: 'В <b>math.h</b>: sqrt — корень, pow(a, b) — степень (корень n-й степени = pow(x, 1.0/n)), fabs/abs — модуль, floor — округление вниз, ceil — вверх, sin/cos — от радиан.', code: '#include <iostream.h>\n#include <math.h>\n#include <stdlib.h>\n\nint main()\n{\n  cout << "sqrt(16)      = " << sqrt(16.0) << endl;\n  cout << "pow(2, 10)    = " << pow(2.0, 10.0) << endl;\n  cout << "pow(32, 1.0/5) = " << pow(32.0, 1.0 / 5) << "  (корень 5-й степени)" << endl;\n  cout << "fabs(-3.5)    = " << fabs(-3.5) << endl;\n  cout << "abs(-7)       = " << abs(-7) << endl;\n  cout << "floor(2.7)    = " << floor(2.7) << endl;\n  cout << "ceil(2.1)     = " << ceil(2.1) << endl;\n  cout << "cos(0)        = " << cos(0.0) << endl;\n  return 0;\n}\n' },
    { re: /\+\+|--|инкремент|декремент|постфикс|префикс/i, n: '++ / --', why: '<b>x++</b> (постфикс) сначала отдаёт старое значение, потом увеличивает; <b>++x</b> (префикс) сначала увеличивает. Разница видна, только когда значение сразу используется.', code: H + '  int x = 5, y;\n  y = x++;   // y получил 5, потом x стал 6\n  cout << "y = x++ :  y = " << y << ", x = " << x << endl;\n  x = 5;\n  y = ++x;   // x стал 6, y получил 6\n  cout << "y = ++x :  y = " << y << ", x = " << x << endl;\n  return 0;\n}\n' },
    { re: /%|остат[а-яё]* от делени|делени[а-яё]* по модулю/i, n: '% (остаток)', why: '<b>a % b</b> — остаток от деления целых. Нужно, чтобы проверить чётность (x % 2 == 0), взять последнюю цифру (x % 10), делить «по кругу».', code: H + '  cout << "17 / 5 = " << 17 / 5 << "   (целая часть)" << endl;\n  cout << "17 % 5 = " << 17 % 5 << "   (остаток)" << endl;\n  for (int x = 1; x <= 6; x++)\n    cout << x << (x % 2 == 0 ? " чётное" : " нечётное") << endl;\n  return 0;\n}\n' },
    { re: /целочисленн[а-яё]* делени|\bint\b.*\/|\(int\)|\(float\)|\(double\)|привед[а-яё]* тип/i, n: 'деление и (int)', why: 'Если оба числа целые, <b>/</b> отбрасывает дробную часть: 7 / 2 = 3. Чтобы получить 3.5, хотя бы одно число должно быть дробным: 7.0 / 2 или (double)7 / 2.', code: H + '  int a = 7, b = 2;\n  cout << "a / b        = " << a / b << endl;\n  cout << "(double)a / b = " << (double)a / b << endl;\n  cout << "7.0 / 2      = " << 7.0 / 2 << endl;\n  cout << "(int)3.99    = " << (int)3.99 << endl;\n  return 0;\n}\n' },
    { re: /\?\s*:|тернарн|условн[а-яё]* операц/i, n: '?: (тернарный)', why: '<b>условие ? A : B</b> — короткий if, который даёт значение. Нужно, чтобы одной строкой выбрать максимум или слово «да/нет».', code: H + '  int a = 7, b = 12;\n  int mx = (a > b) ? a : b;\n  cout << "больше из " << a << " и " << b << ": " << mx << endl;\n  cout << (a % 2 == 0 ? "a чётное" : "a нечётное") << endl;\n  return 0;\n}\n' },
    { re: /&&|\|\||логическ[а-яё]* (и|или|не)(?![а-яё])|\bbool\b|true|false/i, n: '&&, ||, !', why: '<b>&&</b> — «и» (оба условия), <b>||</b> — «или» (хотя бы одно), <b>!</b> — «не». Истина в C++ — 1, ложь — 0. Нужно для сложных проверок: «x от 1 до 10».', code: H + '  int x = 7;\n  cout << "x > 0 && x < 10  ->  " << (x > 0 && x < 10) << endl;\n  cout << "x < 0 || x == 7  ->  " << (x < 0 || x == 7) << endl;\n  cout << "!(x == 7)        ->  " << !(x == 7) << endl;\n  return 0;\n}\n' },
    { re: /\bif\b|\belse\b|ветвлен/i, n: 'if / else', why: '<b>if (условие)</b> выполняет код, только когда условие истинно; <b>else</b> — иначе. Частая ловушка: <b>=</b> — это присваивание, а сравнение — <b>==</b>.', code: H + '  int t = 25;   // поменяй температуру\n  if (t > 30) cout << "жарко" << endl;\n  else if (t > 15) cout << "тепло" << endl;\n  else cout << "холодно" << endl;\n  return 0;\n}\n' },
    { re: /\\[ntar]|управляющ[а-яё]* символ/i, n: '\\n и \\t', why: 'Управляющие символы внутри кавычек: <b>\\n</b> — перейти на новую строку, <b>\\t</b> — табуляция (прыжок к следующему столбцу), <b>\\a</b> — звуковой сигнал, <b>\\\\</b> — сам обратный слэш. Нужно, чтобы выводить ровные таблицы и переносы.', code: H + '  cout << "Имя\\tВозраст\\n";\n  cout << "Алан\\t19\\n";\n  cout << "Дана\\t20\\n";\n  cout << "первая строка\\nвторая строка" << endl;\n  cout << "путь: C:\\\\Builder" << endl;\n  return 0;\n}\n' },
    { re: /\bstr(len|cpy|cat|cmp|str|chr|rev|upr|lwr|n\w+|rchr|icmp|set)\b|string\.h|строков[а-яё]* функц|длин[а-яё]* строки|char\s+\w+\[/i, n: 'строки char[]', why: 'Строка в стиле C — массив char, в конце которого стоит невидимый символ <b>\'\\0\'</b>. <b>strlen</b> — длина без него, <b>strcpy</b> — копировать, <b>strcat</b> — приписать, <b>strcmp</b> — сравнить (0 — равны).', code: '#include <iostream.h>\n#include <string.h>\n\nint main()\n{\n  char s[20] = "Hello";\n  cout << "strlen(s) = " << strlen(s) << endl;\n  strcat(s, " world");\n  cout << "после strcat: " << s << endl;\n  char t[20];\n  strcpy(t, s);\n  cout << "strcmp(s, t) = " << strcmp(s, t) << "  (0 = одинаковые)" << endl;\n  for (int i = 0; i < 5; i++) cout << "s[" << i << "] = \'" << s[i] << "\'" << endl;\n  return 0;\n}\n' },
    { re: /\bchar\b|ascii|код символ/i, n: 'char и коды', why: '<b>char</b> хранит один символ, а на самом деле — его код (ASCII). Поэтому \'A\' + 1 = \'B\', а (int)\'A\' = 65.', code: H + '  char c = \'A\';\n  cout << "c = " << c << ", код = " << (int)c << endl;\n  c = c + 2;\n  cout << "c + 2 = " << c << endl;\n  for (char x = \'a\'; x <= \'e\'; x++) cout << x << " ";\n  cout << endl;\n  return 0;\n}\n' },
    { re: /двумерн|матриц|\[\s*\d+\s*\]\s*\[/i, n: 'двумерный массив', why: 'Двумерный массив <b>a[строк][столбцов]</b> — таблица. Первый индекс — строка, второй — столбец. Обходят двумя вложенными циклами.', code: H + '  int a[3][4];\n  for (int i = 0; i < 3; i++)\n  {\n    for (int j = 0; j < 4; j++)\n    {\n      a[i][j] = i * 10 + j;\n      cout << a[i][j] << "\\t";\n    }\n    cout << endl;\n  }\n  return 0;\n}\n' },
    { re: /массив|\[\s*\d*\s*\]|индекс/i, n: 'массив', why: 'Массив — ряд ячеек одного типа под одним именем. Номера (индексы) начинаются с <b>0</b>, поэтому у <b>int a[5]</b> последний элемент — a[4]. Нужно, чтобы хранить много однотипных значений и обрабатывать их циклом.', code: H + '  int a[5] = {3, 8, 1, 9, 4};\n  int s = 0, mx = a[0];\n  for (int i = 0; i < 5; i++)\n  {\n    cout << "a[" << i << "] = " << a[i] << endl;\n    s += a[i];\n    if (a[i] > mx) mx = a[i];\n  }\n  cout << "сумма " << s << ", максимум " << mx << endl;\n  return 0;\n}\n' },
    { re: /\bnew\b|\bdelete\b|динамическ/i, n: 'new / delete', why: '<b>new</b> выделяет память во время работы (когда размер узнаём только от пользователя), <b>delete</b> (для массива — <b>delete[]</b>) её возвращает.', code: H + '  int n = 4;   // размер узнали «во время работы»\n  int *a = new int[n];\n  for (int i = 0; i < n; i++) a[i] = i * i;\n  for (int i = 0; i < n; i++) cout << a[i] << " ";\n  cout << endl;\n  delete[] a;\n  cout << "память освобождена" << endl;\n  return 0;\n}\n' },
    { re: /ссылк|reference|int\s*&\s*\w/i, n: 'ссылка &', why: 'Ссылка <b>int &r = x;</b> — второе имя той же переменной. Если функция принимает параметр по ссылке, она может изменить переменную вызывающего (как swap).', code: '#include <iostream.h>\n\nvoid plusOne(int v)  { v++; }   // по значению: копия\nvoid plusRef(int &v) { v++; }   // по ссылке: сама переменная\n\nint main()\n{\n  int x = 5;\n  plusOne(x); cout << "после plusOne: x = " << x << endl;\n  plusRef(x); cout << "после plusRef: x = " << x << endl;\n  int &r = x; r = 100;\n  cout << "r = 100, а x = " << x << endl;\n  return 0;\n}\n' },
    { re: /указател|pointer|\*\s*\w+\s*=|&\w+|адрес/i, n: 'указатель *', why: 'Указатель хранит <b>адрес</b> переменной. <b>&x</b> — взять адрес, <b>*p</b> — посмотреть/изменить то, что лежит по адресу. Нужно для массивов, new и передачи больших данных.', code: H + '  int x = 10;\n  int *p = &x;          // p хранит адрес x\n  cout << "x = " << x << ", *p = " << *p << endl;\n  *p = 42;              // меняем x через указатель\n  cout << "после *p = 42:  x = " << x << endl;\n  int a[3] = {5, 6, 7};\n  int *q = a;           // имя массива — адрес a[0]\n  cout << "*(q + 2) = " << *(q + 2) << endl;\n  return 0;\n}\n' },
    { re: /рекурс/i, n: 'рекурсия', why: 'Рекурсия — функция вызывает саму себя с меньшим значением, пока не дойдёт до простого случая (n == 0). Видно, как вызовы «уходят вглубь» и потом возвращаются.', code: '#include <iostream.h>\n\nint fact(int n)\n{\n  cout << "вызов fact(" << n << ")" << endl;\n  if (n <= 1) return 1;\n  int r = n * fact(n - 1);\n  cout << "fact(" << n << ") = " << r << endl;\n  return r;\n}\n\nint main()\n{\n  cout << "итог: " << fact(4) << endl;\n  return 0;\n}\n' },
    { re: /\bstatic\b/, n: 'static', why: 'Локальная <b>static</b>-переменная создаётся один раз и помнит значение между вызовами функции. Нужно, например, чтобы считать, сколько раз функцию вызвали.', code: '#include <iostream.h>\n\nvoid tick()\n{\n  static int k = 0;   // помнит значение\n  int z = 0;          // создаётся заново\n  k++; z++;\n  cout << "static k = " << k << ", обычная z = " << z << endl;\n}\n\nint main()\n{\n  tick(); tick(); tick();\n  return 0;\n}\n' },
    { re: /глобальн|локальн|област[а-яё]* видим/i, n: 'локальные и глобальные', why: 'Глобальная переменная видна во всех функциях, локальная — только внутри своих { }. Локальная с тем же именем «закрывает» глобальную.', code: '#include <iostream.h>\n\nint x = 1;   // глобальная\n\nvoid show() { cout << "в show x = " << x << endl; }\n\nint main()\n{\n  int x = 2;   // локальная, закрывает глобальную\n  cout << "в main x = " << x << endl;\n  show();\n  { int x = 3; cout << "во внутреннем блоке x = " << x << endl; }\n  return 0;\n}\n' },
    { re: /^(?![\s\S]*(файл|fopen|fstream))[\s\S]*(функци|return|\bvoid\b|параметр|прототип)/i, n: 'функция', why: 'Функция — кусок программы с именем: получает параметры, считает и через <b>return</b> отдаёт ответ. <b>void</b> — ничего не возвращает. Нужно, чтобы не писать одно и то же много раз.', code: '#include <iostream.h>\n\nint sq(int a) { return a * a; }\nvoid hello(int k) { for (int i = 0; i < k; i++) cout << "привет! "; cout << endl; }\n\nint main()\n{\n  cout << "sq(7) = " << sq(7) << endl;\n  cout << "sq(3) + sq(4) = " << sq(3) + sq(4) << endl;\n  hello(3);\n  return 0;\n}\n' },
    { re: /\bstruct\b|структур/i, n: 'struct', why: '<b>struct</b> собирает разные поля в одну запись: имя, возраст, оценка. Доступ к полю — через точку.', code: '#include <iostream.h>\n\nstruct Student { char name[20]; int age; double mark; };\n\nint main()\n{\n  Student s = {"Алан", 19, 4.5};\n  cout << s.name << ", " << s.age << " лет, балл " << s.mark << endl;\n  s.mark = 5;\n  cout << "новый балл: " << s.mark << endl;\n  return 0;\n}\n' },
    { re: /sizeof|байт[а-яё]*.*(int|char|double|float)|размер тип/i, n: 'sizeof', why: '<b>sizeof</b> показывает, сколько байт занимает тип или переменная. В C++Builder 6: char — 1, int — 4, double — 8.', code: H + '  cout << "char   " << sizeof(char) << endl;\n  cout << "short  " << sizeof(short) << endl;\n  cout << "int    " << sizeof(int) << endl;\n  cout << "float  " << sizeof(float) << endl;\n  cout << "double " << sizeof(double) << endl;\n  int a[10];\n  cout << "int a[10] -> " << sizeof(a) << endl;\n  return 0;\n}\n' },
    { re: /sqrt|pow|fabs|\babs\b|\bcos\b|\bsin\b|math\.h|cmath/i, n: 'math.h', why: 'В <b>math.h</b>: sqrt — корень, pow(a, b) — степень, fabs — модуль дробного, sin/cos — от радиан.', code: '#include <iostream.h>\n#include <math.h>\n\nint main()\n{\n  cout << "sqrt(16) = " << sqrt(16.0) << endl;\n  cout << "pow(2, 10) = " << pow(2.0, 10.0) << endl;\n  cout << "fabs(-3.5) = " << fabs(-3.5) << endl;\n  cout << "cos(0) = " << cos(0.0) << endl;\n  return 0;\n}\n' },
    { re: /setw|setprecision|iomanip|\\t|\\n|endl|cout|cin/i, n: 'cout / cin', why: '<b>cout &lt;&lt;</b> печатает, <b>cin &gt;&gt;</b> читает ввод, <b>endl</b> и <b>"\\n"</b> — перевод строки, <b>"\\t"</b> — табуляция. Попробуй ввести числа в поле «Ввод».', code: H + '  int a, b;\n  cout << "Введите два числа: ";\n  cin >> a >> b;\n  cout << endl << "a + b =\\t" << a + b << endl;\n  cout << "a * b =\\t" << a * b << "\\n";\n  return 0;\n}\n', input: '3 4' },
    { re: /\bconst\b|констант/i, n: 'const', why: '<b>const</b> — переменная, которую нельзя менять после создания. Компилятор не даст случайно её испортить. Попробуй раскомментировать строку и запусти.', code: H + '  const double PI = 3.14159;\n  double r = 2;\n  cout << "площадь круга = " << PI * r * r << endl;\n  // PI = 3;   // ошибка: const менять нельзя\n  return 0;\n}\n' }
  ];

  /* ---------- код из вопроса → программа с «проходами» ---------- */
  var KW = /^(int|float|double|char|bool|long|short|unsigned|signed|void|return|if|else|for|while|do|switch|case|default|break|continue|cout|cin|endl|true|false|const|static|new|delete|sizeof|struct|main|include|using|namespace|std|getch|clrscr|NULL|string|printf|scanf|puts|gets|strlen|strcpy|strcat|strcmp|sqrt|pow|abs|fabs|sin|cos|exp|log|erase|insert|length|size|substr|find)$/;
  function snippetOf(q) {
    var m = String(q.q || '').match(/```[a-z+]*\n?([\s\S]*?)```/);
    return m ? m[1].trim() : null;
  }
  function blank(m) { return m.replace(/[^\n]/g, ' '); }
  /* строки и комментарии заменяем пробелами той же длины — позиции совпадают с исходником */
  function stripStr(s) { return s.replace(/"(\\.|[^"\\\n])*"|'(\\.|[^'\\\n])*'/g, function (m) { return m[0] + blank(m.slice(1, -1)) + m[0]; }).replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, blank); }
  function matchParen(s, i) { var d = 0; for (; i < s.length; i++) { if (s[i] === '(') d++; else if (s[i] === ')') { d--; if (!d) return i; } } return -1; }
  function matchBrace(s, i) { var d = 0; for (; i < s.length; i++) { if (s[i] === '{') d++; else if (s[i] === '}') { d--; if (!d) return i; } } return -1; }
  function stmtEnd(s, i) { var d = 0; for (; i < s.length; i++) { var c = s[i]; if (c === '(' || c === '{') d++; else if (c === ')' || c === '}') d--; else if (c === ';' && d <= 0) return i; } return -1; }
  function declsIn(s) {   /* имена объявленных переменных: [{n, arr, pos, depth}] */
    var out = [], re = /\b(?:unsigned\s+|signed\s+|const\s+|static\s+)*(int|float|double|char|bool|long|short|string)\s+(?:const\s+)?([^;(){}]+?)(?=;|\)|\{)/g, m, cs = stripStr(s);
    while ((m = re.exec(cs))) {
      var depth = 0, par = 0; for (var k = 0; k < m.index; k++) { var ch = cs[k]; if (ch === '{') depth++; else if (ch === '}') depth--; else if (ch === '(') par++; else if (ch === ')') par--; }
      if (par > 0) depth = 99;   /* объявлено в заголовке for( … ) — снаружи цикла не видно */
      m[2].split(',').forEach(function (part) { var nm = part.replace(/=.*$/, '').replace(/^\s*const\s+/, '').trim(), arr = /\[/.test(nm); nm = nm.replace(/\[.*$/, '').replace(/[*&\s]/g, ''); if (/^[A-Za-z_]\w*$/.test(nm)) out.push({ n: nm, arr: arr, pos: m.index, depth: depth, ptr: /\*/.test(part.replace(/=.*$/, '')) }); });
    }
    return out;
  }
  function buildRun(snip) {
    var s = snip.replace(/\r/g, '');
    var INC = '#include <iostream.h>\n#include <stdio.h>\n#include <conio.h>\n#include <math.h>\n#include <string.h>\n' + (/\bstring\b/.test(s) ? '#include <string>\nusing namespace std;\n' : '');
    if (/\bmain\s*\(/.test(s)) {
      if (!/#include/.test(s)) s = INC + '\n' + s;
      return { code: s, traced: false };
    }
    /* только определения функций — добавим main(), который их вызывает с примерами */
    var fre = /(?:^|\n)\s*(int|float|double|char|bool|void|long)\s+(\w+)\s*\(([^)]*)\)\s*\{/g, fm, fns = [];
    while ((fm = fre.exec(s))) fns.push({ ty: fm[1], n: fm[2], ps: fm[3].trim() ? fm[3].split(',').length : 0 });
    if (fns.length && /^\s*(int|float|double|char|bool|void|long)\s+\w+\s*\(/.test(s)) {
      var calls = fns.map(function (f) {
        return [[3, 7, 5, 2], [7, 3, 2, 5]].slice(0, f.ps ? 2 : 1).map(function (vals) { var a = vals.slice(0, f.ps).join(', '); return f.ty === 'void' ? '  cout << "вызов ' + f.n + '(' + a + '):" << endl;  ' + f.n + '(' + a + ');\n' : '  cout << "' + f.n + '(' + a + ') = " << ' + f.n + '(' + a + ') << endl;\n'; }).join('');
      }).join('');
      return { code: INC + '\n' + s + '\n\nint main()\n{\n  // ↓ вызовы для примера — поменяй числа\n' + calls + '  return 0;\n}\n', traced: false, fn: true };
    }
    var cs = stripStr(s), dec = declsIn(s), names = {}; dec.forEach(function (d) { names[d.n] = 1; });
    /* необъявленные переменные (во фрагментах их часто «опускают») — объявим сами */
    var auto = [], arrs = [], id, re = /\b([A-Za-z_]\w*)\b(\s*\[)?/g;
    while ((id = re.exec(cs))) {
      var n = id[1];
      if (/[.>]/.test(cs.charAt(id.index - 1)) || KW.test(n) || names[n] || /\(/.test(cs.charAt(re.lastIndex + (cs.slice(re.lastIndex).match(/^\s*/)[0].length)))) continue;
      names[n] = 1; if (id[2]) arrs.push(n); else auto.push(n);
    }
    var dbl = function (n) { return new RegExp('\\b' + n + '\\s*=\\s*-?\\d+\\.\\d').test(cs); };
    var pre = auto.map(function (n) { return '  ' + (dbl(n) ? 'double ' : 'int ') + n + ' = 0;\n'; }).join('') + arrs.map(function (n) {
      return new RegExp('\\b' + n + '\\s*\\[[^\\]]*\\]\\s*\\[').test(cs) ? '  int ' + n + '[10][10];  // заполним: ' + n + '[i][j] = i + j + 1\n  for (int __i = 0; __i < 10; __i++) for (int __j = 0; __j < 10; __j++) ' + n + '[__i][__j] = __i + __j + 1;\n'
        : '  int ' + n + '[100];  // заполним: ' + n + '[i] = i + 1\n  for (int __i = 0; __i < 100; __i++) ' + n + '[__i] = __i + 1;\n';
    }).join('');
    if (auto.length || arrs.length) pre = '  // эти переменные во фрагменте не объявлены — объявил сам, поменяй значения\n' + pre;
    var top = dec.filter(function (d) { return d.depth === 0 && !d.arr && !d.ptr; });
    var scal = auto.concat(top.map(function (d) { return d.n; }));
    /* вставляем «проход N» в начало тела каждого цикла */
    var body = s, loops = 0, out = '', i = 0, lre = /\b(for|while)\s*\(|\bdo\b\s*\{/g, mm;
    var visible = function (pos, extra) { return scal.filter(function (n) { var d = top.filter(function (x) { return x.n === n; })[0]; return !d || d.pos < pos; }).concat(extra || []); };
    var trace = function (k, vars) { return ' __k' + k + '++; cout << "  проход " << __k' + k + ' << ":"' + vars.map(function (v) { return ' << "  ' + v + '=" << ' + v; }).join('') + ' << endl; '; };
    var cb = stripStr(body), counters = [], skipW = {};
    while ((mm = lre.exec(cb))) {
      var st = mm.index, hdrEnd, bodyStart, extra = [];
      if (mm[1]) {
        var po = cb.indexOf('(', st), pc = matchParen(cb, po); if (pc < 0) break;
        var hdr = body.slice(po + 1, pc), hv = hdr.match(/^\s*(?:int|long|short|char|double|float|unsigned)\s+([A-Za-z_]\w*)/); if (hv) extra.push(hv[1]);
        if (skipW[st]) continue;   /* while после do { } — хвост do-while, не новый цикл */
        hdrEnd = pc + 1; var ws = cb.slice(hdrEnd).match(/^\s*/)[0].length; bodyStart = hdrEnd + ws;
        if (cb[bodyStart] === ';') continue;
        if (bodyStart >= cb.length) { loops++; counters.push(loops); out += body.slice(i) + ' {' + trace(loops, visible(st, extra)) + '}'; i = body.length; break; }   /* в вопросе только заголовок цикла */
        loops++; counters.push(loops);
        if (cb[bodyStart] === '{') { out += body.slice(i, bodyStart + 1) + trace(loops, visible(st, extra)); i = bodyStart + 1; }
        else { var se = stmtEnd(cb, bodyStart); if (se < 0) break; out += body.slice(i, bodyStart) + '{' + trace(loops, visible(st, extra)) + body.slice(bodyStart, se + 1) + ' }'; i = se + 1; }
        lre.lastIndex = Math.max(lre.lastIndex, i);
      } else {
        bodyStart = cb.indexOf('{', st); loops++; counters.push(loops);
        var be = matchBrace(cb, bodyStart), wm = be > 0 ? cb.slice(be + 1).match(/^\s*while\b/) : null; if (wm) skipW[be + 1 + wm[0].length - 5] = 1;
        out += body.slice(i, bodyStart + 1) + trace(loops, visible(st)); i = bodyStart + 1; lre.lastIndex = i;
      }
    }
    out += body.slice(i);
    var fin = scal.length ? '  cout << "После:"' + scal.map(function (v) { return ' << "  ' + v + '=" << ' + v; }).join('') + ' << endl;\n' : '';
    var cnt = counters.map(function (k) { return '  cout << "цикл ' + (counters.length > 1 ? '№' + k + ' ' : '') + 'повторился " << __k' + k + ' << " раз(а)" << endl;\n'; }).join('');
    var code = INC + '\nint main()\n{\n' + pre + counters.map(function (k) { return '  int __k' + k + ' = 0;\n'; }).join('') +
      '  // ↓ код из вопроса' + (loops ? ' (строки «проход N» вставлены, чтобы видеть каждый шаг)' : '') + '\n  ' + out.replace(/\n/g, '\n  ') + '\n  // ↑\n' + fin + cnt + '  return 0;\n}\n';
    var plainCode = INC + '\nint main()\n{\n' + pre + '  ' + s.replace(/\n/g, '\n  ') + '\n' + fin + '  return 0;\n}\n';
    return { code: code, plain: plainCode, traced: loops > 0 };
  }

  /* ================= Архитектура: тренажёры ================= */
  var BASE_W = [[/двоичн|binary|\bbin\b/i, 2], [/восьмеричн|octal/i, 8], [/шестнадцатеричн|hex/i, 16], [/десятичн|decimal/i, 10]];
  function baseWords(t) { var found = []; BASE_W.forEach(function (b) { var m = t.search(b[0]); if (m >= 0) found.push([m, b[1]]); }); return found.sort(function (a, b) { return a[0] - b[0]; }).map(function (x) { return x[1]; }); }
  /* \b в JS не понимает кириллицу — своя «граница слова» */
  function W(word) { return new RegExp('(^|[^А-Яа-яЁёA-Za-z-])' + word + '(?=$|[^А-Яа-яЁёA-Za-z-])', 'i'); }
  function archFind(q) {
    var t = plain(q.q), r = plain(rightOf(q)), both = t + ' ' + r, out = [], m;
    var has = function (tool) { return out.some(function (o) { return o.tool === tool; }); };
    if ((m = t.match(/\b([01]{2,})\s*\+\s*([01]{2,})\b/))) out.push({ tool: 'sum', label: 'Сложение в двоичной', init: { a: m[1], b: m[2] } });
    if (/хэмминг|хемминг|hamming|ecc/i.test(both)) {
      m = t.match(/\b([01]{4,})\b/); var enc = /постро|закодир|кодирован|сколько\s+бит[а-яё]*\s+ч[её]тн|контрольн[а-яё]+\s+бит/i.test(t);
      out.push({ tool: 'ham', label: 'Код Хэмминга', init: { bits: m ? m[1] : (enc ? '1001' : '111001000'), enc: enc && !/ошибк/i.test(t) } });
    }
    if ((m = t.match(/\b([0-9A-F]{8}|[0-9A-F]{4})h\b/i)) || /single|half|плаваю|мантисс|порядок|порядк|ieee|float|вещественн|точност/i.test(both)) out.push({ tool: 'flt', label: 'Число с плавающей точкой', init: { hex: m ? m[1].toUpperCase() : (/половин|half/i.test(t) ? 'C620' : 'C2440000') } });
    var neg = t.match(/\(?\s*(-|−)\s*(\d+)\s*\)?/);
    if ((/знаков|беззнаков|дополнительн[а-яё]* код|обратн[а-яё]* код|прям[а-яё]* код|байт|переполнен|8-бит/i.test(both) || (neg && baseWords(t).length)) && !has('flt')) {
      var n = neg ? -(+neg[2]) : (m = t.replace(/\d+\s*-?\s*бит[а-яё]*/g, ' ').match(/\d+/)) ? +m[0] : null;
      if (n == null) n = /максимальн[а-яё]* беззнаков/i.test(t) ? 255 : /минимальн[а-яё]* знаков/i.test(t) ? -128 : /максимальн[а-яё]* знаков/i.test(t) ? 127 : /беззнаков|без знака/i.test(t) ? 200 : -115;
      if (n > 255 || n < -128) n = -115;
      out.push({ tool: 'sgn', label: 'Знаковые числа в байте', init: { n: n } });
    }
    var bw = baseWords(t);
    if (!has('sum') && !(has('sgn') && neg) && (bw.length || /систем[а-яё]* счислен|перевед|перевод/i.test(t))) {
      var num = (t.match(/\b[0-9A-F]+\b(?=[^0-9A-F]*(в|to)(?=\s))/i) || t.match(/\b(?=\w*\d)[0-9A-F]+\b/i) || [''])[0];
      var from = bw.length > 1 ? bw[0] : (/^[01]+$/.test(num) && num.length > 3 ? 2 : /[A-F]/i.test(num) ? 16 : 10), to = bw.length > 1 ? bw[1] : (bw[0] && bw[0] !== from ? bw[0] : 2);
      if (/^\s*(Шестнадцатеричн|Двоичн|Восьмеричн)/i.test(t) && bw.length === 1) { from = bw[0]; to = 10; }
      if (to === from) to = from === 10 ? 2 : 10;
      out.push({ tool: 'conv', label: 'Перевод чисел', init: { num: num || '89', from: from, to: to } });
    }
    if (/де морган|de morgan/i.test(both)) out.push({ tool: 'gate', label: 'Закон де Моргана', init: { g: 'morgan' } });
    var logic = /логическ|вентил|элемент|операци|таблиц|функци|схем|кружок/i.test(t);
    var g = /исключающ[а-яё]*.*ИЛИ-НЕ|XNOR|эквивалентност/i.test(both) ? 'XNOR' : /исключающ|XOR|сложени[а-яё]* по модулю/i.test(both) ? 'XOR' : /И-НЕ|NAND|штрих[а-яё]* шеффера/i.test(both) ? 'NAND' : /ИЛИ-НЕ|NOR|стрелк[а-яё]* пирса/i.test(both) ? 'NOR' :
      /дизъюнкц/i.test(t) ? 'OR' : /конъюнкц/i.test(t) ? 'AND' : /инверси|отрицани/i.test(t) && logic && !/код/i.test(t) ? 'NOT' : !logic ? '' :
      W('ИЛИ').test(r) || /\bOR\b|дизъюнкц|логическ[а-яё]* сложени/i.test(r) ? 'OR' : W('НЕ').test(r) || /\bNOT\b|инвер|отрицани/i.test(r) ? 'NOT' : W('И').test(r) || /\bAND\b|конъюнкц|логическ[а-яё]* умножени/i.test(r) ? 'AND' : '';
    if (!g && /вентил|логическ[а-яё]* элемент|таблиц[а-яё]* истинност|кружок на выходе/i.test(t)) g = /кружок|инверс/i.test(both) ? 'NAND' : 'AND';
    if (g && !has('gate')) out.push({ tool: 'gate', label: 'Логические вентили', init: { g: g } });
    return out;
  }

  var GATES = {
    AND: { ru: 'И (AND)', f: function (a, b) { return a & b; }, why: 'Выход 1, только когда <b>оба</b> входа 1. Нужно как «маска»: пропустить сигнал, только если разрешено.' },
    OR: { ru: 'ИЛИ (OR)', f: function (a, b) { return a | b; }, why: 'Выход 1, когда <b>хотя бы один</b> вход 1. Нужно, чтобы собрать несколько сигналов в один (любая кнопка включает лампу).' },
    NOT: { ru: 'НЕ (NOT)', f: function (a) { return a ? 0 : 1; }, one: 1, why: 'Переворачивает сигнал: 0 → 1, 1 → 0. Кружок на выходе вентиля — это и есть НЕ.' },
    NAND: { ru: 'И-НЕ (NAND)', f: function (a, b) { return (a & b) ? 0 : 1; }, why: 'И, а потом НЕ (кружок на выходе): 0 только когда оба 1. Из одних И-НЕ можно собрать любую схему — поэтому их много в микросхемах.' },
    NOR: { ru: 'ИЛИ-НЕ (NOR)', f: function (a, b) { return (a | b) ? 0 : 1; }, why: 'ИЛИ, а потом НЕ: 1 только когда оба входа 0. Тоже «универсальный» вентиль; из двух NOR делают RS-триггер (ячейку памяти).' },
    XOR: { ru: 'Исключающее ИЛИ (XOR)', f: function (a, b) { return a ^ b; }, why: '1, когда входы <b>разные</b>. Это сумма двух битов без переноса — сердце сумматора; ещё им считают контрольные биты (чётность, Хэмминг).' },
    XNOR: { ru: 'Исключающее ИЛИ-НЕ (XNOR)', f: function (a, b) { return (a ^ b) ? 0 : 1; }, why: '1, когда входы <b>одинаковые</b> — «сравниватель» битов (компаратор).' }
  };
  function gateSvg(g, a, b, y) {
    var w = function (v) { return v ? '#5DCAA5' : '#7d7a92'; }, one = GATES[g] && GATES[g].one, bub = /N/.test(g) && g !== 'AND' && g !== 'OR' || g === 'NOT';
    var shape = g === 'NOT' ? '<path d="M70 20 L70 80 L125 50 Z" fill="#2a2540" stroke="#AFA9EC" stroke-width="3"/>' :
      /AND/.test(g) ? '<path d="M70 15 H100 A35 35 0 0 1 100 85 H70 Z" fill="#2a2540" stroke="#AFA9EC" stroke-width="3"/>' :
      '<path d="M65 15 Q85 50 65 85 Q115 85 135 50 Q115 15 65 15 Z" fill="#2a2540" stroke="#AFA9EC" stroke-width="3"/>' + (/X/.test(g) ? '<path d="M56 15 Q76 50 56 85" fill="none" stroke="#AFA9EC" stroke-width="3"/>' : '');
    var ox = g === 'NOT' ? 125 : 135;
    return '<svg viewBox="0 0 220 100" class="tr-svg" role="img" aria-label="Вентиль ' + g + '">' +
      (one ? '<line x1="10" y1="50" x2="70" y2="50" stroke="' + w(a) + '" stroke-width="4"/>' : '<line x1="10" y1="33" x2="72" y2="33" stroke="' + w(a) + '" stroke-width="4"/><line x1="10" y1="67" x2="72" y2="67" stroke="' + w(b) + '" stroke-width="4"/>') +
      shape + (bub ? '<circle cx="' + (ox + 7) + '" cy="50" r="7" fill="#1b1825" stroke="#AFA9EC" stroke-width="3"/>' : '') +
      '<line x1="' + (ox + (bub ? 14 : 0)) + '" y1="50" x2="190" y2="50" stroke="' + w(y) + '" stroke-width="4"/><circle cx="202" cy="50" r="11" fill="' + (y ? '#FFD25A' : '#3a3352') + '"/></svg>';
  }
  var bits = function (n, w) { var s = (n >>> 0).toString(2); while (s.length < w) s = '0' + s; return s.slice(-w); };
  var TOOLS = {
    conv: function (box, o) {
      box.innerHTML = '<div class="tr-row"><label>Число <input class="tr-in" data-n value="' + esc(o.num) + '"></label><label>из <select data-f>' + [2, 8, 10, 16].map(function (b) { return '<option' + (b === o.from ? ' selected' : '') + '>' + b + '</option>'; }).join('') + '</select></label><label>в <select data-t>' + [2, 8, 10, 16].map(function (b) { return '<option' + (b === o.to ? ' selected' : '') + '>' + b + '</option>'; }).join('') + '</select></label></div><div class="tr-out"></div>' +
        '<p class="tr-why">Зачем: компьютер хранит всё в двоичной (0 и 1), а шестнадцатеричной программисты коротко записывают байты — одна цифра = 4 бита (тетрада), восьмеричная цифра = 3 бита (триада).</p>';
      var upd = function () {
        var s = box.querySelector('[data-n]').value.trim().toUpperCase(), f = +box.querySelector('[data-f]').value, t = +box.querySelector('[data-t]').value, out = box.querySelector('.tr-out');
        var ok = s && s.split('').every(function (c) { var v = parseInt(c, 36); return v < f; }); if (!ok) { out.innerHTML = '<p class="tr-bad">В системе с основанием ' + f + ' есть только цифры ' + '0123456789ABCDEF'.slice(0, f).split('').join(' ') + '.</p>'; return; }
        var v = parseInt(s, f), h = '';
        if (f !== 10) h += '<p><b>Шаг 1. В десятичную:</b> каждую цифру умножаем на ' + f + ' в степени её места (справа, с нуля):</p><p class="tr-mono">' + s.split('').map(function (c, i) { return parseInt(c, 16) + '·' + f + '<sup>' + (s.length - 1 - i) + '</sup>'; }).join(' + ') + ' = <b>' + v + '</b></p>';
        if (t !== 10) {
          if ((f === 2 && (t === 16 || t === 8)) || (t === 2 && (f === 16 || f === 8))) {
            var k = (f === 8 || t === 8) ? 3 : 4, bin = v.toString(2); while (bin.length % k) bin = '0' + bin;
            var grp = bin.match(new RegExp('.{' + k + '}', 'g'));
            h += '<p><b>Короткий путь:</b> группы по ' + k + ' бита (' + (k === 4 ? 'тетрады' : 'триады') + '):</p><table class="tr-tab"><tr>' + grp.map(function (g) { return '<td class="tr-mono">' + g + '</td>'; }).join('') + '</tr><tr>' + grp.map(function (g) { return '<td><b>' + parseInt(g, 2).toString(16).toUpperCase() + '</b></td>'; }).join('') + '</tr></table>';
          } else {
            var rows = '', x = v; if (!x) rows = '<tr><td>0</td><td>0</td></tr>';
            while (x > 0) { rows += '<tr><td>' + x + ' : ' + t + ' = ' + Math.floor(x / t) + '</td><td>остаток <b>' + (x % t).toString(16).toUpperCase() + '</b></td></tr>'; x = Math.floor(x / t); }
            h += '<p><b>' + (f !== 10 ? 'Шаг 2. Д' : 'Д') + 'елим на ' + t + ', пока не станет 0;</b> остатки читаем <b>снизу вверх</b>:</p><table class="tr-tab">' + rows + '</table>';
          }
        }
        h += '<p class="tr-ans">' + s + '<sub>' + f + '</sub> = <b>' + v.toString(t).toUpperCase() + '</b><sub>' + t + '</sub></p><p class="tr-mini">Во всех системах: 2 → ' + v.toString(2) + ' · 8 → ' + v.toString(8) + ' · 10 → ' + v + ' · 16 → ' + v.toString(16).toUpperCase() + '</p>';
        out.innerHTML = h;
      };
      box.querySelectorAll('input,select').forEach(function (e) { e.oninput = upd; }); upd();
    },
    sum: function (box, o) {
      box.innerHTML = '<div class="tr-row"><input class="tr-in tr-mono" data-a value="' + o.a + '"> + <input class="tr-in tr-mono" data-b value="' + o.b + '"></div><div class="tr-out"></div><p class="tr-why">Правило: 0+0=0, 0+1=1, 1+1=10 (пишем 0, 1 переносим), 1+1+1=11. Так складывает сумматор процессора: сумма бита — XOR, перенос — AND.</p>';
      var upd = function () {
        var a = box.querySelector('[data-a]').value.replace(/[^01]/g, ''), b = box.querySelector('[data-b]').value.replace(/[^01]/g, ''), n = Math.max(a.length, b.length) + 1;
        if (!a || !b) return; var A = a.padStart(n, '0'), B = b.padStart(n, '0'), c = 0, R = '', C = '';
        for (var i = n - 1; i >= 0; i--) { var s = +A[i] + +B[i] + c; R = (s % 2) + R; C = (s > 1 ? '1' : ' ') + C; c = s > 1 ? 1 : 0; }
        var cell = function (s, cls) { return s.split('').map(function (ch) { return '<td class="' + (cls || '') + '">' + (ch === ' ' ? '' : ch) + '</td>'; }).join(''); };
        R = R.replace(/^0+(?=.)/, '');
        box.querySelector('.tr-out').innerHTML = '<table class="tr-tab tr-mono tr-add"><tr class="tr-carry"><td></td>' + cell(C.slice(1) + ' ') + '</tr><tr><td></td>' + cell(A.replace(/^0/, ' ')) + '</tr><tr><td>+</td>' + cell(B.replace(/^0/, ' ')) + '</tr><tr class="tr-sum"><td>=</td>' + cell(R.padStart(n, ' ')) + '</tr></table>' +
          '<p class="tr-mini">Маленькие цифры сверху — переносы. Проверка в десятичной: ' + parseInt(a, 2) + ' + ' + parseInt(b, 2) + ' = ' + (parseInt(a, 2) + parseInt(b, 2)) + '</p><p class="tr-ans">Ответ: <b>' + R + '</b></p>';
      };
      box.querySelectorAll('input').forEach(function (e) { e.oninput = upd; }); upd();
    },
    gate: function (box, o) {
      var g = o.g === 'morgan' ? 'NAND' : o.g, A = 1, B = 0, morgan = o.g === 'morgan';
      var draw = function () {
        var G = GATES[g], y = G.f(A, B), tab = '<table class="tr-tab"><tr><th>A</th>' + (G.one ? '' : '<th>B</th>') + '<th>Y</th></tr>' + (G.one ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]]).map(function (r) { var on = r[0] === A && (G.one || r[1] === B); return '<tr class="' + (on ? 'on' : '') + '"><td>' + r[0] + '</td>' + (G.one ? '' : '<td>' + r[1] + '</td>') + '<td><b>' + G.f(r[0], r[1]) + '</b></td></tr>'; }).join('') + '</table>';
        var mg = morgan ? '<div class="tr-morgan"><p><b>Де Морган:</b> НЕ(A И B) = НЕ A ИЛИ НЕ B, &nbsp; НЕ(A ИЛИ B) = НЕ A И НЕ B.</p><table class="tr-tab"><tr><th>A</th><th>B</th><th>¬(A∧B)</th><th>¬A∨¬B</th><th>¬(A∨B)</th><th>¬A∧¬B</th></tr>' + [[0, 0], [0, 1], [1, 0], [1, 1]].map(function (r) { var a = r[0], b = r[1]; return '<tr class="' + (a === A && b === B ? 'on' : '') + '"><td>' + a + '</td><td>' + b + '</td><td>' + (1 - (a & b)) + '</td><td>' + ((1 - a) | (1 - b)) + '</td><td>' + (1 - (a | b)) + '</td><td>' + ((1 - a) & (1 - b)) + '</td></tr>'; }).join('') + '</table><p class="tr-mini">Столбцы попарно одинаковые на всех строках — значит, формулы равны. Так И-НЕ заменяют на ИЛИ с инверсными входами.</p></div>' : '';
        box.innerHTML = '<div class="tr-row">' + Object.keys(GATES).map(function (k) { return '<button class="tr-chip' + (k === g ? ' on' : '') + '" data-g="' + k + '">' + k + '</button>'; }).join('') + '</div>' +
          '<div class="tr-gate"><div class="tr-ins"><button class="tr-bit' + (A ? ' on' : '') + '" data-in="A">A = ' + A + '</button>' + (G.one ? '' : '<button class="tr-bit' + (B ? ' on' : '') + '" data-in="B">B = ' + B + '</button>') + '</div>' + gateSvg(g, A, B, y) + '<div class="tr-y">Y = <b>' + y + '</b></div></div>' +
          '<p class="tr-mini">Нажимай на A и B — лампочка покажет выход. ' + G.ru + '</p>' + tab + '<p class="tr-why">' + G.why + '</p>' + mg;
        box.querySelectorAll('[data-g]').forEach(function (b) { b.onclick = function () { g = b.getAttribute('data-g'); draw(); }; });
        box.querySelectorAll('[data-in]').forEach(function (b) { b.onclick = function () { if (b.getAttribute('data-in') === 'A') A = 1 - A; else B = 1 - B; draw(); }; });
      };
      draw();
    },
    ham: function (box, o) {
      var enc = !!o.enc;
      var head = function () {
        box.innerHTML = '<div class="tr-row"><button class="tr-chip' + (enc ? '' : ' on') + '" data-m="0">Найти ошибку</button><button class="tr-chip' + (enc ? ' on' : '') + '" data-m="1">Построить код из данных</button></div>' +
          '<div class="tr-row"><label>' + (enc ? 'Данные' : 'Код') + ' <input class="tr-in tr-mono" data-h value="' + o.bits + '"></label></div><div class="tr-out"></div><p class="tr-why">Зачем: при передаче и в памяти (ECC) бит может «перевернуться». Контрольные биты стоят на местах 1, 2, 4, 8… Каждый проверяет «свои» позиции; номера проверок, которые не сошлись, в сумме дают номер испорченного бита — его можно сразу исправить.</p>';
        box.querySelectorAll('[data-m]').forEach(function (b) { b.onclick = function () { enc = b.getAttribute('data-m') === '1'; o.bits = enc ? '1001' : '111001000'; head(); }; });
        box.querySelector('input').oninput = function () { o.bits = this.value; upd(); };
        upd();
      };
      var encode = function (d, out) {
        var r = 0; while ((1 << r) < d.length + r + 1) r++;
        var n = d.length + r, c = [], k = 0, rows = '';
        for (var i = 1; i <= n; i++) c[i] = (i & (i - 1)) === 0 ? '?' : d[k++];
        for (var p = 1; p <= n; p <<= 1) { var pos = [], x = 0; for (var j = 1; j <= n; j++) if ((j & p) && j !== p) { pos.push(j); x ^= +c[j]; } c[p] = String(x); rows += '<tr><td>бит ' + p + '</td><td class="tr-mono">' + (pos.join(',') || '—') + '</td><td class="tr-mono">' + (pos.map(function (j) { return c[j]; }).join('⊕') || '0') + ' = <b>' + x + '</b></td></tr>'; }
        var code = c.slice(1).join('');
        out.innerHTML = '<p>Данных ' + d.length + ' бит → нужно <b>' + r + '</b> контрольных (2<sup>' + r + '</sup> ≥ ' + d.length + ' + ' + r + ' + 1). Всего ' + n + ' бит.</p><table class="tr-tab tr-ham"><tr>' + c.slice(1).map(function (ch, i) { var q = i + 1, isP = (q & (q - 1)) === 0; return '<td class="' + (isP ? 'tr-p' : '') + '"><small>' + q + '</small><br>' + ch + '</td>'; }).join('') + '</tr></table>' +
          '<table class="tr-tab"><tr><th>Контрольный</th><th>Проверяет</th><th>XOR</th></tr>' + rows + '</table><p class="tr-ans">Код Хэмминга: <b class="tr-mono">' + code + '</b></p><p class="tr-mini">Переключись на «Найти ошибку» и испорти один бит — синдром покажет, какой.</p>';
      };
      var upd = function () {
        var s = String(o.bits).replace(/[^01]/g, ''), n = s.length, out = box.querySelector('.tr-out'); if (n < (enc ? 1 : 3)) { out.innerHTML = ''; return; }
        if (enc) return encode(s, out);
        var syn = 0, rows = '';
        for (var p = 1; p <= n; p <<= 1) {
          var pos = [], x = 0; for (var i = 1; i <= n; i++) if (i & p) { pos.push(i); x ^= +s[i - 1]; }
          if (x) syn += p;
          rows += '<tr><td>S' + p + '</td><td class="tr-mono">' + pos.join(',') + '</td><td class="tr-mono">' + pos.map(function (i) { return s[i - 1]; }).join('⊕') + ' = <b>' + x + '</b></td></tr>';
        }
        var cells = s.split('').map(function (c, i) { var k = i + 1, isP = (k & (k - 1)) === 0; return '<td class="tr-flip ' + (isP ? 'tr-p' : '') + (k === syn ? ' tr-err' : '') + '" data-k="' + i + '" title="Нажми — бит перевернётся"><small>' + k + '</small><br>' + c + '</td>'; }).join('');
        out.innerHTML = '<table class="tr-tab tr-ham"><tr>' + cells + '</tr></table><p class="tr-mini">Фиолетовые — контрольные биты (1, 2, 4, 8…). Нажми на любой бит — он перевернётся, и синдром покажет, где ошибка.</p><table class="tr-tab"><tr><th>Проверка</th><th>Позиции</th><th>XOR</th></tr>' + rows + '</table>' +
          '<p class="tr-ans">' + (syn ? 'Синдром = <b>' + syn + '</b> → ошибка в бите №' + syn + '. Исправленный код: <span class="tr-mono">' + s.split('').map(function (c, i) { return i + 1 === syn ? '<b>' + (1 - c) + '</b>' : c; }).join('') + '</span>' : 'Синдром = 0 → ошибок нет.') + '</p>';
        out.querySelectorAll('[data-k]').forEach(function (td) { td.onclick = function () { var k = +td.getAttribute('data-k'); o.bits = s.slice(0, k) + (s[k] === '1' ? '0' : '1') + s.slice(k + 1); box.querySelector('[data-h]').value = o.bits; upd(); }; });
      };
      head();
    },
    sgn: function (box, o) {
      var v = Math.max(-128, Math.min(255, o.n | 0));
      var draw = function () {
        var u = v & 255, s = u > 127 ? u - 256 : u, b = bits(u, 8);
        var neg = s < 0, mag = bits(Math.abs(s), 8), inv = mag.split('').map(function (c, i) { return i === 0 ? '1' : c === '1' ? '0' : '1'; }).join('');
        box.innerHTML = '<div class="tr-row"><label>Число <input class="tr-in" type="number" min="-128" max="255" data-v value="' + v + '"></label></div>' +
          '<div class="tr-bits">' + b.split('').map(function (c, i) { return '<button class="tr-bit' + (c === '1' ? ' on' : '') + (i === 0 ? ' sign' : '') + '" data-b="' + i + '">' + c + '<small>' + (i === 0 ? 'знак' : '2<sup>' + (7 - i) + '</sup>') + '</small></button>'; }).join('') + '</div>' +
          '<table class="tr-tab"><tr><td>как <b>беззнаковое</b> (0…255)</td><td><b>' + u + '</b></td></tr><tr><td>как <b>знаковое</b> (−128…127)</td><td><b>' + s + '</b></td></tr></table>' +
          (neg ? '<p><b>Как получить код для ' + s + ':</b></p><table class="tr-tab tr-mono"><tr><td>прямой код (знак 1 + модуль)</td><td>' + ('1' + mag.slice(1)) + '</td></tr><tr><td>обратный (инвертировать всё, кроме знака)</td><td>' + inv + '</td></tr><tr><td>дополнительный (обратный + 1)</td><td><b>' + b + '</b></td></tr></table><p class="tr-mini">Короче: ' + u + ' = ' + s + ' + 256. Беззнаковое > 127 → знаковое = число − 256.</p>' : '<p class="tr-mini">Положительные числа во всех трёх кодах одинаковые. Нажми на старший бит (знак) — число станет отрицательным.</p>') +
          '<p class="tr-why">Зачем дополнительный код: процессор складывает и вычитает одной схемой, без отдельного «вычитателя». Поэтому байт хранит −128…127, а минимальное знаковое = 10000000 = −128.</p>';
        box.querySelector('[data-v]').onchange = function () { var x = parseInt(this.value, 10); if (!isNaN(x) && x >= -128 && x <= 255) { v = x; draw(); } };
        box.querySelectorAll('[data-b]').forEach(function (e) { e.onclick = function () { var k = 7 - +e.getAttribute('data-b'); var nu = u ^ (1 << k); v = nu > 127 ? nu - 256 : nu; draw(); }; });
      };
      draw();
    },
    flt: function (box, o) {
      var draw = function (hex) {
        hex = (hex || '').replace(/[^0-9A-F]/gi, '').toUpperCase(); var half = hex.length <= 4, Wd = half ? 16 : 32, E = half ? 5 : 8, M = Wd - 1 - E, bias = half ? 15 : 127;
        while (hex.length < Wd / 4) hex = '0' + hex; hex = hex.slice(0, Wd / 4);
        var b = hex.split('').map(function (c) { return bits(parseInt(c, 16), 4); }).join(''), sg = +b[0], eb = b.slice(1, 1 + E), mb = b.slice(1 + E), e = parseInt(eb, 2);
        var frac = mb.split('').reduce(function (a, c, i) { return a + (+c) * Math.pow(2, -(i + 1)); }, 0), val = e === 0 ? (sg ? -1 : 1) * frac * Math.pow(2, 1 - bias) : e === (1 << E) - 1 ? (frac ? NaN : (sg ? -Infinity : Infinity)) : (sg ? -1 : 1) * (1 + frac) * Math.pow(2, e - bias);
        var mshow = mb.replace(/0+$/, '') || '0';
        box.innerHTML = '<div class="tr-row"><label>Код (hex) <input class="tr-in tr-mono" data-x value="' + hex + '"></label><button class="tr-chip' + (!half ? ' on' : '') + '" data-w="8">single (32 бита)</button><button class="tr-chip' + (half ? ' on' : '') + '" data-w="4">half (16 бит)</button></div>' +
          '<div class="tr-fbits tr-mono"><span class="s">' + b[0] + '</span><span class="e">' + eb + '</span><span class="m">' + mb + '</span></div><p class="tr-mini"><span class="tr-k s">знак 1 бит</span> <span class="tr-k e">порядок ' + E + ' бит (смещение ' + bias + ')</span> <span class="tr-k m">мантисса ' + M + ' бит</span></p>' +
          '<table class="tr-tab"><tr><td>знак</td><td>' + sg + ' → ' + (sg ? 'минус' : 'плюс') + '</td></tr><tr><td>порядок</td><td>' + eb + '₂ = ' + e + '; ' + e + ' − ' + bias + ' = <b>' + (e - bias) + '</b></td></tr><tr><td>мантисса</td><td>1,' + mshow + '₂ (единица перед запятой не хранится)</td></tr></table>' +
          '<p class="tr-ans">' + (sg ? '−' : '') + '1,' + mshow + ' × 2<sup>' + (e - bias) + '</sup> = <b>' + String(val).replace('.', ',') + '</b></p><p class="tr-why">Зачем: так хранят дробные и огромные числа — как «научная запись» в двоичной. Поэтому 0,1 точно не записать: в двоичной это бесконечная дробь.</p>';
        box.querySelector('[data-x]').onchange = function () { draw(this.value); };
        box.querySelectorAll('[data-w]').forEach(function (x) { x.onclick = function () { draw(x.getAttribute('data-w') === '4' ? '3C00' : 'C2440000'); }; });
      };
      draw(o.hex);
    }
  };

  /* ================= поиск примеров ================= */
  T.find = function (q, sid) {
    if (!q) return [];
    var isCpp = sid === 'cpp' || (!sid && /cout|cin|int\s+main|#include|\bint\s+\w+\s*[=;\[]/.test(q.q)), isArch = sid === 'arch';
    var out = [];
    if (isCpp) {
      var sn = snippetOf(q); if (sn) { out.push({ kind: 'cpp', label: 'Код из вопроса', snip: sn }); return out; }   /* есть код — показываем только его */
      /* пример «про команду» — только для вопросов по обычному C/C++ (темы 1–6), не про формы, компоненты, классы и файлы */
      var all = String(q.q || '') + ' ' + String(q.tr || '') + ' ' + (q.opts || []).filter(function (o) { return o.right; }).map(function (o) { return o.t + ' ' + (o.tr || ''); }).join(' ');
      if (q.topic > 6 || /\bT[A-Z][a-z]+|VCL|Memo|Edit\d|Label|Button|Sender|Caption|Hint|Form\d|fopen|fprintf|fscanf|fgets|fputs|#define/.test(all) ||
        /НЕ ТОЧНО|УМКД|компонент|класс[ауео ]|объект|конструктор|деструктор|метод|наследов|полиморф|свойств|событи|обработчик|на форм|файл|директив/i.test(all)) return out;
      /* английские слова (while, for, if, true…) ищем только в коде: в обычном тексте «while the program runs» — не цикл */
      var code = [], noCode = function (s) { return String(s || '').replace(/```[\s\S]*?```|`[^`]+`/g, function (m) { code.push(m.replace(/`/g, ' ')); return ' '; }); };
      var qq = noCode(q.q), qtr = noCode(q.tr);
      var rights = (q.opts || []).filter(function (o) { return o.right; });
      var isCode = function (s) { s = String(s || ''); return s.length < 70 && !/[A-Za-z]{2,}\s+[A-Za-z]{2,}\s+[A-Za-z]{2,}/.test(s) && (/[;{}]|\w\s*\(|\+\+|--|&&|\|\||[<>=!]=|%|\[\d*\]/.test(s) || /^\s*[a-z_]\w*\s*$/.test(s)); };
      rights.forEach(function (o) { if (isCode(o.t)) code.push(o.t); });
      if (q.type === 'keyboard') code.push(String(q.answer || ''));
      var noLat = function (s) { return plain(s).replace(/[CС]\+\+/g, ' ').replace(/[A-Za-z_]+/g, ' '); };
      var t = (code.join(' ') + ' ' + noLat(qq) + ' ' + noLat(qtr) + ' ' + rights.map(function (o) { return noLat(o.tr || '') + ' ' + noLat(o.t); }).join(' ')).replace(/[CС]\+\+/g, ' ');
      for (var i = 0; i < DEMOS.length; i++) if (DEMOS[i].re.test(t)) { out.push({ kind: 'cpp', label: 'Как работает: ' + DEMOS[i].n, demo: DEMOS[i] }); break; }
    }
    if (isArch) out = archFind(q);
    return out;
  };

  /* ================= окно ================= */
  var ov = null;
  T.close = function () { var was = !!ov; if (ov) { ov.remove(); ov = null; } T.active = false; if (was && T.onClose) { var f = T.onClose; T.onClose = null; f(); } };
  /* ---------- C++: как в Builder — окно Unit1.cpp и отдельное окно программы (ввод и вывод вместе) ---------- */
  function cppPane(box, it) {
    var code, why, preset = '';
    if (it.demo) { code = it.demo.code; why = it.demo.why; preset = it.demo.input || ''; }
    else {
      var b = buildRun(it.snip); code = b.code; it._plain = b.plain;
      why = b.fn ? 'Это функция из вопроса. Я дописал <code>main()</code>, который вызывает её с примерами, — видно, что она возвращает.' :
        b.traced ? 'Это код из вопроса. Я обернул его в <code>main()</code> и вставил строки «проход N» — видно, как на каждом шаге меняются переменные и сколько раз повторился цикл.' :
        'Это код из вопроса, обёрнутый в <code>main()</code>. В конце программа печатает, какие значения получились у переменных.';
    }
    var orig = code;
    box.innerHTML = '<p class="tr-why">' + why + ' <span class="tr-mini">Поменяй код и нажми <b>F9</b> — запустится заново.</span></p>' +
      '<div class="tb-ide"><div class="tb-cap"><span>C++Builder 6 - Project1 - [Unit1.cpp]</span></div>' +
      '<div class="tb-tools"><button class="tb-b" data-run title="Run (F9)">▶ Run <u>F9</u></button><button class="tb-b" data-reset title="Вернуть исходный код">↺ Исходный код</button><span class="tb-tab">Unit1.cpp</span></div>' +
      '<div class="tb-ed"></div><div class="tb-stat"><span class="tb-pos">1: 1</span><span>Insert</span><span class="tb-msg"></span></div></div>' +
      '<div class="tb-con"><div class="tb-con-t"><span>C:\\Projects\\Project1.exe</span><i class="tb-x" title="Закрыть">×</i></div><div class="con tb-scr" tabindex="-1"></div>' +
      '<div class="tb-cin" hidden><span>&gt;</span><input spellcheck="false" autocomplete="off" aria-label="Ввод для программы"></div><div class="tb-st"></div></div>';
    var R = null, con = box.querySelector('.tb-con'), scr = box.querySelector('.tb-scr'), cin = box.querySelector('.tb-cin'), inp = cin.querySelector('input'), st = box.querySelector('.tb-st'), msg = box.querySelector('.tb-msg');
    var ed = null;
    var step = function () {
      if (!R) return;
      var r; try { r = CPP.run(R.src, { input: R.input, keys: R.keys, interactive: true, maxSteps: 300000 }); } catch (e) { r = { error: e, screen: [] }; }
      if (r.compileError) {
        if (R.auto && it._plain && R.src === orig) { orig = code = it._plain; ed.value = code; R.src = code; return step(); }   /* трассировка не прижилась — запускаем как есть */
        con.hidden = true; msg.innerHTML = '<b class="tb-err">[C++ Error] Unit1.cpp(' + (r.error.line || '?') + '): ' + esc(r.error.message) + '</b>'; if (r.error.line) ed.markLine(r.error.line); R = null; return;
      }
      con.hidden = false; msg.textContent = '';
      var screen = (r.screen || []).slice(); while (screen.length > 1 && !screen[screen.length - 1].length) screen.pop();
      scr.innerHTML = CPP.screenHTML(screen);
      scr.querySelectorAll('.cl').forEach(function (l) { if (/^\s*проход \d+:|^После:|^цикл (№\d+ )?повторился/.test(l.textContent)) l.classList.add('tb-tr'); });
      scr.scrollTop = scr.scrollHeight;
      if (r.waiting && r.waitKey) { cin.hidden = true; st.textContent = 'getch(): программа ждёт — нажми любую клавишу в этом окне'; R.waitKey = true; scr.focus({ preventScroll: true }); return; }
      R.waitKey = false;
      if (r.waiting) { cin.hidden = false; st.textContent = 'Программа ждёт ввода — напечатай и нажми Enter'; inp.focus({ preventScroll: true }); return; }
      cin.hidden = true;
      st.innerHTML = r.error ? '<b class="tb-err">Ошибка во время работы: ' + esc(r.error.message) + '</b>' : 'Программа завершилась.' + (R.auto && R.input ? ' Ввод «' + esc(R.input.replace(/\n/g, ' ').trim()) + '» я набрал сам — нажми <b>F9</b> и введи свои значения.' : ' F9 — запустить ещё раз.');
      R = null;
    };
    var run = function (auto) {
      ed.markLine(0); msg.textContent = '';
      R = { src: ed.value, input: auto ? (preset ? preset.replace(/\s*$/, '\n') : '') : '', keys: auto ? [13, 13, 13, 13, 13] : [], auto: !!auto };
      step();
    };
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); if (!R) return; R.input += inp.value + '\n'; inp.value = ''; step(); } });
    scr.addEventListener('keydown', function (e) { if (!R || !R.waitKey || e.ctrlKey || e.altKey || /^(Shift|Control|Alt|F\d+)$/.test(e.key)) return; e.preventDefault(); e.stopPropagation(); R.keys.push(e.key === 'Enter' ? 13 : e.key === 'Escape' ? 27 : e.key.length === 1 ? e.key.charCodeAt(0) : 13); step(); });
    scr.addEventListener('click', function () { if (R && R.waitKey) scr.focus(); else if (!cin.hidden) inp.focus(); });
    box.querySelector('.tb-x').onclick = function () { R = null; con.hidden = true; };
    box.querySelector('[data-run]').onclick = function () { run(false); };
    box.querySelector('[data-reset]').onclick = function () { ed.value = orig; run(true); };
    box.addEventListener('keydown', function (e) { if (e.key === 'F9') { e.preventDefault(); e.stopPropagation(); run(false); } });
    var ready = function () {
      ed = CPP.makeEditor(box.querySelector('.tb-ed'), code, function () { run(false); });
      var ta = box.querySelector('.cta'), pos = box.querySelector('.tb-pos');
      var upd = function () { var s = ta.value.slice(0, ta.selectionStart).split('\n'); pos.textContent = s.length + ': ' + (s[s.length - 1].length + 1); };
      ta.addEventListener('keyup', upd); ta.addEventListener('click', upd);
      setTimeout(function () { var k = code.indexOf('// ↓'); if (k > 0) { var ln = code.slice(0, k).split('\n').length - 1; ta.scrollTop = Math.max(0, ln - 1) * 20; } }, 0);
      run(true);
    };
    if (window.CPP && CPP.run && CPP.makeEditor) ready(); else (window.PR && PR.loadCpp ? PR.loadCpp() : Promise.reject()).then(ready, function () { st.textContent = 'Не получилось загрузить C++.'; });
  }
  T.open = function (q, sid) {
    var list = T.find(q, sid); if (!list.length) return;
    T.close(); T.active = true;
    ov = document.createElement('div'); ov.className = 'tr-ov';
    ov.innerHTML = '<div class="tr-win" role="dialog" aria-label="Попробовать"><header><b>🧪 Попробуй сам</b><span class="grow"></span><button class="btn ghost" data-x>✕</button></header>' +
      '<div class="tr-q">' + (function () { var s = String(q.q || ''); if (q.tr) { var cb = (s.match(/```[\s\S]*?```/g) || []).filter(function (c) { return String(q.tr).indexOf(c) < 0; }); s = q.tr + (cb.length ? '\n' + cb.join('\n') : ''); } return window.DG && DG.md ? DG.md(s) : esc(s); })() + '</div>' +
      (list.length > 1 ? '<div class="tr-tabs">' + list.map(function (it, i) { return '<button class="tr-chip' + (i ? '' : ' on') + '" data-tab="' + i + '">' + esc(it.label) + '</button>'; }).join('') + '</div>' : '<div class="tr-tabs"><span class="tr-chip on">' + esc(list[0].label) + '</span></div>') +
      '<div class="tr-box"></div><footer><button class="btn primary" data-x>Понятно — назад</button></footer></div>';
    document.body.appendChild(ov);
    var box = ov.querySelector('.tr-box');
    var show = function (i) { var it = list[i]; ov.querySelectorAll('[data-tab]').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-tab') === i); }); if (it.kind === 'cpp') cppPane(box, it); else TOOLS[it.tool](box, it.init); };
    ov.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { show(+b.getAttribute('data-tab')); }; });
    ov.querySelectorAll('[data-x]').forEach(function (b) { b.onclick = T.close; });
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) T.close(); });
    ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); T.close(); } });
    show(0);
    setTimeout(function () { var x = ov && ov.querySelector('header [data-x]'); if (x) x.focus(); }, 30);
  };
  T._build = buildRun; T._arch = archFind;
})();
