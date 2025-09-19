#!/bin/bash

# AI智能工作台 - 综合项目管理脚本
# 功能：整合备份、部署、监控、恢复等所有功能

set -e  # 遇到错误立即退出

# 配置变量
PROJECT_NAME="AI智能工作台"
VERSION="v1.1.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

# 显示项目信息
show_project_info() {
    log_header "$PROJECT_NAME 项目管理器"
    
    echo -e "${CYAN}项目名称:${NC} $PROJECT_NAME"
    echo -e "${CYAN}当前版本:${NC} $VERSION"
    echo -e "${CYAN}项目目录:${NC} $SCRIPT_DIR"
    echo -e "${CYAN}管理时间:${NC} $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # 显示项目状态
    echo -e "${BLUE}项目状态:${NC}"
    if [[ -f "package.json" ]]; then
        echo -e "  ${GREEN}✓${NC} 前端项目配置"
    else
        echo -e "  ${RED}✗${NC} 前端项目配置"
    fi
    
    if [[ -f "backend/app.py" ]]; then
        echo -e "  ${GREEN}✓${NC} 后端项目配置"
    else
        echo -e "  ${RED}✗${NC} 后端项目配置"
    fi
    
    if [[ -d "node_modules" ]]; then
        echo -e "  ${GREEN}✓${NC} 前端依赖已安装"
    else
        echo -e "  ${YELLOW}!${NC} 前端依赖未安装"
    fi
    
    # 检查服务状态
    if lsof -i :3000 > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} 前端服务运行中 (端口 3000)"
    else
        echo -e "  ${RED}✗${NC} 前端服务未运行"
    fi
    
    if lsof -i :5000 > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} 后端服务运行中 (端口 5000)"
    else
        echo -e "  ${RED}✗${NC} 后端服务未运行"
    fi
    
    echo ""
}

# 显示可用脚本
show_available_scripts() {
    echo -e "${BLUE}可用管理脚本:${NC}"
    
    local scripts=(
        "backup-project.sh:项目备份脚本"
        "deploy.sh:自动化部署脚本"
        "restore.sh:项目恢复脚本"
        "monitor.sh:监控和健康检查脚本"
        "create-version-tag.sh:版本标记脚本"
    )
    
    for script_info in "${scripts[@]}"; do
        local script_name="${script_info%%:*}"
        local script_desc="${script_info##*:}"
        
        if [[ -f "$script_name" && -x "$script_name" ]]; then
            echo -e "  ${GREEN}✓${NC} $script_name - $script_desc"
        else
            echo -e "  ${RED}✗${NC} $script_name - $script_desc (不可用)"
        fi
    done
    
    echo ""
}

# 显示帮助信息
show_help() {
    cat << EOF
$PROJECT_NAME 综合项目管理器

用法: $0 [命令] [选项]

主要命令:
  info               显示项目信息和状态
  backup             执行项目备份
  deploy             部署项目
  restore            恢复项目
  monitor            监控项目
  version            创建版本标记
  start              启动所有服务
  stop               停止所有服务
  restart            重启所有服务
  status             显示服务状态
  logs               查看服务日志
  clean              清理项目文件
  setup              初始化项目环境
  help               显示帮助信息

备份相关:
  backup --full      创建完整备份
  backup --inc       创建增量备份
  backup --version   创建版本备份
  backup --list      列出所有备份

部署相关:
  deploy --env prod  部署到生产环境
  deploy --env dev   部署到开发环境
  deploy --rollback  回滚到上一版本

恢复相关:
  restore --latest   恢复最新备份
  restore --version  恢复指定版本
  restore --list     列出可用备份

监控相关:
  monitor --check    执行健康检查
  monitor --watch    持续监控模式
  monitor --report   生成监控报告

版本相关:
  version --create   创建新版本标记
  version --list     列出所有版本

服务管理:
  start --frontend   仅启动前端服务
  start --backend    仅启动后端服务
  stop --all         停止所有服务
  restart --force    强制重启

示例:
  $0 info                    显示项目信息
  $0 backup --full           创建完整备份
  $0 deploy --env prod       部署到生产环境
  $0 monitor --watch         启动持续监控
  $0 start                   启动所有服务
  $0 version --create v1.2.0 创建新版本

环境变量:
  PROJECT_ENV        项目环境 (dev/prod)
  BACKUP_DIR         备份目录
  DEPLOY_TARGET      部署目标
EOF
}

# 执行备份
run_backup() {
    if [[ ! -f "backup-project.sh" || ! -x "backup-project.sh" ]]; then
        log_error "备份脚本不可用"
        return 1
    fi
    
    log_info "执行项目备份..."
    ./backup-project.sh "$@"
}

# 执行部署
run_deploy() {
    if [[ ! -f "deploy.sh" || ! -x "deploy.sh" ]]; then
        log_error "部署脚本不可用"
        return 1
    fi
    
    log_info "执行项目部署..."
    ./deploy.sh "$@"
}

# 执行恢复
run_restore() {
    if [[ ! -f "restore.sh" || ! -x "restore.sh" ]]; then
        log_error "恢复脚本不可用"
        return 1
    fi
    
    log_info "执行项目恢复..."
    ./restore.sh "$@"
}

# 执行监控
run_monitor() {
    if [[ ! -f "monitor.sh" || ! -x "monitor.sh" ]]; then
        log_error "监控脚本不可用"
        return 1
    fi
    
    log_info "执行项目监控..."
    ./monitor.sh "$@"
}

# 创建版本标记
run_version() {
    if [[ ! -f "create-version-tag.sh" || ! -x "create-version-tag.sh" ]]; then
        log_error "版本标记脚本不可用"
        return 1
    fi
    
    log_info "创建版本标记..."
    ./create-version-tag.sh "$@"
}

# 启动服务
start_services() {
    local service_type="$1"
    
    case "$service_type" in
        --frontend)
            log_info "启动前端服务..."
            if ! lsof -i :3000 > /dev/null 2>&1; then
                nohup npm run dev > frontend.log 2>&1 &
                log_success "前端服务已启动"
            else
                log_warning "前端服务已在运行"
            fi
            ;;
        --backend)
            log_info "启动后端服务..."
            if ! lsof -i :5000 > /dev/null 2>&1; then
                nohup python3 backend/app.py > backend.log 2>&1 &
                log_success "后端服务已启动"
            else
                log_warning "后端服务已在运行"
            fi
            ;;
        *)
            log_info "启动所有服务..."
            start_services --frontend
            start_services --backend
            
            # 等待服务启动
            sleep 3
            
            # 检查服务状态
            if lsof -i :3000 > /dev/null 2>&1 && lsof -i :5000 > /dev/null 2>&1; then
                log_success "所有服务启动成功"
                echo -e "${CYAN}访问地址:${NC}"
                echo "前端: http://localhost:3000"
                echo "后端: http://localhost:5000"
            else
                log_warning "部分服务启动失败，请检查日志"
            fi
            ;;
    esac
}

# 停止服务
stop_services() {
    local stop_type="$1"
    
    case "$stop_type" in
        --all|*)
            log_info "停止所有服务..."
            
            # 停止前端服务
            local frontend_pids=$(lsof -ti :3000 2>/dev/null || true)
            if [[ -n "$frontend_pids" ]]; then
                kill $frontend_pids 2>/dev/null || true
                log_success "前端服务已停止"
            fi
            
            # 停止后端服务
            local backend_pids=$(lsof -ti :5000 2>/dev/null || true)
            if [[ -n "$backend_pids" ]]; then
                kill $backend_pids 2>/dev/null || true
                log_success "后端服务已停止"
            fi
            
            # 停止相关进程
            pkill -f "npm run dev" 2>/dev/null || true
            pkill -f "python.*app.py" 2>/dev/null || true
            
            log_success "所有服务已停止"
            ;;
    esac
}

# 重启服务
restart_services() {
    local restart_type="$1"
    
    case "$restart_type" in
        --force)
            log_info "强制重启所有服务..."
            stop_services --all
            sleep 2
            start_services
            ;;
        *)
            log_info "重启所有服务..."
            stop_services --all
            sleep 1
            start_services
            ;;
    esac
}

# 显示服务状态
show_service_status() {
    log_header "服务状态"
    
    # 前端服务状态
    if lsof -i :3000 > /dev/null 2>&1; then
        local frontend_pid=$(lsof -ti :3000)
        echo -e "${GREEN}✓${NC} 前端服务运行中 (PID: $frontend_pid, 端口: 3000)"
    else
        echo -e "${RED}✗${NC} 前端服务未运行"
    fi
    
    # 后端服务状态
    if lsof -i :5000 > /dev/null 2>&1; then
        local backend_pid=$(lsof -ti :5000)
        echo -e "${GREEN}✓${NC} 后端服务运行中 (PID: $backend_pid, 端口: 5000)"
    else
        echo -e "${RED}✗${NC} 后端服务未运行"
    fi
    
    echo ""
    
    # 进程信息
    echo -e "${BLUE}相关进程:${NC}"
    ps aux | grep -E "(npm|node|python.*app\.py)" | grep -v grep || echo "无相关进程"
}

# 查看日志
show_logs() {
    local log_type="$1"
    
    case "$log_type" in
        --frontend)
            if [[ -f "frontend.log" ]]; then
                log_info "前端服务日志:"
                tail -20 frontend.log
            else
                log_warning "前端日志文件不存在"
            fi
            ;;
        --backend)
            if [[ -f "backend.log" ]]; then
                log_info "后端服务日志:"
                tail -20 backend.log
            else
                log_warning "后端日志文件不存在"
            fi
            ;;
        *)
            log_info "所有服务日志:"
            echo -e "\n${BLUE}前端日志:${NC}"
            if [[ -f "frontend.log" ]]; then
                tail -10 frontend.log
            else
                echo "无前端日志"
            fi
            
            echo -e "\n${BLUE}后端日志:${NC}"
            if [[ -f "backend.log" ]]; then
                tail -10 backend.log
            else
                echo "无后端日志"
            fi
            ;;
    esac
}

# 清理项目文件
clean_project() {
    log_info "清理项目文件..."
    
    # 清理日志文件
    rm -f *.log
    
    # 清理临时文件
    rm -rf .tmp
    rm -rf temp
    
    # 清理构建文件
    rm -rf .next
    rm -rf dist
    rm -rf build
    
    # 清理缓存
    rm -rf .cache
    
    log_success "项目清理完成"
}

# 初始化项目环境
setup_project() {
    log_info "初始化项目环境..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "请先安装 Node.js 18+"
        return 1
    fi
    
    # 检查Python
    if ! command -v python3 &> /dev/null; then
        log_error "请先安装 Python 3.8+"
        return 1
    fi
    
    # 安装前端依赖
    if [[ -f "package.json" ]]; then
        log_info "安装前端依赖..."
        npm install
    fi
    
    # 安装后端依赖
    if [[ -f "backend/requirements.txt" ]]; then
        log_info "安装后端依赖..."
        pip3 install -r backend/requirements.txt
    fi
    
    # 创建必要目录
    mkdir -p logs
    mkdir -p ../backups
    
    # 设置脚本权限
    chmod +x *.sh 2>/dev/null || true
    
    log_success "项目环境初始化完成"
}

# 主函数
main() {
    # 检查是否在项目目录中
    if [[ ! -f "package.json" ]]; then
        log_error "请在项目根目录中运行此脚本"
        exit 1
    fi
    
    # 解析命令行参数
    case "${1:-help}" in
        info)
            show_project_info
            show_available_scripts
            ;;
        backup)
            shift
            run_backup "$@"
            ;;
        deploy)
            shift
            run_deploy "$@"
            ;;
        restore)
            shift
            run_restore "$@"
            ;;
        monitor)
            shift
            run_monitor "$@"
            ;;
        version)
            shift
            run_version "$@"
            ;;
        start)
            shift
            start_services "$@"
            ;;
        stop)
            shift
            stop_services "$@"
            ;;
        restart)
            shift
            restart_services "$@"
            ;;
        status)
            show_service_status
            ;;
        logs)
            shift
            show_logs "$@"
            ;;
        clean)
            clean_project
            ;;
        setup)
            setup_project
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"