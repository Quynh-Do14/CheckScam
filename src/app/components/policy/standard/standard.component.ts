import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from "../../header/header.component";
import { FooterComponent } from "../../footer/footer.component";

@Component({
  selector: 'app-standard',
  templateUrl: './standard.component.html',
  styleUrls: ['./standard.component.scss'],
  imports: [HeaderComponent, FooterComponent]
})
export class StandardComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    // Logic khởi tạo nếu cần
  }

}