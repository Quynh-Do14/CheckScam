// Test component for forum
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forum-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="forum-test">
      <h1>Forum Test Component</h1>
      <p>Nếu bạn thấy thông báo này, forum đã hoạt động!</p>
    </div>
  `,
  styles: [`
    .forum-test {
      padding: 20px;
      text-align: center;
      background: #f8f9fa;
      border-radius: 8px;
      margin: 20px;
    }
  `]
})
export class ForumTestComponent {
  
}
