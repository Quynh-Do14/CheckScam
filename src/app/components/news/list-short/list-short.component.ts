import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { ShortService, Short } from '../../../services/short.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-list-short',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './list-short.component.html',
  styleUrl: './list-short.component.scss'
})
export class ListShortComponent implements OnInit, OnDestroy {
  shorts: Short[] = [];
  currentIndex = 0;
  loading = false;
  private routeSubscription?: Subscription;

  // Carousel navigation properties
  cardWidth = 320;
  cardGap = 24;
  visibleCards = 5;
  slideOffset = 0;
  isTransitioning = false;

  // Drag properties
  isDragging = false;
  startX = 0;
  currentX = 0;
  dragOffset = 0;
  dragThreshold = 50; // Minimum drag distance to trigger navigation

  readonly imageBaseUrl = `${environment.apiBaseUrl}/shorts/thumbnails/`;
  readonly videoBaseUrl = `${environment.apiBaseUrl}/shorts/videos/`;

  constructor(
    private shortService: ShortService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadShorts();
    
    // Subscribe to route params to get the selected short index
    this.routeSubscription = this.route.queryParams.subscribe(params => {
      const selectedIndex = params['index'];
      if (selectedIndex !== undefined) {
        this.currentIndex = parseInt(selectedIndex, 10);
        // Đảm bảo video được căn giữa sau khi load
        setTimeout(() => {
          this.ensureVideoCentered();
        }, 100);
      }
    });

    // Handle window resize to recalculate centering
    window.addEventListener('resize', () => {
      // Trigger recalculation of transform
      this.ensureVideoCentered();
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  loadShorts(): void {
    this.loading = true;
    this.shortService.getAllShorts().subscribe({
      next: (shorts) => {
        // Lọc dữ liệu không hợp lệ
        this.shorts = (shorts || []).filter(short => {
          return short && short.id && short.title;
        });
        
        // Đảm bảo currentIndex không vượt quá giới hạn
        if (this.currentIndex >= this.shorts.length) {
          this.currentIndex = Math.max(0, this.shorts.length - 1);
        }
        
        this.loading = false;
        this.ensureVideoCentered();
      },
      error: (error) => {
        console.error('Error loading shorts:', error);
        this.loading = false;
      }
    });
  }

  scrollToCurrentVideo(): void {
    // This method is no longer needed as we use CSS transform for centering
    // The carousel automatically centers the current video
  }

  updateCarouselPosition(): void {
    // Force Angular to recalculate the transform
    // This is handled by the getSlideTransform() method
  }

    ensureVideoCentered(): void {
    // Đảm bảo video được căn giữa đúng cách
    this.slideOffset = 0;

    // Force Angular to recalculate the transform
    setTimeout(() => {
      // Trigger change detection để cập nhật vị trí
      this.slideOffset = 0;
    }, 10);

    // Thêm event listener cho window resize
    window.addEventListener('resize', () => {
      this.slideOffset = 0;
    });
  }

  onVideoClick(index: number): void {
    // Prevent click during drag
    if (this.isDragging) return;
    
    console.log('Clicking video index:', index);
    this.currentIndex = index;
    this.ensureVideoCentered();
    
    // Tự động phát video khi click
    setTimeout(() => {
      this.playCurrentVideo();
    }, 100);
  }

  onVideoEnded(shortId: number): void {
    // Auto-play next video when current video ends
    const currentShortIndex = this.shorts.findIndex(short => short.id === shortId);
    if (currentShortIndex !== -1 && currentShortIndex < this.shorts.length - 1) {
      this.currentIndex = currentShortIndex + 1;
      // Đảm bảo video tiếp theo được căn giữa
      this.ensureVideoCentered();
    }
  }

  onVideoPlay(short: Short): void {
    // Tăng lượt xem khi video bắt đầu phát
    if (short.id) {
      this.shortService.incrementViews(short.id).subscribe({
        next: (updatedShort) => {
          // Cập nhật lượt xem trong danh sách
          const index = this.shorts.findIndex(s => s.id === short.id);
          if (index !== -1) {
            this.shorts[index].views = updatedShort.views;
          }
        },
        error: (error) => {
          console.error('Error incrementing views:', error);
        }
      });
    }
  }

  playCurrentVideo(): void {
    const videoElement = document.querySelector('.short-video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.play().catch(error => {
        console.error('Error playing current video:', error);
      });
    }
  }

  onVideoLoaded(short: Short): void {
    console.log('Video loaded:', short.title);
    // Video đã load xong, tự động phát
    const videoElement = document.querySelector('.short-video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.play().catch(error => {
        console.error('Error auto-playing loaded video:', error);
      });
    }
  }

  onVideoError(short: Short): void {
    console.error('Video error:', short.title, short.videoUrl);
  }

  getShortThumbnailUrl(short: Short): string {
    if (short.thumbnail) {
      // Sử dụng service để lấy URL đúng
      return this.shortService.getThumbnailUrlFromPath(short.thumbnail);
    }
    return 'assets/img/default-thumbnail.jpg'; // Fallback image
  }

  getShortVideoUrl(short: Short): string {
    if (short.videoUrl) {
      // Sử dụng service để lấy URL đúng
      return this.shortService.getVideoUrlFromPath(short.videoUrl);
    }
    return '';
  }

  onShortImageError(ev: Event): void {
    const img = ev.target as HTMLImageElement;
    img.src = 'assets/img/default-thumbnail.jpg';
  }

  goBack(): void {
    this.router.navigate(['/list-news']);
  }

  trackById(_: number, item: any): number {
    return item.id;
  }

  // Drag methods
  onMouseDown(event: MouseEvent): void {
    this.startDrag(event.clientX);
  }

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length > 0) {
      event.preventDefault();
      this.startDrag(event.touches[0].clientX);
    }
  }

  onMouseMove(event: MouseEvent): void {
    this.updateDrag(event.clientX);
  }

  onTouchMove(event: TouchEvent): void {
    if (event.touches.length > 0) {
      event.preventDefault();
      this.updateDrag(event.touches[0].clientX);
    }
  }

  onMouseUp(event: MouseEvent): void {
    this.endDrag();
  }

  onTouchEnd(event: TouchEvent): void {
    this.endDrag();
  }

  private startDrag(clientX: number): void {
    this.isDragging = true;
    this.startX = clientX;
    this.currentX = clientX;
    this.dragOffset = 0;
  }

  private updateDrag(clientX: number): void {
    if (!this.isDragging) return;
    
    this.currentX = clientX;
    this.dragOffset = this.currentX - this.startX;
    
    // Update slide offset for visual feedback
    this.slideOffset = this.dragOffset;
  }

  private endDrag(): void {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    
    // Check if drag distance is enough to trigger navigation
    if (Math.abs(this.dragOffset) > this.dragThreshold) {
      if (this.dragOffset > 0) {
        // Dragged right - go to previous
        this.prevShorts();
      } else {
        // Dragged left - go to next
        this.nextShorts();
      }
    } else {
      // Reset to original position
      this.slideOffset = 0;
    }
    
    this.dragOffset = 0;
  }



  // Carousel navigation methods
  canPrevShorts(): boolean {
    return this.currentIndex > 0;
  }

  canNextShorts(): boolean {
    return this.currentIndex < this.shorts.length - 1;
  }

  prevShorts(): void {
    if (!this.canPrevShorts() || this.isTransitioning) return;
    this.isTransitioning = true;
    this.slideOffset = this.cardWidth + this.cardGap;
    setTimeout(() => {
      this.currentIndex--;
      this.slideOffset = 0;
      this.isTransitioning = false;
      this.ensureVideoCentered();

      // Tự động phát video khi chuyển
      setTimeout(() => {
        this.playCurrentVideo();
      }, 100);
    }, 300);
  }

  nextShorts(): void {
    if (!this.canNextShorts() || this.isTransitioning) return;
    this.isTransitioning = true;
    this.slideOffset = -(this.cardWidth + this.cardGap);
    setTimeout(() => {
      this.currentIndex++;
      this.slideOffset = 0;
      this.isTransitioning = false;
      this.ensureVideoCentered();

      // Tự động phát video khi chuyển
      setTimeout(() => {
        this.playCurrentVideo();
      }, 100);
    }, 300);
  }

    getSlideTransform(): string {
    // Tính toán để video active luôn ở giữa
    const containerWidth = window.innerWidth - 280; // Trừ đi padding của container (140px mỗi bên)
    const cardTotalWidth = this.cardWidth + this.cardGap;
    
    // Tính toán vị trí để video active ở giữa màn hình
    let translateX = 0;
    
    if (this.currentIndex === 0) {
      // Video đầu tiên - đưa về giữa màn hình
      const centerOffset = (containerWidth - this.cardWidth) / 2;
      translateX = centerOffset;
    } else if (this.currentIndex === 1) {
      // Video thứ 2 - hiển thị video đầu tiên bên trái, video thứ 2 ở giữa
      translateX = 0;
    } else if (this.currentIndex >= this.shorts.length - 2) {
      // Video gần cuối - hiển thị 5 video cuối
      const lastCardIndex = this.shorts.length - 5;
      translateX = -lastCardIndex * cardTotalWidth;
    } else {
      // Video ở giữa - hiển thị 2 video bên trái, video active ở giữa, 2 video bên phải
      const firstCardIndex = this.currentIndex - 2;
      translateX = -firstCardIndex * cardTotalWidth;
    }
    
    // Thêm slideOffset cho drag effect
    translateX += this.slideOffset;
    
    console.log('Transform debug:', {
      currentIndex: this.currentIndex,
      totalShorts: this.shorts.length,
      translateX,
      containerWidth,
      cardWidth: this.cardWidth
    });
    
    return `translateX(${translateX}px)`;
  }
}
