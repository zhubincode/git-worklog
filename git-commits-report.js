#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const inquirer = require("inquirer");
const dayjs = require("dayjs");
const chalk = require("chalk");
const _ = require("lodash");
const relativeTime = require("dayjs/plugin/relativeTime");

// 加载dayjs插件
dayjs.extend(relativeTime);

// 读取配置文件
const CONFIG_PATH = path.join(__dirname, "git-repos.json");

if (!fs.existsSync(CONFIG_PATH)) {
  console.error(chalk.red(`缺少配置文件: ${CONFIG_PATH}`));
  process.exit(1);
}

// 加载配置
const CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
const AUTHOR = CONFIG.author || "zhubin";
const OUTPUT_DIR = path.join(__dirname, CONFIG.outputDir || "output");
const AI_PROMPT_DIR = path.join(__dirname, CONFIG.aiPromptDir || "prompts");
const DATE_FORMAT = CONFIG.dateFormat || "YYYY-MM-DD";
const TIME_FORMAT = CONFIG.timeFormat || "HH:mm:ss";
const COMMIT_FORMAT = CONFIG.commitFormat || {
  pretty: "%h|%an|%ad|%s|%b",
  separator: "<<<END>>>",
};
const REPORT_FORMAT = CONFIG.reportFormat || {
  includeBody: true,
  showAuthor: false,
  showDate: true,
};

// 创建输出目录
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// 创建AI提示词目录
if (!fs.existsSync(AI_PROMPT_DIR)) {
  fs.mkdirSync(AI_PROMPT_DIR);
}

// 执行 git log 命令，返回 commit 字符串数组
function runGitLog(repoPath, since, until) {
  const cmd = `git -C "${repoPath}" log --all --since="${since}" --until="${until}" --author="${AUTHOR}" --pretty=format:"${COMMIT_FORMAT.pretty}${COMMIT_FORMAT.separator}"`;
  try {
    const result = execSync(cmd, { encoding: "utf-8" });
    return result
      .split(COMMIT_FORMAT.separator)
      .map((e) => e.trim())
      .filter(Boolean);
  } catch (err) {
    console.warn(chalk.red(`仓库 ${repoPath} 执行 git log 失败，跳过`));
    return [];
  }
}

// 根据 commit 标题+正文去重，避免 cherry-pick 重复
function dedupeCommits(commits) {
  const seen = new Set();
  return _.filter(commits, (line) => {
    const parts = line.split("|");
    const dedupeKey = parts.slice(3).join("|").trim(); // 标题+正文
    if (seen.has(dedupeKey)) return false;
    seen.add(dedupeKey);
    return true;
  });
}

function formatCommit(raw) {
  const parts = raw.split("|");
  const hash = parts[0];
  const author = parts[1];
  const dateStr = parts[2];
  const title = parts[3];
  const body = parts.slice(4).join("|").trim();

  // 格式化日期，添加"几天前"的相对时间
  const commitDate = dayjs(dateStr);
  const formattedDate = `${commitDate.format(
    DATE_FORMAT
  )} (${commitDate.fromNow()})`;

  return { hash, author, date: formattedDate, title, body };
}

// 终端打印
function printToConsole(commitsByDate) {
  _.forEach(_.sortBy(Object.keys(commitsByDate)), (date) => {
    console.log(chalk.bgBlue.white(`\n📅 ${date}`));
    _.forEach(commitsByDate[date], (commits, repo) => {
      console.log(chalk.yellow(`\n📁 ${repo}`));
      _.forEach(commits, (c) => {
        // 根据配置决定是否在控制台显示哈希
        if (REPORT_FORMAT.showHash !== false) {
          console.log(chalk.green(`- [${c.hash}] ${c.title}`));
        } else {
          console.log(chalk.green(`- ${c.title}`));
        }
        if (c.body && REPORT_FORMAT.includeBody) {
          console.log(
            c.body
              .split("\n")
              .map((l) => `  > ${l}`)
              .join("\n")
          );
        }
      });
    });
  });
}

// 生成 Markdown 格式报告
function formatMarkdownCommits(commitsByDate) {
  let md = `# Git 提交报告 - ${AUTHOR}\n\n`;

  _.forEach(_.sortBy(Object.keys(commitsByDate)), (date) => {
    md += `## 🗓️ ${date}\n\n`;

    _.forEach(commitsByDate[date], (commits, repo) => {
      md += `### 📁 仓库：${repo}\n\n`;
      md += `<table>\n`;
      md += `  <thead>\n`;
      md += `    <tr>\n`;
      // 根据配置决定是否显示哈希列
      if (REPORT_FORMAT.showHash !== false) md += `      <th>提交</th>\n`;
      md += `      <th>描述</th>\n`;
      if (REPORT_FORMAT.showDate) md += `      <th>时间</th>\n`;
      md += `    </tr>\n`;
      md += `  </thead>\n`;
      md += `  <tbody>\n`;

      _.forEach(commits, (c) => {
        md += `    <tr>\n`;
        // 根据配置决定是否显示哈希
        if (REPORT_FORMAT.showHash !== false)
          md += `      <td><code>${c.hash}</code></td>\n`;
        md += `      <td>\n`;
        md += `        <strong>${_.escape(c.title)}</strong>\n`;

        if (c.body && REPORT_FORMAT.includeBody) {
          md += `        <br>\n`;
          md += `        <div style="padding-left: 8px; margin-top: 4px; border-left: 2px solid #ccc;">\n`;
          md += c.body
            .split("\n")
            .map((line) => `          ${_.escape(line)}`)
            .join("<br>\n");
          md += `\n        </div>\n`;
        }

        md += `      </td>\n`;

        if (REPORT_FORMAT.showDate) {
          md += `      <td>${c.date}</td>\n`;
        }

        md += `    </tr>\n`;
      });

      md += `  </tbody>\n`;
      md += `</table>\n\n`;
      md += `<div style="height: 20px;"></div>\n\n`;
    });

    md += `<div style="page-break-after: always;"></div>\n\n`;
  });

  return md;
}

// 生成AI提示词，用于快速获取日报
function generateAIPrompt(commitsByDate, authorName) {
  if (!CONFIG.aiPrompt || !CONFIG.aiPrompt.enabled) {
    return null;
  }

  let commitsText = "";

  _.forEach(_.sortBy(Object.keys(commitsByDate)), (date) => {
    commitsText += `日期: ${date}\n\n`;

    _.forEach(commitsByDate[date], (commits, repo) => {
      commitsText += `项目: ${repo}\n`;

      _.forEach(commits, (c) => {
        commitsText += `- ${c.title}\n`;
        if (c.body) {
          // 添加提交描述，缩进处理
          const indentedBody = c.body
            .split("\n")
            .map((line) => `  ${line}`)
            .join("\n");
          commitsText += `${indentedBody}\n`;
        }
      });

      commitsText += "\n";
    });
  });

  // 使用配置的模板，替换{commits}占位符和{author}占位符
  return CONFIG.aiPrompt.template
    .replace("{commits}", commitsText)
    .replace("{author}", authorName || AUTHOR); // 使用传入的作者名或默认作者
}

// 根据选择类型计算日期范围数组
function calculateDates(selection, inputs) {
  switch (selection) {
    case "今日":
      return [dayjs()];
    case "昨日":
      return [dayjs().subtract(1, "day")];
    case "最近一周":
      return _.map(_.range(7), (i) => dayjs().subtract(i, "day"));
    case "指定日期":
      return [dayjs(inputs.date)];
    case "指定范围":
      const start = dayjs(inputs.start);
      const end = dayjs(inputs.end);
      if (end.isBefore(start)) {
        throw new Error("结束日期不能早于开始日期");
      }
      const rangeResults = [];
      let cur = start;
      while (cur.isSameOrBefore(end)) {
        rangeResults.push(cur);
        cur = cur.add(1, "day");
      }
      return rangeResults;
    default:
      throw new Error("无效的选择");
  }
}

async function main() {
  const { selection } = await inquirer.prompt([
    {
      type: "list",
      name: "selection",
      message: "请选择日期范围：",
      choices: ["今日", "昨日", "最近一周", "指定日期", "指定范围"],
    },
  ]);

  let inputs = {};
  if (selection === "指定日期") {
    inputs = await inquirer.prompt([
      {
        type: "input",
        name: "date",
        message: `请输入日期 (${DATE_FORMAT})：`,
        validate: (input) =>
          dayjs(input, DATE_FORMAT, true).isValid() || "日期格式不正确",
      },
    ]);
  } else if (selection === "指定范围") {
    inputs = await inquirer.prompt([
      {
        type: "input",
        name: "start",
        message: `起始日期 (${DATE_FORMAT})：`,
        validate: (input) =>
          dayjs(input, DATE_FORMAT, true).isValid() || "日期格式不正确",
      },
      {
        type: "input",
        name: "end",
        message: `结束日期 (${DATE_FORMAT})：`,
        validate: (input) =>
          dayjs(input, DATE_FORMAT, true).isValid() || "日期格式不正确",
      },
    ]);
  }

  // 是否选择特定的作者
  const { useDefaultAuthor } = await inquirer.prompt([
    {
      type: "confirm",
      name: "useDefaultAuthor",
      message: `使用默认作者 "${AUTHOR}"？`,
      default: true,
    },
  ]);

  let author = AUTHOR;
  if (!useDefaultAuthor) {
    const { customAuthor } = await inquirer.prompt([
      {
        type: "input",
        name: "customAuthor",
        message: "请输入作者名称：",
        validate: (input) => input.trim() !== "" || "作者名称不能为空",
        default: AUTHOR,
      },
    ]);
    author = customAuthor;
  }

  let dates;
  try {
    dates = calculateDates(selection, inputs);
  } catch (e) {
    console.error(chalk.red(e.message));
    process.exit(1);
  }

  const commitsByDate = {};

  // 获取仓库列表
  const repos = CONFIG.repositories || [];

  for (const date of dates) {
    const dayStr = date.format(DATE_FORMAT);
    const since = date.startOf("day").toISOString();
    const until = date.endOf("day").toISOString();

    commitsByDate[dayStr] = {};

    for (const repoPath of repos) {
      const repoName = path.basename(repoPath);
      // 更新 runGitLog 函数的调用，传入当前选择的作者
      const rawCommits = runGitLog(repoPath, since, until);
      const deduped = dedupeCommits(rawCommits);
      const parsed = _.map(deduped, formatCommit);
      if (!_.isEmpty(parsed)) {
        commitsByDate[dayStr][repoName] = parsed;
      }
    }
  }

  if (_.every(Object.keys(commitsByDate), (d) => _.isEmpty(commitsByDate[d]))) {
    console.log(chalk.yellow("无符合条件的提交记录"));
    return;
  }

  printToConsole(commitsByDate);

  // 根据选择的选项生成文件名基础部分
  let reportType = selection;
  const dateKeys = _.sortBy(Object.keys(commitsByDate));

  if (selection === "指定日期") {
    reportType = `${inputs.date}`;
  } else if (selection === "指定范围") {
    reportType = `${inputs.start}_to_${inputs.end}`;
  } else if (dateKeys.length > 1) {
    // 对于最近一周或其他多日期选项
    reportType = `${reportType}-${dateKeys[0]}_to_${_.last(dateKeys)}`;
  }

  // 添加作者信息到文件名
  const fileNameBase =
    author === AUTHOR ? reportType : `${reportType}-${author}`;
  const timeStamp = dayjs().format(TIME_FORMAT.replace(/:/g, ""));

  // 生成Markdown报告
  const md = formatMarkdownCommits(commitsByDate);
  const mdFileName = `${fileNameBase}-${author}-${timeStamp}.md`;
  const mdFilePath = path.join(OUTPUT_DIR, mdFileName);
  fs.writeFileSync(mdFilePath, md, "utf-8");
  console.log(chalk.cyan(`\n✅ 已导出 Markdown 报告：${mdFilePath}`));

  // 生成AI提示词并保存到单独的文件
  const aiPrompt = generateAIPrompt(commitsByDate, author);
  if (aiPrompt) {
    // 生成AI提示词文件，加入作者名
    const aiPromptFileName = `${fileNameBase}-${author}-${timeStamp}.txt`;
    const aiPromptFilePath = path.join(AI_PROMPT_DIR, aiPromptFileName);
    fs.writeFileSync(aiPromptFilePath, aiPrompt, "utf-8");

    // 输出到控制台
    console.log(chalk.cyan(`\n===== AI日报生成提示词 =====\n`));
    console.log(aiPrompt);
    console.log(chalk.cyan(`\n===========================\n`));
    console.log(chalk.cyan(`\n✅ 已导出 AI提示词：${aiPromptFilePath}`));
  }
}

main();
