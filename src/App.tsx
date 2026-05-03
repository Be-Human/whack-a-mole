import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

// 游戏状态类型
type GameState = 'idle' | 'playing' | 'ended';

// 洞口状态类型
interface HoleState {
  id: number;
  hasMole: boolean;
}

function App() {
  // 游戏状态
  const [gameState, setGameState] = useState<GameState>('idle');
  // 得分
  const [score, setScore] = useState(0);
  // 倒计时（秒）
  const [timeLeft, setTimeLeft] = useState(60);
  // 洞口状态数组
  const [holes, setHoles] = useState<HoleState[]>(
    Array.from({ length: 9 }, (_, i) => ({ id: i, hasMole: false }))
  );
  // 地鼠停留时间（毫秒）
  const [moleStayTime, setMoleStayTime] = useState(1500);
  // 地鼠出现间隔（毫秒）
  const [moleInterval, setMoleInterval] = useState(1500);

  // 计时器引用
  const gameTimerRef = useRef<number | null>(null);
  const moleTimerRef = useRef<number | null>(null);
  const difficultyTimerRef = useRef<number | null>(null);

  // 清除所有计时器
  const clearAllTimers = useCallback(() => {
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
      gameTimerRef.current = null;
    }
    if (moleTimerRef.current) {
      clearInterval(moleTimerRef.current);
      moleTimerRef.current = null;
    }
    if (difficultyTimerRef.current) {
      clearInterval(difficultyTimerRef.current);
      difficultyTimerRef.current = null;
    }
  }, []);

  // 开始游戏
  const startGame = useCallback(() => {
    // 重置游戏状态
    setGameState('playing');
    setScore(0);
    setTimeLeft(60);
    setHoles(Array.from({ length: 9 }, (_, i) => ({ id: i, hasMole: false })));
    setMoleStayTime(1500);
    setMoleInterval(1500);
  }, []);

  // 结束游戏
  const endGame = useCallback(() => {
    setGameState('ended');
    clearAllTimers();
    // 隐藏所有地鼠
    setHoles(prev => prev.map(hole => ({ ...hole, hasMole: false })));
  }, [clearAllTimers]);

  // 点击地鼠得分
  const whackMole = useCallback((holeId: number) => {
    // 只有游戏进行中且洞口有地鼠时才能得分
    if (gameState === 'playing' && holes[holeId].hasMole) {
      setScore(prev => prev + 10);
      // 点击后地鼠缩回
      setHoles(prev => prev.map(hole => 
        hole.id === holeId ? { ...hole, hasMole: false } : hole
      ));
    }
  }, [gameState, holes]);

  // 随机让地鼠出现
  const spawnMole = useCallback(() => {
    // 找出当前没有地鼠的洞口
    const emptyHoles = holes.filter(hole => !hole.hasMole);
    
    if (emptyHoles.length > 0) {
      // 随机选择一个空洞口
      const randomIndex = Math.floor(Math.random() * emptyHoles.length);
      const selectedHoleId = emptyHoles[randomIndex].id;

      // 让地鼠在这个洞口出现
      setHoles(prev => prev.map(hole => 
        hole.id === selectedHoleId ? { ...hole, hasMole: true } : hole
      ));

      // 设置地鼠停留时间
      setTimeout(() => {
        setHoles(prev => prev.map(hole => 
          hole.id === selectedHoleId ? { ...hole, hasMole: false } : hole
        ));
      }, moleStayTime);
    }
  }, [holes, moleStayTime]);

  // 游戏倒计时逻辑
  useEffect(() => {
    if (gameState === 'playing') {
      // 每秒减少倒计时
      gameTimerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // 时间到，结束游戏
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000) as unknown as number;

      // 地鼠出现定时器
      moleTimerRef.current = window.setInterval(() => {
        spawnMole();
      }, moleInterval) as unknown as number;

      // 难度递增定时器：每10秒增加难度
      difficultyTimerRef.current = window.setInterval(() => {
        setMoleStayTime(prev => {
          // 最短停留时间为 500ms
          return Math.max(prev - 100, 500);
        });
        setMoleInterval(prev => {
          // 最短间隔为 500ms
          return Math.max(prev - 100, 500);
        });
      }, 10000) as unknown as number;
    }

    // 清理函数
    return () => {
      clearAllTimers();
    };
  }, [gameState, moleInterval, spawnMole, endGame, clearAllTimers]);

  return (
    <div className="game-container">
      {/* 游戏标题 */}
      <h1 className="game-title">打地鼠游戏</h1>

      {/* 游戏信息栏 */}
      <div className="game-info">
        <div className="info-item">
          <span className="info-label">得分:</span>
          <span className="info-value score">{score}</span>
        </div>
        <div className="info-item">
          <span className="info-label">时间:</span>
          <span className={`info-value time ${timeLeft <= 10 ? 'warning' : ''}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* 游戏开始/结束界面 */}
      {gameState === 'idle' && (
        <div className="game-overlay">
          <h2 className="overlay-title">准备好了吗？</h2>
          <p className="overlay-description">
            点击出现的地鼠得分，时间有限，难度会逐渐增加！
          </p>
          <button className="start-button" onClick={startGame}>
            开始游戏
          </button>
        </div>
      )}

      {gameState === 'ended' && (
        <div className="game-overlay">
          <h2 className="overlay-title">游戏结束！</h2>
          <div className="final-score">
            <span className="final-score-label">最终得分:</span>
            <span className="final-score-value">{score}</span>
          </div>
          <button className="restart-button" onClick={startGame}>
            再玩一次
          </button>
        </div>
      )}

      {/* 游戏网格 */}
      <div className={`game-grid ${gameState !== 'playing' ? 'dimmed' : ''}`}>
        {holes.map((hole) => (
          <div
            key={hole.id}
            className={`hole ${hole.hasMole ? 'active' : ''}`}
            onClick={() => whackMole(hole.id)}
          >
            <div className="hole-cover"></div>
            {hole.hasMole && (
              <div className="mole">
                <div className="mole-face">
                  <div className="mole-eyes">
                    <div className="mole-eye"></div>
                    <div className="mole-eye"></div>
                  </div>
                  <div className="mole-nose"></div>
                  <div className="mole-whiskers">
                    <div className="mole-whisker left"></div>
                    <div className="mole-whisker left"></div>
                    <div className="mole-whisker right"></div>
                    <div className="mole-whisker right"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 难度提示 */}
      {gameState === 'playing' && (
        <div className="difficulty-indicator">
          <span className="difficulty-label">难度: </span>
          <span className="difficulty-value">
            {moleInterval <= 700 ? '地狱' : 
             moleInterval <= 1000 ? '困难' : 
             moleInterval <= 1300 ? '中等' : '简单'}
          </span>
        </div>
      )}
    </div>
  );
}

export default App;
