export interface ReportDetailInfoDto {
  id: number;
  createdAt: string;
  type: number; // 1: Số điện thoại, 2: Số tài khoản ngân hàng, 3: URL
  info: string;
  description: string;
  status: number;
}