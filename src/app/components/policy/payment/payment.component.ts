import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from "../../header/header.component";
import { FooterComponent } from "../../footer/footer.component";

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
  imports: [HeaderComponent, FooterComponent]
})
export class PaymentComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    // Logic khởi tạo nếu cần
  }

}