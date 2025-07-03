import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from "../../header/header.component";
import { FooterComponent } from "../../footer/footer.component";

@Component({
  selector: 'app-refund',
  templateUrl: './refund.component.html',
  styleUrls: ['./refund.component.scss'],
  imports: [HeaderComponent, FooterComponent]
})
export class RefundComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    // Logic khởi tạo nếu cần
  }

}