import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  goBack(): void {
    this.router.navigateByUrl('/'); // Hoặc route cụ thể bạn muốn quay lại
  }

  goToReportCreate(): void {
    this.router.navigate(['/report/create']);
  }

  // Phương thức để điều hướng đến trang khiếu nại báo cáo sai
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