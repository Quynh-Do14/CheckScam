import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { FooterComponent } from "../../footer/footer.component";
import { HeaderComponent } from "../../header/header.component";


@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss'],
  imports: [FooterComponent, HeaderComponent]
})
export class PrivacyComponent implements OnInit {

  constructor(private titleService: Title, private metaService: Meta) { } // Inject services

  ngOnInit(): void {
    // Cập nhật tiêu đề trang
    this.titleService.setTitle('Chính sách về Quyền riêng tư');

    // Cập nhật thẻ meta description
    this.metaService.updateTag({
      name: 'description',
      content: 'Tìm hiểu về chính sách quyền riêng tư của AI6, cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn.'
    });

    // Cập nhật thẻ meta keywords (tùy chọn)
    this.metaService.updateTag({
      name: 'keywords',
      content: 'chính sách quyền riêng tư, AI6, bảo mật thông tin, dữ liệu cá nhân, báo cáo lừa đảo'
    });
  }

}