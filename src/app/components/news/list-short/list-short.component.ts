import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
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

  cardWidth = 360;
  cardHeight = 640;
  cardGap = 30;

  isDragging = false;
  startX = 0;
  currentX = 0;
  dragOffset = 0;
  dragThreshold = 50;

  readonly imageBaseUrl = `${environment.apiBaseUrl}/shorts/thumbnails/`;
  readonly videoBaseUrl = `${environment.apiBaseUrl}/shorts/videos/`;

  constructor(
    private shortService: ShortService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadShorts();

    this.routeSubscription = this.route.queryParams.subscribe(params => {
      const selectedIndex = params['index'];
      if (selectedIndex !== undefined) {
        this.currentIndex = parseInt(selectedIndex, 10);
        this.ensureVideoCentered();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.updateCardDimensions();
    this.ensureVideoCentered();
  }

  updateCardDimensions(): void {
    if (window.innerWidth <= 768) {
      this.cardWidth = 250;
      this.cardHeight = 444;
      this.cardGap = 15;
    } else if (window.innerWidth <= 1024) {
      this.cardWidth = 300;
      this.cardHeight = 533;
      this.cardGap = 20;
    } else {
      this.cardWidth = 360;
      this.cardHeight = 640;
      this.cardGap = 30;
    }
  }

  loadShorts(): void {
    this.loading = true;
    this.shortService.getAllShorts().subscribe({
      next: (shorts) => {
        this.shorts = (shorts || []).filter(short => {
          return short && short.id && short.title;
        });

        if (this.currentIndex >= this.shorts.length) {
          this.currentIndex = Math.max(0, this.shorts.length - 1);
        }

        this.loading = false;
        this.updateCardDimensions();
        this.ensureVideoCentered();
      },
      error: (error) => {
        console.error('Error loading shorts:', error);
        this.loading = false;
      }
    });
  }

  ensureVideoCentered(): void {
  }

  onVideoClick(index: number): void {
    if (this.isDragging) return;

    if (this.currentIndex === index) {
    } else {
      this.currentIndex = index;
      this.playCurrentVideo();
    }
  }

  onVideoEnded(shortId: number): void {
    const currentShortIndex = this.shorts.findIndex(short => short.id === shortId);
    if (currentShortIndex !== -1 && currentShortIndex < this.shorts.length - 1) {
      this.currentIndex = currentShortIndex + 1;
      this.playCurrentVideo();
    }
  }

  onVideoPlay(short: Short): void {
    if (short.id) {
      this.shortService.incrementViews(short.id).subscribe({
        next: (updatedShort) => {
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
    const allVideos = document.querySelectorAll('.short-video');
    allVideos.forEach(video => {
      const vidElem = video as HTMLVideoElement;
      if (!vidElem.paused) {
        vidElem.pause();
      }
    });

    const videoElement = document.querySelector('.short-card.active .short-video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.play().catch(error => {
        console.error('Error playing current video:', error);
      });
    }
  }

  onVideoLoaded(short: Short): void {
  }

  onVideoError(short: Short): void {
    console.error('Video error:', short.title, short.videoUrl);
  }

  getShortThumbnailUrl(short: Short): string {
    if (short.thumbnail) {
      return this.shortService.getThumbnailUrlFromPath(short.thumbnail);
    }
    return 'assets/img/default-thumbnail.jpg';
  }

  getShortVideoUrl(short: Short): string {
    if (short.videoUrl) {
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

  onMouseDown(event: MouseEvent): void {
    this.startDrag(event.clientX);
  }

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length > 0) {
      this.startDrag(event.touches[0].clientX);
      event.preventDefault();
    }
  }

  onMouseMove(event: MouseEvent): void {
    this.updateDrag(event.clientX);
  }

  onTouchMove(event: TouchEvent): void {
    if (event.touches.length > 0) {
      this.updateDrag(event.touches[0].clientX);
      event.preventDefault();
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
  }

  private endDrag(): void {
    if (!this.isDragging) return;

    this.isDragging = false;

    if (Math.abs(this.dragOffset) > this.dragThreshold) {
      if (this.dragOffset > 0) {
        this.prevShorts();
      } else {
        this.nextShorts();
      }
    }
    this.dragOffset = 0;
  }

  canPrevShorts(): boolean {
    return this.currentIndex > 0;
  }

  canNextShorts(): boolean {
    return this.currentIndex < this.shorts.length - 1;
  }

  prevShorts(): void {
    if (!this.canPrevShorts()) return;
    this.currentIndex--;
    this.playCurrentVideo();
  }

  nextShorts(): void {
    if (!this.canNextShorts()) return;
    this.currentIndex++;
    this.playCurrentVideo();
  }

  getSlideTransform(): string {
    const containerWidth = window.innerWidth;
    const activeCardWidth = this.cardWidth * 1.15;
    const inactiveCardWidth = this.cardWidth * 0.85;

    let totalPrevCardsWidth = 0;
    for (let i = 0; i < this.currentIndex; i++) {
        totalPrevCardsWidth += (inactiveCardWidth + this.cardGap);
    }

    const centerAdjustment = (containerWidth / 2) - (activeCardWidth / 2);

    let dynamicOffset = centerAdjustment - totalPrevCardsWidth;

    dynamicOffset += this.dragOffset;

    return `translateX(${dynamicOffset}px)`;
  }
}