// src/app/dtos/profile.dto.ts

export class UpdateUserDTO {
    name?: string;
    email?: string;
    avatar?: File;
    description?: string;
    password?: string;
  
    constructor(data: any) {
      this.name = data.name;
      this.email = data.email;
      this.avatar = data.avatar;
      this.description = data.description;
      this.password = data.password;
    }
}

export class UpdateProfileDTO {
    nameInfo?: string;
    info?: string;
  
    constructor(data: any) {
      this.nameInfo = data.nameInfo;
      this.info = data.info;
    }
}

export class ProfileResponseDTO {
    id: number;
    nameInfo: string;
    info: string;
    created: string; // Đổi từ createdAt sang created nếu backend dùng tên này
  
    constructor(data: any) {
      this.id = data.id;
      this.nameInfo = data.nameInfo;
      this.info = data.info;
      this.created = data.created; // Đổi từ createdAt sang created
    }
}

export class UserProfileDTO {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    description?: string;
    role: string[];
    profiles?: ProfileResponseDTO[];
  
    constructor(data: any) {
      this.id = data.id;
      this.name = data.name;
      this.email = data.email;
      this.avatar = data.avatar;
      this.description = data.description;
      // SỬA LỖI Ở ĐÂY: Đảm bảo role luôn là một mảng string.
      // Nếu data.role không tồn tại hoặc không phải mảng, gán mảng rỗng.
      this.role = Array.isArray(data.role) ? data.role : []; 
      this.profiles = data.profiles ? data.profiles.map((p: any) => new ProfileResponseDTO(p)) : [];
    }
}