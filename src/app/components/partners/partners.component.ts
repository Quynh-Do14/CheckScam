import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "../header/header.component";
import { ChatBoxComponent } from "../chat-box/chat-box.component";
import { PartnershipService, PartnershipRequest } from '../../services/partnership.service';
import { Title } from '@angular/platform-browser';


declare var THREE: any;
declare var gsap: any;

@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, FormsModule, HeaderComponent, ChatBoxComponent],
  templateUrl: './partners.component.html',
  styleUrl: './partners.component.scss',
  providers: [PartnershipService]
})
export class PartnersComponent implements OnInit, AfterViewInit, OnDestroy {
  private ai6Robot: any;
  private particleBackground: any;
  private scrollAnimations: any;
  showChatbox: boolean | undefined;
  isSubmitting: boolean = false;
  showSuccessModal: boolean = false;
  submissionData: any = null;
  formErrors: { [key: string]: string } = {};
  showErrorModal: boolean = false;
  // titleService: any;

   constructor(
    private partnershipService: PartnershipService,
    private titleService: Title 
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Trở Thành Đối Tác AI6 - Săn Người Xấu, Diệt Kẻ Gian'); 
    this.loadAgents();
  }
  loadAgents() {
    throw new Error('Method not implemented.');
  }

  ngAfterViewInit(): void {
    this.loadExternalScripts().then(() => {
      this.initializeSystem();
    });
  }

  ngOnDestroy(): void {
  }

  private loadExternalScripts(): Promise<void[]> {
    const scripts = [
      'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js'
    ];

    const promises = scripts.map(src => this.loadScript(src));
    return Promise.all(promises);
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });
  }

  private initializeSystem(): void {
    // Initialize all systems from the original HTML file
    this.initializeAI6Robot();
    this.initializeParticleBackground();
    this.initializeScrollAnimations();
    this.setupEventListeners();
  }

  private initializeAI6Robot(): void {
    // AI6Robot class from original HTML
    class AI6Robot {
      expressions: any;
      currentExpression: string;
      missionRobot: any;
      packageRobot: any;
      robotArmy: any[];
      expressionCycle: number;
      flyingRobot: any;
      canvas: any;
      ctx: any;
      robot: any;

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
        
        this.currentExpression = 'excited';
        this.missionRobot = null;
        this.packageRobot = null;
        this.robotArmy = [];
        this.expressionCycle = 0;
        this.flyingRobot = null;
        this.init();
      }

      init() {
        this.setupCanvas();
        this.createRobot();
        this.setupMissionRobot();
        this.setupPackageRobot();
        this.setupRobotArmy();
        this.setupInteractions();
        this.startAnimationLoop();
        this.createParticles();
        this.startExpressionCycle();
        this.setupParticleExplosions();
        this.setupBenefitCardInteractions();
        this.setupPackageAccordion();
        this.setupContactForm();
      }

      setupCanvas() {
        this.canvas = document.getElementById('robot-canvas') as HTMLCanvasElement;
        if (this.canvas) {
          this.ctx = this.canvas.getContext('2d');
          this.canvas.width = 300;
          this.canvas.height = 400;
        }
      }

      createRobot() {
        this.robot = {
          x: 150,
          y: 200,
          size: 80,
          bodyColor: '#C0C0C0',
          eyeColor: '#00BFFF',
          animationOffset: 0,
          shadowOffset: 0
        };
      }

      setupMissionRobot() {
        const missionCanvas = document.getElementById('mission-robot-canvas') as HTMLCanvasElement;
        if (missionCanvas) {
          this.missionRobot = {
            canvas: missionCanvas,
            ctx: missionCanvas.getContext('2d'),
            x: 150,
            y: 200,
            size: 60,
            animationOffset: 0,
            currentExpression: 'curious'
          };
        }
      }

      setupPackageRobot() {
        const packageCanvas = document.getElementById('package-robot-canvas') as HTMLCanvasElement;
        if (packageCanvas) {
          this.packageRobot = {
            canvas: packageCanvas,
            ctx: packageCanvas.getContext('2d'),
            x: 150,
            y: 200,
            size: 70,
            animationOffset: 0,
            currentExpression: 'curious',
            reflectiveColor: '#C0C0C0'
          };
        }
      }

      setupRobotArmy() {
        const armyContainer = document.getElementById('robot-army');
        if (armyContainer) {
          const expressions = Object.keys(this.expressions);
          for (let i = 0; i < 12; i++) {
            const miniRobotDiv = document.createElement('div');
            miniRobotDiv.className = 'mini-robot';
            
            const canvas = document.createElement('canvas') as HTMLCanvasElement;
            canvas.width = 60;
            canvas.height = 80;
            miniRobotDiv.appendChild(canvas);
            
            const miniRobot = {
              canvas: canvas,
              ctx: canvas.getContext('2d'),
              x: 30,
              y: 40,
              size: 20,
              animationOffset: i * 0.5,
              currentExpression: expressions[i],
              huntingTarget: null
            };
            
            this.robotArmy.push(miniRobot);
            armyContainer.appendChild(miniRobotDiv);
          }
        }
      }

      drawRobot() {
        if (!this.ctx || !this.canvas) return;

        const ctx = this.ctx;
        const r = this.robot;
        const expr = this.expressions[this.currentExpression];

        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Shadow  
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        // Use arc instead of ellipse for better browser compatibility
        ctx.arc(r.x, r.y + r.size + 20 + r.shadowOffset, r.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Robot body with metallic gradient
        const gradient = ctx.createLinearGradient(r.x - r.size, r.y - r.size, r.x + r.size, r.y + r.size);
        gradient.addColorStop(0, '#E8E8E8');
        gradient.addColorStop(0.5, r.bodyColor);
        gradient.addColorStop(1, '#A0A0A0');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        // Use simple rect instead of roundRect for compatibility
        ctx.rect(r.x - r.size/2, r.y - r.size/2, r.size, r.size * 1.2);
        ctx.fill();

        // Chest panel
        ctx.fillStyle = expr.color;
        ctx.beginPath();
        ctx.rect(r.x - r.size/3, r.y - r.size/4, r.size/1.5, r.size/2);
        ctx.fill();

        // Head
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(r.x, r.y - r.size/2, r.size/2.5, 0, Math.PI * 2);
        ctx.fill();

        // Eyes with expression
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(expr.eyes, r.x, r.y - r.size/2 + 8);

        // Arms
        ctx.strokeStyle = '#C0C0C0';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(r.x - r.size/2, r.y);
        ctx.lineTo(r.x - r.size, r.y + Math.sin(r.animationOffset) * 10);
        ctx.moveTo(r.x + r.size/2, r.y);
        ctx.lineTo(r.x + r.size, r.y + Math.sin(r.animationOffset + Math.PI) * 10);
        ctx.stroke();

        // Legs
        ctx.beginPath();
        ctx.moveTo(r.x - r.size/4, r.y + r.size/2);
        ctx.lineTo(r.x - r.size/4, r.y + r.size);
        ctx.moveTo(r.x + r.size/4, r.y + r.size/2);
        ctx.lineTo(r.x + r.size/4, r.y + r.size);
        ctx.stroke();
      }

      animateExpression() {
        const expr = this.expressions[this.currentExpression];
        const r = this.robot;

        switch(expr.animation) {
          case 'bounce':
            r.y = 200 + Math.sin(r.animationOffset * 2) * 5;
            break;
          case 'shake':
            r.x = 150 + Math.sin(r.animationOffset * 8) * 3;
            break;
          case 'jump':
            r.y = 200 + Math.abs(Math.sin(r.animationOffset * 3)) * -20;
            break;
          case 'tremble':
            r.x = 150 + (Math.random() - 0.5) * 2;
            r.y = 200 + (Math.random() - 0.5) * 2;
            break;
          default:
            r.y = 200 + Math.sin(r.animationOffset) * 3;
        }

        r.animationOffset += 0.1;
        r.shadowOffset = Math.sin(r.animationOffset) * 2;
      }

      changeExpression(newExpression: string) {
        if (this.expressions[newExpression]) {
          this.currentExpression = newExpression;
          const indicator = document.getElementById('expression-indicator');
          if (indicator) {
            indicator.textContent = `Robot: ${newExpression.charAt(0).toUpperCase() + newExpression.slice(1)} ${this.expressions[newExpression].eyes}`;
          }
        }
      }

      createFireworks() {
        const colors = ['#FF6600', '#FFD700', '#FF1493', '#00BFFF', '#32CD32'];
        
        for (let i = 0; i < 50; i++) {
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

      startExpressionCycle() {
        const expressions = Object.keys(this.expressions);
        setInterval(() => {
          this.expressionCycle = (this.expressionCycle + 1) % expressions.length;
          this.changeExpression(expressions[this.expressionCycle]);
          
          const speechBubble = document.getElementById('robot-speech');
          if (speechBubble) {
            speechBubble.textContent = this.expressions[expressions[this.expressionCycle]].message;
          }
        }, 5000);
      }

      setupInteractions() {
        let expressionIndex = 0;
        const expressionKeys = Object.keys(this.expressions);

        // Click interactions
        document.addEventListener('click', () => {
          this.changeExpression('excited');
          setTimeout(() => {
            this.changeExpression('happy');
          }, 2000);
        });
      }

      setupParticleExplosions() {
        const ctaButton = document.getElementById('cta-main');
        if (ctaButton) {
          ctaButton.addEventListener('mouseenter', () => {
            this.createExplosion(ctaButton);
            this.changeExpression('thrilled');
          });
        }
      }

      createExplosion(element: Element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 20; i++) {
          const particle = document.createElement('div');
          particle.className = 'particle-explosion';
          
          const angle = (Math.PI * 2 * i) / 20;
          const velocity = 50 + Math.random() * 50;
          const dx = Math.cos(angle) * velocity;
          const dy = Math.sin(angle) * velocity;
          
          particle.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${centerY}px;
            --dx: ${dx}px;
            --dy: ${dy}px;
            z-index: 1000;
          `;
          
          document.body.appendChild(particle);
          
          setTimeout(() => {
            particle.remove();
          }, 1000);
        }
      }

      setupBenefitCardInteractions() {
        const benefitCards = document.querySelectorAll('.benefit-card');
        benefitCards.forEach(card => {
          card.addEventListener('mouseenter', () => {
            const benefit = (card as HTMLElement).dataset['benefit'];
            this.handleBenefitHover(benefit);
          });
        });
      }

      handleBenefitHover(benefit: string | undefined) {
        switch(benefit) {
          case 'cybersecurity':
            this.changeExpression('angry');
            break;
          case 'training':
            this.changeExpression('proud');
            break;
          case 'api':
            this.changeExpression('excited');
            break;
          case 'pentest':
            this.changeExpression('determined');
            break;
          case 'events':
            this.changeExpression('thrilled');
            break;
          default:
            this.changeExpression('curious');
        }
      }

      setupPackageAccordion() {
        const packageTabs = document.querySelectorAll('.package-tab');
        packageTabs.forEach(tab => {
          const header = tab.querySelector('.package-header');
          if (header) {
            header.addEventListener('click', () => {
              // Close all other tabs
              packageTabs.forEach(otherTab => {
                if (otherTab !== tab) {
                  otherTab.classList.remove('active');
                }
              });
              
              // Toggle current tab
              tab.classList.toggle('active');
            });
          }
        });
      }

      setupContactForm() {
        const form = document.getElementById('contact-form');
        if (form) {
          const inputs = form.querySelectorAll('input, select, textarea');
          inputs.forEach(input => {
            input.addEventListener('focus', () => {
              this.changeExpression('curious');
            });
          });
        }
      }

      createParticles() {
        for (let i = 0; i < 20; i++) {
          setTimeout(() => {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + 'vw';
            particle.style.animationDelay = Math.random() * 4 + 's';
            document.body.appendChild(particle);

            setTimeout(() => {
              if (particle.parentNode) {
                particle.remove();
              }
            }, 4000);
          }, i * 200);
        }
      }

      startAnimationLoop() {
        const animate = () => {
          this.animateExpression();
          this.drawRobot();
          this.drawMissionRobot();
          this.drawPackageRobot();
          this.drawRobotArmy();
          requestAnimationFrame(animate);
        };
        animate();
      }

      drawMissionRobot() {
        if (!this.missionRobot) return;
        
        const ctx = this.missionRobot.ctx;
        const r = this.missionRobot;
        const expr = this.expressions[r.currentExpression || 'curious'];

        ctx.clearRect(0, 0, r.canvas.width, r.canvas.height);

        // Simple robot drawing
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(r.x - r.size/2, r.y - r.size/2, r.size, r.size * 1.2);
        
        ctx.fillStyle = expr.color;
        ctx.fillRect(r.x - r.size/3, r.y - r.size/4, r.size/1.5, r.size/2);
        
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.arc(r.x, r.y - r.size/2, r.size/3, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(expr.eyes, r.x, r.y - r.size/2 + 6);

        r.animationOffset += 0.1;
      }

      drawPackageRobot() {
        if (!this.packageRobot) return;
        
        const ctx = this.packageRobot.ctx;
        const r = this.packageRobot;
        const expr = this.expressions[r.currentExpression || 'curious'];

        ctx.clearRect(0, 0, r.canvas.width, r.canvas.height);

        // Enhanced robot drawing
        ctx.fillStyle = r.reflectiveColor;
        ctx.fillRect(r.x - r.size/2, r.y - r.size/2, r.size, r.size * 1.2);
        
        ctx.fillStyle = expr.color;
        ctx.fillRect(r.x - r.size/3, r.y - r.size/4, r.size/1.5, r.size/2);
        
        ctx.fillStyle = r.reflectiveColor;
        ctx.beginPath();
        ctx.arc(r.x, r.y - r.size/2, r.size/2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(expr.eyes, r.x, r.y - r.size/2 + 8);

        r.animationOffset += 0.1;
      }

      drawRobotArmy() {
        this.robotArmy.forEach((robot, index) => {
          const ctx = robot.ctx;
          const r = robot;
          const expr = this.expressions[r.currentExpression];

          ctx.clearRect(0, 0, r.canvas.width, r.canvas.height);

          // Mini robot body
          ctx.fillStyle = '#B0B0B0';
          ctx.fillRect(r.x - r.size/2, r.y - r.size/2, r.size, r.size * 1.3);

          ctx.fillStyle = expr.color;
          ctx.fillRect(r.x - r.size/3, r.y - r.size/4, r.size/1.5, r.size/2);

          ctx.fillStyle = '#B0B0B0';
          ctx.beginPath();
          ctx.arc(r.x, r.y - r.size/2, r.size/2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(expr.eyes, r.x, r.y - r.size/2 + 4);

          r.animationOffset += 0.08;
        });
      }
    }

    this.ai6Robot = new AI6Robot();
  }

  private initializeParticleBackground(): void {
    // ParticleBackground class from original HTML
    class ParticleBackground {
      canvas: any;
      heroCanvas: any;
      ctx: any;
      heroCtx: any;
      particles: any[];
      heroParticles: any[];

      constructor() {
        this.canvas = document.getElementById('particles-bg') as HTMLCanvasElement;
        this.heroCanvas = document.getElementById('particle-canvas') as HTMLCanvasElement;
        this.particles = [];
        this.heroParticles = [];
        
        if (this.canvas) {
          this.ctx = this.canvas.getContext('2d');
        }
        if (this.heroCanvas) {
          this.heroCtx = this.heroCanvas.getContext('2d');
        }
        
        this.init();
      }

      init() {
        this.resize();
        this.createParticles();
        this.createHeroParticles();
        this.animate();
        window.addEventListener('resize', () => this.resize());
      }

      resize() {
        if (this.canvas) {
          this.canvas.width = window.innerWidth;
          this.canvas.height = window.innerHeight;
        }
        
        if (this.heroCanvas) {
          this.heroCanvas.width = window.innerWidth;
          this.heroCanvas.height = window.innerHeight;
        }
      }

      createParticles() {
        const canvasWidth = this.canvas ? this.canvas.width : window.innerWidth;
        const canvasHeight = this.canvas ? this.canvas.height : window.innerHeight;
        
        for (let i = 0; i < 50; i++) {
          this.particles.push({
            x: Math.random() * canvasWidth,
            y: Math.random() * canvasHeight,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.2
          });
        }
      }

      createHeroParticles() {
        if (!this.heroCanvas) return;
        
        for (let i = 0; i < 1000; i++) {
          this.heroParticles.push({
            x: Math.random() * this.heroCanvas.width,
            y: Math.random() * this.heroCanvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 3 + 1,
            opacity: Math.random() * 0.3 + 0.1,
            color: Math.random() > 0.5 ? '#FF6600' : '#FFEFD5',
            life: Math.random() * 100 + 50
          });
        }
      }

      animate() {
        if (this.ctx && this.canvas) {
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
        }

        if (this.heroCtx && this.heroCanvas) {
          this.heroCtx.clearRect(0, 0, this.heroCanvas.width, this.heroCanvas.height);
          
          this.heroParticles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;

            particle.vy += 0.02;
            
            if (particle.x < 0 || particle.x > this.heroCanvas.width) {
              particle.vx *= -0.8;
              particle.x = Math.max(0, Math.min(this.heroCanvas.width, particle.x));
            }
            if (particle.y < 0 || particle.y > this.heroCanvas.height) {
              particle.vy *= -0.8;
              particle.y = Math.max(0, Math.min(this.heroCanvas.height, particle.y));
            }

            this.heroCtx.save();
            this.heroCtx.globalAlpha = particle.opacity * (particle.life / 100);
            this.heroCtx.fillStyle = particle.color;
            this.heroCtx.shadowColor = particle.color;
            this.heroCtx.shadowBlur = particle.size * 2;
            this.heroCtx.beginPath();
            this.heroCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.heroCtx.fill();
            this.heroCtx.restore();

            if (particle.life <= 0) {
              particle.x = Math.random() * this.heroCanvas.width;
              particle.y = Math.random() * this.heroCanvas.height;
              particle.vx = (Math.random() - 0.5) * 2;
              particle.vy = (Math.random() - 0.5) * 2;
              particle.life = Math.random() * 100 + 50;
            }
          });
        }

        requestAnimationFrame(() => this.animate());
      }
    }

    this.particleBackground = new ParticleBackground();
  }

  private initializeScrollAnimations(): void {
    // ScrollAnimations class from original HTML
    class ScrollAnimations {
      constructor() {
        this.init();
      }

      init() {
        this.observeElements();
        this.setupParallax();
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

      setupParallax() {
        window.addEventListener('scroll', () => {
          const scrolled = window.pageYOffset;
          const parallax = document.querySelector('.hero');
          const speed = scrolled * 0.5;
          
          if (parallax) {
            (parallax as HTMLElement).style.transform = `translateY(${speed}px)`;
          }

          const robot = document.getElementById('robot-container');
          if (robot) {
            const robotSpeed = scrolled * 0.1;
            robot.style.transform = `translateY(calc(-50% + ${robotSpeed}px))`;
          }
        });
      }
    }

    this.scrollAnimations = new ScrollAnimations();
  }

  private setupEventListeners(): void {
    // Add laser effects periodically
    setInterval(() => {
      const laser = document.createElement('div');
      laser.className = 'laser-beam';
      laser.style.top = Math.random() * 80 + '%';
      laser.style.left = Math.random() * 80 + '%';
      document.body.appendChild(laser);

      setTimeout(() => {
        if (laser.parentNode) {
          laser.remove();
        }
      }, 2000);
    }, 3000);
  }

  // Contact form submission
  onContactFormSubmit(event: Event): void {
    event.preventDefault();
    
    if (this.isSubmitting) {
      return;
    }
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Validate form
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const organization = formData.get('organization') as string;
    const packageType = formData.get('package') as string;
    const message = formData.get('message') as string;
    
    // Clear previous errors
    this.formErrors = {};
    
    // Validate required fields
    if (!name?.trim()) {
      this.formErrors['name'] = 'Vui lòng nhập họ tên đầy đủ';
    }
    
    if (!email?.trim()) {
      this.formErrors['email'] = 'Vui lòng nhập email doanh nghiệp';
    } else if (!this.isValidEmail(email)) {
      this.formErrors['email'] = 'Email không hợp lệ';
    }
    
    if (!organization?.trim()) {
      this.formErrors['organization'] = 'Vui lòng nhập tên tổ chức';
    }
    
    if (!packageType) {
      this.formErrors['package'] = 'Vui lòng chọn gói hợp tác';
    }
    
    // Check if there are any errors
    if (Object.keys(this.formErrors).length > 0) {
      this.showErrorModal = true;
      this.scrollToFirstError();
      return;
    }
    
    // Extract phone number from form if added
    const phoneMatch = message?.match(/((\\+84|0)[0-9]{9,10})/);
    const phoneNumber = phoneMatch ? phoneMatch[0] : undefined;
    
    const partnershipRequest: PartnershipRequest = {
      name: name.trim(),
      email: email.trim(),
      organization: organization.trim(),
      packageType: packageType,
      phoneNumber: phoneNumber,
      message: message?.trim()
    };
    
    this.isSubmitting = true;
    
    // Gửi đăng ký hợp tác
    this.partnershipService.registerPartnership(partnershipRequest).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        // Kiểm tra status của HTTP response
        if (response.status === 'CREATED' || response.status === 'OK') {
          form.reset();
          this.submissionData = {
            message: response.message,
            data: response.data,
            organization: partnershipRequest.organization,
            packageType: partnershipRequest.packageType,
            email: partnershipRequest.email
          };
          this.showSuccessModal = true;
          this.showSuccessMessage();
        } else {
          alert(response.message || 'Có lỗi xảy ra. Vui lòng thử lại!');
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error submitting partnership:', error);
        alert(error.error?.message || 'Có lỗi xảy ra khi gửi đề xuất. Vui lòng thử lại sau hoặc liên hệ trực tiếp qua email!');
      }
    });
  }

  private showSuccessMessage(): void {
    // Change robot to happy and create fireworks
    if (this.ai6Robot && this.ai6Robot.changeExpression) {
      this.ai6Robot.changeExpression('happy');
      this.ai6Robot.createFireworks();
    }
  }

  /* ===== Chat ===== */
  onAiTuVanClicked(): void {
    debugger
    this.showChatbox = true;
  }

  closeChatbox(): void {
    debugger
    this.showChatbox = false;
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    this.submissionData = null;
  }

  getPackageDisplayName(packageType: string): string {
    const packageNames: { [key: string]: string } = {
      'basic': 'Hợp Tác Cơ Bản (< 10M VND)',
      'companion': 'Hợp Tác Đồng Hành (10-20M VND)',
      'collaboration': 'Hợp Tác Thân Thiệt (20-40M VND)',
      'strategic': 'Hợp Tác Chiến Lược (40-80M VND)',
      'gold': 'Hợp Tác Vàng (> 80M VND)'
    };
    return packageNames[packageType] || packageType;
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
    this.formErrors = {};
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private scrollToFirstError(): void {
    setTimeout(() => {
      const firstErrorField = Object.keys(this.formErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
    }, 100);
  }

  getErrorsArray(): string[] {
    return Object.values(this.formErrors);
  }
}

