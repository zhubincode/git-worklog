# Git 提交报告生成器

一个简洁高效的工具，用于从多个 Git 仓库中收集提交记录，生成结构化的报告和 AI 日报提示词。非常适合日常工作汇报和项目进度跟踪。

## 功能特点

- 支持从多个 Git 仓库收集提交信息
- 多种时间范围选择：今日、昨日、最近一周、指定日期、指定范围
- 自定义作者过滤
- 自动去重复提交（如 cherry-pick）
- 生成格式化的 Markdown 报告
- 自动生成 AI 日报提示词，方便快速获取工作日报
- 高度可定制的配置选项

## 安装

```bash
# 克隆仓库
git clone <仓库地址>
cd git-commit-report

# 安装依赖
npm install
# 或使用pnpm
pnpm install
```

## 配置

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
    "template": "请根据以下Git提交记录，生成一份简洁的工作日报，按项目分类，只保留关键内容：\n\n{commits}\n\n要求：\n1. 合并相似内容\n2. 简洁扼要\n3. 去掉技术细节\n4. 按项目分类展示"
  }
}
```

### 配置选项说明

| 选项                       | 说明                      |
| -------------------------- | ------------------------- |
| `author`                   | 默认作者名，用于过滤提交  |
| `repositories`             | 要监控的 Git 仓库路径数组 |
| `outputDir`                | Markdown 报告输出目录     |
| `aiPromptDir`              | AI 提示词输出目录         |
| `dateFormat`               | 日期格式                  |
| `timeFormat`               | 时间格式                  |
| `commitFormat.pretty`      | Git log 格式              |
| `commitFormat.separator`   | 提交记录分隔符            |
| `reportFormat.includeBody` | 是否包含提交正文          |
| `reportFormat.showAuthor`  | 是否显示作者              |
| `reportFormat.showDate`    | 是否显示日期              |
| `reportFormat.showHash`    | 是否显示提交哈希          |
| `aiPrompt.enabled`         | 是否生成 AI 提示词        |
| `aiPrompt.template`        | AI 提示词模板             |

## 使用方法

```bash
# 直接运行
node git-commits-report.js

# 如果设置了可执行权限
./git-commits-report.js
```

### 交互式选项

运行程序后，会显示交互式菜单：

1. 选择时间范围：今日、昨日、最近一周、指定日期、指定范围
2. 根据选择输入具体日期（如果需要）
3. 确认是否使用默认作者或指定其他作者

### 输出文件

程序会生成两类输出文件：

1. **Markdown 报告**：保存在 `outputDir` 配置的目录中（默认为 `output/`）

   - 包含完整的提交记录，按日期和仓库分类
   - 使用表格格式呈现，美观易读

2. **AI 提示词**：保存在 `aiPromptDir` 配置的目录中（默认为 `prompts/`）
   - 包含结构化的提交记录摘要
   - 可直接复制给 AI，快速生成日报

## 示例

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

## 许可证

MIT
