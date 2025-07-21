import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser'; // Import Title service
import { HeaderComponent } from "../header/header.component";
import { FooterComponent } from "../footer/footer.component";
import { ChatBoxComponent } from "../chat-box/chat-box.component";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
  imports: [CommonModule, HeaderComponent, FooterComponent, FormsModule, ChatBoxComponent],
})
export class ReportComponent implements OnInit {
  showChatbox = false;
  constructor(private router: Router, private titleService: Title) { } // Inject Title service

  ngOnInit(): void {
    this.titleService.setTitle('Báo Cáo AI6 - Săn Người Xấu, Diệt Kẻ Gian | Phân Tích Lừa Đảo'); // Đặt tiêu đề cho tab trình duyệt
  }

  goBack(): void {
    this.router.navigateByUrl('/'); 
  }

  goToReportCreate(): void {
    this.router.navigate(['/report/create']);
  }

  goToReportMistake(): void {
    this.router.navigate(['/report/mistake']);
  }

  openReportForm(): void {
    alert('Bạn đã click nút "Báo cáo lừa đảo". Logic chuyển đến form báo cáo sẽ được triển khai tại đây.');
  }

  openComplaintForm(): void {
    alert('Bạn đã click nút "Khiếu nại đánh giá sai". Logic chuyển đến form khiếu nại sẽ được triển khai tại đây.');
  }

  onAiTuVanClicked(): void {
    debugger
    this.showChatbox = true;
  }

  closeChatbox(): void {
    this.showChatbox = false;
  }
}