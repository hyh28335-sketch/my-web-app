#!/bin/bash

# AI智能工作台 - 自动化部署脚本
# 功能：一键部署到开发、测试、生产环境

set -e  # 遇到错误立即退出

# 配置变量
PROJECT_NAME="AI智能工作台"
VERSION="v1.1.0"
DEFAULT_ENV="development"
DEPLOY_DIR="/opt/ai-workspace"
BACKUP_DIR="/opt/backups"
LOG_DIR="/var/log/ai-workspace"

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
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $1" >> "$LOG_DIR/deploy.log" 2>/dev/null || true
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [SUCCESS] $1" >> "$LOG_DIR/deploy.log" 2>/dev/null || true
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [WARNING] $1" >> "$LOG_DIR/deploy.log" 2>/dev/null || true
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $1" >> "$LOG_DIR/deploy.log" 2>/dev/null || true
}

log_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# 显示帮助信息
show_help() {
    cat << EOF
$PROJECT_NAME 自动化部署脚本

用法: $0 [环境] [选项]

环境:
  development, dev    开发环境 (默认)
  testing, test       测试环境
  production, prod    生产环境

选项:
  --backup           部署前创建备份
  --no-deps          跳过依赖安装
  --no-build         跳过构建步骤
  --force            强制部署，忽略检查
  --rollback         回滚到上一个版本
  --status           显示部署状态
  --help, -h         显示帮助信息

示例:
  $0 dev              部署到开发环境
  $0 prod --backup    部署到生产环境并创建备份
  $0 --rollback       回滚到上一个版本
  $0 --status         查看部署状态

环境变量:
  DEPLOY_DIR         部署目录 (默认: $DEPLOY_DIR)
  BACKUP_DIR         备份目录 (默认: $BACKUP_DIR)
  LOG_DIR            日志目录 (默认: $LOG_DIR)
EOF
}

# 检查系统要求
check_requirements() {
    log_info "检查系统要求..."
    
    local errors=0
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        ((errors++))
    else
        local node_version=$(node --version | sed 's/v//')
        log_info "Node.js 版本: $node_version"
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        ((errors++))
    fi
    
    # 检查Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 未安装"
        ((errors++))
    else
        local python_version=$(python3 --version | cut -d' ' -f2)
        log_info "Python 版本: $python_version"
    fi
    
    # 检查pip
    if ! command -v pip3 &> /dev/null; then
        log_error "pip3 未安装"
        ((errors++))
    fi
    
    # 检查磁盘空间
    local available_space=$(df . | tail -1 | awk '{print $4}')
    if [[ $available_space -lt 1048576 ]]; then  # 1GB in KB
        log_warning "可用磁盘空间不足1GB"
    fi
    
    if [[ $errors -gt 0 ]]; then
        log_error "系统要求检查失败，发现 $errors 个问题"
        return 1
    fi
    
    log_success "系统要求检查通过"
    return 0
}

# 创建目录结构
create_directories() {
    log_info "创建目录结构..."
    
    # 创建部署目录
    sudo mkdir -p "$DEPLOY_DIR" 2>/dev/null || mkdir -p "$DEPLOY_DIR"
    
    # 创建备份目录
    sudo mkdir -p "$BACKUP_DIR" 2>/dev/null || mkdir -p "$BACKUP_DIR"
    
    # 创建日志目录
    sudo mkdir -p "$LOG_DIR" 2>/dev/null || mkdir -p "$LOG_DIR"
    
    # 设置权限
    if [[ -w "$DEPLOY_DIR" ]]; then
        chmod 755 "$DEPLOY_DIR"
    fi
    
    log_success "目录结构创建完成"
}

# 创建部署前备份
create_deployment_backup() {
    if [[ "$CREATE_BACKUP" != "true" ]]; then
        return 0
    fi
    
    log_info "创建部署前备份..."
    
    local backup_name="pre-deploy-$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    if [[ -d "$DEPLOY_DIR/current" ]]; then
        cp -r "$DEPLOY_DIR/current" "$backup_path"
        tar -czf "$backup_path.tar.gz" -C "$BACKUP_DIR" "$backup_name"
        rm -rf "$backup_path"
        
        log_success "部署前备份已创建: $backup_path.tar.gz"
        echo "$backup_path.tar.gz" > "$DEPLOY_DIR/.last_backup"
    else
        log_info "没有现有部署，跳过备份"
    fi
}

# 安装依赖
install_dependencies() {
    if [[ "$SKIP_DEPS" == "true" ]]; then
        log_info "跳过依赖安装"
        return 0
    fi
    
    log_info "安装项目依赖..."
    
    # 安装前端依赖
    log_info "安装前端依赖..."
    npm ci --production=false
    
    # 安装后端依赖
    log_info "安装后端依赖..."
    cd backend
    pip3 install -r requirements.txt
    cd ..
    
    log_success "依赖安装完成"
}

# 构建项目
build_project() {
    if [[ "$SKIP_BUILD" == "true" ]]; then
        log_info "跳过构建步骤"
        return 0
    fi
    
    log_info "构建项目..."
    
    case "$ENVIRONMENT" in
        "production")
            log_info "构建生产版本..."
            npm run build
            ;;
        "testing")
            log_info "构建测试版本..."
            npm run build
            ;;
        "development")
            log_info "开发环境，跳过构建"
            ;;
    esac
    
    log_success "项目构建完成"
}

# 部署应用
deploy_application() {
    log_info "部署应用到 $ENVIRONMENT 环境..."
    
    local deploy_target="$DEPLOY_DIR/releases/$(date +%Y%m%d_%H%M%S)"
    
    # 创建发布目录
    mkdir -p "$deploy_target"
    
    # 复制项目文件
    rsync -av \
        --exclude='.git/' \
        --exclude='node_modules/' \
        --exclude='backend/venv/' \
        --exclude='*.log' \
        --exclude='*.tmp' \
        ./ "$deploy_target/"
    
    # 创建符号链接
    if [[ -L "$DEPLOY_DIR/current" ]]; then
        rm "$DEPLOY_DIR/current"
    fi
    ln -sf "$deploy_target" "$DEPLOY_DIR/current"
    
    # 创建部署信息文件
    cat > "$deploy_target/DEPLOY_INFO.txt" << EOF
部署信息
========

项目: $PROJECT_NAME
版本: $VERSION
环境: $ENVIRONMENT
部署时间: $(date)
部署路径: $deploy_target
Git提交: $(git rev-parse HEAD 2>/dev/null || echo "N/A")

配置:
- Node.js: $(node --version)
- Python: $(python3 --version)
- 部署用户: $(whoami)
- 主机名: $(hostname)
EOF
    
    log_success "应用部署完成: $deploy_target"
}

# 配置环境
configure_environment() {
    log_info "配置 $ENVIRONMENT 环境..."
    
    local config_dir="$DEPLOY_DIR/current"
    
    case "$ENVIRONMENT" in
        "production")
            # 生产环境配置
            cat > "$config_dir/.env.production" << EOF
NODE_ENV=production
PORT=3000
PYTHON_ENV=production
DATABASE_URL=sqlite:///data/production.db
LOG_LEVEL=info
EOF
            ;;
        "testing")
            # 测试环境配置
            cat > "$config_dir/.env.testing" << EOF
NODE_ENV=test
PORT=3001
PYTHON_ENV=testing
DATABASE_URL=sqlite:///data/testing.db
LOG_LEVEL=debug
EOF
            ;;
        "development")
            # 开发环境配置
            cat > "$config_dir/.env.development" << EOF
NODE_ENV=development
PORT=3000
PYTHON_ENV=development
DATABASE_URL=sqlite:///data/development.db
LOG_LEVEL=debug
EOF
            ;;
    esac
    
    log_success "环境配置完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    local current_dir="$DEPLOY_DIR/current"
    
    case "$ENVIRONMENT" in
        "production")
            # 生产环境使用PM2或systemd
            if command -v pm2 &> /dev/null; then
                cd "$current_dir"
                pm2 start ecosystem.config.js --env production
                pm2 save
            else
                log_warning "PM2 未安装，使用直接启动"
                cd "$current_dir"
                nohup npm start > "$LOG_DIR/frontend.log" 2>&1 &
                nohup python3 backend/app.py > "$LOG_DIR/backend.log" 2>&1 &
            fi
            ;;
        "testing"|"development")
            # 开发/测试环境
            cd "$current_dir"
            nohup npm run dev > "$LOG_DIR/frontend-dev.log" 2>&1 &
            nohup python3 backend/app.py > "$LOG_DIR/backend-dev.log" 2>&1 &
            ;;
    esac
    
    # 等待服务启动
    sleep 5
    
    log_success "服务启动完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    local frontend_port=3000
    local backend_port=5000
    local max_attempts=30
    local attempt=0
    
    # 检查前端服务
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -s "http://localhost:$frontend_port" > /dev/null; then
            log_success "前端服务健康检查通过"
            break
        fi
        ((attempt++))
        sleep 2
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        log_error "前端服务健康检查失败"
        return 1
    fi
    
    # 检查后端服务
    attempt=0
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -s "http://localhost:$backend_port/health" > /dev/null; then
            log_success "后端服务健康检查通过"
            break
        fi
        ((attempt++))
        sleep 2
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        log_warning "后端服务健康检查失败"
    fi
    
    log_success "健康检查完成"
}

# 回滚部署
rollback_deployment() {
    log_info "回滚到上一个版本..."
    
    local releases_dir="$DEPLOY_DIR/releases"
    local current_release=$(readlink "$DEPLOY_DIR/current")
    local previous_release=$(ls -t "$releases_dir" | grep -v "$(basename "$current_release")" | head -1)
    
    if [[ -z "$previous_release" ]]; then
        log_error "没有找到可回滚的版本"
        return 1
    fi
    
    # 停止当前服务
    log_info "停止当前服务..."
    pkill -f "npm.*dev" || true
    pkill -f "python.*app.py" || true
    
    # 切换到上一个版本
    rm "$DEPLOY_DIR/current"
    ln -sf "$releases_dir/$previous_release" "$DEPLOY_DIR/current"
    
    # 重启服务
    start_services
    
    # 健康检查
    if health_check; then
        log_success "回滚完成: $previous_release"
    else
        log_error "回滚后健康检查失败"
        return 1
    fi
}

# 显示部署状态
show_deployment_status() {
    log_header "部署状态"
    
    echo -e "${CYAN}项目: $PROJECT_NAME${NC}"
    echo -e "${CYAN}版本: $VERSION${NC}"
    echo ""
    
    # 当前部署
    if [[ -L "$DEPLOY_DIR/current" ]]; then
        local current_release=$(readlink "$DEPLOY_DIR/current")
        echo -e "${GREEN}当前部署:${NC} $(basename "$current_release")"
        
        if [[ -f "$current_release/DEPLOY_INFO.txt" ]]; then
            echo -e "${BLUE}部署信息:${NC}"
            cat "$current_release/DEPLOY_INFO.txt" | head -10
        fi
    else
        echo -e "${RED}没有活动部署${NC}"
    fi
    echo ""
    
    # 服务状态
    echo -e "${YELLOW}服务状态:${NC}"
    if pgrep -f "npm.*dev" > /dev/null; then
        echo "  前端服务: 运行中"
    else
        echo "  前端服务: 停止"
    fi
    
    if pgrep -f "python.*app.py" > /dev/null; then
        echo "  后端服务: 运行中"
    else
        echo "  后端服务: 停止"
    fi
    echo ""
    
    # 最近的发布
    echo -e "${PURPLE}最近的发布:${NC}"
    if [[ -d "$DEPLOY_DIR/releases" ]]; then
        ls -lt "$DEPLOY_DIR/releases" | head -5
    else
        echo "  无发布记录"
    fi
}

# 清理旧发布
cleanup_old_releases() {
    log_info "清理旧发布..."
    
    local releases_dir="$DEPLOY_DIR/releases"
    local keep_releases=5
    
    if [[ -d "$releases_dir" ]]; then
        local release_count=$(ls "$releases_dir" | wc -l)
        if [[ $release_count -gt $keep_releases ]]; then
            ls -t "$releases_dir" | tail -n +$((keep_releases + 1)) | while read -r old_release; do
                log_info "删除旧发布: $old_release"
                rm -rf "$releases_dir/$old_release"
            done
        fi
    fi
    
    log_success "旧发布清理完成"
}

# 主函数
main() {
    log_header "$PROJECT_NAME 自动化部署"
    
    # 解析命令行参数
    ENVIRONMENT="$DEFAULT_ENV"
    CREATE_BACKUP=false
    SKIP_DEPS=false
    SKIP_BUILD=false
    FORCE_DEPLOY=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            development|dev)
                ENVIRONMENT="development"
                shift
                ;;
            testing|test)
                ENVIRONMENT="testing"
                shift
                ;;
            production|prod)
                ENVIRONMENT="production"
                shift
                ;;
            --backup)
                CREATE_BACKUP=true
                shift
                ;;
            --no-deps)
                SKIP_DEPS=true
                shift
                ;;
            --no-build)
                SKIP_BUILD=true
                shift
                ;;
            --force)
                FORCE_DEPLOY=true
                shift
                ;;
            --rollback)
                rollback_deployment
                exit $?
                ;;
            --status)
                show_deployment_status
                exit 0
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    echo -e "${CYAN}部署环境: $ENVIRONMENT${NC}"
    echo -e "${CYAN}创建备份: $CREATE_BACKUP${NC}"
    echo ""
    
    # 确认部署
    if [[ "$FORCE_DEPLOY" != "true" ]]; then
        read -p "确认要部署到 $ENVIRONMENT 环境吗？(y/N): " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            log_info "部署已取消"
            exit 0
        fi
    fi
    
    # 执行部署流程
    check_requirements
    create_directories
    create_deployment_backup
    install_dependencies
    build_project
    deploy_application
    configure_environment
    start_services
    health_check
    cleanup_old_releases
    
    # 显示部署结果
    show_deployment_status
    
    log_header "部署完成"
    log_success "$PROJECT_NAME 已成功部署到 $ENVIRONMENT 环境！"
    
    echo ""
    echo -e "${CYAN}访问地址:${NC}"
    echo "前端: http://localhost:3000"
    echo "后端: http://localhost:5000"
    echo ""
    echo -e "${CYAN}日志文件:${NC}"
    echo "部署日志: $LOG_DIR/deploy.log"
    echo "应用日志: $LOG_DIR/"
}

# 执行主函数
main "$@"