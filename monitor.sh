#!/bin/bash

# AI智能工作台 - 项目监控和健康检查脚本
# 功能：实时监控系统状态、性能指标和服务健康

set -e  # 遇到错误立即退出

# 配置变量
PROJECT_NAME="AI智能工作台"
VERSION="v1.1.0"
MONITOR_INTERVAL=30  # 监控间隔（秒）
LOG_DIR="./logs"
ALERT_LOG="$LOG_DIR/alerts.log"
HEALTH_LOG="$LOG_DIR/health.log"
PERFORMANCE_LOG="$LOG_DIR/performance.log"

# 服务配置
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:5000"
FRONTEND_HEALTH_ENDPOINT="$FRONTEND_URL"
BACKEND_HEALTH_ENDPOINT="$BACKEND_URL/health"

# 阈值配置
CPU_THRESHOLD=80        # CPU使用率阈值
MEMORY_THRESHOLD=80     # 内存使用率阈值
DISK_THRESHOLD=90       # 磁盘使用率阈值
RESPONSE_TIME_THRESHOLD=5000  # 响应时间阈值（毫秒）

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
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[INFO]${NC} $1"
    echo "[$timestamp] [INFO] $1" >> "$HEALTH_LOG"
}

log_success() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    echo "[$timestamp] [SUCCESS] $1" >> "$HEALTH_LOG"
}

log_warning() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[WARNING]${NC} $1"
    echo "[$timestamp] [WARNING] $1" >> "$HEALTH_LOG"
    echo "[$timestamp] [WARNING] $1" >> "$ALERT_LOG"
}

log_error() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[ERROR]${NC} $1"
    echo "[$timestamp] [ERROR] $1" >> "$HEALTH_LOG"
    echo "[$timestamp] [ERROR] $1" >> "$ALERT_LOG"
}

log_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# 初始化监控环境
init_monitoring() {
    log_info "初始化监控环境..."
    
    # 创建日志目录
    mkdir -p "$LOG_DIR"
    
    # 创建日志文件
    touch "$ALERT_LOG" "$HEALTH_LOG" "$PERFORMANCE_LOG"
    
    # 检查必要的命令
    local required_commands=("curl" "ps" "top" "df")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "缺少必要命令: $cmd"
            exit 1
        fi
    done
    
    log_success "监控环境初始化完成"
}

# 检查系统资源
check_system_resources() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # CPU使用率
    local cpu_usage
    if command -v top &> /dev/null; then
        # macOS
        cpu_usage=$(top -l 1 -s 0 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
    else
        # Linux
        cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    fi
    
    # 内存使用率
    local memory_usage
    if command -v vm_stat &> /dev/null; then
        # macOS
        local vm_stat_output=$(vm_stat)
        local pages_free=$(echo "$vm_stat_output" | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
        local pages_active=$(echo "$vm_stat_output" | grep "Pages active" | awk '{print $3}' | sed 's/\.//')
        local pages_inactive=$(echo "$vm_stat_output" | grep "Pages inactive" | awk '{print $3}' | sed 's/\.//')
        local pages_speculative=$(echo "$vm_stat_output" | grep "Pages speculative" | awk '{print $3}' | sed 's/\.//')
        local pages_wired=$(echo "$vm_stat_output" | grep "Pages wired down" | awk '{print $4}' | sed 's/\.//')
        
        local total_pages=$((pages_free + pages_active + pages_inactive + pages_speculative + pages_wired))
        local used_pages=$((pages_active + pages_inactive + pages_speculative + pages_wired))
        memory_usage=$((used_pages * 100 / total_pages))
    else
        # Linux
        memory_usage=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
    fi
    
    # 磁盘使用率
    local disk_usage=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
    
    # 记录性能数据
    echo "[$timestamp] CPU: ${cpu_usage}%, Memory: ${memory_usage}%, Disk: ${disk_usage}%" >> "$PERFORMANCE_LOG"
    
    # 检查阈值
    if [[ $(echo "$cpu_usage > $CPU_THRESHOLD" | bc -l 2>/dev/null || echo "0") -eq 1 ]]; then
        log_warning "CPU使用率过高: ${cpu_usage}% (阈值: ${CPU_THRESHOLD}%)"
    fi
    
    if [[ $memory_usage -gt $MEMORY_THRESHOLD ]]; then
        log_warning "内存使用率过高: ${memory_usage}% (阈值: ${MEMORY_THRESHOLD}%)"
    fi
    
    if [[ $disk_usage -gt $DISK_THRESHOLD ]]; then
        log_warning "磁盘使用率过高: ${disk_usage}% (阈值: ${DISK_THRESHOLD}%)"
    fi
    
    echo -e "${CYAN}系统资源:${NC} CPU: ${cpu_usage}%, 内存: ${memory_usage}%, 磁盘: ${disk_usage}%"
}

# 检查服务状态
check_service_status() {
    local service_name="$1"
    local url="$2"
    local timeout=10
    
    local start_time=$(date +%s%3N)
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $timeout "$url" 2>/dev/null || echo "000")
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    if [[ "$response_code" == "200" ]]; then
        if [[ $response_time -gt $RESPONSE_TIME_THRESHOLD ]]; then
            log_warning "$service_name 响应时间过长: ${response_time}ms (阈值: ${RESPONSE_TIME_THRESHOLD}ms)"
        else
            echo -e "${GREEN}✓${NC} $service_name (${response_time}ms)"
        fi
        return 0
    else
        log_error "$service_name 服务不可用 (HTTP: $response_code)"
        echo -e "${RED}✗${NC} $service_name (HTTP: $response_code)"
        return 1
    fi
}

# 检查进程状态
check_process_status() {
    local process_name="$1"
    local process_count=$(ps aux | grep -v grep | grep "$process_name" | wc -l)
    
    if [[ $process_count -gt 0 ]]; then
        echo -e "${GREEN}✓${NC} $process_name 进程运行中 ($process_count 个)"
        return 0
    else
        log_error "$process_name 进程未运行"
        echo -e "${RED}✗${NC} $process_name 进程未运行"
        return 1
    fi
}

# 检查端口状态
check_port_status() {
    local port="$1"
    local service_name="$2"
    
    if lsof -i ":$port" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $service_name 端口 $port 正在监听"
        return 0
    else
        log_error "$service_name 端口 $port 未监听"
        echo -e "${RED}✗${NC} $service_name 端口 $port 未监听"
        return 1
    fi
}

# 检查文件系统
check_filesystem() {
    local critical_files=("package.json" "app/layout.tsx" "components/MainContent.tsx" "backend/app.py")
    local missing_files=0
    
    for file in "${critical_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "关键文件缺失: $file"
            ((missing_files++))
        fi
    done
    
    if [[ $missing_files -eq 0 ]]; then
        echo -e "${GREEN}✓${NC} 文件系统完整"
        return 0
    else
        log_error "文件系统检查失败: $missing_files 个文件缺失"
        echo -e "${RED}✗${NC} 文件系统不完整 ($missing_files 个文件缺失)"
        return 1
    fi
}

# 检查依赖状态
check_dependencies() {
    local deps_ok=true
    
    # 检查Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        echo -e "${GREEN}✓${NC} Node.js $node_version"
    else
        log_error "Node.js 未安装"
        echo -e "${RED}✗${NC} Node.js 未安装"
        deps_ok=false
    fi
    
    # 检查Python
    if command -v python3 &> /dev/null; then
        local python_version=$(python3 --version)
        echo -e "${GREEN}✓${NC} $python_version"
    else
        log_error "Python 3 未安装"
        echo -e "${RED}✗${NC} Python 3 未安装"
        deps_ok=false
    fi
    
    # 检查npm依赖
    if [[ -f "package.json" ]] && [[ -d "node_modules" ]]; then
        echo -e "${GREEN}✓${NC} npm 依赖已安装"
    else
        log_warning "npm 依赖可能未安装"
        echo -e "${YELLOW}!${NC} npm 依赖状态未知"
    fi
    
    # 检查Python依赖
    if [[ -f "backend/requirements.txt" ]]; then
        local missing_packages=$(pip3 freeze -r backend/requirements.txt 2>&1 | grep "not installed" | wc -l)
        if [[ $missing_packages -eq 0 ]]; then
            echo -e "${GREEN}✓${NC} Python 依赖已安装"
        else
            log_warning "Python 依赖可能缺失"
            echo -e "${YELLOW}!${NC} Python 依赖状态未知"
        fi
    fi
    
    if [[ "$deps_ok" == "true" ]]; then
        return 0
    else
        return 1
    fi
}

# 执行健康检查
perform_health_check() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${CYAN}[$timestamp] 执行健康检查...${NC}"
    
    local checks_passed=0
    local total_checks=0
    
    # 系统资源检查
    echo -e "\n${BLUE}系统资源:${NC}"
    check_system_resources
    
    # 服务状态检查
    echo -e "\n${BLUE}服务状态:${NC}"
    ((total_checks++))
    if check_service_status "前端服务" "$FRONTEND_HEALTH_ENDPOINT"; then
        ((checks_passed++))
    fi
    
    ((total_checks++))
    if check_service_status "后端服务" "$BACKEND_HEALTH_ENDPOINT"; then
        ((checks_passed++))
    fi
    
    # 进程状态检查
    echo -e "\n${BLUE}进程状态:${NC}"
    ((total_checks++))
    if check_process_status "node"; then
        ((checks_passed++))
    fi
    
    ((total_checks++))
    if check_process_status "python"; then
        ((checks_passed++))
    fi
    
    # 端口状态检查
    echo -e "\n${BLUE}端口状态:${NC}"
    ((total_checks++))
    if check_port_status "3000" "前端服务"; then
        ((checks_passed++))
    fi
    
    ((total_checks++))
    if check_port_status "5000" "后端服务"; then
        ((checks_passed++))
    fi
    
    # 文件系统检查
    echo -e "\n${BLUE}文件系统:${NC}"
    ((total_checks++))
    if check_filesystem; then
        ((checks_passed++))
    fi
    
    # 依赖检查
    echo -e "\n${BLUE}依赖状态:${NC}"
    ((total_checks++))
    if check_dependencies; then
        ((checks_passed++))
    fi
    
    # 健康评分
    local health_score=$((checks_passed * 100 / total_checks))
    echo -e "\n${PURPLE}健康评分: $health_score% ($checks_passed/$total_checks)${NC}"
    
    if [[ $health_score -ge 90 ]]; then
        log_success "系统健康状态良好 ($health_score%)"
    elif [[ $health_score -ge 70 ]]; then
        log_warning "系统健康状态一般 ($health_score%)"
    else
        log_error "系统健康状态不佳 ($health_score%)"
    fi
    
    echo "[$timestamp] Health Score: $health_score% ($checks_passed/$total_checks)" >> "$PERFORMANCE_LOG"
    
    return $((100 - health_score))
}

# 生成监控报告
generate_report() {
    local report_file="$LOG_DIR/monitor_report_$(date +%Y%m%d_%H%M%S).txt"
    
    log_info "生成监控报告: $report_file"
    
    cat > "$report_file" << EOF
$PROJECT_NAME 监控报告
生成时间: $(date '+%Y-%m-%d %H:%M:%S')
版本: $VERSION

=== 系统概览 ===
$(uname -a)

=== 最近性能数据 ===
$(tail -20 "$PERFORMANCE_LOG" 2>/dev/null || echo "无性能数据")

=== 最近告警 ===
$(tail -20 "$ALERT_LOG" 2>/dev/null || echo "无告警记录")

=== 当前健康检查 ===
EOF
    
    # 执行健康检查并追加到报告
    perform_health_check >> "$report_file" 2>&1
    
    log_success "监控报告已生成: $report_file"
}

# 清理日志文件
cleanup_logs() {
    local days_to_keep=7
    
    log_info "清理 $days_to_keep 天前的日志文件..."
    
    # 清理旧的监控报告
    find "$LOG_DIR" -name "monitor_report_*.txt" -mtime +$days_to_keep -delete 2>/dev/null || true
    
    # 截断大日志文件
    local max_lines=10000
    for log_file in "$ALERT_LOG" "$HEALTH_LOG" "$PERFORMANCE_LOG"; do
        if [[ -f "$log_file" ]] && [[ $(wc -l < "$log_file") -gt $max_lines ]]; then
            tail -$max_lines "$log_file" > "${log_file}.tmp"
            mv "${log_file}.tmp" "$log_file"
            log_info "截断日志文件: $(basename "$log_file")"
        fi
    done
    
    log_success "日志清理完成"
}

# 显示帮助信息
show_help() {
    cat << EOF
$PROJECT_NAME 监控脚本

用法: $0 [选项]

选项:
  --check            执行一次健康检查
  --monitor          持续监控模式
  --report           生成监控报告
  --cleanup          清理旧日志文件
  --status           显示当前状态
  --interval SECONDS 设置监控间隔 (默认: $MONITOR_INTERVAL 秒)
  --help, -h         显示帮助信息

监控功能:
  - 系统资源监控 (CPU、内存、磁盘)
  - 服务健康检查 (前端、后端)
  - 进程状态监控
  - 端口监听检查
  - 文件系统完整性
  - 依赖状态检查
  - 性能数据记录
  - 告警日志记录

日志文件:
  - 健康日志: $HEALTH_LOG
  - 告警日志: $ALERT_LOG
  - 性能日志: $PERFORMANCE_LOG

示例:
  $0 --check                    执行一次健康检查
  $0 --monitor                  启动持续监控
  $0 --monitor --interval 60    每60秒监控一次
  $0 --report                   生成监控报告
  $0 --cleanup                  清理旧日志

环境变量:
  MONITOR_INTERVAL    监控间隔 (默认: $MONITOR_INTERVAL)
  CPU_THRESHOLD       CPU阈值 (默认: $CPU_THRESHOLD)
  MEMORY_THRESHOLD    内存阈值 (默认: $MEMORY_THRESHOLD)
  DISK_THRESHOLD      磁盘阈值 (默认: $DISK_THRESHOLD)
EOF
}

# 显示当前状态
show_status() {
    log_header "当前系统状态"
    
    echo -e "${CYAN}项目: $PROJECT_NAME${NC}"
    echo -e "${CYAN}版本: $VERSION${NC}"
    echo -e "${CYAN}监控间隔: $MONITOR_INTERVAL 秒${NC}"
    echo ""
    
    # 显示最近的性能数据
    if [[ -f "$PERFORMANCE_LOG" ]]; then
        echo -e "${BLUE}最近性能数据:${NC}"
        tail -5 "$PERFORMANCE_LOG"
        echo ""
    fi
    
    # 显示最近的告警
    if [[ -f "$ALERT_LOG" ]]; then
        echo -e "${YELLOW}最近告警:${NC}"
        tail -5 "$ALERT_LOG" || echo "无告警记录"
        echo ""
    fi
    
    # 执行快速健康检查
    perform_health_check
}

# 持续监控模式
continuous_monitoring() {
    log_header "启动持续监控模式"
    log_info "监控间隔: $MONITOR_INTERVAL 秒"
    log_info "按 Ctrl+C 停止监控"
    
    # 设置信号处理
    trap 'log_info "停止监控..."; exit 0' INT TERM
    
    while true; do
        perform_health_check
        echo -e "\n${CYAN}等待 $MONITOR_INTERVAL 秒...${NC}\n"
        sleep $MONITOR_INTERVAL
    done
}

# 主函数
main() {
    # 初始化监控环境
    init_monitoring
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --check)
                perform_health_check
                exit $?
                ;;
            --monitor)
                continuous_monitoring
                ;;
            --report)
                generate_report
                exit 0
                ;;
            --cleanup)
                cleanup_logs
                exit 0
                ;;
            --status)
                show_status
                exit 0
                ;;
            --interval)
                MONITOR_INTERVAL="$2"
                shift 2
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 默认执行健康检查
    log_header "$PROJECT_NAME 监控系统"
    perform_health_check
}

# 执行主函数
main "$@"