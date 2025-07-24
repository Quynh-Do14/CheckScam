import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

import { FooterComponent } from "../../footer/footer.component";
import { HeaderComponent } from "../../header/header.component";


@Component({
  selector: 'app-community',
  templateUrl: './community.component.html', 
  styleUrls: ['./community.component.scss'], 
  imports: [FooterComponent, HeaderComponent] 
})
export class CommunityComponent implements OnInit {

  constructor(private titleService: Title, private metaService: Meta) { } 

  ngOnInit(): void {
    // Cập nhật tiêu đề trang
    this.titleService.setTitle('Chính Sách Nội Dung & Quy Tắc Cộng Đồng - AI6.VN');

    // Cập nhật thẻ meta description
    this.metaService.updateTag({
      name: 'description',
      content: 'Tìm hiểu Chính sách Nội dung và Quy tắc Cộng đồng của AI6.VN. Quy định về việc đóng góp, tố cáo lừa đảo, và các nội dung được phép/bị cấm để xây dựng môi trường an toàn, minh bạch.'
    });

    // Cập nhật thẻ meta keywords (tùy chọn)
    this.metaService.updateTag({
      name: 'keywords',
      content: 'chính sách nội dung, quy tắc cộng đồng, AI6.VN, tố cáo lừa đảo, an toàn mạng, thông tin lừa đảo, quy định đóng góp'
    });

    // Cuộn lên đầu trang khi component được khởi tạo
    window.scrollTo(0, 0);
  }

}