// src/app/dtos/group-report-request.dto.ts

export interface ReportDetailItemDTO {
  type: 1 | 2 | 3; // 1: Phone, 2: Bank Account, 3: URL
  info: string;
  info2?: string; // Tên chủ tài khoản (nếu type là 2)
  info3?: string; // Tên ngân hàng (nếu type là 2)
  description: string;
}

export interface GroupReportRequestDTO {
  description: string;
  emailAuthorReport: string;
  scamAmount: number | null; // API đang nhận là string, bạn có thể gửi number và server tự convert
  captchaToken: string;
  reportDetails: ReportDetailItemDTO[];
  categoryId: number;
}