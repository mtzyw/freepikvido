# Video Backend Service

AI视频生成后端服务，支持图生视频和文生视频功能。

## 技术栈

- Node.js + Express.js + TypeScript
- Prisma ORM + MySQL/Subspace
- Redis + BullMQ (消息队列)
- Cloudflare R2 (对象存储)
- JWT 认证 (支持传统登录和Canva无摩擦认证)
- Freepik API (视频生成)
- Apple Pay + Stripe (支付)

## 项目结构

```
video-backend/
├── src/
│   ├── config/          # 配置文件
│   ├── controllers/     # 控制器
│   ├── services/        # 业务逻辑
│   ├── repositories/    # 数据访问层
│   ├── middleware/      # 中间件
│   ├── routes/          # 路由
│   ├── utils/           # 工具函数
│   ├── workers/         # 后台任务
│   └── types/           # 类型定义
├── prisma/              # 数据库模型
└── docker-compose.yml   # Docker配置
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入实际配置
```

### 3. 初始化数据库

```bash
# 生成Prisma客户端
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate:dev
```

### 4. 启动服务

#### 开发环境

```bash
# 使用Docker Compose启动所有服务
docker-compose up -d

# 或单独启动
npm run dev        # 启动主服务
npm run worker     # 启动worker进程
```

#### 生产环境

```bash
npm run build
npm start
```

## API接口

- `/api/v1/register` - 用户注册
- `/api/v1/login` - 用户登录
- `/api/v1/upload/image` - 图片上传
- `/api/v1/video_tasks` - 创建视频任务
- `/api/v1/video_tasks/{id}` - 查询任务状态
- `/api/v1/products` - 商品列表
- `/api/v1/orders` - 创建订单
- `/api/v1/user_memberships` - 会员状态

## 开发指南

### 代码规范

```bash
npm run lint       # 运行ESLint检查
npm run lint:fix   # 自动修复格式问题
```

### 测试

```bash
npm test           # 运行测试
npm run test:watch # 监听模式
npm run test:coverage # 生成覆盖率报告
```

### 数据库管理

```bash
npm run prisma:studio  # 打开Prisma Studio GUI
```

## 部署

1. 构建Docker镜像
```bash
docker build -t video-backend .
```

2. 运行容器
```bash
docker run -p 3000:3000 --env-file .env video-backend
```

## 注意事项

- 确保所有敏感信息存储在环境变量中
- API Key需要加密存储
- 实施适当的速率限制和安全措施
- 定期备份数据库
- 监控Redis队列和worker进程状态