import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { FooterComponent } from "../../footer/footer.component";
import { HeaderComponent } from "../../header/header.component";

@Component({
  selector: 'app-termsofservice',
  templateUrl: './termsofservice.component.html',
  styleUrls: ['./termsofservice.component.scss'],
  imports: [HeaderComponent, FooterComponent]

})
export class TermsofserviceComponent implements OnInit {

  constructor(private titleService: Title, private metaService: Meta) { }

  ngOnInit(): void {
    this.titleService.setTitle('Thỏa Thuận Sử Dụng Dịch Vụ'); 
  }

}