import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Stars, Cloud, Environment, Float, Text, ContactShadows, PresentationControls, Sparkles } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Trophy, RefreshCw, X, Coins, Zap, Bomb } from 'lucide-react';
import * as THREE from 'three';
import api from '../services/api';

// --- GAME COMPONENTS ---

const Package = ({ position }) => {
    return (
        <mesh position={[position, -3, 0]} castShadow>
            <boxGeometry args={[1.5, 1, 1]} />
            <meshStandardMaterial color="#f97316" metalness={0.5} roughness={0.2} />
            {/* Package tape/details */}
            <mesh position={[0, 0, 0.51]}>
                <boxGeometry args={[0.2, 1, 0.02]} />
                <meshStandardMaterial color="#8b5cf6" />
            </mesh>
            <mesh position={[0, 0.51, 0]}>
                <boxGeometry args={[1.5, 0.02, 0.2]} />
                <meshStandardMaterial color="#8b5cf6" />
            </mesh>
        </mesh>
    );
};

const CoinItem = ({ position }) => {
    const meshRef = useRef();
    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 3;
        }
    });

    return (
        <group position={position}>
            <mesh ref={meshRef} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} rotation={[Math.PI / 2, 0, 0]} />
                <meshStandardMaterial color="#fbbf24" metalness={1} roughness={0.1} />
            </mesh>
            <Sparkles count={5} scale={1} size={2} speed={0.5} color="#fbbf24" />
        </group>
    );
};

const BombItem = ({ position }) => {
    const meshRef = useRef();
    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * 2;
            meshRef.current.rotation.z += delta * 2;
        }
    });

    return (
        <group position={position}>
            <mesh ref={meshRef} castShadow>
                <sphereGeometry args={[0.4, 32, 32]} />
                <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Fuse */}
            <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
                <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
            </mesh>
        </group>
    );
};

const GameScene = ({ gameState, setScore, onGameOver }) => {
    const { viewport, mouse } = useThree();
    const [playerX, setPlayerX] = useState(0);
    const [items, setItems] = useState([]);
    const itemsRef = useRef([]);
    const scoreRef = useRef(0);
    const lastSpawnTime = useRef(0);
    const speedMultiplier = useRef(1);

    useFrame((state, delta) => {
        if (gameState !== 'PLAYING') return;

        // Mouse tracking for player
        const targetX = (mouse.x * viewport.width) / 2;
        setPlayerX(THREE.MathUtils.lerp(playerX, targetX, 0.1));

        // Difficulty increases over time
        speedMultiplier.current += delta * 0.01;

        // Spawning
        if (state.clock.elapsedTime - lastSpawnTime.current > 1 / speedMultiplier.current) {
            const isBomb = Math.random() < 0.3;
            itemsRef.current.push({
                id: Math.random(),
                x: (Math.random() - 0.5) * viewport.width * 0.8,
                y: 6,
                type: isBomb ? 'BOMB' : 'COIN',
                speed: (2 + speedMultiplier.current) * delta
            });
            lastSpawnTime.current = state.clock.elapsedTime;
        }

        // Updating items
        itemsRef.current = itemsRef.current.filter(item => {
            item.y -= item.speed;

            // Collision check
            const dx = Math.abs(item.x - playerX);
            const dy = Math.abs(item.y - (-3));
            
            if (dx < 1 && dy < 0.8) {
                if (item.type === 'COIN') {
                    scoreRef.current += 10;
                    setScore(scoreRef.current);
                    return false;
                } else {
                    onGameOver();
                    return false;
                }
            }

            return item.y > -6; // Remove if falls below floor
        });

        setItems([...itemsRef.current]);
    });

    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            
            <Environment preset="city" />

            {/* Clouds at spawn area */}
            <group position={[0, 7, -2]}>
                <Cloud speed={0.2} opacity={0.5} size={0.5} position={[-2, 0, 0]} />
                <Cloud speed={0.2} opacity={0.5} size={0.5} position={[2, 0, 0]} />
                <Cloud speed={0.2} opacity={0.5} size={0.5} position={[0, 0, 0]} />
            </group>

            {/* Shiping Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]} receiveShadow>
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial color="#0f172a" opacity={0.8} transparent />
            </mesh>
            <gridHelper args={[20, 20, "#1e293b", "#0f172a"]} position={[0, -3.99, 0]} />

            {/* Player */}
            <Package position={playerX} />

            {/* Falling Items */}
            {items.map(item => (
                item.type === 'COIN' 
                    ? <CoinItem key={item.id} position={[item.x, item.y, 0]} />
                    : <BombItem key={item.id} position={[item.x, item.y, 0]} />
            ))}
        </>
    );
};

// --- MAIN COMPONENT ---

const VanguardCatcher = ({ onClose, onSuccess }) => {
    const [gameState, setGameState] = useState('START'); // START, PLAYING, GAMEOVER
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(localStorage.getItem('vanguard_catcher_high') || 0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reward, setReward] = useState(null);

    const startGame = () => {
        setGameState('PLAYING');
        setScore(0);
        setReward(null);
    };

    const handleGameOver = () => {
        setGameState('GAMEOVER');
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('vanguard_catcher_high', score);
        }
    };

    const submitScore = async () => {
        setIsSubmitting(true);
        try {
            const res = await api.post('/coin/arcade-submit', { score });
            if (res.data.status === 'success') {
                setReward(res.data.metadata.reward);
                if (onSuccess) onSuccess(res.data.metadata.reward);
            }
        } catch (error) {
            alert(error.response?.data?.message || "Lỗi khi nhận thưởng");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative w-full h-[600px] bg-[#020617] rounded-3xl overflow-hidden shadow-2xl border border-white/5 select-none">
            {/* 3D CANVAS */}
            <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center text-white">Loading 3D Arcade...</div>}>
                <Canvas 
                    shadows={{ type: THREE.PCFShadowMap }} 
                    dpr={[1, 2]}
                >
                    <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
                    <GameScene 
                        gameState={gameState} 
                        setScore={setScore} 
                        onGameOver={handleGameOver} 
                    />
                </Canvas>
            </Suspense>

            {/* UI LAYERS */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Score HUD */}
                <div className="absolute top-8 left-8 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest">
                        <Trophy size={14} className="text-amber-500" /> High Score: {highScore}
                    </div>
                    <div className="text-5xl font-black text-white italic tracking-tighter drop-shadow-2xl">
                        {score.toString().padStart(4, '0')}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {gameState === 'START' && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 pointer-events-auto z-20 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-sm p-8 text-center"
                        >
                            <motion.div 
                                animate={{ y: [0, -10, 0], rotate: [0, 2, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(37,99,235,0.4)] border border-white/20">
                                    <Gamepad2 size={48} className="text-white" />
                                </div>
                            </motion.div>
                            <h2 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter">Vanguard Catcher 3D</h2>
                            <p className="text-slate-400 mb-8 max-w-xs text-sm font-medium">
                                Sử dụng chuột để điều khiển kiện hàng. Hứng xu từ đám mây và tránh xa bom nổ!
                            </p>
                            <div className="flex flex-col gap-3 w-full max-w-[220px]">
                                <button 
                                    onClick={startGame}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95 border-b-4 border-blue-800"
                                >
                                    BẮT ĐẦU CHƠI
                                </button>
                                <button 
                                    onClick={onClose}
                                    className="w-full py-3 text-slate-500 font-bold hover:text-white transition-colors text-sm"
                                >
                                    QUAY LẠI
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {gameState === 'GAMEOVER' && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 pointer-events-auto z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl p-8 text-center"
                        >
                            <h2 className="text-6xl font-black text-white mb-2 uppercase italic tracking-tighter">
                                <span className="text-red-500">BOOM!</span>
                            </h2>
                            <div className="text-white/40 font-bold mb-8 uppercase tracking-widest text-sm letter-spacing-2">
                                KẾT THÚC: <span className="text-white">{score} ĐIỂM</span>
                            </div>

                            {reward !== null ? (
                                <motion.div 
                                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                    className="mb-10"
                                >
                                    <div className="text-7xl font-black text-blue-500 mb-2 drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">+{reward}</div>
                                    <div className="text-white font-black text-xl uppercase tracking-widest">XU VANGUARD ĐÃ NHẬN</div>
                                </motion.div>
                            ) : (
                                <div className="flex flex-col gap-4 w-full max-w-[260px] mb-10">
                                    <button 
                                        onClick={submitScore}
                                        disabled={isSubmitting || score < 10}
                                        className="w-full py-4 bg-white text-slate-950 font-black rounded-2xl shadow-2xl hover:bg-slate-100 disabled:opacity-50 transition-all active:scale-95 border-b-4 border-slate-300 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <RefreshCw className="animate-spin" /> : <Zap size={20} className="fill-current text-blue-600" />}
                                        {score < 10 ? "ĐIỂM QUÁ THẤP" : "NHẬN THƯỞNG XU"}
                                    </button>
                                    <button 
                                        onClick={startGame}
                                        className="w-full py-3 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        <RefreshCw size={16} /> CHƠI LẠI
                                    </button>
                                </div>
                            )}

                            <button 
                                onClick={onClose}
                                className="text-slate-500 font-bold hover:text-white transition-colors flex items-center gap-2 text-sm uppercase tracking-widest"
                            >
                                <X size={16} /> THOÁT
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default VanguardCatcher;
