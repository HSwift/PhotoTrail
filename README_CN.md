# Photo Trail

一个在交互式地图上显示带有位置信息的照片画廊应用。

## 功能特性

- 🖼️ 响应式照片画廊，采用瀑布流布局
- 🗺️ 交互式地图显示照片位置
- 📷 详细的照片元数据（相机设置、位置、日期）
- 🔍 全尺寸照片查看器
- 📱 移动端友好设计

## 安装设置

1. 安装依赖：

```bash
pnpm install
```

2. 创建 `.env.local` 文件并配置：

```bash
# 用于加载项目 JSON 文件的存储基础 URL
STORAGE_BASE=https://your-storage-base-url.com

# 可选：用于地图功能的 Mapbox 访问令牌
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

3. 运行开发服务器：

```bash
pnpm dev
```

## 使用方法

应用从远程存储位置加载项目数据。使用以下路径访问项目：

```
http://localhost:3000/p/project-name
```

根路径 `/` 默认会重定向到 `/p/default`。

## 环境变量

- `STORAGE_BASE`: 项目 JSON 文件托管的基础 URL（例如：`https://cdn.example.com`）
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`: （可选）用于地图功能的 Mapbox 访问令牌

## 使用 dbgen 创建照片数据库

`dbgen` 是一个用于生成照片数据库的工具。它会从照片中提取 EXIF 元数据（相机信息、GPS 位置等），生成 WebP 格式的图片和预览图，并创建 JSON 数据库文件。

### 前置要求

- Python 3.10 或更高版本
- [uv](https://github.com/astral-sh/uv)（用于依赖管理）

### 安装依赖

进入 `dbgen` 目录并安装依赖：

```bash
cd dbgen
uv sync
```

### 使用方法

基本用法：

```bash
uv run python main.py <图片目录> <项目名称>
```

示例：

```bash
# 处理 data/e2025-travel 目录中的图片，生成名为 "2025-travel" 的项目
uv run python main.py data/2025-travel 2025-travel
```

可选参数：

- `-f, --filter`: 指定文件扩展名过滤规则（默认为 `.+\.(png|jpe?g|tiff?|webp|heic|heif)`）

```bash
# 只处理 JPG 和 JPEG 文件
uv run python main.py -f ".*\.(jpg|jpeg)$" data/2025-travel 2025-travel
```

### 输出文件

运行后会在当前目录生成以下文件：

- `<项目名称>.json`: 包含所有照片元数据的 JSON 数据库文件
- `<项目名称>/`: 包含处理后的图片文件目录
  - `<photo_id>.webp`: 转换后的原图（WebP 格式）
  - `<photo_id>_preview.webp`: 预览图（约 100KB）

### 功能说明

`dbgen` 会从照片中提取以下信息：

- **元数据**: 相机型号、镜头型号、焦距、光圈、ISO、快门速度
- **位置信息**: GPS 坐标（经纬度）和反向地理编码的位置名称
- **拍摄时间**: 从 EXIF 数据中提取的原始拍摄时间
- **图片属性**: 宽高比等其他属性

处理流程：

1. 扫描指定目录中的所有图片文件
2. 读取每张图片的 EXIF 数据
3. 生成 WebP 格式的原图和预览图
4. 生成 base64 编码的缩略图（嵌入在 JSON 中）
5. 合并到现有数据库（如果存在）
6. 保存 JSON 数据库文件

### 编辑数据库

处理完成后，可以手动编辑生成的 `<项目名称>.json` 文件来添加：
- 照片标题 (`title`)
- 照片描述 (`caption`)
- 标签 (`tags`)

数据库文件采用 JSON 格式，所有照片按拍摄时间排序。

## 部署

本项目可以轻松部署到 [Vercel](https://vercel.com)，这是由 Next.js 团队创建的平台。

### 使用 Vercel CLI 部署

1. 全局安装 Vercel CLI：

```bash
npm i -g vercel
```

2. 登录 Vercel：

```bash
vercel login
```

3. 部署到生产环境：

```bash
vercel --prod
```

按照提示将项目链接到现有的 Vercel 项目或创建新项目。

### 使用 GitHub 集成部署

1. 将代码推送到 GitHub 仓库

2. 在 [Vercel](https://vercel.com/new) 上导入仓库：
   - 点击 "Add New Project"（添加新项目）
   - 导入你的 GitHub 仓库
   - Vercel 会自动检测 Next.js 并配置构建设置

3. 配置环境变量：
   - 进入 Vercel 项目设置
   - 导航到 "Environment Variables"（环境变量）部分
   - 添加以下变量：
     - `STORAGE_BASE`: 项目 JSON 文件托管的基础 URL
     - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`: （可选）你的 Mapbox 访问令牌

4. 部署：
   - Vercel 会在每次推送到主分支时自动部署
   - 你也可以从 Vercel 仪表板手动触发部署

### 生产环境变量

确保在 Vercel 项目设置中设置以下环境变量：

- `STORAGE_BASE`: 必需 - 项目 JSON 文件托管的基础 URL（例如：`https://cdn.example.com`）
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`: 可选 - 用于地图功能的 Mapbox 访问令牌

### 构建设置

Vercel 会自动检测 Next.js 并使用以下构建设置：
- **构建命令**: `pnpm build`（或 `npm run build`）
- **输出目录**: `.next`
- **安装命令**: `pnpm install`（或 `npm install`）

如果你使用 `pnpm`，确保在项目根目录创建 `.npmrc` 文件（如果尚未存在），以确保 Vercel 使用 `pnpm`：

```
package-manager=pnpm
```

### 自定义域名

部署后，可以在 Vercel 项目设置的 "Domains"（域名）部分添加自定义域名。

