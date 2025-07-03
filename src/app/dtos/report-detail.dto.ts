import { ReportDetailInfoDto } from './report-detai-info.dto';
import { AttachmentDto } from './attachment.dto';
import { CategoryDto } from './category.dto';

export interface ReportDetailDto {
  id: number;
  description: string;
  emailAuthorReport: string;
  status: number; // Đây là trường 'status' gốc từ backend
  dateReport: string;
  moneyScam: number;
  processingStatus: number; // Đây là trường 'processingStatus' sau khi backend xử lý
  reportDetails: ReportDetailInfoDto[]; // Mảng các chi tiết báo cáo
  attachments: AttachmentDto[]; // Mảng các ảnh đính kèm
  category?: CategoryDto; // Có thể có hoặc không
}