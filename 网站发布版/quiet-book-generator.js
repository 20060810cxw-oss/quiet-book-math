(function (global) {
  "use strict";
  const QUESTION_COUNT = 18;
  const BASIC_COUNT = 1;
  const COUNTS = { oral: 1, mixed: 2, extremum: 3, blank: 2, compare: 1, picture: 2, word: 6, extension: 1 };
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (items) => items[rand(0, items.length - 1)];
  const shuffle = (items) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = rand(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  const range = (min, max) => Array.from({ length: max - min + 1 }, (_, i) => i + min);
  const digits = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  function numberWords(n) {
    if (n < 10) return digits[n];
    return (n >= 20 ? digits[Math.floor(n / 10)] : "") + "十" + (digits[n % 10] || "");
  }
  function formula(a, b) {
    const [x, y] = [a, b].sort((u, v) => u - v);
    return digits[x] + digits[y] + (x * y < 10 ? "得" : "") + numberWords(x * y);
  }
  function model(a = rand(1, 9), b = rand(1, 9), op = "", c = 0) { return { a, b, op, c }; }
  function value(m) { return m.a * m.b + (m.op === "+" ? m.c : m.op === "−" ? -m.c : 0); }
  function expression(m) { return m.a + " × " + m.b + (m.op ? " " + m.op + " " + m.c : ""); }
  function mixedModel(op) {
    const m = model();
    m.op = op;
    m.c = rand(1, Math.min(19, op === "+" ? 100 - m.a * m.b : m.a * m.b));
    return m;
  }
  function uniqueOptions(answer, min = 0, max = 100) {
    const nearby = range(min, max).filter(n => n !== answer && Math.abs(n - answer) <= 12);
    const pool = nearby.length >= 3 ? nearby : range(min, max).filter(n => n !== answer);
    return shuffle([answer, ...shuffle(pool).slice(0, 3)]);
  }
  function numeric(answer, mode = pick(["input", "choice", "drag", "tap"])) {
    return { answer, mode, options: uniqueOptions(answer) };
  }
  function hints(m) {
    return {
      hint: m.op ? "先算乘法，再算加减。想想对应的乘法口诀。" : "想一想：" + digits[Math.min(m.a, m.b)] + digits[Math.max(m.a, m.b)] + "这句口诀。",
      explanation: "口诀“" + formula(m.a, m.b) + "”。" + expression(m) + " = " + value(m) + "。"
    };
  }
  function question(category, label, fields) {
    return {
      category, label, mode: "input", medalText: "思", actionText: "想一想",
      rewardTitle: "收获一枚思考奖章！", rewardText: "你读懂了题目，也认真检查了答案。",
      success: "答对啦！你的思路很清楚。",
      ...fields
    };
  }
  function oral() {
    const m = model();
    return question("oral", "乘法口算", { title: expression(m) + " = □", prompt: "想口诀，求出积。",
      ...numeric(value(m)), ...hints(m), visual: { type: "equation", parts: [m.a, "×", m.b, "="] }, math: m });
  }
  function mixed(op) {
    const m = mixedModel(op);
    return question("mixed", op === "+" ? "乘加计算" : "乘减计算", { title: expression(m) + " = □",
      prompt: "先算乘法，再算加减。", ...numeric(value(m)), ...hints(m),
      visual: { type: "equation", parts: [m.a, "×", m.b, op, m.c, "="] }, math: m });
  }
  function extremum(kind) {
    const max = kind === "max" || (kind === "mixed" && Math.random() < 0.5);
    const b = rand(2, 9), boundary = rand(2, 8);
    const op = kind === "mixed" ? pick(["+", "−"]) : "";
    const c = op ? rand(1, op === "−" ? Math.min(19, b) : 19) : 0;
    const offset = op === "+" ? c : op === "−" ? -c : 0;
    const limit = boundary * b + offset + (max ? 1 : -1);
    const solutions = range(1, 9).filter(x => max ? x * b + offset < limit : x * b + offset > limit);
    const answer = max ? Math.max(...solutions) : Math.min(...solutions);
    const relation = max ? "<" : ">";
    return question("extremum", max ? "最大能填几" : "最小能填几", {
      title: "□ × " + b + (op ? " " + op + " " + c : "") + " " + relation + " " + limit,
      prompt: "□里填1—9中的整数，" + (max ? "最大" : "最小") + "能填几？",
      ...numeric(answer, "input"), hint: "把1—9代进去试一试。注意要严格" + (max ? "小于" : "大于") + "，不能相等。",
      explanation: "符合条件的数是 " + solutions.join("、") + "，所以" + (max ? "最大" : "最小") + "填 " + answer + "。",
      visual: { type: "instruction", text: "可选整数：1、2、3、4、5、6、7、8、9" },
      constraint: { b, op, c, limit, relation, seek: max ? "max" : "min" }
    });
  }
  function blank(kind) {
    const m = kind === "factor" ? model() : mixedModel(pick(["+", "−"]));
    const answer = kind === "factor" ? m.a : m.c;
    const text = kind === "factor" ? "□ × " + m.b + " = " + value(m)
      : m.a + " × " + m.b + " " + m.op + " □ = " + value(m);
    return question("blank", kind === "factor" ? "乘数填空" : "加减数填空", {
      title: text, prompt: kind === "factor" ? "□里填1—9中的整数。" : "□里填0—19中的整数。",
      ...numeric(answer, pick(["input", "choice"])), options: uniqueOptions(answer, kind === "factor" ? 1 : 0, kind === "factor" ? 9 : 19),
      hint: kind === "factor" ? "想一想哪句口诀的积是" + value(m) + "。" : "先算出乘法的积，再想它怎样变成右边的数。",
      explanation: expression(m) + " = " + value(m) + "，所以填 " + answer + "。",
      visual: { type: "instruction", text: "让等号两边一样大。" }, math: m, blankKind: kind
    });
  }
  function compare() {
    const left = Math.random() < 0.5 ? model() : mixedModel(pick(["+", "−"]));
    const useNumber = Math.random() < 0.6;
    const right = useNumber ? null : model();
    const rightValue = useNumber ? pick([value(left), rand(0, 100)]) : value(right);
    const answer = value(left) < rightValue ? "<" : value(left) > rightValue ? ">" : "=";
    return question("compare", "比大小", {
      title: expression(left) + " ○ " + (right ? expression(right) : rightValue),
      prompt: "分别算出两边的结果，再选符号。", answer, mode: "compare", options: ["<", ">", "="],
      hint: "先算乘法，再算加减。相同大小要选等号。",
      explanation: "左边是" + value(left) + "，右边是" + rightValue + "，所以选 " + answer + "。",
      visual: { type: "compare", left: expression(left), right: right ? expression(right) : rightValue },
      left, right, rightValue
    });
  }
  function expressionOptions(m) {
    const answer = expression(m);
    // Exclude numerically equivalent distractors, including exchanged factors.
    const candidates = [];
    for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) {
      const candidate = model(a, b, m.op, m.c);
      if (value(candidate) >= 0 && value(candidate) <= 100 && value(candidate) !== value(m)) candidates.push(expression(candidate));
    }
    return shuffle([answer, ...shuffle(candidates).slice(0, 3)]);
  }
  function scene(m, icon = "●", unit = "个") {
    return { type: "groups", groups: m.b, each: m.a, op: m.op, change: m.c, icon, unit };
  }
  function picture(changed) {
    const m = model(rand(2, 9), rand(2, 6));
    if (changed) { m.op = pick(["+", "−"]); m.c = rand(1, m.a - 1); }
    return question("picture", changed ? "看图乘加减" : "看图列式", {
      title: "看图选算式：现在一共有多少个？",
      prompt: "每组" + m.a + "个，共" + m.b + "组。" + (m.op === "+" ? "另有" + m.c + "个。" : m.op === "−" ? "划去" + m.c + "个。" : ""),
      answer: expression(m), mode: "choice", options: expressionOptions(m), ...hints(m),
      visual: scene(m), math: m
    });
  }
  function word(kind) {
    const m = kind === "add" ? mixedModel("+") : kind === "subtract" ? mixedModel("−") : model();
    let title, unit = "个", visual, needed;
    const goods = [
      { name: "铅笔", unit: "支" }, { name: "橡皮", unit: "块" }, { name: "尺子", unit: "把" },
      { name: "练习本", unit: "本" }
    ];
    if (kind === "total") {
      title = "每盘有" + m.a + "个苹果，" + m.b + "盘一共有多少个苹果？";
      visual = scene(m, "🍎");
    } else if (kind === "price") {
      const item = pick(goods);
      title = item.name + "每" + item.unit + m.a + "元，买" + m.b + item.unit + "，一共需要多少钱？";
      unit = "元"; visual = { type: "instruction", text: "每" + item.unit + m.a + "元，共买" + m.b + item.unit + "。" };
    } else if (kind === "add" || kind === "subtract") {
      title = m.b + "盒彩笔，每盒" + m.a + "支，" + (kind === "add" ? "另外还有" : "送出") + m.c + "支，" + (kind === "add" ? "一共有" : "还剩") + "多少支？";
      unit = "支"; visual = scene(m, "●", "支");
    } else if (kind === "enough") {
      needed = Math.max(1, Math.min(100, value(m) + pick([-3, 0, 4])));
      title = "每张桌子坐" + m.a + "人，" + m.b + "张桌子，能坐下" + needed + "人吗？";
      unit = "人"; visual = { type: "instruction", text: "需要安排" + needed + "人入座。" };
    } else {
      const target = rand(0, 3);
      const rows = goods.map((g, i) => ({ ...g, price: i === target ? m.a : rand(1, 9) }));
      const item = rows[target];
      title = "看价格表，买" + m.b + item.unit + item.name + "需要多少钱？";
      unit = "元"; visual = { type: "price-table", rows, target, count: m.b };
    }
    const enough = value(m) >= needed;
    const steps = [
      { mode: "choice", answer: expression(m), options: expressionOptions(m), prompt: "第一步：选出符合题意的算式。",
        hint: "找到每份的数量和份数，再看有没有增加或减少。", explanation: "对应的算式是 " + expression(m) + "。" },
      kind === "enough"
        ? { mode: "choice", answer: enough ? "够" : "不够", options: ["够", "不够"],
            prompt: "第二步：算出能坐多少人，再判断够不够。", hint: "座位数和人数一样，也算够。",
            explanation: expression(m) + " = " + value(m) + "，需要" + needed + "个座位，所以" + (enough ? "够。" : "不够。") }
        : { ...numeric(value(m), "input"), prompt: "第二步：计算结果，填写多少" + unit + "。",
            ...hints(m) }
    ];
    const labels = { total: "求总数", price: "求总价", add: "增加应用", subtract: "减少应用", enough: "够不够", table: "读表选条件" };
    return question("word", labels[kind], {
      title, prompt: steps[0].prompt, answer: steps[1].answer, mode: steps[0].mode,
      options: steps[0].options, steps, visual, math: m, wordKind: kind, needed, unit,
      hint: steps[0].hint, explanation: steps[1].explanation
    });
  }
  let extensionCursor = rand(0, 2);
  function extension(kind) {
    const m = model(rand(2, 9), rand(2, 8));
    if (kind === 0) {
      const shown = Math.random() < 0.5 ? value(m) : value(m) + 1;
      const steps = [
        { mode: "choice", options: ["对", "不对"], answer: shown === value(m) ? "对" : "不对",
          prompt: "第一步：判断这道算式。", ...hints(m) },
        { ...numeric(value(m), "input"), prompt: "第二步：写出正确的积。", ...hints(m) }
      ];
      return question("extension", "判断纠错", { title: expression(m) + " = " + shown + "，对吗？",
        steps, answer: steps[1].answer, mode: "choice", options: steps[0].options,
        prompt: steps[0].prompt, ...hints(m), visual: { type: "instruction", text: "想口诀，核对积。" }, math: m, shown });
    }
    if (kind === 1) {
      return question("extension", "乘法意义", { title: m.b + "个" + m.a + "，选哪个乘法算式？",
        prompt: "注意：“几个几”和“几与几”意思不一样。",
        answer: expression(m), mode: "choice", options: shuffle([expression(m), m.a + " + " + m.b, expression(model(m.a, m.b - 1)), expression(model(m.a, m.b + 1))]),
        hint: "每份一样多，可以用乘法。", explanation: m.b + "个" + m.a + "，可以列式 " + expression(m) + "。",
        visual: scene(m), math: m });
    }
    const start = rand(1, 5), missing = rand(1, 3);
    const terms = range(start, start + 4).map(x => x * m.a);
    return question("extension", "口诀规律", {
      title: terms.map((n, i) => i === missing ? "□" : n).join("、"),
      prompt: "按同一句口诀表的顺序，把缺少的数补上。",
      ...numeric(terms[missing], pick(["input", "tap", "drag"])),
      hint: "看看相邻两个数相差几，再想对应的口诀。",
      explanation: "依次是" + range(start, start + 4).map(x => m.a + "×" + x).join("、") + "，应填" + terms[missing] + "。",
      visual: { type: "instruction", text: "每一步都按相同的规律变化。" }, pattern: { factor: m.a, start, missing }
    });
  }
  function generateQuestionSet() {
    const questions = [oral(), mixed("+"), mixed("−"), extremum("max"), extremum("min"), extremum("mixed"),
      blank("factor"), blank("offset"), compare(), picture(false), picture(true),
      ...["total", "price", "add", "subtract", "enough", "table"].map(word), extension(extensionCursor++ % 3)];
    return shuffle(questions).map((q, i) => ({ ...q, id: "q-" + Date.now() + "-" + i }));
  }
  function generateMoleQuestionSet(count) {
    const mixedCount = Math.floor(count / 3), seen = new Set(), result = [];
    for (let i = 0; i < count; i++) {
      const op = i < mixedCount ? (i % 2 ? "−" : "+") : "";
      const pool = [];
      for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) {
        const m = model(a, b, op, op ? rand(1, Math.min(19, op === "+" ? 100 - a * b : a * b)) : 0);
        if (!seen.has(expression(m))) pool.push(m);
      }
      const m = pick(pool);
      seen.add(expression(m));
      result.push({ text: expression(m) + " = ?", answer: value(m), math: m });
    }
    return shuffle(result);
  }
  global.QuietBookQuestionGenerator = {
    QUESTION_COUNT, BASIC_COUNT, COUNTS, generateQuestionSet, generateMoleQuestionSet,
    _test: { value, expression, formula, model, uniqueOptions, extremum, word, extension }
  };
})(typeof window !== "undefined" ? window : globalThis);
