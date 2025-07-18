import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; // Import RouterModule

@Component({
  selector: 'app-access-denied',
  standalone: true, // Thêm standalone: true nếu bạn đang dùng Angular 17+
  imports: [RouterModule], // Import RouterModule ở đây
  templateUrl: './access-denied.component.html',
  styleUrl: './access-denied.component.scss'
})
export class AccessDeniedComponent {

}