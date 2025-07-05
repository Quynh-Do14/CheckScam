import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from '../../footer/footer.component';
import { environment } from '../../../environments/environment';

interface Profile {
  id: number;
  createdAt: string;
  nameInfo: string;
  info: string;
}

interface Role {
  id: number;
  createdAt: string;
  name: string;
}

interface AgentDetail {
  id: number;
  createdAt: string;
  name: string;
  email: string;
  avatar: string | null;
  description?: string;
  profiles: Profile[];
  roles: Role[];
}

interface ApiResponse {
  code: number;
  message: string | null;
  data: AgentDetail;
  total: number;
}

@Component({
  selector: 'app-agent-detail',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './agent-detail.component.html',
  styleUrls: ['./agent-detail.component.scss']
})
export class AgentDetailComponent implements OnInit {
  agent: AgentDetail | null = null;
  isLoading: boolean = true;
  error: string | null = null;
  agentId: number | null = null;

  private readonly BASE_URL = `${environment.apiUrl}`;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.agentId = +params['id'];
      if (this.agentId) {
        this.loadAgentDetail();
      } else {
        this.error = 'ID giao dịch viên không hợp lệ';
        this.isLoading = false;
      }
    });
  }

  loadAgentDetail(): void {
    if (!this.agentId) return;

    this.isLoading = true;
    this.error = null;

    const apiUrl = `${this.BASE_URL}/api/v1/users/${this.agentId}`;

    this.http.get<ApiResponse>(apiUrl).subscribe({
      next: (response) => {
        if (response.code === 200 && response.data) {
          this.agent = {
            ...response.data,
            avatar: response.data.avatar ? `${this.BASE_URL}/${response.data.avatar}` : this.getDefaultAvatar(response.data.name)
          };
        } else {
          this.error = response.message || 'Không thể tải thông tin giao dịch viên';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading agent detail:', error);
        this.error = 'Không thể tải thông tin giao dịch viên. Vui lòng thử lại sau.';
        this.isLoading = false;
      }
    });
  }

  private getDefaultAvatar(name: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=FF6B35&color=fff&bold=true`;
  }

  // Public method for template use
  getDefaultAvatarForTemplate(name: string): string {
    return this.getDefaultAvatar(name);
  }

  // Handle image error
  onImageError(event: Event, agentName: string): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = this.getDefaultAvatar(agentName);
    }
  }

  goBack(): void {
    this.router.navigate(['/transactions']);
  }

  retryLoad(): void {
    this.loadAgentDetail();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRoleDisplayName(roleName: string): string {
    switch (roleName) {
      case 'ADMIN': return 'Quản trị viên';
      case 'COLLAB': return 'Cộng tác viên';
      default: return roleName;
    }
  }

  getRoleBadgeClass(roleName: string): string {
    switch (roleName) {
      case 'ADMIN': return 'role-admin';
      case 'COLLAB': return 'role-collab';
      default: return 'role-default';
    }
  }

  onContactClick(profile: Profile): void {
    console.log('Contact via:', profile);
    // Here you can implement the contact functionality
    // For example, open external links or show contact modal
    if (profile.nameInfo.toLowerCase().includes('facebook')) {
      // Handle Facebook contact
      window.open(profile.info, '_blank');
    } else if (profile.nameInfo.toLowerCase().includes('zalo')) {
      // Handle Zalo contact
      window.open(profile.info, '_blank');
    }
  }

  getProfileIcon(nameInfo: string): string {
    const name = nameInfo.toLowerCase();
    if (name.includes('facebook')) return 'fab fa-facebook';
    if (name.includes('zalo')) return 'fas fa-comment';
    if (name.includes('phone') || name.includes('điện thoại')) return 'fas fa-phone';
    if (name.includes('email')) return 'fas fa-envelope';
    if (name.includes('telegram')) return 'fab fa-telegram';
    if (name.includes('whatsapp')) return 'fab fa-whatsapp';
    return 'fas fa-link';
  }
}
