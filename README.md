# 摇一摇决策器

> 选择困难？摇一下就好。

摇一摇决策器是一个基于手机陀螺仪 + AI 的决策辅助 Web 工具。

不是随机选一个，而是帮你看清为什么纠结。

## 在线体验

[点击访问](https://shake-decision.vercel.app)（需 HTTPS 环境以使用陀螺仪功能）

## 产品理念

每天我们要做 35000 个决策，最折磨人的不是大事，而是那些"选 A 选 B 都行，但就是选不了"的日常小纠结。

摇一摇决策器的核心是：**不是随机选一个，而是帮你看清为什么纠结。**

- 摇晃手机，表达你的纠结程度
- AI 分析你描述中的措辞倾向和首因效应
- 给出有理有据的决策建议，让你"被说中"的感觉

## 核心功能

| 功能 | 说明 |
|------|------|
| 决策输入 | 描述纠结，填写两个选项，支持快速模板 |
| 摇一摇交互 | 手机陀螺仪检测摇晃力度（PC 端支持点击模式） |
| AI 决策分析 | DeepSeek API 分析纠结根因，给出理性建议 |
| Mock 降级 | 无 API Key 时自动使用预设分析数据 |
| 决策日记 | localStorage 存储历史决策，支持满意度回评 |
| 分享功能 | 一键分享分析结果到社交媒体 |

## 技术栈

- **框架**: Next.js 16 + React + TypeScript
- **样式**: Tailwind CSS v4
- **字体**: Inter + Noto Sans SC
- **API**: DeepSeek（OpenAI SDK 兼容）
- **存储**: localStorage
- **部署**: Vercel

## 项目结构

```
shake-decision/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/analyze/        # DeepSeek API 路由
│   │   ├── decide/             # 决策核心页面
│   │   ├── history/            # 决策日记页面
│   │   ├── layout.tsx          # 根布局 + SEO
│   │   ├── page.tsx            # 首页落地页
│   │   └── ...
│   ├── components/             # React 组件
│   ├── hooks/                  # 自定义 Hooks
│   ├── lib/                    # 工具库
│   └── types/                  # TypeScript 类型
├── .env.example                # 环境变量模板
├── vercel.json                 # Vercel 配置
└── next.config.ts              # Next.js 配置
```

## 本地开发

```bash
# 克隆项目
git clone https://github.com/zbw-zbw/shake-decision.git
cd shake-decision

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入 DEEPSEEK_API_KEY

# 启动开发服务器
npm run dev
```

## 部署到 Vercel

```bash
# 推送代码到 GitHub
git push origin master

# 在 Vercel 导入项目
# 配置环境变量 DEEPSEEK_API_KEY
# 一键部署
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥（可选，留空则使用 Mock 模式） |

## License

MIT
