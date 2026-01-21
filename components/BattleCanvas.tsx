
import React, { useEffect, useRef, useState } from 'react';
import { ArmyStack, UNIT_DEFINITIONS, FactionId, UnitSpecial } from '../types';

interface BattleCanvasProps {
    playerArmy: ArmyStack[];
    enemyArmy: ArmyStack[];
    width: number;
    height: number;
    isPaused: boolean;
    playerColor: string;
    enemyColor: string;
    battleStarted: boolean; 
    phase: 'DEPLOYMENT' | 'COMBAT' | 'RESULTS';
    deploymentPositions: Record<string, {x: number, y: number}>;
    onUpdatePosition: (uid: string, x: number, y: number) => void;
}

type CombatRole = 'MELEE' | 'RANGED' | 'MAGIC';

interface Particle {
    id: number;
    stackId: string;
    defId: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    team: 'PLAYER' | 'ENEMY';
    color: string;
    radius: number;
    dead: boolean;
    maxHp: number;
    currentHp: number; 
    
    role: CombatRole;
    isFlying: boolean;
    range: number;
    cooldown: number;
    maxCooldown: number;
    
    speedFactor: number;
}

interface GoreParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
}

interface Projectile {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
    explodeOnImpact: boolean;
    // Trail support
    history: {x: number, y: number}[];
}

interface Beam {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
    life: number;
    width: number;
}

interface Explosion {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    color: string; 
    life: number; 
    type: 'RING' | 'CLOUD' | 'FLASH';
}

interface BreathParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
}

// Helpers
const getUnitRole = (defId: string): CombatRole => {
    const rangedIds = ['crossbowman', 'heavy_arbalest', 'bombard_cannon', 'vampire_hunter', 'skeleton_archer', 'marksman']; 
    const magicIds = ['lich', 'ancient_lich', 'cultist_warlock', 'battle_priest', 'witch_hunter', 'seraphim'];
    if (rangedIds.some(id => defId.includes(id))) return 'RANGED';
    if (magicIds.some(id => defId.includes(id))) return 'MAGIC';
    return 'MELEE';
};

const isUnitFlying = (defId: string): boolean => {
    const flyingIds = ['spectre', 'banshee', 'bone_dragon', 'dracolich', 'seraphim', 'bat'];
    return flyingIds.some(id => defId.includes(id));
};

export const BattleCanvas = ({ playerArmy, enemyArmy, width, height, isPaused, playerColor, enemyColor, battleStarted, phase, deploymentPositions, onUpdatePosition }: BattleCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Systems
    const particlesRef = useRef<Particle[]>([]);
    const goreRef = useRef<GoreParticle[]>([]);
    const projectilesRef = useRef<Projectile[]>([]);
    const beamsRef = useRef<Beam[]>([]);
    const explosionsRef = useRef<Explosion[]>([]);
    const breathRef = useRef<BreathParticle[]>([]);
    
    // Interaction State
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const dragOffset = useRef({ x: 0, y: 0 });

    // Screen Shake Ref (Current Intensity)
    const shakeRef = useRef<number>(0);
    
    const animationFrameRef = useRef<number>(0);
    const armySnapshotRef = useRef<{p: ArmyStack[], e: ArmyStack[]}>({ p: [], e: [] });

    // Refs for live data access
    const livePlayerArmy = useRef(playerArmy);
    const liveEnemyArmy = useRef(enemyArmy);
    const liveBattleStarted = useRef(battleStarted);
    const livePositions = useRef(deploymentPositions);

    useEffect(() => {
        livePlayerArmy.current = playerArmy;
        liveEnemyArmy.current = enemyArmy;
        liveBattleStarted.current = battleStarted;
        livePositions.current = deploymentPositions;
    }, [playerArmy, enemyArmy, battleStarted, deploymentPositions]);

    const MAX_PARTICLES_PER_SIDE = 2500; 
    const FORMATION_GAP = 3.5; 
    const FLUID_PRESSURE = 0.6;
    const TIME_SCALE = 0.3; 

    // --- INPUT HANDLERS (Deployment) ---
    const handlePointerDown = (e: React.PointerEvent) => {
        if (phase !== 'DEPLOYMENT') return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Find if clicked on a player stack box
        // Box size approx 40x40 centered on position
        const boxSize = 40;
        
        const clickedStack = livePlayerArmy.current.find(stack => {
            const pos = livePositions.current[stack.uid];
            if (!pos) return false;
            const px = pos.x * width;
            const py = pos.y * height;
            return Math.abs(x - px) < boxSize / 2 && Math.abs(y - py) < boxSize / 2;
        });

        if (clickedStack) {
            const pos = livePositions.current[clickedStack.uid];
            setDraggingId(clickedStack.uid);
            dragOffset.current = { x: x - (pos.x * width), y: y - (pos.y * height) };
            // Capture pointer for smooth dragging outside canvas bounds if needed (though bounds limit is good)
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (phase !== 'DEPLOYMENT' || !draggingId) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate new normalized position
        let newX = (x - dragOffset.current.x) / width;
        let newY = (y - dragOffset.current.y) / height;

        // Bounds: Player is bottom half (roughly > 0.55)
        newX = Math.max(0.05, Math.min(0.95, newX)); 
        newY = Math.max(0.55, Math.min(0.95, newY));

        onUpdatePosition(draggingId, newX, newY);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (draggingId) {
            setDraggingId(null);
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        }
    };

    // Initialize Particles when phase switches to COMBAT
    useEffect(() => {
        if (phase !== 'COMBAT') return;

        const particles: Particle[] = [];
        let pId = 0;

        const initSide = (army: ArmyStack[], team: 'PLAYER' | 'ENEMY') => {
            const totalUnits = army.reduce((acc, s) => acc + s.count, 0);
            const scaleRatio = totalUnits > MAX_PARTICLES_PER_SIDE ? MAX_PARTICLES_PER_SIDE / totalUnits : 1;

            const baseTeamColor = team === 'PLAYER' ? playerColor : enemyColor;

            army.forEach((stack, stackIndex) => {
                const def = UNIT_DEFINITIONS[stack.defId];
                if (!def) return;

                const pos = livePositions.current[stack.uid];
                // Fallback if pos missing
                const startX = pos ? pos.x * width : width / 2;
                const startY = pos ? pos.y * height : (team === 'PLAYER' ? height - 50 : 50);

                const visualCount = Math.ceil(stack.count * scaleRatio);
                const color = baseTeamColor;
                
                const baseSize = def.baseStats.hp > 100 ? 2.5 : def.baseStats.hp > 40 ? 1.8 : 1.2;
                const size = baseSize;

                const role = getUnitRole(stack.defId);
                const isFlying = isUnitFlying(stack.defId);
                
                let range = 20; 
                if (role === 'RANGED') range = 300; 
                if (role === 'MAGIC') range = 250;
                if (stack.defId.includes('dragon')) range = 180;

                const speedFactor = (def.baseStats.speed || 5) * 0.04;
                const cols = Math.ceil(Math.sqrt(visualCount * 3.0)); 

                for (let i = 0; i < visualCount; i++) {
                    const col = i % cols;
                    const row = Math.floor(i / cols);
                    // Center the formation on the start point
                    const offsetX = (col * FORMATION_GAP) - ((cols * FORMATION_GAP) / 2);
                    const offsetY = (row * FORMATION_GAP) - ((Math.ceil(visualCount/cols) * FORMATION_GAP) / 2);

                    const px = startX + offsetX + (Math.random() * 4);
                    const py = startY + offsetY + (Math.random() * 4);

                    particles.push({
                        id: pId++,
                        stackId: stack.uid,
                        defId: stack.defId,
                        x: px,
                        y: py,
                        vx: 0,
                        vy: 0,
                        team,
                        color,
                        radius: size,
                        dead: false,
                        maxHp: def.baseStats.hp,
                        currentHp: def.baseStats.hp,
                        role,
                        isFlying,
                        range,
                        cooldown: Math.random() * 100,
                        maxCooldown: 100 + Math.random() * 50,
                        speedFactor
                    });
                }
            });
        };

        initSide(playerArmy, 'PLAYER');
        initSide(enemyArmy, 'ENEMY');

        particlesRef.current = particles;
        armySnapshotRef.current = { 
            p: JSON.parse(JSON.stringify(playerArmy)), 
            e: JSON.parse(JSON.stringify(enemyArmy)) 
        };
        projectilesRef.current = [];
        beamsRef.current = [];
        goreRef.current = [];
        explosionsRef.current = [];
        breathRef.current = [];
        shakeRef.current = 0;
    }, [phase, width, height, playerColor, enemyColor]); 

    // Main Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const loop = () => {
            // --- DRAW BACKGROUND ---
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, width, height);

            // --- DEPLOYMENT PHASE RENDER ---
            if (phase === 'DEPLOYMENT') {
                // Draw Zones
                ctx.fillStyle = 'rgba(255, 0, 0, 0.05)'; // Player Zone (Bottom)
                ctx.fillRect(0, height * 0.55, width, height * 0.45);
                ctx.strokeStyle = '#331111';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(0, height * 0.55);
                ctx.lineTo(width, height * 0.55);
                ctx.stroke();
                ctx.setLineDash([]);

                const drawSquad = (army: ArmyStack[], isPlayer: boolean) => {
                    army.forEach(stack => {
                        const def = UNIT_DEFINITIONS[stack.defId];
                        if (!def) return;
                        const pos = livePositions.current[stack.uid];
                        if (!pos) return;

                        const x = pos.x * width;
                        const y = pos.y * height;
                        const size = 30;

                        // Draw Selection Box
                        ctx.fillStyle = isPlayer ? '#111' : '#111';
                        ctx.fillRect(x - size/2, y - size/2, size, size);
                        
                        ctx.strokeStyle = isPlayer ? playerColor : enemyColor;
                        ctx.lineWidth = draggingId === stack.uid ? 3 : 1;
                        ctx.strokeRect(x - size/2, y - size/2, size, size);

                        // Draw Type Indicator (Letter)
                        ctx.fillStyle = isPlayer ? '#fff' : '#aaa';
                        ctx.font = 'bold 12px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(def.name.substring(0, 2).toUpperCase(), x, y);

                        // Count
                        ctx.font = '10px sans-serif';
                        ctx.fillStyle = isPlayer ? '#aaa' : '#666';
                        ctx.fillText(stack.count.toString(), x, y + size/2 + 10);
                        
                        // Role Indicator
                        const role = getUnitRole(stack.defId);
                        const roleIcon = role === 'RANGED' ? '🏹' : role === 'MAGIC' ? '✨' : '⚔️';
                        ctx.font = '10px sans-serif';
                        ctx.fillText(roleIcon, x, y - size/2 - 8);
                    });
                };

                drawSquad(livePlayerArmy.current, true);
                drawSquad(liveEnemyArmy.current, false);

                // Instructions
                ctx.fillStyle = '#666';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText("DRAG SQUADS TO POSITION", width * 0.5, height - 20);

                animationFrameRef.current = requestAnimationFrame(loop);
                return;
            }

            // --- COMBAT PHASE RENDER ---
            
            if (isPaused) {
                animationFrameRef.current = requestAnimationFrame(loop);
                return;
            }

            // --- 1. SYNC DEATHS ---
            if (liveBattleStarted.current) {
                const syncDeaths = (currentStacks: ArmyStack[], team: 'PLAYER' | 'ENEMY') => {
                    const snapshot = team === 'PLAYER' ? armySnapshotRef.current.p : armySnapshotRef.current.e;
                    const teamColor = team === 'PLAYER' ? playerColor : enemyColor;

                    currentStacks.forEach(curr => {
                        const snap = snapshot.find(s => s.uid === curr.uid);
                        if (snap && curr.count < snap.count) {
                            const diff = snap.count - curr.count;
                            const particles = particlesRef.current.filter(p => p.team === team && p.stackId === curr.uid && !p.dead);
                            const lossRatio = diff / snap.count;
                            const particlesToKill = Math.ceil(particles.length * lossRatio);

                            for (let i = 0; i < particlesToKill; i++) {
                                const livePool = particlesRef.current.filter(p => p.team === team && p.stackId === curr.uid && !p.dead);
                                if (livePool.length === 0) break;
                                const victim = livePool[Math.floor(Math.random() * livePool.length)];
                                victim.dead = true;
                                
                                for(let g=0; g<3; g++) {
                                    goreRef.current.push({
                                        x: victim.x, y: victim.y,
                                        vx: (Math.random() - 0.5) * 3,
                                        vy: (Math.random() - 0.5) * 3,
                                        life: 1.0,
                                        color: teamColor
                                    });
                                }
                            }
                            snap.count = curr.count;
                        }
                    });
                };
                syncDeaths(livePlayerArmy.current, 'PLAYER');
                syncDeaths(liveEnemyArmy.current, 'ENEMY');
            }

            // --- PRE-RENDER: SHAKE ---
            ctx.save(); // Start Shake Transform
            if (shakeRef.current > 0) {
                const dx = (Math.random() - 0.5) * shakeRef.current;
                const dy = (Math.random() - 0.5) * shakeRef.current;
                ctx.translate(dx, dy);
                shakeRef.current *= 0.9; // Decay
                if (shakeRef.current < 0.5) shakeRef.current = 0;
            }

            // Corpses
            ctx.fillStyle = '#1a0505'; 
            particlesRef.current.filter(p => p.dead).forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            const activeParticles = particlesRef.current.filter(p => !p.dead);
            
            // --- FULL COMBAT SIMULATION ---
            const gridSize = 50;
            const grid: Record<string, Particle[]> = {};
            activeParticles.forEach(p => {
                const key = `${Math.floor(p.x/gridSize)},${Math.floor(p.y/gridSize)}`;
                if (!grid[key]) grid[key] = [];
                grid[key].push(p);
            });

            activeParticles.forEach(p => {
                // A. TARGETING
                let target: Particle | null = null;
                let minDist = 99999;
                
                const gx = Math.floor(p.x/gridSize);
                const gy = Math.floor(p.y/gridSize);
                for(let dx=-2; dx<=2; dx++) {
                    for(let dy=-2; dy<=2; dy++) {
                        const cell = grid[`${gx+dx},${gy+dy}`];
                        if (cell) {
                            cell.forEach(other => {
                                if (other.team !== p.team && !other.dead) {
                                    const d = Math.hypot(other.x - p.x, other.y - p.y);
                                    if (d < minDist) {
                                        minDist = d;
                                        target = other;
                                    }
                                }
                            });
                        }
                    }
                }

                // Default seek target: Opposite side vertically
                // Player moves UP (to 0), Enemy moves DOWN (to height)
                let targetX = target ? target.x : width / 2;
                let targetY = target ? target.y : (p.team === 'PLAYER' ? 20 : height - 20);

                // B. MOVEMENT
                let seekX = targetX;
                let seekY = targetY;

                if (target && (p.role === 'RANGED' || p.role === 'MAGIC' || p.defId.includes('dragon'))) {
                    if (minDist < p.range * 0.4) {
                        const angle = Math.atan2(target.y - p.y, target.x - p.x);
                        seekX = p.x - Math.cos(angle) * 100;
                        seekY = p.y - Math.sin(angle) * 100;
                    } else if (minDist < p.range) {
                        seekX = p.x;
                        seekY = p.y;
                    }
                }

                const dx = seekX - p.x;
                const dy = seekY - p.y;
                const distToDest = Math.sqrt(dx*dx + dy*dy);
                if (distToDest > 0) {
                    p.vx += (dx / distToDest) * p.speedFactor;
                    p.vy += (dy / distToDest) * p.speedFactor;
                }

                // C. SEPARATION
                const neighbors = grid[`${gx},${gy}`] || [];
                neighbors.forEach(other => {
                    if (other === p) return;
                    if (p.isFlying !== other.isFlying) return;

                    const odx = p.x - other.x;
                    const ody = p.y - other.y;
                    const odistSq = odx*odx + ody*ody;
                    const minSep = (p.radius + other.radius + 1.2); // Very tight separation
                    
                    if (odistSq < minSep * minSep && odistSq > 0) {
                        const odist = Math.sqrt(odistSq);
                        const force = (minSep - odist) * FLUID_PRESSURE;
                        p.vx += (odx / odist) * force;
                        p.vy += (ody / odist) * force;
                    }
                });

                // D. COMBAT ACTIONS
                if (target && minDist <= p.range) {
                    p.cooldown -= 1 * TIME_SCALE; 
                    if (p.cooldown <= 0) {
                        p.cooldown = p.maxCooldown;
                        
                        // 1. DRAGON BREATH
                        if (p.defId.includes('dragon')) {
                            const angle = Math.atan2(target.y - p.y, target.x - p.x);
                            const breathColor = p.defId.includes('dracolich') ? '#7e22ce' : '#84cc16';
                            
                            shakeRef.current += 1.5; 

                            for(let i=0; i<12; i++) {
                                const spread = (Math.random() - 0.5) * 0.5;
                                const speed = 3 + Math.random() * 2;
                                breathRef.current.push({
                                    x: p.x, y: p.y,
                                    vx: Math.cos(angle + spread) * speed,
                                    vy: Math.sin(angle + spread) * speed,
                                    life: 1.0,
                                    maxLife: 1.0,
                                    color: breathColor,
                                    size: 3 + Math.random() * 4
                                });
                            }
                        }
                        
                        // 2. SERAPHIM
                        else if (p.defId.includes('seraphim') && minDist < 30) {
                            shakeRef.current += 2;
                            explosionsRef.current.push({
                                x: (p.x + target.x)/2,
                                y: (p.y + target.y)/2,
                                radius: 5,
                                maxRadius: 40,
                                color: '#fbbf24',
                                life: 1.0,
                                type: 'FLASH'
                            });
                        }

                        // 3. ARTILLERY
                        else if (p.defId.includes('bombard')) {
                            shakeRef.current += 0.5; 
                            projectilesRef.current.push({
                                x: p.x, y: p.y,
                                vx: (target.x - p.x) / minDist * 6,
                                vy: (target.y - p.y) / minDist * 6,
                                life: 60,
                                color: '#1f2937',
                                size: 3,
                                explodeOnImpact: true,
                                history: []
                            });
                        }

                        // 4. RANGED
                        else if (p.role === 'RANGED') {
                            projectilesRef.current.push({
                                x: p.x, y: p.y,
                                vx: (target.x - p.x) / minDist * 12,
                                vy: (target.y - p.y) / minDist * 12,
                                life: 40,
                                color: '#e5e5e5',
                                size: 1.0, 
                                explodeOnImpact: false,
                                history: []
                            });
                        } 
                        
                        // 5. MAGIC
                        else if (p.role === 'MAGIC') {
                            beamsRef.current.push({
                                x1: p.x, y1: p.y,
                                x2: target.x, y2: target.y,
                                color: p.team === 'PLAYER' ? '#a855f7' : '#fbbf24',
                                life: 1.0,
                                width: 1.5
                            });
                            
                            explosionsRef.current.push({
                                x: target.x,
                                y: target.y,
                                radius: 2,
                                maxRadius: 15,
                                color: p.team === 'PLAYER' ? '#d8b4fe' : '#fcd34d',
                                life: 1.0,
                                type: 'RING'
                            });
                        }
                    }
                }

                // E. PHYSICS UPDATE
                const maxVel = Math.max(2.0, p.speedFactor * 15); 
                const vel = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
                if (vel > maxVel) {
                    p.vx = (p.vx / vel) * maxVel;
                    p.vy = (p.vy / vel) * maxVel;
                }

                p.vx *= 0.90;
                p.vy *= 0.90;
                p.x += p.vx * TIME_SCALE;
                p.y += p.vy * TIME_SCALE;

                if (p.x < 10) p.x = 10;
                if (p.x > width - 10) p.x = width - 10;
                if (p.y < 10) p.y = 10;
                if (p.y > height - 10) p.y = height - 10;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
                
                if (p.isFlying) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            });

            // --- 5. RENDER EFFECTS ---
            
            // BREATH PARTICLES
            breathRef.current.forEach(b => {
                b.x += b.vx * TIME_SCALE;
                b.y += b.vy * TIME_SCALE;
                b.life -= 0.04 * TIME_SCALE;
                b.size += 0.1 * TIME_SCALE;
                
                ctx.globalAlpha = Math.max(0, b.life * 0.6);
                ctx.fillStyle = b.color;
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            });
            breathRef.current = breathRef.current.filter(b => b.life > 0);

            // EXPLOSIONS
            explosionsRef.current.forEach(ex => {
                ex.life -= 0.05 * TIME_SCALE;
                const progress = 1 - ex.life;
                ex.radius = ex.maxRadius * progress;

                ctx.globalAlpha = Math.max(0, ex.life);
                
                if (ex.type === 'RING') {
                    ctx.beginPath();
                    ctx.arc(ex.x, ex.y, ex.radius, 0, Math.PI * 2);
                    ctx.strokeStyle = ex.color;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                } else if (ex.type === 'FLASH') {
                    ctx.beginPath();
                    ctx.arc(ex.x, ex.y, ex.radius, 0, Math.PI * 2);
                    ctx.fillStyle = ex.color;
                    ctx.fill();
                } else if (ex.type === 'CLOUD') {
                    ctx.beginPath();
                    ctx.arc(ex.x, ex.y, ex.radius, 0, Math.PI * 2);
                    ctx.fillStyle = ex.color;
                    ctx.fill();
                }
                
                ctx.globalAlpha = 1.0;
            });
            explosionsRef.current = explosionsRef.current.filter(ex => ex.life > 0);

            // PROJECTILES
            projectilesRef.current.forEach((proj) => {
                // Update Pos
                proj.x += proj.vx * TIME_SCALE;
                proj.y += proj.vy * TIME_SCALE;
                proj.life -= 1 * TIME_SCALE;
                
                // Track History for Trails
                proj.history.push({ x: proj.x, y: proj.y });
                if (proj.history.length > 5) proj.history.shift();

                // Explode Logic
                if (proj.life <= 0 && proj.explodeOnImpact) {
                    shakeRef.current += 3; // BIG IMPACT SHAKE
                    explosionsRef.current.push({
                        x: proj.x,
                        y: proj.y,
                        radius: 5,
                        maxRadius: 30,
                        color: '#ea580c', 
                        life: 1.0,
                        type: 'CLOUD'
                    });
                    explosionsRef.current.push({
                        x: proj.x,
                        y: proj.y,
                        radius: 5,
                        maxRadius: 20,
                        color: '#4b5563', 
                        life: 0.8,
                        type: 'CLOUD'
                    });
                }

                // Draw Trail
                if (proj.history.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(proj.history[0].x, proj.history[0].y);
                    for (let i=1; i<proj.history.length; i++) {
                        ctx.lineTo(proj.history[i].x, proj.history[i].y);
                    }
                    ctx.strokeStyle = proj.color;
                    ctx.lineWidth = 1;
                    ctx.globalAlpha = 0.5;
                    ctx.stroke();
                    ctx.globalAlpha = 1.0;
                }

                // Draw Head
                ctx.fillStyle = proj.color;
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI*2);
                ctx.fill();
            });
            projectilesRef.current = projectilesRef.current.filter(p => p.life > 0);

            // BEAMS
            beamsRef.current.forEach(beam => {
                beam.life -= 0.05 * TIME_SCALE;
                ctx.beginPath();
                ctx.moveTo(beam.x1, beam.y1);
                ctx.lineTo(beam.x2, beam.y2);
                ctx.strokeStyle = beam.color;
                ctx.lineWidth = beam.width * beam.life;
                ctx.globalAlpha = beam.life;
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            });
            beamsRef.current = beamsRef.current.filter(b => b.life > 0);

            // GORE
            goreRef.current.forEach((g) => {
                g.x += g.vx * TIME_SCALE;
                g.y += g.vy * TIME_SCALE;
                g.life -= 0.02 * TIME_SCALE;
                ctx.fillStyle = g.color;
                ctx.globalAlpha = Math.max(0, g.life);
                ctx.fillRect(g.x, g.y, 2, 2);
                ctx.globalAlpha = 1.0;
            });
            goreRef.current = goreRef.current.filter(g => g.life > 0);

            ctx.restore(); // END SHAKE TRANSFORM (Restore to 0,0)

            animationFrameRef.current = requestAnimationFrame(loop);
        };

        animationFrameRef.current = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [isPaused, width, height, playerColor, enemyColor, phase, draggingId, deploymentPositions]); 

    return (
        <canvas 
            ref={canvasRef} 
            width={width} 
            height={height} 
            className="w-full h-full bg-black touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        />
    );
};
