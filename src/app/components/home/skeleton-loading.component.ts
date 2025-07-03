import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-container" *ngIf="isVisible">
      <div class="skeleton-item" *ngFor="let item of skeletonArray">
        <div class="skeleton-rank"></div>
        <div class="skeleton-info"></div>
        <div class="skeleton-description"></div>
        <div class="skeleton-stats"></div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 20px 0;
    }

    .skeleton-item {
      display: flex;
      align-items: center;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
      border-radius: 16px;
      padding: 20px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      animation: skeletonPulse 1.5s ease-in-out infinite;
    }

    .skeleton-rank {
      width: 40px;
      height: 40px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      border-radius: 50%;
      animation: skeletonShimmer 1.5s ease-in-out infinite;
    }

    .skeleton-info {
      width: 140px;
      height: 20px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      border-radius: 8px;
      margin: 0 20px;
      animation: skeletonShimmer 1.5s ease-in-out infinite;
      animation-delay: 0.2s;
    }

    .skeleton-description {
      flex: 1;
      height: 16px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      border-radius: 8px;
      margin: 0 20px;
      animation: skeletonShimmer 1.5s ease-in-out infinite;
      animation-delay: 0.4s;
    }

    .skeleton-stats {
      width: 80px;
      height: 24px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      border-radius: 8px;
      animation: skeletonShimmer 1.5s ease-in-out infinite;
      animation-delay: 0.6s;
    }

    @keyframes skeletonPulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.8;
      }
    }

    @keyframes skeletonShimmer {
      0% {
        background-position: -200px 0;
      }
      100% {
        background-position: calc(200px + 100%) 0;
      }
    }

    .skeleton-rank,
    .skeleton-info,
    .skeleton-description,
    .skeleton-stats {
      background-size: 200px 100%;
      background-repeat: no-repeat;
    }

    @media (max-width: 480px) {
      .skeleton-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
        padding: 15px;
      }

      .skeleton-info,
      .skeleton-description {
        margin: 0;
        width: 100%;
      }

      .skeleton-description {
        height: 14px;
      }

      .skeleton-stats {
        align-self: flex-end;
        width: 60px;
        height: 20px;
      }
    }
  `]
})
export class SkeletonLoadingComponent {
  @Input() isVisible: boolean = false;
  @Input() itemCount: number = 5;

  get skeletonArray() {
    return Array(this.itemCount).fill(0);
  }
}
