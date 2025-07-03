// src/app/dtos/report.dto.ts

export interface ReportDTO {
  info: string;
  pageToReport?: string; // Optional, only if you add this field to the single report form
  emailAuthorReport: string;
  type: 1 | 2 | 3; // 1: Phone, 2: Bank Account, 3: URL
  description: string;
  captchaToken: string;
  info2?: string; // Tên chủ tài khoản (nếu type là 2)
  info3?: string; // Tên ngân hàng (nếu type là 2)
  categoryId: number;
}