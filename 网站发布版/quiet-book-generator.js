(function (global) {
  const BASIC_COUNT = 6;
  const QUESTION_COUNT = 15;

  const pick = (items) => items[Math.floor(Math.random() * items.length)];
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffle = (items) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  function uniqueOptions(answer, min = 0, max = 100) {
    const values = new Set([answer]);
    const offsets = shuffle([-10, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 10]);
    offsets.forEach((offset) => {
      const value = answer + offset;
      if (value >= min && value <= max) values.add(value);
    });
    while (values.size < 4) values.add(rand(min, max));
    return shuffle([...values]).slice(0, 4);
  }

  function expressionValue(expression) {
    const tokens = String(expression).match(/\d+|[+-]/g) || [];
    let total = Number(tokens[0] || 0);
    for (let i = 1; i < tokens.length; i += 2) {
      const op = tokens[i];
      const value = Number(tokens[i + 1]);
      total = op === "+" ? total + value : total - value;
    }
    return total;
  }

  function makeQuestion(base) {
    return {
      mode: "input",
      medalText: base.medalText || "奖",
      rewardTitle: base.rewardTitle || "获得数学奖章！",
      rewardText: base.rewardText || "你认真完成了一道题。",
      success: base.success || "答对啦！继续保持。",
      actionText: base.actionText || "看提示",
      ...base
    };
  }

  function makeBasicCalculation() {
    const kind = pick(["add2", "sub2", "add1Carry", "sub1Borrow", "chain"]);
    if (kind === "add2") {
      const a = rand(12, 67);
      const b = rand(11, Math.min(99 - a, 29));
      const answer = a + b;
      return makeQuestion({
        category: "basic",
        label: "基础口算",
        title: `${a} + ${b} = ?`,
        prompt: "先算个位，再算十位，把最后答案写出来。",
        answer,
        mode: pick(["input", "choice"]),
        options: uniqueOptions(answer),
        hint: `可以先分成十位和个位来算：${a} + ${b} = ${answer}。`,
        visual: { type: "equation", parts: [a, "+", b, "="] },
        medalText: "算"
      });
    }
    if (kind === "sub2") {
      const a = rand(35, 99);
      const b = rand(11, Math.min(49, a - 5));
      const answer = a - b;
      return makeQuestion({
        category: "basic",
        label: "基础口算",
        title: `${a} - ${b} = ?`,
        prompt: "看清减号，先减整十，再减个位。",
        answer,
        mode: pick(["input", "choice"]),
        options: uniqueOptions(answer),
        hint: `求少了多少，用减法：${a} - ${b} = ${answer}。`,
        visual: { type: "number-line", start: a, steps: [`-${Math.floor(b / 10) * 10}`, `-${b % 10}`], end: "?" },
        medalText: "减"
      });
    }
    if (kind === "add1Carry") {
      const tens = rand(2, 8);
      const ones = rand(3, 9);
      const add = rand(10 - ones, 9);
      const a = tens * 10 + ones;
      const answer = a + add;
      return makeQuestion({
        category: "basic",
        label: "进位加法",
        title: `${a} + ${add} = ?`,
        prompt: "个位相加满 10，就可以想成 1 个十。",
        answer,
        mode: pick(["input", "drag", "tap"]),
        options: uniqueOptions(answer),
        hint: `先算 ${ones} + ${add} = ${ones + add}，再和 ${tens} 个十合起来，答案是 ${answer}。`,
        visual: { type: "sticks", tens, ones, addOnes: add },
        medalText: "棒"
      });
    }
    if (kind === "sub1Borrow") {
      const tens = rand(3, 9);
      const ones = rand(0, 5);
      const sub = rand(ones + 1, 9);
      const a = tens * 10 + ones;
      const answer = a - sub;
      return makeQuestion({
        category: "basic",
        label: "退位减法",
        title: `${a} - ${sub} = ?`,
        prompt: "个位不够减，先借 1 个十再算。",
        answer,
        mode: pick(["input", "choice"]),
        options: uniqueOptions(answer),
        hint: `把 1 个十拆成 10 个一，${10 + ones} - ${sub} = ${10 + ones - sub}，答案是 ${answer}。`,
        visual: { type: "number-line", start: a, steps: [`-${sub}`], end: "?" },
        medalText: "退"
      });
    }
    const a = rand(20, 80);
    const b = rand(3, 18);
    const c = rand(2, 15);
    const usePlus = Math.random() > 0.45;
    const expression = usePlus ? `${a} - ${b} + ${c}` : `${a} + ${b} - ${c}`;
    const answer = expressionValue(expression);
    return makeQuestion({
      category: "basic",
      label: "连加连减",
      title: `${expression} = ?`,
      prompt: "连算题从左往右，一步一步算。",
      answer,
      mode: pick(["input", "choice"]),
      options: uniqueOptions(answer),
      hint: `按顺序算：${expression} = ${answer}。`,
      visual: { type: "step-cards", cards: expression.split(" ").concat(["?"]) },
      medalText: "序"
    });
  }

  function makeCompareQuestion() {
    const left = pick([`${rand(20, 80)} + ${rand(2, 18)}`, `${rand(30, 99)} - ${rand(2, 29)}`, String(rand(20, 99))]);
    const right = pick([`${rand(20, 80)} + ${rand(2, 18)}`, `${rand(30, 99)} - ${rand(2, 29)}`, String(rand(20, 99))]);
    const leftValue = expressionValue(left);
    const rightValue = expressionValue(right);
    const answer = leftValue > rightValue ? ">" : leftValue < rightValue ? "<" : "=";
    return makeQuestion({
      label: "比大小",
      title: `${left}  ?  ${right}`,
      prompt: "先把两边都算出来，再选 >、< 或 =。",
      answer,
      mode: "compare",
      options: [">", "<", "="],
      hint: `左边是 ${leftValue}，右边是 ${rightValue}，所以选 ${answer}。`,
      visual: { type: "compare", left, right },
      medalText: "比"
    });
  }

  function makeInequalityBlankQuestion() {
    const kind = pick(["addLessMax", "subGreaterMax", "addGreaterMin"]);
    if (kind === "addLessMax") {
      const a = rand(18, 70);
      const limit = rand(a + 6, Math.min(99, a + 24));
      const answer = limit - a - 1;
      return makeQuestion({
        label: "最大能填几",
        title: `${a} + (  ) < ${limit}`,
        prompt: "括号里最大能填几？填最大的那个数。",
        answer,
        mode: "input",
        hint: `${limit} - ${a} = ${limit - a}，要比 ${limit} 小，所以最大填 ${answer}。`,
        visual: { type: "compare", left: `${a} + ( )`, right: `${limit}` },
        medalText: "大"
      });
    }
    if (kind === "subGreaterMax") {
      const a = rand(35, 90);
      const limit = rand(8, a - 8);
      const answer = a - limit - 1;
      return makeQuestion({
        label: "最大能填几",
        title: `${a} - (  ) > ${limit}`,
        prompt: "括号里最大能填几？注意结果要比右边大。",
        answer,
        mode: "input",
        hint: `${a} - ${limit} = ${a - limit}，要还大一点，所以最大填 ${answer}。`,
        visual: { type: "compare", left: `${a} - ( )`, right: `${limit}` },
        medalText: "大"
      });
    }
    const a = rand(10, 60);
    const limit = rand(a + 6, Math.min(99, a + 28));
    const answer = limit - a + 1;
    return makeQuestion({
      label: "最小能填几",
      title: `${a} + (  ) > ${limit}`,
      prompt: "括号里最小能填几？填刚刚超过右边的数。",
      answer,
      mode: "input",
      hint: `${limit} - ${a} = ${limit - a}，要比 ${limit} 大，所以最小填 ${answer}。`,
      visual: { type: "compare", left: `${a} + ( )`, right: `${limit}` },
      medalText: "小"
    });
  }

  function makeEquationBlankQuestion() {
    const kind = pick(["missingAddend", "missingSubtrahend", "missingStart"]);
    if (kind === "missingAddend") {
      const a = rand(12, 70);
      const missing = rand(2, Math.min(25, 99 - a));
      const total = a + missing;
      return makeQuestion({
        label: "填括号",
        title: `${a} + (  ) = ${total}`,
        prompt: "想一想：还差多少能到右边的数？",
        answer: missing,
        mode: pick(["input", "choice"]),
        options: uniqueOptions(missing, 0, 30),
        hint: `${total} - ${a} = ${missing}，所以括号里填 ${missing}。`,
        visual: { type: "equation", parts: [a, "+", "( )", "=", total] },
        medalText: "填"
      });
    }
    if (kind === "missingSubtrahend") {
      const a = rand(30, 99);
      const answer = rand(2, Math.min(30, a - 5));
      const result = a - answer;
      return makeQuestion({
        label: "填括号",
        title: `${a} - (  ) = ${result}`,
        prompt: "想一想：减去了多少？",
        answer,
        mode: pick(["input", "drag"]),
        options: uniqueOptions(answer, 0, 35),
        hint: `${a} - ${result} = ${answer}，所以括号里填 ${answer}。`,
        visual: { type: "equation", parts: [a, "-", "( )", "=", result] },
        medalText: "填"
      });
    }
    const answer = rand(20, 70);
    const sub = rand(2, 18);
    const result = answer - sub;
    return makeQuestion({
      label: "填括号",
      title: `(  ) - ${sub} = ${result}`,
      prompt: "想一想：哪个数减去它，会得到右边的数？",
      answer,
      mode: "input",
      hint: `${result} + ${sub} = ${answer}，所以括号里填 ${answer}。`,
      visual: { type: "equation", parts: ["( )", "-", sub, "=", result] },
      medalText: "填"
    });
  }

  function makeTrueFalseQuestion() {
    const a = rand(20, 80);
    const b = rand(2, 18);
    const op = pick(["+", "-"]);
    const correct = op === "+" ? a + b : a - b;
    const shown = Math.random() > 0.45 ? correct : correct + pick([-10, -3, -2, 2, 3, 10]);
    const answer = shown === correct ? "对" : "错";
    return makeQuestion({
      label: "判断改错",
      title: `${a} ${op} ${b} = ${shown}`,
      prompt: "这道算式算得对吗？先自己算一遍。",
      answer,
      mode: "choice",
      options: ["对", "错"],
      hint: `正确结果是 ${correct}，所以这道题是${answer}的。`,
      visual: { type: "equation", parts: [a, op, b, "=", shown] },
      medalText: "判"
    });
  }

  function makePatternQuestion() {
    const step = pick([3, 5, 7, 9, 10]);
    const direction = pick(["+", "-"]);
    const start = direction === "+" ? rand(10, 70 - step * 4) : rand(40 + step * 2, 99);
    const sequence = Array.from({ length: 5 }, (_, index) => direction === "+" ? start + step * index : start - step * index);
    const missingIndex = rand(1, 3);
    const answer = sequence[missingIndex];
    const shown = sequence.map((value, index) => index === missingIndex ? "(  )" : value).join("，");
    return makeQuestion({
      label: "找规律",
      title: `${shown}`,
      prompt: `这组数每次${direction === "+" ? "增加" : "减少"} ${step}，括号里填几？`,
      answer,
      mode: pick(["input", "tap"]),
      options: uniqueOptions(answer),
      hint: `规律是每次${direction === "+" ? "加" : "减"} ${step}，所以填 ${answer}。`,
      visual: { type: "step-cards", cards: sequence.map((value, index) => index === missingIndex ? "?" : value) },
      medalText: "律"
    });
  }

  function makePlaceValueQuestion() {
    const tens = rand(1, 8);
    const ones = rand(0, 9);
    const answer = tens * 10 + ones;
    return makeQuestion({
      label: "数位组成",
      title: `${tens} 个十和 ${ones} 个一，合起来是多少？`,
      prompt: "先看有几个十，再看有几个一。",
      answer,
      mode: pick(["input", "choice"]),
      options: uniqueOptions(answer),
      hint: `${tens} 个十是 ${tens * 10}，再加 ${ones} 个一，合起来是 ${answer}。`,
      visual: { type: "money", tens, ones },
      medalText: "位"
    });
  }

  function makeHundredChartQuestion() {
    const center = rand(22, 78);
    const direction = pick([
      ["上面", -10],
      ["下面", 10],
      ["左边", -1],
      ["右边", 1]
    ]);
    const answer = center + direction[1];
    return makeQuestion({
      label: "百数表",
      title: `${center} 的${direction[0]}是几？`,
      prompt: "百数表里，上少 10，下多 10，左少 1，右多 1。",
      answer,
      mode: pick(["input", "choice"]),
      options: uniqueOptions(answer),
      hint: `${center} 的${direction[0]}是 ${answer}。`,
      visual: { type: "hundred", center },
      medalText: "百"
    });
  }

  function makeWordProblem() {
    const templates = [
      () => {
        const total = pick([12, 13, 14, 16, 18]);
        const part = rand(3, total - 5);
        return [`一共有 ${total} 个手工作品，已经贴好 ${part} 个，还剩几个没贴？`, total - part, `求还剩，用 ${total} - ${part} = ${total - part}。`, "贴"];
      },
      () => {
        const total = pick([24, 32, 40, 48]);
        const each = pick([4, 8]);
        return [`有 ${total} 箱苹果，每次运 ${each} 箱，需要运几次？`, total / each, `${each} + ${each} + ... 合成 ${total}，一共 ${total / each} 次。`, "果"];
      },
      () => {
        const total = rand(30, 80);
        const moved = rand(6, 20);
        return [`货车上原来有 ${total} 箱，运走 ${moved} 箱，还剩多少箱？`, total - moved, `求还剩，用 ${total} - ${moved} = ${total - moved}。`, "车"];
      },
      () => {
        const together = rand(18, 40);
        const one = rand(5, together - 8);
        return [`操场上一共有 ${together} 个小朋友，玩跳绳的有 ${one} 人，玩轮滑的有几人？`, together - one, `一共减去其中一部分：${together} - ${one} = ${together - one}。`, "玩"];
      }
    ];
    const [title, answer, hint, medalText] = pick(templates)();
    return makeQuestion({
      label: "文字应用",
      title,
      prompt: "先圈出总数和已知部分，再想是求一共还是求剩下。",
      answer,
      mode: pick(["input", "choice"]),
      options: uniqueOptions(answer),
      hint,
      visual: { type: "story", icon: medalText },
      medalText
    });
  }

  function makeShapeQuestion() {
    const shapes = [
      ["长方形", rand(2, 5)],
      ["正方形", rand(1, 4)],
      ["圆形", rand(2, 6)],
      ["三角形", rand(1, 4)]
    ];
    const target = pick(shapes);
    return makeQuestion({
      label: "图形统计",
      title: `数一数：${target[0]}有几个？`,
      prompt: "先按形状分类，再数目标图形的个数。",
      answer: target[1],
      mode: pick(["input", "choice"]),
      options: uniqueOptions(target[1], 0, 8),
      hint: `${target[0]}一共有 ${target[1]} 个。`,
      visual: { type: "shapes", shapes },
      medalText: "形"
    });
  }

  function makeMixedQuestion() {
    return pick([
      makeCompareQuestion,
      makeInequalityBlankQuestion,
      makeEquationBlankQuestion,
      makeTrueFalseQuestion,
      makePatternQuestion,
      makePlaceValueQuestion,
      makeHundredChartQuestion,
      makeWordProblem,
      makeShapeQuestion
    ])();
  }

  function generateQuestionSet() {
    const questions = [];
    const signatures = new Set();
    const addQuestion = (factory) => {
      for (let tries = 0; tries < 20; tries += 1) {
        const question = factory();
        const signature = `${question.label}:${question.title}`;
        if (!signatures.has(signature)) {
          signatures.add(signature);
          questions.push(question);
          return;
        }
      }
      questions.push(factory());
    };

    for (let i = 0; i < BASIC_COUNT; i += 1) addQuestion(makeBasicCalculation);
    while (questions.length < QUESTION_COUNT) addQuestion(makeMixedQuestion);
    return shuffle(questions).map((question, index) => ({
      ...question,
      id: `q-${Date.now()}-${index}-${Math.floor(Math.random() * 10000)}`
    }));
  }

  global.QuietBookQuestionGenerator = {
    BASIC_COUNT,
    QUESTION_COUNT,
    generateQuestionSet,
    _test: {
      expressionValue
    }
  };

  if (typeof module !== "undefined") {
    module.exports = global.QuietBookQuestionGenerator;
  }
})(typeof window !== "undefined" ? window : globalThis);
