#!/bin/bash

# AI智能工作台 - 增强版项目备份脚本 v2.0
# 功能：完整备份、增量备份、版本控制、自动恢复

set -e  # 遇到错误立即退出

# 配置变量
PROJECT_NAME="ai-workspace"
PROJECT_DIR="$(pwd)"
BACKUP_BASE_DIR="../backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
VERSION="v1.1.0"

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

# 创建备份目录结构
create_backup_structure() {
    log_info "创建备份目录结构..."
    
    mkdir -p "$BACKUP_BASE_DIR"
    mkdir -p "$BACKUP_BASE_DIR/full"
    mkdir -p "$BACKUP_BASE_DIR/incremental"
    mkdir -p "$BACKUP_BASE_DIR/versions"
    mkdir -p "$BACKUP_BASE_DIR/logs"
    
    log_success "备份目录结构创建完成"
}

# 检查项目完整性
check_project_integrity() {
    log_info "检查项目完整性..."
    
    local errors=0
    
    # 检查关键文件
    local critical_files=(
        "package.json"
        "next.config.js"
        "tailwind.config.js"
        "tsconfig.json"
        "app/layout.tsx"
        "app/page.tsx"
        "components/MainContent.tsx"
        "components/Navbar.tsx"
        "backend/app.py"
        "backend/requirements.txt"
    )
    
    for file in "${critical_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "关键文件缺失: $file"
            ((errors++))
        fi
    done
    
    # 检查关键目录
    local critical_dirs=(
        "app"
        "components"
        "lib"
        "backend"
    )
    
    for dir in "${critical_dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            log_error "关键目录缺失: $dir"
            ((errors++))
        fi
    done
    
    if [[ $errors -eq 0 ]]; then
        log_success "项目完整性检查通过"
        return 0
    else
        log_error "项目完整性检查失败，发现 $errors 个问题"
        return 1
    fi
}

# 计算文件哈希
calculate_file_hash() {
    local file="$1"
    if [[ -f "$file" ]]; then
        shasum -a 256 "$file" | cut -d' ' -f1
    else
        echo "FILE_NOT_FOUND"
    fi
}

# 生成项目清单
generate_manifest() {
    local manifest_file="$1"
    log_info "生成项目清单..."
    
    cat > "$manifest_file" << EOF
# AI智能工作台项目清单
# 生成时间: $(date)
# 版本: $VERSION
# 备份类型: $BACKUP_TYPE

[PROJECT_INFO]
name=$PROJECT_NAME
version=$VERSION
timestamp=$TIMESTAMP
backup_type=$BACKUP_TYPE
source_path=$PROJECT_DIR

[FILE_HASHES]
EOF
    
    # 计算关键文件的哈希值
    find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name "*.py" -o -name "*.md" -o -name "*.css" \) \
        -not -path "./.next/*" \
        -not -path "./node_modules/*" \
        -not -path "./backend/venv/*" \
        -not -path "./.git/*" | while read -r file; do
        hash=$(calculate_file_hash "$file")
        echo "${file#./}=$hash" >> "$manifest_file"
    done
    
    log_success "项目清单生成完成"
}

# 完整备份
full_backup() {
    log_header "开始完整备份"
    BACKUP_TYPE="full"
    
    local backup_name="${PROJECT_NAME}-full-${TIMESTAMP}"
    local backup_dir="$BACKUP_BASE_DIR/full/$backup_name"
    
    log_info "创建完整备份目录: $backup_dir"
    mkdir -p "$backup_dir"
    
    # 复制项目文件（排除不必要的目录）
    log_info "复制项目文件..."
    rsync -av \
        --exclude='.next/' \
        --exclude='node_modules/' \
        --exclude='backend/venv/' \
        --exclude='.git/' \
        --exclude='*.log' \
        --exclude='*.tmp' \
        --exclude='ai-notebook-backup-*.tar.gz' \
        "$PROJECT_DIR/" "$backup_dir/"
    
    # 生成清单文件
    generate_manifest "$backup_dir/MANIFEST.txt"
    
    # 创建备份信息文件
    cat > "$backup_dir/BACKUP_INFO.txt" << EOF
AI智能工作台 - 完整备份信息

备份时间: $(date)
备份版本: $VERSION
备份类型: 完整备份
源路径: $PROJECT_DIR
备份路径: $backup_dir

项目状态:
- 前端: Next.js + React + TypeScript
- 后端: Python Flask
- 数据库: SQLite
- UI: Tailwind CSS

恢复方法:
1. 解压备份文件到目标目录
2. 运行 ./restore-project.sh
3. 或手动执行以下命令：
   cd 目标目录
   npm install
   cd backend && pip install -r requirements.txt
   npm run dev (前端)
   python backend/app.py (后端)

备份文件大小: $(du -sh "$backup_dir" | cut -f1)
EOF
    
    # 创建快速恢复脚本
    cat > "$backup_dir/restore-project.sh" << 'EOF'
#!/bin/bash

echo "🔄 开始恢复AI智能工作台项目..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 请先安装Node.js"
    exit 1
fi

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 请先安装Python 3"
    exit 1
fi

# 安装前端依赖
echo "📦 安装前端依赖..."
npm install

# 安装后端依赖
echo "🐍 安装后端依赖..."
cd backend
pip3 install -r requirements.txt
cd ..

echo "✅ 项目恢复完成！"
echo ""
echo "启动方法："
echo "前端: npm run dev"
echo "后端: cd backend && python3 app.py"
echo ""
echo "访问地址: http://localhost:3000"
EOF
    
    chmod +x "$backup_dir/restore-project.sh"
    
    # 压缩备份
    log_info "压缩备份文件..."
    cd "$BACKUP_BASE_DIR/full"
    tar -czf "${backup_name}.tar.gz" "$backup_name"
    
    # 清理临时目录
    rm -rf "$backup_name"
    
    local backup_file="$BACKUP_BASE_DIR/full/${backup_name}.tar.gz"
    local backup_size=$(du -sh "$backup_file" | cut -f1)
    
    log_success "完整备份完成！"
    log_info "备份文件: $backup_file"
    log_info "备份大小: $backup_size"
    
    # 记录备份日志
    echo "$(date): 完整备份 - $backup_file ($backup_size)" >> "$BACKUP_BASE_DIR/logs/backup.log"
    
    return 0
}

# 增量备份
incremental_backup() {
    log_header "开始增量备份"
    BACKUP_TYPE="incremental"
    
    local backup_name="${PROJECT_NAME}-incremental-${TIMESTAMP}"
    local backup_dir="$BACKUP_BASE_DIR/incremental/$backup_name"
    local last_backup_manifest=""
    
    # 查找最近的备份清单
    local last_full_backup=$(ls -t "$BACKUP_BASE_DIR/full/"*.tar.gz 2>/dev/null | head -1)
    if [[ -n "$last_full_backup" ]]; then
        log_info "找到基准备份: $(basename "$last_full_backup")"
        # 解压最近的完整备份以获取清单
        local temp_dir=$(mktemp -d)
        tar -xzf "$last_full_backup" -C "$temp_dir"
        last_backup_manifest="$temp_dir/*/MANIFEST.txt"
    else
        log_warning "未找到基准备份，将执行完整备份"
        full_backup
        return $?
    fi
    
    log_info "创建增量备份目录: $backup_dir"
    mkdir -p "$backup_dir"
    
    # 生成当前项目清单
    local current_manifest="$backup_dir/CURRENT_MANIFEST.txt"
    generate_manifest "$current_manifest"
    
    # 比较文件变化
    log_info "分析文件变化..."
    local changed_files="$backup_dir/CHANGED_FILES.txt"
    
    if [[ -f "$last_backup_manifest" ]]; then
        # 比较哈希值，找出变化的文件
        while IFS='=' read -r file hash; do
            if [[ "$file" =~ ^\[.*\]$ ]] || [[ -z "$file" ]] || [[ "$file" =~ ^# ]]; then
                continue
            fi
            
            local current_hash=$(calculate_file_hash "$file")
            if [[ "$current_hash" != "$hash" ]]; then
                echo "$file" >> "$changed_files"
                # 复制变化的文件
                local target_dir="$backup_dir/$(dirname "$file")"
                mkdir -p "$target_dir"
                cp "$file" "$target_dir/" 2>/dev/null || true
            fi
        done < <(grep -v '^\[' "$last_backup_manifest" | grep -v '^#' | grep '=')
    fi
    
    # 查找新文件
    find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name "*.py" -o -name "*.md" -o -name "*.css" \) \
        -not -path "./.next/*" \
        -not -path "./node_modules/*" \
        -not -path "./backend/venv/*" \
        -not -path "./.git/*" \
        -newer "$last_full_backup" >> "$changed_files" 2>/dev/null || true
    
    local change_count=0
    if [[ -f "$changed_files" ]]; then
        change_count=$(wc -l < "$changed_files")
    fi
    
    if [[ $change_count -eq 0 ]]; then
        log_info "没有检测到文件变化，跳过增量备份"
        rm -rf "$backup_dir"
        return 0
    fi
    
    log_info "检测到 $change_count 个文件变化"
    
    # 创建增量备份信息
    cat > "$backup_dir/INCREMENTAL_INFO.txt" << EOF
AI智能工作台 - 增量备份信息

备份时间: $(date)
备份版本: $VERSION
备份类型: 增量备份
基准备份: $(basename "$last_full_backup")
变化文件数: $change_count

变化文件列表:
$(cat "$changed_files" 2>/dev/null || echo "无")

恢复方法:
1. 先恢复基准完整备份
2. 解压此增量备份覆盖对应文件
3. 重新安装依赖并启动项目
EOF
    
    # 压缩增量备份
    cd "$BACKUP_BASE_DIR/incremental"
    tar -czf "${backup_name}.tar.gz" "$backup_name"
    rm -rf "$backup_name"
    
    local backup_file="$BACKUP_BASE_DIR/incremental/${backup_name}.tar.gz"
    local backup_size=$(du -sh "$backup_file" | cut -f1)
    
    log_success "增量备份完成！"
    log_info "备份文件: $backup_file"
    log_info "备份大小: $backup_size"
    log_info "变化文件: $change_count 个"
    
    # 记录备份日志
    echo "$(date): 增量备份 - $backup_file ($backup_size, $change_count files)" >> "$BACKUP_BASE_DIR/logs/backup.log"
    
    # 清理临时文件
    [[ -n "$temp_dir" ]] && rm -rf "$temp_dir"
    
    return 0
}

# 版本标记备份
version_backup() {
    log_header "创建版本标记备份"
    
    local version_backup_name="${PROJECT_NAME}-${VERSION}-${TIMESTAMP}"
    local version_backup_dir="$BACKUP_BASE_DIR/versions/$version_backup_name"
    
    log_info "创建版本备份: $version_backup_name"
    mkdir -p "$version_backup_dir"
    
    # 复制项目文件
    rsync -av \
        --exclude='.next/' \
        --exclude='node_modules/' \
        --exclude='backend/venv/' \
        --exclude='.git/' \
        --exclude='*.log' \
        --exclude='*.tmp' \
        "$PROJECT_DIR/" "$version_backup_dir/"
    
    # 创建版本信息
    cat > "$version_backup_dir/VERSION_INFO.txt" << EOF
AI智能工作台 - 版本备份

版本号: $VERSION
发布时间: $(date)
备份类型: 版本标记备份

版本特性:
- 品牌升级为AI智能工作台
- 2排3列响应式网格布局
- 导航栏优化为"我的个人工作台"
- 性能优化和代码简化
- 完整的项目保护方案

技术栈:
- 前端: Next.js 14 + React 18 + TypeScript
- 后端: Python Flask + SQLite
- 样式: Tailwind CSS
- 部署: Vercel + Railway

Git标记命令:
git tag -a $VERSION -m "AI智能工作台 $VERSION 版本发布"
git push origin $VERSION
EOF
    
    # 压缩版本备份
    cd "$BACKUP_BASE_DIR/versions"
    tar -czf "${version_backup_name}.tar.gz" "$version_backup_name"
    rm -rf "$version_backup_name"
    
    local backup_file="$BACKUP_BASE_DIR/versions/${version_backup_name}.tar.gz"
    local backup_size=$(du -sh "$backup_file" | cut -f1)
    
    log_success "版本备份完成！"
    log_info "版本文件: $backup_file"
    log_info "文件大小: $backup_size"
    
    return 0
}

# 清理旧备份
cleanup_old_backups() {
    log_info "清理旧备份文件..."
    
    # 保留最近5个完整备份
    local full_backups=($(ls -t "$BACKUP_BASE_DIR/full/"*.tar.gz 2>/dev/null))
    if [[ ${#full_backups[@]} -gt 5 ]]; then
        for ((i=5; i<${#full_backups[@]}; i++)); do
            log_info "删除旧的完整备份: $(basename "${full_backups[$i]}")"
            rm -f "${full_backups[$i]}"
        done
    fi
    
    # 保留最近10个增量备份
    local inc_backups=($(ls -t "$BACKUP_BASE_DIR/incremental/"*.tar.gz 2>/dev/null))
    if [[ ${#inc_backups[@]} -gt 10 ]]; then
        for ((i=10; i<${#inc_backups[@]}; i++)); do
            log_info "删除旧的增量备份: $(basename "${inc_backups[$i]}")"
            rm -f "${inc_backups[$i]}"
        done
    fi
    
    # 版本备份永久保留
    log_success "备份清理完成"
}

# 显示备份状态
show_backup_status() {
    log_header "备份状态报告"
    
    echo -e "${CYAN}备份目录: $BACKUP_BASE_DIR${NC}"
    echo ""
    
    # 完整备份
    local full_count=$(ls "$BACKUP_BASE_DIR/full/"*.tar.gz 2>/dev/null | wc -l)
    echo -e "${GREEN}完整备份: $full_count 个${NC}"
    if [[ $full_count -gt 0 ]]; then
        ls -lh "$BACKUP_BASE_DIR/full/"*.tar.gz | tail -3
    fi
    echo ""
    
    # 增量备份
    local inc_count=$(ls "$BACKUP_BASE_DIR/incremental/"*.tar.gz 2>/dev/null | wc -l)
    echo -e "${YELLOW}增量备份: $inc_count 个${NC}"
    if [[ $inc_count -gt 0 ]]; then
        ls -lh "$BACKUP_BASE_DIR/incremental/"*.tar.gz | tail -3
    fi
    echo ""
    
    # 版本备份
    local ver_count=$(ls "$BACKUP_BASE_DIR/versions/"*.tar.gz 2>/dev/null | wc -l)
    echo -e "${PURPLE}版本备份: $ver_count 个${NC}"
    if [[ $ver_count -gt 0 ]]; then
        ls -lh "$BACKUP_BASE_DIR/versions/"*.tar.gz
    fi
    echo ""
    
    # 总大小
    local total_size=$(du -sh "$BACKUP_BASE_DIR" 2>/dev/null | cut -f1)
    echo -e "${BLUE}总备份大小: $total_size${NC}"
}

# 主函数
main() {
    log_header "AI智能工作台 - 增强版备份系统 v2.0"
    
    # 检查项目完整性
    if ! check_project_integrity; then
        log_error "项目完整性检查失败，备份终止"
        exit 1
    fi
    
    # 创建备份目录结构
    create_backup_structure
    
    # 根据参数选择备份类型
    case "${1:-full}" in
        "full")
            full_backup
            ;;
        "incremental"|"inc")
            incremental_backup
            ;;
        "version"|"ver")
            version_backup
            ;;
        "all")
            full_backup
            incremental_backup
            version_backup
            ;;
        "status")
            show_backup_status
            exit 0
            ;;
        "cleanup")
            cleanup_old_backups
            exit 0
            ;;
        *)
            echo "用法: $0 [full|incremental|version|all|status|cleanup]"
            echo ""
            echo "备份类型:"
            echo "  full        - 完整备份（默认）"
            echo "  incremental - 增量备份"
            echo "  version     - 版本标记备份"
            echo "  all         - 执行所有类型备份"
            echo "  status      - 显示备份状态"
            echo "  cleanup     - 清理旧备份"
            exit 1
            ;;
    esac
    
    # 清理旧备份
    cleanup_old_backups
    
    # 显示备份状态
    show_backup_status
    
    log_header "备份任务完成"
    log_success "AI智能工作台已安全备份！"
    
    echo ""
    echo -e "${CYAN}快速恢复命令:${NC}"
    echo "tar -xzf 备份文件.tar.gz && cd 解压目录 && ./restore-project.sh"
    echo ""
    echo -e "${CYAN}手动恢复步骤:${NC}"
    echo "1. 解压备份文件到目标目录"
    echo "2. npm install (安装前端依赖)"
    echo "3. cd backend && pip install -r requirements.txt (安装后端依赖)"
    echo "4. npm run dev (启动前端)"
    echo "5. python backend/app.py (启动后端)"
}

# 执行主函数
main "$@"