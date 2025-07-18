import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from "../../header/header.component";
import { FooterComponent } from "../../footer/footer.component";
import { Title } from '@angular/platform-browser'; 

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
  imports: [HeaderComponent, FooterComponent]
})
export class PaymentComponent implements OnInit {

  constructor(private titleService: Title) { 
    
   }

  ngOnInit(): void {
    this.titleService.setTitle('Chính Sách Thanh Toán'); 
  }

}