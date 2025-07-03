import { CommonModule, DatePipe } from '@angular/common'; 
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ReportService } from '../../../services/report.service';
import { ToastrService } from 'ngx-toastr';

export enum ReportProcessingStatus {
  PENDING = 1,  // Đang chờ xử lý
  APPROVED = 2, // Đã duyệt
  REJECTED = 3, // Đã từ chối
}

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './report-management.component.html',
  styleUrls: ['./report-management.component.scss'],
  providers: [DatePipe] 
})
export class ReportMangementComponent implements OnInit, OnDestroy {

  reports: ReportDisplayDto[] = [];
  isLoading: boolean = false;
  totalElements: number = 0;
  currentPage: number = 0;
  pageSize: number = 10;

  selectedStatusFilter: string = '';

  isApproveConfirmModalOpen: boolean = false;
  isRejectConfirmModalOpen: boolean = false;
  selectedReportIdForModal: number | null = null; 

  ReportProcessingStatus = ReportProcessingStatus; 

  private filterTerms = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private reportService: ReportService,
    private toastr: ToastrService,
    private datePipe: DatePipe 
  ) { }

  ngOnInit(): void { 
    this.loadAllReports(); 
    
    this.filterTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(status => {
      this.selectedStatusFilter = status;
      this.currentPage = 0;
      this.loadAllReports();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onStatusFilterChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.filterTerms.next(selectElement.value);
  }

  loadAllReports(page: number = this.currentPage): void {
    this.isLoading = true;
    this.currentPage = page;
    this.reportService.getListReports(this.currentPage, this.pageSize, this.selectedStatusFilter).subscribe({
      next: (res: any) => { 
        const rawReports: any[] = res.content || []; 
        this.reports = rawReports.map((report: any) => {
          const mappedReport: ReportDisplayDto = {
            id: report.id,
            emailAuthorReport: report.emailAuthorReport,
            description: report.description,
            moneyScam: report.moneyScam,
            processingStatus: this.mapBackendStatusToProcessingStatus(report.status), 
            dateReport: report.dateReport, 
            scamTypeIdAfterHandle: report.category ? report.category.id : null 
          };
          return mappedReport;
        });

        this.totalElements = res.totalElements || this.reports.length; 
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi tải danh sách báo cáo:', err);
        this.toastr.error(err.error?.message || err.message || 'Lỗi tải danh sách báo cáo', 'Lỗi');
        this.isLoading = false;
      }
    });
  }
  
  private mapBackendStatusToProcessingStatus(statusFromBackend: number): ReportProcessingStatus {
      switch (statusFromBackend) {
          case 1: return ReportProcessingStatus.PENDING;
          case 2: return ReportProcessingStatus.APPROVED;
          case 3: return ReportProcessingStatus.REJECTED;
          default: return ReportProcessingStatus.PENDING;
      }
  }

  getProcessingStatusText(status: ReportProcessingStatus): string {
    switch (status) {
      case ReportProcessingStatus.PENDING:
        return 'Đang chờ xử lý';
      case ReportProcessingStatus.APPROVED:
        return 'Đã duyệt';
      case ReportProcessingStatus.REJECTED:
        return 'Đã từ chối';
      default:
        return 'Không xác định';
    }
  }

  // --- Modal Logic ---
  openApproveConfirmModal(reportId: number): void {
    this.selectedReportIdForModal = reportId;
    this.isApproveConfirmModalOpen = true;
    this.isRejectConfirmModalOpen = false;
  }

  closeApproveConfirmModal(): void {
    this.isApproveConfirmModalOpen = false;
    this.selectedReportIdForModal = null;
  }

  openRejectConfirmModal(reportId: number): void {
    this.selectedReportIdForModal = reportId;
    this.isRejectConfirmModalOpen = true;
    this.isApproveConfirmModalOpen = false;
  }

  closeRejectConfirmModal(): void {
    this.isRejectConfirmModalOpen = false;
    this.selectedReportIdForModal = null;
  }
  
  approveReportProcessing(reportId: number): void {
    this.reportService.approveReport(reportId).subscribe({ 
      next: (updatedReport) => { 
        this.toastr.success('Duyệt báo cáo thành công', 'Thành công');
        this.closeApproveConfirmModal();
        // Cập nhật trực tiếp trạng thái của báo cáo trong mảng 'reports'
        const index = this.reports.findIndex(r => r.id === reportId);
        if (index !== -1) {
          this.reports[index].processingStatus = ReportProcessingStatus.APPROVED;
        }
      },
      error: (err) => this.toastr.error(err.error?.message || err.message || 'Lỗi duyệt báo cáo', 'Lỗi')
    });
  }

  rejectReportProcessing(reportId: number): void {
    this.reportService.rejectReport(reportId).subscribe({ 
      next: () => { 
        this.toastr.info('Từ chối báo cáo thành công', 'Thành công');
        this.closeRejectConfirmModal();
        // Cập nhật trực tiếp trạng thái của báo cáo trong mảng 'reports'
        const index = this.reports.findIndex(r => r.id === reportId);
        if (index !== -1) {
          this.reports[index].processingStatus = ReportProcessingStatus.REJECTED;
        }
      },
      error: (err) => this.toastr.error(err.error?.message || err.message || 'Lỗi từ chối báo cáo', 'Lỗi')
    });
  }

  // Phương thức afterReportHandled không còn cần thiết nếu cập nhật trực tiếp UI
  // private afterReportHandled(): void {
  //   this.closeApproveConfirmModal();
  //   this.closeRejectConfirmModal();
  //   this.loadAllReports(this.currentPage);
  // }

  // --- Pagination Logic (Không thay đổi) ---
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
      this.loadAllReports();
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
}

interface ReportDisplayDto {
  id: number;
  emailAuthorReport: string;
  description: string;
  moneyScam: number;
  processingStatus: ReportProcessingStatus; 
  dateReport: string; 
  scamTypeIdAfterHandle?: number | null; 
}