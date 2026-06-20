/**
 * Canvas Aura Particle System
 * Creates a beautiful, floating, ambient particle backdrop representing inner thoughts.
 */

export class AuraCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        this.particles = [];
        this.particleCount = 40;
        this.flowRate = 1.0; // Dynamic velocity scale
        
        this.mouse = {
            x: null,
            y: null,
            radius: 150
        };

        this.colors = [
            'rgba(103, 58, 183, 0.15)', // Violet
            'rgba(0, 150, 136, 0.15)',   // Teal
            'rgba(233, 30, 99, 0.12)',   // Rose
            'rgba(33, 150, 243, 0.12)'    // Blue
        ];

        this.init();
        this.animate();

        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }

    updateColors(themeName) {
        if (themeName === 'teal') {
            this.colors = [
                'rgba(0, 150, 136, 0.16)', // Teal
                'rgba(76, 175, 80, 0.14)',  // Green
                'rgba(0, 188, 212, 0.14)',  // Cyan
                'rgba(33, 150, 243, 0.12)'  // Blue
            ];
        } else if (themeName === 'rose') {
            this.colors = [
                'rgba(233, 30, 99, 0.16)',  // Rose
                'rgba(156, 39, 176, 0.14)', // Purple
                'rgba(224, 64, 251, 0.14)', // Magenta
                'rgba(244, 67, 54, 0.12)'   // Red
            ];
        } else if (themeName === 'amber') {
            this.colors = [
                'rgba(255, 152, 0, 0.16)',  // Orange
                'rgba(255, 193, 7, 0.16)',  // Amber
                'rgba(255, 87, 34, 0.12)',  // Deep Orange
                'rgba(255, 235, 59, 0.12)'  // Yellow
            ];
        } else {
            this.colors = [
                'rgba(103, 58, 183, 0.15)', // Violet
                'rgba(0, 150, 136, 0.15)',   // Teal
                'rgba(233, 30, 99, 0.12)',   // Rose
                'rgba(33, 150, 243, 0.12)'    // Blue
            ];
        }
        
        this.particles.forEach(p => {
            p.color = this.colors[Math.floor(Math.random() * this.colors.length)];
        });
    }

    init() {
        this.resize();
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(this.createParticle());
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    handleMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }

    createParticle() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            radius: Math.random() * 80 + 40,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            baseAlpha: Math.random() * 0.3 + 0.1,
            pulseSpeed: Math.random() * 0.005 + 0.002,
            pulseTime: Math.random() * Math.PI
        };
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Slow movement and draw
        for (let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];
            
            // Pulse radius slightly
            p.pulseTime += p.pulseSpeed * this.flowRate;
            let currentRadius = p.radius + Math.sin(p.pulseTime) * 15;

            // Update position
            p.x += p.vx * this.flowRate;
            p.y += p.vy * this.flowRate;

            // Bounce off edges
            if (p.x - p.radius < 0 || p.x + p.radius > this.canvas.width) p.vx = -p.vx;
            if (p.y - p.radius < 0 || p.y + p.radius > this.canvas.height) p.vy = -p.vy;

            // Mouse interaction (gentle attraction/repulsion)
            if (this.mouse.x !== null && this.mouse.y !== null) {
                let dx = this.mouse.x - p.x;
                let dy = this.mouse.y - p.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < this.mouse.radius) {
                    // Soft drift towards mouse
                    p.x += dx * 0.002;
                    p.y += dy * 0.002;
                }
            }

            // Draw particle
            this.ctx.beginPath();
            let grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentRadius);
            grad.addColorStop(0, p.color);
            grad.addColorStop(1, 'rgba(11, 10, 21, 0)');
            
            this.ctx.fillStyle = grad;
            this.ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        requestAnimationFrame(() => this.animate());
    }
}
