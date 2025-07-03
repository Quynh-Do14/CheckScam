import { Component, OnInit } from '@angular/core';
import { FooterComponent } from "../../footer/footer.component";
import { HeaderComponent } from "../../header/header.component";

@Component({
  selector: 'app-termsofservice',
  templateUrl: './termsofservice.component.html',
  styleUrls: ['./termsofservice.component.scss'],
  imports: [HeaderComponent, FooterComponent]

})
export class TermsofserviceComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    // Logic khởi tạo nếu cần
  }

}