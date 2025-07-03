// src/app/dtos/user.dto.ts

export class UserDTO {
    name: string;
    email: string;
    password?: string;
    roleName?: string; // Thêm trường này

    constructor(data: any) {
      this.name = data.name;
      this.email = data.email;
      this.password = data.password;
      this.roleName = data.roleName; // Gán roleName từ data
    }
}