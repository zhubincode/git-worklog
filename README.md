# Git Worklog - Git 提交日志生成工具

一个简洁高效的工具，用于从多个 Git 仓库中收集提交记录，生成结构化的报告和 AI 日报提示词。非常适合日常工作汇报和项目进度跟踪。

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 功能特点

- 支持从多个 Git 仓库收集提交信息
- 多种时间范围选择：今日、昨日、最近一周、指定日期、指定范围
- 自定义作者过滤
- 自动去重复提交（如 cherry-pick）
- 生成格式化的 Markdown 报告
- 自动生成 AI 日报提示词，方便快速获取工作日报
- 高度可定制的配置选项

## 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/zhubincode/git-worklog.git
cd git-worklog

# 安装依赖
npm install
# 或使用pnpm
pnpm install

# 设置可执行权限(可选，仅限Unix/Linux/Mac)
chmod +x git-commits-report.js
```

### 基本使用

1. 创建配置文件
   首先，在项目根目录创建 `git-repos.json` 文件，或修改已有的示例配置文件。

2. 运行工具

   ```bash
   node git-commits-report.js
   ```

3. 按照交互式提示选择日期范围和作者
4. 查看生成的报告，位于 `output` 目录
5. 使用生成的 AI 提示词，位于 `prompts` 目录

## 详细配置

编辑 `git-repos.json` 文件来配置工具：

```json
{
  "author": "你的名字",
  "repositories": ["/path/to/repo1", "/path/to/repo2", "/path/to/repo3"],
  "outputDir": "output",
  "aiPromptDir": "prompts",
  "dateFormat": "YYYY-MM-DD",
  "timeFormat": "HH:mm:ss",
  "commitFormat": {
    "pretty": "%h|%an|%ad|%s|%b",
    "separator": "<<<END>>>"
  },
  "reportFormat": {
    "includeBody": true,
    "showAuthor": false,
    "showDate": true,
    "showHash": false
  },
  "aiPrompt": {
    "enabled": true,
    "template": "嘿，我是{author}，需要你帮我把下面的Git提交记录整理成日报。\n\n{commits}\n\n有几点要求：\n1. 必须按日期分组\n2. 每个日期下再按项目分组\n3. 对技术性内容做概念抽象和提炼，让非技术人员也能理解\n4. 如果我的提交信息太技术化或太简略，帮我适当扩展解释一下\n5. 不要合并不同天的内容\n\n技术内容可以保留，但要确保易于理解。谢谢！"
  }
}
```

### 配置选项详解

| 选项                       | 说明                      | 默认值                 |
| -------------------------- | ------------------------- | ---------------------- |
| `author`                   | 默认作者名，用于过滤提交  | -                      |
| `repositories`             | 要监控的 Git 仓库路径数组 | -                      |
| `outputDir`                | Markdown 报告输出目录     | `output`               |
| `aiPromptDir`              | AI 提示词输出目录         | `prompts`              |
| `dateFormat`               | 日期格式                  | `YYYY-MM-DD`           |
| `timeFormat`               | 时间格式                  | `HH:mm:ss`             |
| `commitFormat.pretty`      | Git log 格式              | `%h\|%an\|%ad\|%s\|%b` |
| `commitFormat.separator`   | 提交记录分隔符            | `<<<END>>>`            |
| `reportFormat.includeBody` | 是否包含提交正文          | `true`                 |
| `reportFormat.showAuthor`  | 是否显示作者              | `false`                |
| `reportFormat.showDate`    | 是否显示日期              | `true`                 |
| `reportFormat.showHash`    | 是否显示提交哈希          | `false`                |
| `aiPrompt.enabled`         | 是否生成 AI 提示词        | `true`                 |
| `aiPrompt.template`        | AI 提示词模板             | 见上方示例             |

## 使用方法详解

### 交互式选项

运行程序后，会显示交互式菜单：

1. **选择时间范围**：

   - 今日：仅包含今天的提交
   - 昨日：仅包含昨天的提交
   - 最近一周：包含过去 7 天的提交
   - 指定日期：输入具体日期(YYYY-MM-DD 格式)
   - 指定范围：输入开始和结束日期

2. **作者选择**：
   - 可以使用配置文件中的默认作者
   - 也可以临时指定其他作者名称

### 输出文件说明

程序会生成两类输出文件：

1. **Markdown 报告**：

   - 保存路径：`outputDir` 配置的目录中（默认为 `output/`）
   - 文件名格式：`[日期范围]-[作者]-[时间戳].md`
   - 内容结构：按日期和仓库分类的提交记录，使用表格格式呈现

2. **AI 提示词**：
   - 保存路径：`aiPromptDir` 配置的目录中（默认为 `prompts/`）
   - 文件名格式：`[日期范围]-[作者]-[时间戳].txt`
   - 用途：可直接复制给 AI 助手（如 ChatGPT、Claude 等），快速生成结构化日报

### 实际使用场景

1. **日常工作汇报**：

   ```bash
   # 生成今日工作报告
   node git-commits-report.js
   # 选择"今日"选项
   ```

2. **周报生成**：

   ```bash
   # 生成过去一周的工作报告
   node git-commits-report.js
   # 选择"最近一周"选项
   ```

3. **特定日期范围的项目进展**：
   ```bash
   # 生成特定时间段的报告
   node git-commits-report.js
   # 选择"指定范围"选项
   # 输入起始和结束日期
   ```

## 输出示例

### 生成的 Markdown 报告

```markdown
# Git 提交报告 - 用户名

## 🗓️ 2023-05-10

### 📁 仓库：project-name

<table>
  <thead>
    <tr>
      <th>描述</th>
      <th>时间</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <strong>修复首页加载问题</strong>
        <br>
        <div style="padding-left: 8px; margin-top: 4px; border-left: 2px solid #ccc;">
          优化了数据加载逻辑，解决了首次加载白屏问题
        </div>
      </td>
      <td>2023-05-10 (2天前)</td>
    </tr>
  </tbody>
</table>
```

### 生成的 AI 提示词

```
嘿，我是zhubin，需要你帮我把下面的Git提交记录整理成日报。

日期: 2023-05-10

项目: project-name
- 修复首页加载问题
  优化了数据加载逻辑，解决了首次加载白屏问题

有几点要求：
1. 必须按日期分组
2. 每个日期下再按项目分组
3. 对技术性内容做概念抽象和提炼，让非技术人员也能理解
4. 如果我的提交信息太技术化或太简略，帮我适当扩展解释一下
5. 不要合并不同天的内容

技术内容可以保留，但要确保易于理解。谢谢！
```

## 常见问题解答

**Q: 如何添加新的 Git 仓库到监控列表？**  
A: 编辑`git-repos.json`文件，在`repositories`数组中添加仓库的绝对路径。

**Q: 如何修改默认作者名？**  
A: 编辑`git-repos.json`文件，修改`author`字段的值。

**Q: 为什么有些提交没有显示在报告中？**  
A: 检查以下几点：

- 确认提交作者名与配置中的`author`一致
- 确认提交日期在选择的时间范围内
- 检查仓库路径是否正确

**Q: 如何自定义 AI 提示词的模板？**  
A: 编辑`git-repos.json`文件中的`aiPrompt.template`字段，可以使用`{author}`和`{commits}`作为占位符。

## 贡献指南

欢迎贡献代码或提出建议！请通过以下方式参与：

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。

## 作者

[zhubin](https://github.com/zhubincode)
