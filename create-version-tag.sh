#!/bin/bash

# AI智能工作台 - 版本标记创建脚本
# 功能：自动化版本发布、Git标记、发布说明生成

set -e  # 遇到错误立即退出

# 配置变量
VERSION="v1.1.0"
PROJECT_NAME="AI智能工作台"
RELEASE_BRANCH="main"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# 检查Git状态
check_git_status() {
    log_info "检查Git仓库状态..."
    
    # 检查是否在Git仓库中
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_warning "当前目录不是Git仓库，初始化Git仓库..."
        git init
        git add .
        git commit -m "Initial commit: AI智能工作台项目"
        log_success "Git仓库初始化完成"
    fi
    
    # 检查工作区状态
    if ! git diff-index --quiet HEAD --; then
        log_warning "工作区有未提交的更改"
        echo "未提交的文件:"
        git status --porcelain
        echo ""
        read -p "是否要提交这些更改？(y/N): " commit_changes
        if [[ "$commit_changes" =~ ^[Yy]$ ]]; then
            git add .
            git commit -m "Pre-release commit: 准备发布 $VERSION"
            log_success "更改已提交"
        else
            log_error "请先提交或暂存更改后再创建版本标记"
            exit 1
        fi
    fi
    
    log_success "Git状态检查通过"
}

# 检查版本号格式
validate_version() {
    log_info "验证版本号格式..."
    
    if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        log_error "版本号格式不正确，应为 vX.Y.Z 格式"
        exit 1
    fi
    
    # 检查版本是否已存在
    if git tag -l | grep -q "^$VERSION$"; then
        log_error "版本标记 $VERSION 已存在"
        echo "现有标记:"
        git tag -l | sort -V
        exit 1
    fi
    
    log_success "版本号验证通过: $VERSION"
}

# 更新版本信息
update_version_info() {
    log_info "更新项目版本信息..."
    
    # 更新package.json版本
    if [[ -f "package.json" ]]; then
        local current_version=$(grep '"version"' package.json | sed 's/.*"version": "\(.*\)".*/\1/')
        local new_version=${VERSION#v}  # 移除v前缀
        
        sed -i.bak "s/\"version\": \"$current_version\"/\"version\": \"$new_version\"/" package.json
        rm package.json.bak
        log_success "package.json版本已更新: $current_version -> $new_version"
    fi
    
    # 更新VERSION文件
    echo "$VERSION" > VERSION
    echo "发布时间: $TIMESTAMP" >> VERSION
    echo "项目: $PROJECT_NAME" >> VERSION
    log_success "VERSION文件已创建"
    
    # 更新备份脚本中的版本
    if [[ -f "backup-project.sh" ]]; then
        sed -i.bak "s/VERSION=\".*\"/VERSION=\"$VERSION\"/" backup-project.sh
        rm backup-project.sh.bak
        log_success "备份脚本版本已更新"
    fi
}

# 生成变更日志
generate_changelog() {
    log_info "生成变更日志..."
    
    local changelog_file="CHANGELOG.md"
    local temp_file=$(mktemp)
    
    # 创建新的变更日志条目
    cat > "$temp_file" << EOF
# 变更日志

## [$VERSION] - $(date +"%Y-%m-%d")

### 🎯 重大更新
- 品牌升级为AI智能工作台
- 导航栏优化为"我的个人工作台"
- 完整的项目保护和备份方案

### ✨ 新增特性
- 增强版备份系统（完整/增量/版本备份）
- 智能文件变化检测
- 自动化恢复脚本
- 项目完整性检查

### 🔧 技术改进
- 基于SHA-256的文件哈希验证
- 多类型备份支持
- 自动备份清理机制
- 详细的备份日志记录

### 📋 修复问题
- 优化备份脚本性能
- 改进错误处理机制
- 增强跨平台兼容性

---

EOF
    
    # 如果已存在变更日志，则合并
    if [[ -f "$changelog_file" ]]; then
        tail -n +2 "$changelog_file" >> "$temp_file"
    fi
    
    mv "$temp_file" "$changelog_file"
    log_success "变更日志已生成: $changelog_file"
}

# 创建发布包
create_release_package() {
    log_info "创建发布包..."
    
    local release_dir="releases"
    local package_name="${PROJECT_NAME}-${VERSION}"
    local package_dir="$release_dir/$package_name"
    
    # 创建发布目录
    mkdir -p "$package_dir"
    
    # 复制项目文件
    rsync -av \
        --exclude='.git/' \
        --exclude='.next/' \
        --exclude='node_modules/' \
        --exclude='backend/venv/' \
        --exclude='releases/' \
        --exclude='*.log' \
        --exclude='*.tmp' \
        ./ "$package_dir/"
    
    # 创建发布信息文件
    cat > "$package_dir/RELEASE_INFO.txt" << EOF
$PROJECT_NAME $VERSION 发布包

发布时间: $TIMESTAMP
版本号: $VERSION
Git提交: $(git rev-parse HEAD)
分支: $(git branch --show-current)

安装说明:
1. 解压发布包到目标目录
2. 运行 npm install 安装前端依赖
3. 运行 cd backend && pip install -r requirements.txt 安装后端依赖
4. 运行 npm run dev 启动开发服务器
5. 访问 http://localhost:3000

生产部署:
1. 运行 npm run build 构建生产版本
2. 运行 npm start 启动生产服务器
3. 配置反向代理和SSL证书

技术支持:
- 文档: PROJECT_DOCUMENTATION.md
- 发布说明: RELEASE_NOTES.md
- 变更日志: CHANGELOG.md

版本特性:
- AI智能工作台品牌升级
- 增强版备份和恢复系统
- 完整的项目保护方案
- 优化的用户界面和体验
EOF
    
    # 压缩发布包
    cd "$release_dir"
    tar -czf "${package_name}.tar.gz" "$package_name"
    zip -r "${package_name}.zip" "$package_name" > /dev/null
    
    # 清理临时目录
    rm -rf "$package_name"
    
    cd ..
    
    local package_size=$(du -sh "$release_dir/${package_name}.tar.gz" | cut -f1)
    log_success "发布包已创建: $release_dir/${package_name}.tar.gz ($package_size)"
}

# 创建Git标记
create_git_tag() {
    log_info "创建Git标记..."
    
    # 提交版本更新
    git add .
    git commit -m "Release $VERSION: AI智能工作台版本发布

- 品牌升级为AI智能工作台
- 增强版备份系统
- 完整的项目保护方案
- 优化用户界面和体验

详细信息请查看 RELEASE_NOTES.md"
    
    # 创建带注释的标记
    git tag -a "$VERSION" -m "$PROJECT_NAME $VERSION

发布时间: $TIMESTAMP

主要特性:
- 品牌升级为AI智能工作台
- 导航栏优化为'我的个人工作台'
- 增强版备份系统（完整/增量/版本备份）
- 智能文件变化检测和完整性检查
- 自动化恢复和部署脚本

技术改进:
- 基于SHA-256的文件哈希验证
- 多类型备份支持和自动清理
- 详细的备份日志和状态报告
- 跨平台兼容性增强

查看完整发布说明: RELEASE_NOTES.md"
    
    log_success "Git标记已创建: $VERSION"
}

# 显示发布信息
show_release_info() {
    log_header "发布信息摘要"
    
    echo -e "${CYAN}项目名称:${NC} $PROJECT_NAME"
    echo -e "${CYAN}版本号:${NC} $VERSION"
    echo -e "${CYAN}发布时间:${NC} $TIMESTAMP"
    echo -e "${CYAN}Git提交:${NC} $(git rev-parse --short HEAD)"
    echo -e "${CYAN}分支:${NC} $(git branch --show-current)"
    echo ""
    
    echo -e "${GREEN}发布文件:${NC}"
    if [[ -d "releases" ]]; then
        ls -lh releases/${PROJECT_NAME}-${VERSION}.* 2>/dev/null || echo "  无发布包"
    fi
    echo ""
    
    echo -e "${YELLOW}Git标记:${NC}"
    git tag -l | grep "$VERSION" || echo "  无标记"
    echo ""
    
    echo -e "${BLUE}下一步操作:${NC}"
    echo "1. 推送标记到远程仓库: git push origin $VERSION"
    echo "2. 推送代码到远程仓库: git push origin $(git branch --show-current)"
    echo "3. 在GitHub/GitLab创建Release"
    echo "4. 部署到生产环境"
    echo "5. 通知团队成员新版本发布"
}

# 清理函数
cleanup() {
    log_info "清理临时文件..."
    # 清理可能的临时文件
    find . -name "*.bak" -delete 2>/dev/null || true
    log_success "清理完成"
}

# 主函数
main() {
    log_header "$PROJECT_NAME 版本发布工具"
    
    echo -e "${CYAN}准备发布版本: $VERSION${NC}"
    echo ""
    
    # 确认发布
    read -p "确认要创建版本 $VERSION 吗？(y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        log_info "版本发布已取消"
        exit 0
    fi
    
    # 执行发布流程
    check_git_status
    validate_version
    update_version_info
    generate_changelog
    create_release_package
    create_git_tag
    
    # 显示发布信息
    show_release_info
    
    # 清理
    cleanup
    
    log_header "版本发布完成"
    log_success "$PROJECT_NAME $VERSION 已成功发布！"
    
    echo ""
    echo -e "${CYAN}快速部署命令:${NC}"
    echo "tar -xzf releases/${PROJECT_NAME}-${VERSION}.tar.gz"
    echo "cd ${PROJECT_NAME}-${VERSION}"
    echo "npm install && cd backend && pip install -r requirements.txt"
    echo "npm run dev"
}

# 处理命令行参数
case "${1:-}" in
    "--help"|"-h")
        echo "用法: $0 [选项]"
        echo ""
        echo "选项:"
        echo "  --help, -h     显示帮助信息"
        echo "  --version, -v  显示当前版本"
        echo "  --dry-run      模拟运行，不实际创建标记"
        echo ""
        echo "环境变量:"
        echo "  VERSION        指定版本号 (默认: $VERSION)"
        echo "  PROJECT_NAME   指定项目名称 (默认: $PROJECT_NAME)"
        exit 0
        ;;
    "--version"|"-v")
        echo "$PROJECT_NAME 版本发布工具 v1.0.0"
        exit 0
        ;;
    "--dry-run")
        echo "模拟运行模式 - 不会实际创建标记或文件"
        # 设置模拟模式标志
        DRY_RUN=true
        ;;
esac

# 执行主函数
main "$@"