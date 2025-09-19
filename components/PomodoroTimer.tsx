'use client';

import React, { useState, useEffect, useRef } from 'react';

interface PomodoroTimerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PomodoroSession {
  id: string;
  type: 'work' | 'break' | 'longBreak';
  duration: number;
  completedAt: Date;
}

interface PomodoroStats {
  totalSessions: number;
  totalWorkTime: number;
  totalBreakTime: number;
  todaySessions: number;
  streak: number;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ isOpen, onClose }) => {
  // 计时器状态
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25分钟（秒）
  const [isRunning, setIsRunning] = useState(false);
  const [currentMode, setCurrentMode] = useState<'work' | 'break' | 'longBreak'>('work');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  
  // UI状态
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // 设置
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [longBreakInterval, setLongBreakInterval] = useState(4);
  
  // 统计数据
  const [stats, setStats] = useState<PomodoroStats>({
    totalSessions: 0,
    totalWorkTime: 0,
    totalBreakTime: 0,
    todaySessions: 0,
    streak: 0
  });
  
  // 历史记录
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  
  // 音频引用
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 计时器引用
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 获取当前模式的持续时间
  const getCurrentDuration = () => {
    switch (currentMode) {
      case 'work': return workDuration * 60;
      case 'break': return breakDuration * 60;
      case 'longBreak': return longBreakDuration * 60;
      default: return workDuration * 60;
    }
  };

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 计算进度百分比
  const getProgress = () => {
    const totalDuration = getCurrentDuration();
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  };

  // 播放提醒音效
  const playNotificationSound = () => {
    // 创建音频上下文播放提醒音
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  // 发送浏览器通知
  const sendNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  };

  // 请求通知权限
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  // 开始下一个会话
  const startNextSession = () => {
    let nextMode: 'work' | 'break' | 'longBreak' = 'work';
    
    if (currentMode === 'work') {
      // 工作完成，开始休息
      if ((sessionsCompleted + 1) % longBreakInterval === 0) {
        nextMode = 'longBreak';
      } else {
        nextMode = 'break';
      }
      setSessionsCompleted(prev => prev + 1);
    } else {
      // 休息完成，开始工作
      nextMode = 'work';
    }
    
    setCurrentMode(nextMode);
    setTimeLeft(getCurrentDurationForMode(nextMode));
    setIsRunning(false);
  };

  const getCurrentDurationForMode = (mode: 'work' | 'break' | 'longBreak') => {
    switch (mode) {
      case 'work': return workDuration * 60;
      case 'break': return breakDuration * 60;
      case 'longBreak': return longBreakDuration * 60;
    }
  };

  // 完成会话
  const completeSession = () => {
    const session: PomodoroSession = {
      id: Date.now().toString(),
      type: currentMode,
      duration: getCurrentDuration(),
      completedAt: new Date()
    };
    
    setSessions(prev => [session, ...prev]);
    
    // 更新统计
    setStats(prev => ({
      ...prev,
      totalSessions: prev.totalSessions + 1,
      totalWorkTime: currentMode === 'work' ? prev.totalWorkTime + getCurrentDuration() : prev.totalWorkTime,
      totalBreakTime: currentMode !== 'work' ? prev.totalBreakTime + getCurrentDuration() : prev.totalBreakTime,
      todaySessions: prev.todaySessions + 1,
      streak: currentMode === 'work' ? prev.streak + 1 : prev.streak
    }));
    
    // 播放提醒音效
    playNotificationSound();
    
    // 发送通知
    const messages = {
      work: { title: '工作时间结束！', body: '是时候休息一下了 🎉' },
      break: { title: '休息时间结束！', body: '准备开始下一个工作周期 💪' },
      longBreak: { title: '长休息结束！', body: '准备开始新的工作周期 🚀' }
    };
    
    sendNotification(messages[currentMode].title, messages[currentMode].body);
    
    // 开始下一个会话
    startNextSession();
  };

  // 计时器效果
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // 组件挂载时请求通知权限
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // 开始/暂停计时器
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // 重置计时器
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getCurrentDuration());
  };

  // 跳过当前会话
  const skipSession = () => {
    setIsRunning(false);
    startNextSession();
  };

  // 切换模式
  const switchMode = (mode: 'work' | 'break' | 'longBreak') => {
    setCurrentMode(mode);
    setTimeLeft(getCurrentDurationForMode(mode));
    setIsRunning(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">番茄钟</h2>
              <p className="text-sm text-white/70">专注工作，高效休息</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {!showStats && !showSettings && (
            <>
              {/* 模式切换 */}
              <div className="flex justify-center mb-8">
                <div className="flex bg-white/5 rounded-2xl p-1">
                  {[
                    { key: 'work', label: '工作', icon: '💼' },
                    { key: 'break', label: '短休', icon: '☕' },
                    { key: 'longBreak', label: '长休', icon: '🛋️' }
                  ].map(({ key, label, icon }) => (
                    <button
                      key={key}
                      onClick={() => switchMode(key as any)}
                      className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                        currentMode === key
                          ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-lg'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="mr-2">{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 圆形进度条和计时器 */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative w-64 h-64 mb-6">
                  {/* 背景圆环 */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="3"
                      fill="none"
                    />
                    {/* 进度圆环 */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="url(#gradient)"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f87171" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* 中心内容 */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-5xl font-bold text-white mb-2 font-mono">
                      {formatTime(timeLeft)}
                    </div>
                    <div className="text-white/70 text-lg capitalize">
                      {currentMode === 'work' ? '专注工作' : currentMode === 'break' ? '短暂休息' : '长时间休息'}
                    </div>
                    <div className="text-white/50 text-sm mt-1">
                      第 {sessionsCompleted + 1} 个番茄钟
                    </div>
                  </div>
                </div>

                {/* 控制按钮 */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={resetTimer}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={toggleTimer}
                    className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                      isRunning
                        ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg'
                        : 'bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg'
                    }`}
                  >
                    {isRunning ? '暂停' : '开始'}
                  </button>
                  
                  <button
                    onClick={skipSession}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3-3 3m-4-6l3 3-3 3" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 会话统计 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{sessionsCompleted}</div>
                  <div className="text-white/70 text-sm">今日完成</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{stats.totalSessions}</div>
                  <div className="text-white/70 text-sm">总会话</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{Math.floor(stats.totalWorkTime / 3600)}</div>
                  <div className="text-white/70 text-sm">工作小时</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{stats.streak}</div>
                  <div className="text-white/70 text-sm">连续天数</div>
                </div>
              </div>
            </>
          )}

          {/* 统计页面 */}
          {showStats && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">统计数据</h3>
              
              {/* 今日统计 */}
              <div className="bg-white/5 rounded-xl p-6">
                <h4 className="text-lg font-medium text-white mb-4">今日表现</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-3xl font-bold text-green-400">{stats.todaySessions}</div>
                    <div className="text-white/70">完成会话</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-400">{Math.floor(stats.totalWorkTime / 60)}</div>
                    <div className="text-white/70">专注分钟</div>
                  </div>
                </div>
              </div>

              {/* 历史记录 */}
              <div className="bg-white/5 rounded-xl p-6">
                <h4 className="text-lg font-medium text-white mb-4">最近会话</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {sessions.slice(0, 10).map((session) => (
                    <div key={session.id} className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">
                          {session.type === 'work' ? '💼' : session.type === 'break' ? '☕' : '🛋️'}
                        </span>
                        <span className="text-white/70">
                          {session.type === 'work' ? '工作' : session.type === 'break' ? '短休' : '长休'}
                        </span>
                      </div>
                      <div className="text-white/50 text-sm">
                        {session.completedAt.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 设置页面 */}
          {showSettings && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">设置</h3>
              
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-6">
                  <h4 className="text-lg font-medium text-white mb-4">时间设置</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/70 text-sm mb-2">工作时长（分钟）</label>
                      <input
                        type="number"
                        value={workDuration}
                        onChange={(e) => setWorkDuration(Number(e.target.value))}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400"
                        min="1"
                        max="60"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white/70 text-sm mb-2">短休息时长（分钟）</label>
                      <input
                        type="number"
                        value={breakDuration}
                        onChange={(e) => setBreakDuration(Number(e.target.value))}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400"
                        min="1"
                        max="30"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white/70 text-sm mb-2">长休息时长（分钟）</label>
                      <input
                        type="number"
                        value={longBreakDuration}
                        onChange={(e) => setLongBreakDuration(Number(e.target.value))}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400"
                        min="1"
                        max="60"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white/70 text-sm mb-2">长休息间隔（工作会话数）</label>
                      <input
                        type="number"
                        value={longBreakInterval}
                        onChange={(e) => setLongBreakInterval(Number(e.target.value))}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400"
                        min="2"
                        max="10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;