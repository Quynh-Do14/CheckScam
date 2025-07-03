import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { Mistake, MistakeService, ApiResponse, MistakeStatus } from '../../../services/mistake.service';

@Component({
  selector: 'app-mistake-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DatePipe,
  ],
  templateUrl: './mistake-management.component.html',
  styleUrls: ['./mistake-management.component.scss'],
  providers: [DatePipe]
})
export class MistakeManagementComponent implements OnInit, OnDestroy {
  mistakes: Mistake[] = [];
  isLoading: boolean = false;
  currentPage: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;

  selectedStatusFilter: string = '';

  isProcessConfirmModalOpen: boolean = false;
  isRejectConfirmModalOpen: boolean = false;
  selectedMistakeIdForModal: number | null = null;

  private filterTerms = new Subject<string>();
  private destroy$ = new Subject<void>();

  MistakeStatus = MistakeStatus;

  constructor(
    private mistakeService: MistakeService,
    private toastr: ToastrService,
    private datePipe: DatePipe,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadMistakes();

    this.filterTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(status => {
      this.selectedStatusFilter = status;
      this.currentPage = 0;
      this.loadMistakes();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMistakes(): void {
    this.isLoading = true;
    this.mistakeService.getMistakes(this.currentPage, this.pageSize, this.selectedStatusFilter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ApiResponse<Mistake>) => {
          this.mistakes = response.content;
          this.totalElements = response.totalElements;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading mistakes:', error);
          this.isLoading = false;
          this.toastr.error('Không thể tải danh sách khiếu nại.', 'Lỗi');
        }
      });
  }

  onStatusFilterChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.filterTerms.next(selectElement.value);
  }

  getMistakeStatusString(status: MistakeStatus): string {
    switch (status) {
      case MistakeStatus.PENDING: return 'Đang chờ xử lý';
      case MistakeStatus.APPROVED: return 'Đã duyệt';
      case MistakeStatus.REJECTED: return 'Đã từ chối';
      default: return 'Không xác định';
    }
  }

  openApproveConfirmModal(mistakeId: number): void {
    this.selectedMistakeIdForModal = mistakeId;
    this.isProcessConfirmModalOpen = true;
    this.isRejectConfirmModalOpen = false;
  }

  closeProcessConfirmModal(): void {
    this.isProcessConfirmModalOpen = false;
    this.selectedMistakeIdForModal = null;
  }

  openRejectConfirmModal(mistakeId: number): void {
    this.selectedMistakeIdForModal = mistakeId;
    this.isRejectConfirmModalOpen = true;
    this.isProcessConfirmModalOpen = false;
  }

  closeRejectConfirmModal(): void {
    this.isRejectConfirmModalOpen = false;
    this.selectedMistakeIdForModal = null;
  }

  approveMistake(mistakeId: number): void {
    this.mistakeService.approveMistake(mistakeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success('Khiếu nại đã được duyệt thành công.', 'Thành công!');
          this.afterMistakeHandled();
        },
        error: (error) => {
          console.error('Error approving mistake:', error);
          this.toastr.error(error.error?.message || 'Không thể duyệt khiếu nại.', 'Lỗi');
        }
      });
  }

  rejectMistake(mistakeId: number): void {
    this.mistakeService.rejectMistake(mistakeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.info('Khiếu nại đã được từ chối.', 'Thông báo');
          this.afterMistakeHandled();
        },
        error: (error) => {
          console.error('Error rejecting mistake:', error);
          this.toastr.error(error.error?.message || 'Không thể từ chối khiếu nại.', 'Lỗi');
        }
      });
  }

  private afterMistakeHandled(): void {
    this.closeProcessConfirmModal();
    this.closeRejectConfirmModal();
    this.loadMistakes();
  }

  get totalPages(): number {
    return this.pageSize > 0 ? Math.ceil(this.totalElements / this.pageSize) : 0;
  }

  get paginationPages(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage + 1;
    const delta = 2;
    const range: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) range.push(i);
    } else {
      if (current <= 3 + delta) {
        for (let i = 1; i <= 3 + delta; i++) range.push(i);
        range.push('...');
        range.push(total);
      } else if (current >= total - (2 + delta)) {
        range.push(1);
        range.push('...');
        for (let i = total - (3 + delta) + 1; i <= total; i++) range.push(i);
      } else {
        range.push(1);
        range.push('...');
        for (let i = current - delta; i <= current + delta; i++) range.push(i);
        range.push('...');
        range.push(total);
      }
    }
    return range;
  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadMistakes();
    }
  }

  goToPage(page: number | string): void {
    if (typeof page !== 'number') return;
    if (page < 1 || page > this.totalPages || page === this.currentPage + 1) return;
    this.onPageChange(page - 1);
  }

  goToFirst(): void { this.goToPage(1); }
  goToLast(): void { this.goToPage(this.totalPages); }
  goToPrev(): void { this.onPageChange(this.currentPage - 1); }
  goToNext(): void { this.onPageChange(this.currentPage + 1); }

  viewMistakeDetail(mistakeId: number): void {
    this.router.navigate(['/admin/mistake-detail', mistakeId]);
  }
}