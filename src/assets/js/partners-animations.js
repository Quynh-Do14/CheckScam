// AI6 Robot Animation System
class AI6Robot {
    constructor() {
        this.expressions = {
            happy: { eyes: '😊', color: '#FFD700', animation: 'bounce', message: 'Sẵn sàng săn tội phạm!' },
            sad: { eyes: '😢', color: '#4169E1', animation: 'droop', message: 'Quá nhiều lừa đảo cần ngăn chặn...' },
            angry: { eyes: '😠', color: '#FF0000', animation: 'shake', message: 'Đang nhắm mục tiêu kẻ xấu!' },
            excited: { eyes: '🤩', color: '#FF69B4', animation: 'jump', message: 'Đến giờ hợp tác rồi!' },
            fearful: { eyes: '😨', color: '#800080', animation: 'tremble', message: 'Phát hiện lừa đảo gần đây!' },
            surprised: { eyes: '😲', color: '#00CED1', animation: 'expand', message: 'Wow, đối tác mới!' },
            proud: { eyes: '😎', color: '#32CD32', animation: 'puff', message: 'Nhiệm vụ hoàn thành!' },
            anxious: { eyes: '😰', color: '#FFA500', animation: 'fidget', message: 'Đang phân tích mối đe dọa...' },
            determined: { eyes: '😤', color: '#DC143C', animation: 'clench', message: 'Tiêu diệt tội phạm!' },
            relaxed: { eyes: '😌', color: '#98FB98', animation: 'sway', message: 'Tất cả hệ thống hoạt động tốt' },
            curious: { eyes: '🤔', color: '#DDA0DD', animation: 'tilt', message: 'Đang điều tra...' },
            thrilled: { eyes: '🥳', color: '#FF1493', animation: 'spin', message: 'Hãy săn kẻ xấu cùng tôi!' }
        };
        
        this.currentExpression = 'happy';
        this.animationOffset = 0;
        this.init();
    }

    init() {
        console.log('AI6Robot initialized successfully!');
        this.startAnimationLoop();
    }

    changeExpression(expression) {
        if (this.expressions[expression]) {
            this.currentExpression = expression;
            console.log(`Robot expression changed to: ${expression}`);
        }
    }

    createFireworks() {
        console.log('Creating fireworks effect!');
        const colors = ['#FF6600', '#FFD700', '#FF1493', '#00BFFF', '#32CD32'];
        
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const firework = document.createElement('div');
                firework.style.cssText = `
                    position: fixed;
                    left: ${Math.random() * window.innerWidth}px;
                    top: ${Math.random() * window.innerHeight}px;
                    width: 6px;
                    height: 6px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 1000;
                    animation: fireworkExplode 2s ease-out forwards;
                `;
                document.body.appendChild(firework);
                setTimeout(() => firework.remove(), 2000);
            }, i * 50);
        }
    }

    startAnimationLoop() {
        const animate = () => {
            this.animationOffset += 0.1;
            requestAnimationFrame(animate);
        };
        animate();
    }
}

// Particle Background System
class ParticleBackground {
    constructor() {
        this.canvas = document.getElementById('particles-bg');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.particles = [];
            this.init();
        }
    }

    init() {
        this.resize();
        this.createParticles();
        this.animate();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }

    createParticles() {
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * (this.canvas ? this.canvas.width : window.innerWidth),
                y: Math.random() * (this.canvas ? this.canvas.height : window.innerHeight),
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }

    animate() {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;

            if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;

            this.ctx.save();
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillStyle = '#FF6600';
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });

        requestAnimationFrame(() => this.animate());
    }
}

// Scroll Animation System
class ScrollAnimations {
    constructor() {
        this.init();
    }

    init() {
        this.observeElements();
        console.log('ScrollAnimations initialized');
    }

    observeElements() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.fade-in').forEach(el => {
            observer.observe(el);
        });
    }
}

// Make classes available globally
window.AI6Robot = AI6Robot;
window.ParticleBackground = ParticleBackground;
window.ScrollAnimations = ScrollAnimations;

console.log('Partners animations loaded successfully!');
