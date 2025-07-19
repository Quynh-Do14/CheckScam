import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ForumPostDto } from '../dtos/forum-post.dto';

@Injectable({
  providedIn: 'root'
})
export class ForumServiceMock {
  
  // Mock data for testing
  private mockPosts: ForumPostDto[] = [
    {
      id: '1',
      title: 'Cảnh báo: Lừa đảo qua tin nhắn SMS ngân hàng',
      content: 'Gần đây có nhiều trường hợp lừa đảo qua tin nhắn SMS giả mạo ngân hàng. Các bạn cẩn thận với những tin nhắn yêu cầu cập nhật thông tin tài khoản hoặc nhấn vào link lạ. Luôn kiểm tra số điện thoại gửi và liên hệ trực tiếp với ngân hàng nếu có nghi ngờ.',
      imageUrl: 'https://via.placeholder.com/500x300/FF6B6B/white?text=CẢNH+BÁO+SMS',
      authorId: 'user1',
      authorName: 'Chuyên gia bảo mật',
      authorEmail: 'chuyengia.baomat@example.com',
      createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      updatedAt: new Date(Date.now() - 3600000),
      likesCount: 25,
      commentsCount: 12,
      isLiked: false
    },
    {
      id: '2',
      title: '',
      content: 'Mình vừa nhận được cuộc gọi từ số lạ tự xưng là nhân viên ngân hàng, hỏi thông tin thẻ tín dụng. May mà mình cảnh giác không cung cấp. Mọi người cũng cẩn thận nhé! 🚨',
      authorId: 'user2',
      authorName: 'Người dùng thông thái',
      authorEmail: 'user.thongthái@example.com',
      createdAt: new Date(Date.now() - 7200000), // 2 hours ago
      updatedAt: new Date(Date.now() - 7200000),
      likesCount: 18,
      commentsCount: 8,
      isLiked: true
    },
    {
      id: '3',
      title: 'Kinh nghiệm phát hiện website lừa đảo',
      content: 'Chia sẻ một số kinh nghiệm để nhận biết website lừa đảo:\n\n1. Kiểm tra URL có https và chính tả đúng\n2. Xem thông tin liên hệ của website\n3. Đọc đánh giá từ người dùng khác\n4. Không nhập thông tin cá nhân vào site lạ\n5. Sử dụng phương thức thanh toán an toàn\n\nHy vọng hữu ích cho mọi người!',
      imageUrl: 'https://via.placeholder.com/500x300/4267B2/white?text=WEBSITE+AN+TOÀN',
      authorId: 'user3',
      authorName: 'Chuyên viên IT',
      authorEmail: 'chuyenvien.it@example.com',
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      updatedAt: new Date(Date.now() - 86400000),
      likesCount: 42,
      commentsCount: 15,
      isLiked: false
    },
    {
      id: '4',
      title: '',
      content: 'Có ai biết cách kiểm tra một số điện thoại có phải lừa đảo không? Mình hay nhận được cuộc gọi từ những số lạ.',
      authorId: 'user4',
      authorName: 'Người mới',
      authorEmail: 'nguoi.moi@example.com',
      createdAt: new Date(Date.now() - 172800000), // 2 days ago
      updatedAt: new Date(Date.now() - 172800000),
      likesCount: 8,
      commentsCount: 22,
      isLiked: false
    },
    {
      id: '5',
      title: 'Cảnh báo: Chiêu trò lừa đảo mới qua mạng xã hội',
      content: 'Cảnh báo tất cả mọi người về chiêu trò lừa đảo mới:\n\nHacker tạo tài khoản giả mạo người thân, bạn bè và nhắn tin vay tiền khẩn cấp. Họ sử dụng thông tin cá nhân từ mạng xã hội để tăng độ tin cậy.\n\nCách phòng tránh:\n- Gọi điện xác nhận trước khi chuyển tiền\n- Kiểm tra tài khoản có dấu hiệu bất thường\n- Không chuyển tiền qua link lạ',
      imageUrl: 'https://via.placeholder.com/500x300/FF9800/white?text=CẢNH+BÁO+MXH',
      authorId: 'user5',
      authorName: 'Admin bảo mật',
      authorEmail: 'admin.baomat@example.com',
      createdAt: new Date(Date.now() - 259200000), // 3 days ago
      updatedAt: new Date(Date.now() - 259200000),
      likesCount: 67,
      commentsCount: 28,
      isLiked: true
    }
  ];

  getPosts(page: number = 1, limit: number = 10): Observable<{data: ForumPostDto[], total: number, page: number, limit: number}> {
    // Simulate API response
    return of({
      data: this.mockPosts,
      total: this.mockPosts.length,
      page: page,
      limit: limit
    });
  }

  getPostById(id: string): Observable<ForumPostDto> {
    const post = this.mockPosts.find(p => p.id === id);
    return of(post || this.mockPosts[0]);
  }

  likePost(postId: string): Observable<void> {
    return of(void 0);
  }

  unlikePost(postId: string): Observable<void> {
    return of(void 0);
  }
}
