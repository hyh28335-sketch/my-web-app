#!/bin/bash

# AI智能工作台 - 自动化恢复脚本
# 功能：从备份中快速恢复项目

set -e  # 遇到错误立即退出

# 配置变量
PROJECT_NAME="AI智能工作台"
VERSION="v1.1.0"
BACKUP_BASE_DIR="../backups"
RESTORE_DIR="./restored"

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

# 显示帮助信息
show_help() {
    cat << EOF
$PROJECT_NAME 自动化恢复脚本

用法: $0 [选项] [备份文件]

选项:
  --list             列出所有可用备份
  --latest           恢复最新的完整备份
  --version VERSION  恢复指定版本备份
  --target DIR       指定恢复目标目录 (默认: $RESTORE_DIR)
  --no-deps          跳过依赖安装
  --no-start         恢复后不启动服务
  --force            强制覆盖现有文件
  --verify           验证备份完整性
  --help, -h         显示帮助信息

备份类型:
  full               完整备份
  incremental        增量备份 (需要基准备份)
  version            版本标记备份

示例:
  $0 --list                           列出所有备份
  $0 --latest                         恢复最新完整备份
  $0 --version v1.1.0                 恢复指定版本
  $0 backup-file.tar.gz               恢复指定备份文件
  $0 --target /opt/ai-workspace       恢复到指定目录
  $0 --verify backup-file.tar.gz      验证备份完整性

环境变量:
  BACKUP_BASE_DIR    备份基础目录 (默认: $BACKUP_BASE_DIR)
  RESTORE_DIR        恢复目标目录 (默认: $RESTORE_DIR)
EOF
}

# 列出可用备份
list_backups() {
    log_header "可用备份列表"
    
    echo -e "${CYAN}备份目录: $BACKUP_BASE_DIR${NC}"
    echo ""
    
    # 完整备份
    echo -e "${GREEN}完整备份:${NC}"
    if [[ -d "$BACKUP_BASE_DIR/full" ]]; then
        local full_backups=($(ls -t "$BACKUP_BASE_DIR/full/"*.tar.gz 2>/dev/null))
        if [[ ${#full_backups[@]} -gt 0 ]]; then
            for backup in "${full_backups[@]}"; do
                local size=$(du -sh "$backup" | cut -f1)
                local date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$backup" 2>/dev/null || stat -c "%y" "$backup" 2>/dev/null | cut -d' ' -f1,2 | cut -d'.' -f1)
                echo "  $(basename "$backup") ($size, $date)"
            done
        else
            echo "  无完整备份"
        fi
    else
        echo "  备份目录不存在"
    fi
    echo ""
    
    # 增量备份
    echo -e "${YELLOW}增量备份:${NC}"
    if [[ -d "$BACKUP_BASE_DIR/incremental" ]]; then
        local inc_backups=($(ls -t "$BACKUP_BASE_DIR/incremental/"*.tar.gz 2>/dev/null))
        if [[ ${#inc_backups[@]} -gt 0 ]]; then
            for backup in "${inc_backups[@]}"; do
                local size=$(du -sh "$backup" | cut -f1)
                local date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$backup" 2>/dev/null || stat -c "%y" "$backup" 2>/dev/null | cut -d' ' -f1,2 | cut -d'.' -f1)
                echo "  $(basename "$backup") ($size, $date)"
            done
        else
            echo "  无增量备份"
        fi
    else
        echo "  备份目录不存在"
    fi
    echo ""
    
    # 版本备份
    echo -e "${PURPLE}版本备份:${NC}"
    if [[ -d "$BACKUP_BASE_DIR/versions" ]]; then
        local ver_backups=($(ls -t "$BACKUP_BASE_DIR/versions/"*.tar.gz 2>/dev/null))
        if [[ ${#ver_backups[@]} -gt 0 ]]; then
            for backup in "${ver_backups[@]}"; do
                local size=$(du -sh "$backup" | cut -f1)
                local date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$backup" 2>/dev/null || stat -c "%y" "$backup" 2>/dev/null | cut -d' ' -f1,2 | cut -d'.' -f1)
                echo "  $(basename "$backup") ($size, $date)"
            done
        else
            echo "  无版本备份"
        fi
    else
        echo "  备份目录不存在"
    fi
}

# 查找备份文件
find_backup_file() {
    local search_term="$1"
    local backup_file=""
    
    # 如果是完整路径且文件存在
    if [[ -f "$search_term" ]]; then
        echo "$search_term"
        return 0
    fi
    
    # 在备份目录中搜索
    local search_dirs=("$BACKUP_BASE_DIR/full" "$BACKUP_BASE_DIR/incremental" "$BACKUP_BASE_DIR/versions")
    
    for dir in "${search_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            # 精确匹配
            if [[ -f "$dir/$search_term" ]]; then
                echo "$dir/$search_term"
                return 0
            fi
            
            # 模糊匹配
            local matches=($(find "$dir" -name "*$search_term*" -type f 2>/dev/null))
            if [[ ${#matches[@]} -eq 1 ]]; then
                echo "${matches[0]}"
                return 0
            elif [[ ${#matches[@]} -gt 1 ]]; then
                log_error "找到多个匹配的备份文件:"
                for match in "${matches[@]}"; do
                    echo "  $(basename "$match")"
                done
                return 1
            fi
        fi
    done
    
    log_error "未找到备份文件: $search_term"
    return 1
}

# 获取最新备份
get_latest_backup() {
    local latest_backup=""
    local latest_time=0
    
    # 搜索完整备份
    if [[ -d "$BACKUP_BASE_DIR/full" ]]; then
        local full_backups=($(ls -t "$BACKUP_BASE_DIR/full/"*.tar.gz 2>/dev/null))
        if [[ ${#full_backups[@]} -gt 0 ]]; then
            latest_backup="${full_backups[0]}"
        fi
    fi
    
    if [[ -n "$latest_backup" ]]; then
        echo "$latest_backup"
        return 0
    else
        log_error "未找到任何完整备份"
        return 1
    fi
}

# 验证备份完整性
verify_backup() {
    local backup_file="$1"
    
    log_info "验证备份完整性: $(basename "$backup_file")"
    
    # 检查文件是否存在
    if [[ ! -f "$backup_file" ]]; then
        log_error "备份文件不存在: $backup_file"
        return 1
    fi
    
    # 检查文件是否为有效的tar.gz
    if ! tar -tzf "$backup_file" > /dev/null 2>&1; then
        log_error "备份文件损坏或格式无效"
        return 1
    fi
    
    # 检查关键文件
    local required_files=("package.json" "app/layout.tsx" "components/MainContent.tsx")
    local temp_dir=$(mktemp -d)
    
    tar -xzf "$backup_file" -C "$temp_dir"
    local extracted_dir=$(find "$temp_dir" -maxdepth 1 -type d | tail -1)
    
    local missing_files=0
    for file in "${required_files[@]}"; do
        if [[ ! -f "$extracted_dir/$file" ]]; then
            log_warning "缺少关键文件: $file"
            ((missing_files++))
        fi
    done
    
    # 清理临时目录
    rm -rf "$temp_dir"
    
    if [[ $missing_files -eq 0 ]]; then
        log_success "备份完整性验证通过"
        return 0
    else
        log_warning "备份完整性验证发现 $missing_files 个问题"
        return 1
    fi
}

# 解压备份
extract_backup() {
    local backup_file="$1"
    local target_dir="$2"
    
    log_info "解压备份: $(basename "$backup_file")"
    log_info "目标目录: $target_dir"
    
    # 创建目标目录
    mkdir -p "$target_dir"
    
    # 检查目标目录是否为空
    if [[ "$FORCE_RESTORE" != "true" ]] && [[ -n "$(ls -A "$target_dir" 2>/dev/null)" ]]; then
        log_warning "目标目录不为空: $target_dir"
        read -p "是否要覆盖现有文件？(y/N): " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            log_info "恢复已取消"
            return 1
        fi
    fi
    
    # 解压备份文件
    local temp_dir=$(mktemp -d)
    tar -xzf "$backup_file" -C "$temp_dir"
    
    # 查找解压后的目录
    local extracted_dir=$(find "$temp_dir" -maxdepth 1 -type d | tail -1)
    
    if [[ -z "$extracted_dir" ]]; then
        log_error "备份解压失败"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # 复制文件到目标目录
    cp -r "$extracted_dir"/* "$target_dir/"
    
    # 清理临时目录
    rm -rf "$temp_dir"
    
    log_success "备份解压完成"
    return 0
}

# 安装依赖
install_dependencies() {
    if [[ "$SKIP_DEPS" == "true" ]]; then
        log_info "跳过依赖安装"
        return 0
    fi
    
    log_info "安装项目依赖..."
    
    cd "$RESTORE_DIR"
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js 18+"
        return 1
    fi
    
    # 检查Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 未安装，请先安装 Python 3.8+"
        return 1
    fi
    
    # 安装前端依赖
    log_info "安装前端依赖..."
    if [[ -f "package.json" ]]; then
        npm install
    else
        log_warning "未找到 package.json 文件"
    fi
    
    # 安装后端依赖
    log_info "安装后端依赖..."
    if [[ -f "backend/requirements.txt" ]]; then
        cd backend
        pip3 install -r requirements.txt
        cd ..
    else
        log_warning "未找到 backend/requirements.txt 文件"
    fi
    
    log_success "依赖安装完成"
}

# 启动服务
start_services() {
    if [[ "$NO_START" == "true" ]]; then
        log_info "跳过服务启动"
        return 0
    fi
    
    log_info "启动服务..."
    
    cd "$RESTORE_DIR"
    
    # 启动前端服务
    log_info "启动前端服务..."
    nohup npm run dev > frontend.log 2>&1 &
    local frontend_pid=$!
    
    # 启动后端服务
    log_info "启动后端服务..."
    nohup python3 backend/app.py > backend.log 2>&1 &
    local backend_pid=$!
    
    # 等待服务启动
    sleep 5
    
    # 检查服务状态
    if kill -0 $frontend_pid 2>/dev/null; then
        log_success "前端服务启动成功 (PID: $frontend_pid)"
    else
        log_warning "前端服务启动失败"
    fi
    
    if kill -0 $backend_pid 2>/dev/null; then
        log_success "后端服务启动成功 (PID: $backend_pid)"
    else
        log_warning "后端服务启动失败"
    fi
    
    # 健康检查
    log_info "等待服务就绪..."
    local attempts=0
    local max_attempts=30
    
    while [[ $attempts -lt $max_attempts ]]; do
        if curl -s "http://localhost:3000" > /dev/null 2>&1; then
            log_success "前端服务就绪: http://localhost:3000"
            break
        fi
        ((attempts++))
        sleep 2
    done
    
    if [[ $attempts -eq $max_attempts ]]; then
        log_warning "前端服务健康检查超时"
    fi
}

# 显示恢复信息
show_restore_info() {
    log_header "恢复完成"
    
    echo -e "${CYAN}项目: $PROJECT_NAME${NC}"
    echo -e "${CYAN}恢复目录: $RESTORE_DIR${NC}"
    echo ""
    
    if [[ -f "$RESTORE_DIR/BACKUP_INFO.txt" ]]; then
        echo -e "${BLUE}备份信息:${NC}"
        cat "$RESTORE_DIR/BACKUP_INFO.txt" | head -10
        echo ""
    fi
    
    echo -e "${GREEN}访问地址:${NC}"
    echo "前端: http://localhost:3000"
    echo "后端: http://localhost:5000"
    echo ""
    
    echo -e "${YELLOW}日志文件:${NC}"
    echo "前端日志: $RESTORE_DIR/frontend.log"
    echo "后端日志: $RESTORE_DIR/backend.log"
    echo ""
    
    echo -e "${PURPLE}手动启动命令:${NC}"
    echo "cd $RESTORE_DIR"
    echo "npm run dev          # 前端服务"
    echo "python3 backend/app.py  # 后端服务"
}

# 主函数
main() {
    log_header "$PROJECT_NAME 自动化恢复"
    
    # 解析命令行参数
    local backup_file=""
    local target_version=""
    SKIP_DEPS=false
    NO_START=false
    FORCE_RESTORE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --list)
                list_backups
                exit 0
                ;;
            --latest)
                backup_file=$(get_latest_backup)
                if [[ $? -ne 0 ]]; then
                    exit 1
                fi
                shift
                ;;
            --version)
                target_version="$2"
                backup_file=$(find_backup_file "$target_version")
                if [[ $? -ne 0 ]]; then
                    exit 1
                fi
                shift 2
                ;;
            --target)
                RESTORE_DIR="$2"
                shift 2
                ;;
            --no-deps)
                SKIP_DEPS=true
                shift
                ;;
            --no-start)
                NO_START=true
                shift
                ;;
            --force)
                FORCE_RESTORE=true
                shift
                ;;
            --verify)
                if [[ -n "$2" && "$2" != --* ]]; then
                    backup_file=$(find_backup_file "$2")
                    if [[ $? -eq 0 ]]; then
                        verify_backup "$backup_file"
                        exit $?
                    else
                        exit 1
                    fi
                else
                    log_error "--verify 需要指定备份文件"
                    exit 1
                fi
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            -*)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
            *)
                backup_file=$(find_backup_file "$1")
                if [[ $? -ne 0 ]]; then
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # 如果没有指定备份文件，使用最新的
    if [[ -z "$backup_file" ]]; then
        log_info "未指定备份文件，使用最新的完整备份"
        backup_file=$(get_latest_backup)
        if [[ $? -ne 0 ]]; then
            log_error "请指定要恢复的备份文件或使用 --list 查看可用备份"
            exit 1
        fi
    fi
    
    echo -e "${CYAN}备份文件: $(basename "$backup_file")${NC}"
    echo -e "${CYAN}恢复目录: $RESTORE_DIR${NC}"
    echo ""
    
    # 确认恢复
    if [[ "$FORCE_RESTORE" != "true" ]]; then
        read -p "确认要恢复此备份吗？(y/N): " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            log_info "恢复已取消"
            exit 0
        fi
    fi
    
    # 执行恢复流程
    verify_backup "$backup_file"
    extract_backup "$backup_file" "$RESTORE_DIR"
    install_dependencies
    start_services
    
    # 显示恢复信息
    show_restore_info
    
    log_success "$PROJECT_NAME 恢复完成！"
}

# 执行主函数
main "$@"