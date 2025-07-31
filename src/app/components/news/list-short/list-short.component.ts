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

  // Video state management
  private videoLoadingStates = new Map<number, boolean>();
  private videoErrorStates = new Map<number, boolean>();
  private videoPlayingStates = new Map<number, boolean>();
  private videoMutedStates = new Map<number, boolean>();
  private videoProgressStates = new Map<number, number>();
  private preloadedVideos = new Set<number>();

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
      this.videoPlayingStates.set(short.id, true);
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

  onVideoLoadStart(short: Short): void {
    if (short.id) {
      this.videoLoadingStates.set(short.id, true);
      this.videoErrorStates.set(short.id, false);
    }
  }

  onVideoLoaded(short: Short): void {
    if (short.id) {
      this.videoLoadingStates.set(short.id, false);
      this.videoErrorStates.set(short.id, false);
    }
  }

  onVideoCanPlay(short: Short): void {
    if (short.id) {
      this.videoLoadingStates.set(short.id, false);
    }
  }

  onVideoPause(short: Short): void {
    if (short.id) {
      this.videoPlayingStates.set(short.id, false);
    }
  }

  onVideoTimeUpdate(event: Event, short: Short): void {
    const video = event.target as HTMLVideoElement;
    if (short.id && video.duration) {
      const progress = (video.currentTime / video.duration) * 100;
      this.videoProgressStates.set(short.id, progress);
    }
  }

  onVideoPreloaded(short: Short): void {
    if (short.id) {
      this.preloadedVideos.add(short.id);
      console.log(`Video preloaded for short ${short.id}`);
    }
  }

  onVideoError(short: Short): void {
    console.error('Video error:', short.title, short.videoUrl);
    if (short.id) {
      this.videoErrorStates.set(short.id, true);
      this.videoLoadingStates.set(short.id, false);
    }
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
    const cardWidth = this.cardWidth; // All cards have same width now

    let totalPrevCardsWidth = 0;
    for (let i = 0; i < this.currentIndex; i++) {
        totalPrevCardsWidth += (cardWidth + this.cardGap);
    }

    const centerAdjustment = (containerWidth / 2) - (cardWidth / 2);

    let dynamicOffset = centerAdjustment - totalPrevCardsWidth;

    dynamicOffset += this.dragOffset;

    return `translateX(${dynamicOffset}px)`;
  }

  // Video control methods
  isVideoLoading(shortId: number): boolean {
    return this.videoLoadingStates.get(shortId) || false;
  }

  hasVideoError(shortId: number): boolean {
    return this.videoErrorStates.get(shortId) || false;
  }

  isVideoPlaying(shortId: number): boolean {
    return this.videoPlayingStates.get(shortId) || false;
  }

  getVideoProgress(shortId: number): number {
    return this.videoProgressStates.get(shortId) || 0;
  }

  toggleVideoPlayPause(shortId: number): void {
    const videoElement = document.getElementById(`video-${shortId}`) as HTMLVideoElement;
    if (videoElement) {
      if (videoElement.paused) {
        videoElement.play().catch(error => {
          console.error('Error playing video:', error);
        });
      } else {
        videoElement.pause();
      }
    }
  }

  toggleMute(shortId: number): void {
    const videoElement = document.getElementById(`video-${shortId}`) as HTMLVideoElement;
    if (videoElement) {
      videoElement.muted = !videoElement.muted;
      this.videoMutedStates.set(shortId, videoElement.muted);
    }
  }

  getVolumeIcon(shortId: number): string {
    const isMuted = this.videoMutedStates.get(shortId) || false;
    return isMuted ? 'bi bi-volume-mute-fill' : 'bi bi-volume-up-fill';
  }

  toggleFullscreen(shortId: number): void {
    const videoElement = document.getElementById(`video-${shortId}`) as HTMLVideoElement;
    if (videoElement) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(error => {
          console.error('Error exiting fullscreen:', error);
        });
      } else {
        videoElement.requestFullscreen().catch(error => {
          console.error('Error entering fullscreen:', error);
        });
      }
    }
  }

  retryVideo(short: Short): void {
    if (short.id) {
      this.videoErrorStates.set(short.id, false);
      this.videoLoadingStates.set(short.id, true);
      
      // Force reload the video
      const videoElement = document.getElementById(`video-${short.id}`) as HTMLVideoElement;
      if (videoElement) {
        videoElement.load();
      }
    }
  }

  shouldPreloadVideo(index: number): boolean {
    // Preload next video only
    return index === this.currentIndex + 1 && index < this.shorts.length;
  }
}