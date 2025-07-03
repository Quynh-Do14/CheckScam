// src/app/dtos/create-report-request.dto.ts

// Thêm interface cho các tùy chọn loại tố cáo (để dùng trong UI)
export interface ReportTypeOption {
  id: 1 | 2 | 3;
  name: string;
}

export interface ReportDetailItemDTO {
  type: 1 | 2 | 3; // 1: Phone, 2: Bank Account, 3: URL
  info: string;
  info2?: string; // Tên chủ tài khoản (nếu type là 2)
  info3?: string; // Tên ngân hàng (nếu type là 2)
  description: string;

  // --- THÊM CÁC TRƯỜNG DƯỚI ĐÂY CHỈ DÙNG CHO UI ---
  selectedTypeName?: string; // Tên hiển thị của loại tố cáo (ví dụ: "Số điện thoại")
  isTypeDropdownOpen?: boolean; // Cờ để quản lý trạng thái mở/đóng của dropdown này
  // --- KẾT THÚC CÁC TRƯỜNG UI ---
}

export interface CreateReportRequestDTO {
  emailAuthorReport: string; // Email của người báo cáo
  description: string;       // Mô tả chung về vụ việc
  moneyScam?: number | null;  // Số tiền lừa đảo (chỉ có cho báo cáo gộp, hoặc để null/undefined nếu báo cáo đơn không có)
  categoryId: number;        // ID danh mục báo cáo
  reportDetails: ReportDetailItemDTO[]; // Mảng chi tiết tố cáo (1 phần tử cho báo cáo đơn, nhiều cho báo cáo gộp)
  captchaToken: string;
  pageToReport?: string;     // Trang web cần báo cáo (nếu có, bạn có thể thêm input cho nó)
}