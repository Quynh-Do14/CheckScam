import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-overlay" *ngIf="isVisible" [class.full-screen]="fullScreen">
      <div class="loading-container">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <p class="loading-text">{{ text }}</p>
        <div class="loading-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      animation: fadeIn 0.3s ease-out;
    }

    .loading-overlay.full-screen {
      position: fixed;
    }

    .loading-container {
      text-align: center;
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 300px;
      animation: slideUp 0.4s ease-out;
    }

    .loading-spinner {
      position: relative;
      width: 80px;
      height: 80px;
      margin: 0 auto 30px;
    }

    .spinner-ring {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: 4px solid transparent;
      border-radius: 50%;
      animation: spin 1.5s linear infinite;
    }

    .spinner-ring:nth-child(1) {
      border-top-color: #FF6B35;
      animation-delay: 0s;
    }

    .spinner-ring:nth-child(2) {
      border-right-color: #FFD23F;
      animation-delay: 0.3s;
      width: 70%;
      height: 70%;
      top: 15%;
      left: 15%;
    }

    .spinner-ring:nth-child(3) {
      border-bottom-color: #FF8A65;
      animation-delay: 0.6s;
      width: 40%;
      height: 40%;
      top: 30%;
      left: 30%;
    }

    .loading-text {
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
      margin: 0 0 20px 0;
      animation: pulse 1.5s ease-in-out infinite;
    }

    .loading-dots {
      display: flex;
      justify-content: center;
      gap: 8px;
    }

    .dot {
      width: 8px;
      height: 8px;
      background: #FF6B35;
      border-radius: 50%;
      animation: bounce 1.4s ease-in-out infinite both;
    }

    .dot:nth-child(1) { animation-delay: -0.32s; }
    .dot:nth-child(2) { animation-delay: -0.16s; }
    .dot:nth-child(3) { animation-delay: 0s; }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px) scale(0.9);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    @keyframes bounce {
      0%, 80%, 100% {
        transform: scale(0);
      }
      40% {
        transform: scale(1);
      }
    }

    @media (max-width: 768px) {
      .loading-container {
        padding: 30px;
        max-width: 280px;
      }

      .loading-spinner {
        width: 60px;
        height: 60px;
        margin-bottom: 20px;
      }

      .loading-text {
        font-size: 1rem;
      }
    }

    @media (max-width: 480px) {
      .loading-container {
        padding: 25px;
        max-width: 250px;
        margin: 20px;
      }

      .loading-spinner {
        width: 50px;
        height: 50px;
        margin-bottom: 15px;
      }

      .loading-text {
        font-size: 0.9rem;
        margin-bottom: 15px;
      }
    }
  `]
})
export class LoadingComponent {
  @Input() isVisible: boolean = false;
  @Input() text: string = 'Đang tải...';
  @Input() fullScreen: boolean = true;
}
