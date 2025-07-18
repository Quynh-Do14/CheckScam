import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser'; // Import Title service here
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { HttpClient } from '@angular/common/http';
import { ChatBoxComponent } from '../chat-box/chat-box.component';
import { environment } from '../../environments/environment';

interface TransactionAgent {
  id: number;
  name: string;
  avatar: string | null;
  email: string;
  description?: string;
  profiles?: Profile[];
}

interface Profile {
  id: number;
  nameInfo: string;
  info: string;
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent, ChatBoxComponent],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit {
  searchQuery: string = '';
  filteredAgents: TransactionAgent[] = [];
  allAgents: TransactionAgent[] = [];
  isLoading: boolean = false;
  error: string | null = null;
  showChatbox = false;

  private readonly BASE_URL = `${environment.apiUrl}`;
  private readonly API_URL = `${this.BASE_URL}/api/v1/users/collaborators`; 

  constructor(private http: HttpClient, private router: Router, private titleService: Title) { } 

  ngOnInit(): void {
    this.titleService.setTitle('Giao dịch viên'); 
    this.loadAgents();
  }

  loadAgents(): void {
    this.isLoading = true;
    this.error = null;

    this.http.get<TransactionAgent[]>(this.API_URL).subscribe({
      next: (data) => {
        this.allAgents = data.map(agent => ({
          ...agent,
          avatar: agent.avatar ? `${this.BASE_URL}/${agent.avatar}` : this.getDefaultAvatar(agent.name)
        }));
        this.filteredAgents = [...this.allAgents];
        this.isLoading = false;
      },
      error: (error) => {
      console.error('❌ Error loading agents:', error);
      this.error = 'Không thể tải danh sách giao dịch viên từ server. Vui lòng kiểm tra kết nối và thử lại.';
      this.isLoading = false;
      this.allAgents = [];
        this.filteredAgents = [];
        }
    });
  }

  private getDefaultAvatar(name: string): string {
    const initials = name.split(' ').map(word => word.charAt(0)).join('').slice(0, 2);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=150&background=FF6B35&color=fff&bold=true`;
  }

  onImageError(event: Event, agentName: string): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = this.getDefaultAvatar(agentName);
    }
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredAgents = [...this.allAgents];
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.filteredAgents = this.allAgents.filter(agent =>
      agent.name.toLowerCase().includes(query) ||
      agent.email.toLowerCase().includes(query)
    );
  }

  onAgentClick(agent: TransactionAgent): void {
    console.log('Selected agent:', agent);
    this.router.navigate(['/transactions/agent', agent.id]);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredAgents = [...this.allAgents];
  }

  trackByAgentId(index: number, agent: TransactionAgent): number {
    return agent.id;
  }

  retryLoad(): void {
    this.loadAgents();
  }

  onAiTuVanClicked(): void {
    debugger
    this.showChatbox = true;
  }

  closeChatbox(): void {
    debugger
    this.showChatbox = false;
  }
}