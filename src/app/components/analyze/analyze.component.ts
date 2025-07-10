import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { FormsModule } from '@angular/forms';

import { CheckScamService } from '../../services/check-scam.service';
import { CheckScamRequestDTO } from '../../dtos/check-scam-request.dto';
import { ChatBoxComponent } from "../chat-box/chat-box.component";
import { environment } from '../../environments/environment';


interface AnalysisResult {
  info: string;
  type: number;
  description: string;
  reportDescription: string;
  moneyScam: string;
  dateReport: string | null;
  verifiedCount: number;
  lastReportAt: string;
  evidenceUrls?: string[]; 
  evidenceURLs?: string[]; 
  analysis: string;
  categorization?: string;
  trustScore?: number;
  dataBreach?: string;
  phishingList?: string;
  apwgCategory?: string;
  screenshotCaption?: string;
  screenshot?: string; 
  screenShot?: string;
  externalUrlCheckResponses?: ExternalCheckResponse[]; 
}

interface ExternalCheckResponse {
  provider: string;
  malicious: boolean;
}

@Component({
  selector: 'app-analyze',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    RouterModule,
    FormsModule,
    ChatBoxComponent
],
  templateUrl: './analyze.component.html',
  styleUrls: ['./analyze.component.scss']
})
export class AnalyzeComponent implements OnInit, OnDestroy {
  analysisResult: AnalysisResult | null = null;
  inputType: number | undefined;
  inputInfo: string | undefined;
  selectedType: number = 1;

  currentSearchType: number = 1;
  currentSearchInfo: string = '';
  isLoading: boolean = false;
  isInitialLoading: boolean = false; 
  isSearching: boolean = false;       
  errorMessage: string | null = null;
  imageLoaded: boolean = false;
  showAllImagesFlag: boolean = false; 
  maxDisplayImages: number = 4;        
  currentImageIndex: number = 0;       
  autoPlayInterval: any = null;        
  isAutoPlayEnabled: boolean = false; 

  riskLevelDescription: string = 'Vui lòng nhập thông tin để phân tích.';
  detailedAnalysis: string = 'Chưa có thông tin để hiển thị phân tích chi tiết.';
  recommendations: string = 'Chưa có khuyến nghị.';

    showChatbox = false;


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private CheckScamService: CheckScamService
  ) {
    this.route.queryParams.subscribe(params => {
      const info = params['info'];
      const type = params['type'];

      if (info && type && info !== 'Không xác định' && info.trim() !== '') {
        this.inputInfo = info;
        this.inputType = parseInt(type, 10);
        this.currentSearchInfo = this.inputInfo || '';
        this.currentSearchType = this.inputType;
        this.selectedType = this.inputType;

        this.analysisResult = null;
        this.isInitialLoading = true; 
        this.riskLevelDescription = 'Vui lòng chờ trong khi phân tích...';
        this.detailedAnalysis = 'Vui lòng chờ trong khi phân tích...';
        this.recommendations = 'Vui lòng chờ trong khi phân tích...';

        const requestDto = new CheckScamRequestDTO({ info: this.inputInfo, type: this.inputType });

        this.CheckScamService.CheckScam(requestDto).subscribe({
          next: (data: any) => {

          const normalizedData: AnalysisResult = {
            ...data,
            evidenceUrls: data.evidenceURLs || data.evidenceUrls || [],
            screenshot: data.screenshot || data.screenShot 
          };

          this.analysisResult = normalizedData;
          this.isInitialLoading = false; 
          this.currentImageIndex = 0;    

          if (this.analysisResult && this.analysisResult.analysis) {
            this.parseAnalysisString(this.analysisResult.analysis);
          } else {
            this.riskLevelDescription = 'Không có dữ liệu phân tích.';
            this.detailedAnalysis = 'Không có thông tin phân tích chi tiết.';
            this.recommendations = 'Không có khuyến nghị.';
          }
        },
          error: (err) => {
            this.isInitialLoading = false; 
            this.riskLevelDescription = 'Lỗi tải dữ liệu.';
            this.detailedAnalysis = 'Không thể tải thông tin phân tích chi tiết.';
            this.recommendations = 'Không thể tải khuyến nghị.';
          }
        });
      } else {
        this.clearData();
      }
    });
  }

  ngOnInit(): void {
    const stateData = history.state;

    if (stateData && stateData.result) {
      this.analysisResult = stateData.result;
      this.inputInfo = stateData.info;
      this.inputType = stateData.type;

      this.currentSearchInfo = this.inputInfo || '';
      this.currentSearchType = this.inputType || 1;
      this.selectedType = this.inputType || 1;

      if (this.analysisResult && this.analysisResult.analysis) {
        this.parseAnalysisString(this.analysisResult.analysis);
      }
    }

    setTimeout(() => {
      const currentParams = this.route.snapshot.queryParams;
      const info = currentParams['info'];
      const type = currentParams['type'];

      if ((info || type) && (info === 'Không xác định' || !info || info.trim() === '')) {
        this.clearAndNavigate();
      }
    }, 100);

    document.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
    this.stopAutoPlay();
  }

  clearAndNavigate(): void {
    this.router.navigate(['/analyze'], { replaceUrl: true });
    this.clearData();
  }

  private clearData(): void {
    this.inputInfo = undefined;
    this.inputType = undefined;
    this.analysisResult = null;
    this.currentSearchInfo = '';
    this.currentSearchType = 1;
    this.selectedType = 1;
    this.currentImageIndex = 0; 
    this.stopAutoPlay();        
    this.riskLevelDescription = 'Vui lòng nhập thông tin để phân tích.';
    this.detailedAnalysis = 'Chưa có thông tin để hiển thị phân tích chi tiết.';
    this.recommendations = 'Chưa có khuyến nghị.';
  }

  selectSearchType(type: number): void {
    this.currentSearchType = type;
    this.currentSearchInfo = '';
    this.errorMessage = null;
  }

  getSearchPlaceholder(): string {
    switch (this.currentSearchType) {
      case 1:
        return 'Ví dụ: 0123456789';
      case 2:
        return 'Ví dụ: 1234567890';
      case 3:
        return 'Ví dụ: https://example.com';
      default:
        return 'Nhập thông tin cần kiểm tra...';
    }
  }

  analyzeNewInput(): void {
    const value = this.currentSearchInfo.trim();
    if (!value) {
      this.errorMessage = 'Vui lòng nhập thông tin cần tra cứu.';
      return;
    }

    this.errorMessage = null;
    this.isSearching = true;  

    if (this.currentSearchType === 1 && !this.isPhoneNumber(value)) {
      this.errorMessage = 'Số điện thoại phải bắt đầu bằng 0 và gồm 10 chữ số.';
      this.isSearching = false;
      return;
    }
    if (this.currentSearchType === 2 && !this.isBankNumber(value)) {
      this.errorMessage = 'Số tài khoản chỉ được chứa ký tự số.';
      this.isSearching = false;
      return;
    }
    if (this.currentSearchType === 3 && !this.isUrl(value)) {
      this.errorMessage = 'URL không hợp lệ (ví dụ hợp lệ: https://example.com hoặc example.vn).';
      this.isSearching = false;
      return;
    }

    this.router.navigate(['/analyze'], {
      queryParams: { info: value, type: this.currentSearchType }
    }).then(() => {
      this.isSearching = false; 
    });
  }

  private isPhoneNumber(value: string): boolean {
    return /^0\d{9}$/.test(value.trim());
  }

  private isBankNumber(value: string): boolean {
    return /^\d+$/.test(value.trim());
  }

  private isUrl(value: string): boolean {
  const urlRegex = /^(https?:\/\/)?((([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9]))(\.[A-Za-z]{2,63})(\/([a-zA-Z0-9\-._~:/?#\[\]@!$&'()*+,;=])*)*\/?$/i;
  return urlRegex.test(value.trim());
}

  getSearchInputTypeIcon(): string {
    switch (this.currentSearchType) {
      case 1: return 'fas fa-mobile-alt';
      case 2: return 'fas fa-university';
      case 3: return 'fas fa-globe';
      default: return 'fas fa-question-circle';
    }
  }

  private parseAnalysisString(analysisText: string): void {
    const normalizedText = analysisText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();

    const hasNumberedSections = /^\d+\./m.test(normalizedText);
    const isUrlAnalysis = this.analysisResult?.type === 3;

    if (isUrlAnalysis && !hasNumberedSections) {
      this.parseUrlAnalysisFormat(normalizedText);
    } else {
      this.parsePhoneAccountFormat(normalizedText);
    }
  }

  private parsePhoneAccountFormat(text: string): void {
    this.extractRiskLevel(text);
    this.extractDetailedAnalysis(text);
    this.extractRecommendations(text);
  }

  private parseUrlAnalysisFormat(text: string): void {
    this.extractUrlRiskLevel(text);
    this.extractUrlDetailedAnalysis(text);
    this.extractUrlRecommendations(text);
  }

  private extractRiskLevel(text: string): void {
    const riskPatterns = [
      /\*\*Mức độ nguy hiểm:\*\*\s*([^.\n]+)/i,
      /Mức độ nguy hiểm:\s*([^.\n]+)/i,
      /nguy hiểm:\s*(cao|trung bình|thấp|an toàn|không nguy hiểm)/i,
      /mức độ:\s*(cao|trung bình|thấp|an toàn|không nguy hiểm)/i,
      /(cao|trung bình|thấp|an toàn|không nguy hiểm)\s*nguy hiểm/i
    ];

    for (const pattern of riskPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        this.riskLevelDescription = `**Mức độ nguy hiểm:** ${match[1].trim()}.`;
        return;
      }
    }

    this.riskLevelDescription = "**Mức độ nguy hiểm:** Không xác định.";
  }

  private extractDetailedAnalysis(text: string): void {
    let detailedContent = '';

    const analysisSectionMatch = text.match(/(2\.\s*Phân tích chi tiết:[\s\S]*?)(?=3\.|4\.|5\.|$)/i);
    if (analysisSectionMatch && analysisSectionMatch[1]) {
      const analysisSection = analysisSectionMatch[1];

      const howToScamMatch = analysisSection.match(/(- \*\*Cách thức lừa đảo được thực hiện:\*\*[\s\S]*?)(?=- \*\*Các dấu hiệu nhận biết:\*\*|3\.|4\.|5\.|$)/i);
      if (howToScamMatch && howToScamMatch[1]) {
        let content = howToScamMatch[1].replace(/- \*\*Cách thức lừa đảo được thực hiện:\*\*/i, '').trim();
        detailedContent += '<h4><i class="fas fa-hammer"></i> Cách thức lừa đảo được thực hiện:</h4>';
        detailedContent += this.parseBulletPointsToHtml(content);
      }

      const signsMatch = analysisSection.match(/(- \*\*Các dấu hiệu nhận biết:\*\*[\s\S]*?)(?=- \*\*Các dấu hiệu nhận biết:\*\*|3\.|4\.|5\.|$)/i); 
      if (signsMatch && signsMatch[1]) {
        let content = signsMatch[1].replace(/- \*\*Các dấu hiệu nhận biết:\*\*/i, '').trim();
        if (detailedContent) detailedContent += '<br>';
        detailedContent += '<h4><i class="fas fa-exclamation-circle"></i> Các dấu hiệu nhận biết:</h4>';
        detailedContent += this.parseBulletPointsToHtml(content);
      }
    }

    if (detailedContent.trim() === '') {
      this.detailedAnalysis = "2. Phân tích chi tiết: Không có thông tin phân tích chi tiết.";
    } else {
      this.detailedAnalysis = detailedContent;
    }
  }

  private parseBulletPointsToHtml(text: string): string {
    let html = '<ul>';
    const lines = text.split('\n');
    let hasValidBullet = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('-')) {
        let content = trimmedLine.substring(1).trim();
        content = this.formatMarkdownToHtml(content); 
        if (content) {
          html += `<li>${content}</li>`;
          hasValidBullet = true;
        }
      } else if (trimmedLine) {
        if (!trimmedLine.toLowerCase().includes('cách thức lừa đảo') && !trimmedLine.toLowerCase().includes('dấu hiệu nhận biết')) {
          let content = this.formatMarkdownToHtml(trimmedLine);
          if (content) {
            html += `<li>${content}</li>`;
            hasValidBullet = true;
          }
        }
      }
    }
    html += '</ul>';

    if (!hasValidBullet && html === '<ul></ul>') {
      return '';
    }
    return html;
  }

  private formatMarkdownToHtml(text: string): string {
    let formatted = text;
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
  }

  private extractRecommendations(text: string): void {
    const recommendationPatterns = [
      /(5\.\s*Khuyến nghị:[\s\S]*?)(?=\n\n|\n[0-9]+\.|\n[A-Z][^:]*:|$)/i,
      /(Khuyến nghị:[\s\S]*?)(?=\n\n|\n[0-9]+\.|\n[A-Z][^:]*:|$)/i,
      /(Lời khuyến.*?:[\s\S]*?)(?=\n\n|\n[0-9]+\.|\n[A-Z][^:]*:|$)/i,
      /(Cách phòng.*?:[\s\S]*?)(?=\n\n|\n[0-9]+\.|\n[A-Z][^:]*:|$)/i,
      /(Biện pháp.*?:[\s\S]*?)(?=\n\n|\n[0-9]+\.|\n[A-Z][^:]*:|$)/i,
      /(5\.\s*Khuyến nghị:[\s\S]*)/i,
      /(- \*\*Lời khuyến.*?:[\s\S]*)/i
    ];

    for (let i = 0; i < recommendationPatterns.length; i++) {
      const pattern = recommendationPatterns[i];
      const match = text.match(pattern);

      if (match && match[1] && match[1].trim().length > 10) {
        let extractedText = match[1].trim();

        extractedText = this.extractCompleteSentences(extractedText);

        if (extractedText.length > 20) {
          if (!extractedText.startsWith('5.')) {
            this.recommendations = `5. Khuyến nghị:\n${extractedText}`;
          } else {
            this.recommendations = extractedText;
          }
          return;
        }
      }
    }

    const sectionFiveMatch = text.match(/(5\.\s*Khuyến nghị:[\s\S]*)/i);
    if (sectionFiveMatch && sectionFiveMatch[1]) {
      let sectionContent = sectionFiveMatch[1].trim();

      const bulletPointsInSection = sectionContent.split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => this.cleanBulletPoint(line))
        .filter(line => line.length > 10);

      if (bulletPointsInSection.length > 0) {
        this.recommendations = `5. Khuyến nghị:\n${bulletPointsInSection.join('\n')}`;
        return;
      }

      const cleanedSection = this.extractCompleteSentences(sectionContent);
      if (cleanedSection.length > 30) {
        this.recommendations = cleanedSection;
        return;
      }
    }

    const bulletPoints = text.split('\n')
      .filter(line => line.trim().startsWith('-'))
      .filter(line => {
        const lowerLine = line.toLowerCase();
        return lowerLine.includes('nên') ||
               lowerLine.includes('tránh') ||
               lowerLine.includes('cảnh giác') ||
               lowerLine.includes('khuyến') ||
               lowerLine.includes('bảo vệ') ||
               lowerLine.includes('kiểm tra');
      })
      .map(line => this.cleanBulletPoint(line));

    if (bulletPoints.length > 0) {
      this.recommendations = `5. Khuyến nghị:\n${bulletPoints.join('\n')}`;
    }
  }

  private extractUrlRiskLevel(text: string): void {
    const urlRiskPatterns = [
      /\*\*Đánh giá rủi ro:\*\*\s*([^.\n]+)/i,
      /Đánh giá rủi ro:\s*([^.\n]+)/i,
      /\*\s*\*\*Đánh giá rủi ro:\*\*\s*([^.\n]+)/i,
      /rủi ro:\s*([Tt]hấp|[Tt]rung bình|[Cc]ao)/i,
      /([Tt]hấp|[Tt]rung bình|[Cc]ao)\s*\./i
    ];

    for (const pattern of urlRiskPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let riskValue = match[1].trim();
        if (riskValue.endsWith('.')) {
          riskValue = riskValue.slice(0, -1);
        }
        this.riskLevelDescription = `**Mức độ nguy hiểm:** ${riskValue}.`;
        return;
      }
    }
  }

  private extractUrlDetailedAnalysis(text: string): void {
    let detailedContentHtml = '';
    let hasExtractedContent = false;

    const functionAndTypeSection = {
      header: '2. Nhận định về chức năng và loại hình website:',
      pattern: /(\*\*2\. Nhận định về chức năng và loại hình website:[\s\S]*?)(?=\*\*3\.|\*\*4\.|$)/i,
      icon: 'fas fa-cogs'
    };
    const functionMatch = text.match(functionAndTypeSection.pattern);
    if (functionMatch && functionMatch[1]) {
      let content = functionMatch[1].trim();
      content = content.replace(new RegExp(`\\*\\*${functionAndTypeSection.header.replace(/\./g, '\\.').replace(/\(/g, '\\(').replace(/\)/g, '\\)')}\\*\\*`, 'i'), '').trim();
      content = content.replace(new RegExp(`${functionAndTypeSection.header.replace(/\./g, '\\.').replace(/\(/g, '\\(').replace(/\)/g, '\\)')}`, 'i'), '').trim();
      if (content.length > 0) {
        detailedContentHtml += `<h4><i class="${functionAndTypeSection.icon}"></i> ${functionAndTypeSection.header}</h4>`;
        detailedContentHtml += this.parseUrlSectionContent(content); 
        hasExtractedContent = true;
      }
    }

    const suspiciousSignsSection = {
      header: '3. Phát hiện dấu hiệu nghi vấn:',
      pattern: /(\*\*3\. Phát hiện dấu hiệu nghi vấn:[\s\S]*?)(?=\*\*4\.|$)/i,
      icon: 'fas fa-eye'
    };
    const suspiciousMatch = text.match(suspiciousSignsSection.pattern);
    if (suspiciousMatch && suspiciousMatch[1]) {
      let content = suspiciousMatch[1].trim();
      content = content.replace(new RegExp(`\\*\\*${suspiciousSignsSection.header.replace(/\./g, '\\.').replace(/\(/g, '\\(').replace(/\)/g, '\\)')}\\*\\*`, 'i'), '').trim();
      content = content.replace(new RegExp(`${suspiciousSignsSection.header.replace(/\./g, '\\.').replace(/\(/g, '\\(').replace(/\)/g, '\\)')}`, 'i'), '').trim();
      if (content.length > 0) {
        detailedContentHtml += `<h4><i class="${suspiciousSignsSection.icon}"></i> ${suspiciousSignsSection.header}</h4>`;
        detailedContentHtml += this.parseUrlSectionContent(content);
        hasExtractedContent = true;
      }
    }

    const riskAssessmentSection = {
      header: '4. Đánh giá rủi ro và khuyến nghị:',
      subHeader: '**Rủi ro:**',
      pattern: /(\*\*4\. Đánh giá rủi ro và khuyến nghị:[\s\S]*?)(?=\*\*5\.|$)/i,
      riskPattern: /(\*\*Rủi ro:\*\*[\s\S]*?)(?=\*\*Khuyến nghị:|$)/i,
      icon: 'fas fa-shield-alt' 
    };
    const assessmentMatch = text.match(riskAssessmentSection.pattern);
    if (assessmentMatch && assessmentMatch[1]) {
      const fullSectionContent = assessmentMatch[1].trim();
      const riskMatch = fullSectionContent.match(riskAssessmentSection.riskPattern);

      if (riskMatch && riskMatch[1]) {
        let content = riskMatch[1].trim();
        content = content.replace(new RegExp(`\\*\\*${riskAssessmentSection.subHeader.replace(/\./g, '\\.').replace(/\(/g, '\\(').replace(/\)/g, '\\)')}\\*\\*`, 'i'), '').trim();
        if (content.length > 0) {
          detailedContentHtml += `<h4><i class="${riskAssessmentSection.icon}"></i> ${riskAssessmentSection.subHeader}</h4>`;
          detailedContentHtml += this.parseUrlSectionContent(content);
          hasExtractedContent = true;
        }
      }
    }

    if (detailedContentHtml.trim() === '') {
      this.detailedAnalysis = "Phân tích chi tiết: Không có thông tin để hiển thị.";
    } else {
      this.detailedAnalysis = detailedContentHtml;
    }
  }


  private parseUrlSectionContent(text: string): string {
    let html = '';
    const lines = text.split('\n');
    let inList = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += '<p></p>'; 
        continue;
      }

      if (trimmedLine.startsWith('*')) { 
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        let content = trimmedLine.substring(1).trim();
        content = this.formatMarkdownToHtml(content);
        html += `<li>${content}</li>`;
      } else {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        // Loại bỏ các tiêu đề con có thể xuất hiện trong nội dung
        if (!trimmedLine.toLowerCase().includes('phân tích nội dung ảnh') &&
            !trimmedLine.toLowerCase().includes('nhận định về chức năng') &&
            !trimmedLine.toLowerCase().includes('đánh giá giao diện và hành vi') &&
            !trimmedLine.toLowerCase().includes('đánh giá rủi ro') &&
            !trimmedLine.toLowerCase().includes('khuyến nghị')) {
            html += `<p>${this.formatMarkdownToHtml(trimmedLine)}</p>`;
        }
      }
    }

    if (inList) {
      html += '</ul>';
    }
    return html;
  }

  private extractUrlRecommendations(text: string): void {
    const urlRecommendationPatterns = [
      /\*\s*\*\*Khuyến nghị:\*\*\s*([\s\S]*?)(?=\n\n|$)/i,
      /\*\*Khuyến nghị:\*\*\s*([\s\S]*?)(?=\n\n|$)/i,
      /(\*\*4\. Đánh giá rủi ro và khuyến nghị:\*\*[\s\S]*)/i,
      /(khuyến nghị[:\s]*[\s\S]*?)(?=\n\n|$)/i
    ];

    for (const pattern of urlRecommendationPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].trim().length > 20) {
        let extractedText = match[1].trim();

        if (extractedText.includes('**Đánh giá rủi ro:**')) {
          const recommendationMatch = extractedText.match(/\*\s*\*\*Khuyến nghị:\*\*\s*([\s\S]*)/i);
          if (recommendationMatch && recommendationMatch[1]) {
            extractedText = recommendationMatch[1].trim();
          }
        }

        const cleanedText = this.extractCompleteSentences(extractedText);
        if (cleanedText.length > 20) {
          this.recommendations = `5. Khuyến nghị:\n${cleanedText}`;
          return;
        }
      }
    }
  }

  private extractCompleteSentences(text: string): string {
    if (!text || text.trim().length === 0) return text;

    const lines = text.split('\n');
    const processedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) {
        processedLines.push('');
        continue;
      }

      if (line.startsWith('-')) {
        const cleanedBullet = this.cleanBulletPoint(line);
        if (cleanedBullet.length > 10) { // Chỉ giữ bullet có nghĩa
          processedLines.push(cleanedBullet);
        }
        continue;
      }

      if (line.includes(':') && !line.endsWith('.') && !line.endsWith('!') && !line.endsWith('?')) {
        processedLines.push(line);
        continue;
      }

      const sentences = this.splitIntoCompleteSentences(line);
      if (sentences.length > 0) {
        processedLines.push(sentences.join(' '));
      } else {
        if (line.length > 20 && line.split(' ').length >= 4) {
          let processedLine = line;
          if (!line.endsWith('.') && !line.endsWith('!') && !line.endsWith('?')) {
            processedLine += '.';
          }
          processedLines.push(processedLine);
        }
      }
    }

    const result = processedLines.join('\n').trim();
    return result;
  }

  private splitIntoCompleteSentences(text: string): string[] {
    if (!text || text.trim().length === 0) return [];

    const sentencePattern = /[^.!?]*[.!?](?=\s|$)/g;
    const sentences = text.match(sentencePattern) || [];

    return sentences
      .map(sentence => sentence.trim())
      .filter(sentence => {
        return sentence.length >= 10 &&
               !sentence.match(/^[\s\d\.\-]+$/) && 
               sentence.split(' ').length >= 3; 
      });
  }

  private cleanBulletPoint(bulletLine: string): string {
    if (!bulletLine || !bulletLine.trim().startsWith('-')) return bulletLine;

    let cleaned = bulletLine.trim();

    cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1'); 
    cleaned = cleaned.replace(/\*(.*?)\*/g, '$1');    

    const hasValidContent = cleaned.length > 15 && cleaned.split(' ').length >= 4;
    const hasValidEnding = cleaned.endsWith('.') || cleaned.endsWith('!') || cleaned.endsWith('?') || cleaned.endsWith(':');

    if (hasValidContent && !hasValidEnding) {
      const lastWords = cleaned.split(' ').slice(-3).join(' ').toLowerCase();
      const incompletePhrases = ['các', 'những', 'và', 'hoặc', 'của', 'trên', 'dưới', 'trong', 'ngoài'];

      if (!incompletePhrases.some(phrase => lastWords.endsWith(phrase))) {
        cleaned += '.';
      }
    }

    return cleaned;
  }

  getSafetyStatus(): string {
    if (this.riskLevelDescription) {
      const lowerCaseDescription = this.riskLevelDescription.toLowerCase();
      if (lowerCaseDescription.includes('an toàn') ||
          lowerCaseDescription.includes('0/10') ||
          lowerCaseDescription.includes('không nguy hiểm')) {
        return 'An toàn';
      }
      else if (lowerCaseDescription.includes('nguy hiểm: thấp') ||
               lowerCaseDescription.includes('nguy cơ thấp') ||
               lowerCaseDescription.includes('thấp')) {
        return 'Nguy cơ thấp';
      }
      else if (lowerCaseDescription.includes('nguy hiểm: trung bình') ||
               lowerCaseDescription.includes('nguy cơ trung bình') ||
               lowerCaseDescription.includes('trung bình')) {
        return 'Nguy cơ trung bình';
      }
      else if (lowerCaseDescription.includes('nguy hiểm: cao') ||
               lowerCaseDescription.includes('nguy cơ cao') ||
               lowerCaseDescription.includes('cao')) {
        return 'Nguy cơ cao';
      }
    }
    return 'Chưa xác định';
  }

  getRiskColor(): string {
    if (this.riskLevelDescription) {
      const lowerCaseDescription = this.riskLevelDescription.toLowerCase();
      if (lowerCaseDescription.includes('an toàn') ||
          lowerCaseDescription.includes('0/10') ||
          lowerCaseDescription.includes('không nguy hiểm')) {
        return 'green';
      }
      else if (lowerCaseDescription.includes('nguy hiểm: thấp') ||
               lowerCaseDescription.includes('nguy cơ thấp') ||
               lowerCaseDescription.includes('thấp')) {
        return 'yellowgreen';
      }
      else if (lowerCaseDescription.includes('nguy hiểm: trung bình') ||
               lowerCaseDescription.includes('nguy cơ trung bình') ||
               lowerCaseDescription.includes('trung bình')) {
        return 'orange';
      }
      else if (lowerCaseDescription.includes('nguy hiểm: cao') ||
               lowerCaseDescription.includes('nguy cơ cao') ||
               lowerCaseDescription.includes('cao')) {
        return 'red';
      }
    }
    return 'gray';
  }

  getRiskIcon(): string {
    if (this.riskLevelDescription) {
      const lowerCaseDescription = this.riskLevelDescription.toLowerCase();
      if (lowerCaseDescription.includes('an toàn') ||
          lowerCaseDescription.includes('0/10') ||
          lowerCaseDescription.includes('không nguy hiểm')) {
        return 'fas fa-check';
      }
      else if (lowerCaseDescription.includes('nguy hiểm: thấp') ||
               lowerCaseDescription.includes('nguy cơ thấp') ||
               lowerCaseDescription.includes('thấp')) {
        return 'fas fa-info-circle';
      }
      else if (lowerCaseDescription.includes('nguy hiểm: trung bình') ||
               lowerCaseDescription.includes('nguy cơ trung bình') ||
               lowerCaseDescription.includes('trung bình')) {
        return 'fas fa-exclamation-triangle';
      }
      else if (lowerCaseDescription.includes('nguy hiểm: cao') ||
               lowerCaseDescription.includes('nguy cơ cao') ||
               lowerCaseDescription.includes('cao')) {
        return 'fas fa-times';
      }
    }
    return 'fas fa-shield-alt';
  }

  getRiskStatusText(): string {
    if (this.riskLevelDescription) {
      const lowerCaseDescription = this.riskLevelDescription.toLowerCase();

      if (lowerCaseDescription.includes('an toàn') ||
          lowerCaseDescription.includes('0/10') ||
          lowerCaseDescription.includes('không nguy hiểm')) {
        return 'Có vẻ an toàn';
      }
      else if (lowerCaseDescription.includes('nguy hiểm: thấp') ||
               lowerCaseDescription.includes('nguy cơ thấp') ||
               lowerCaseDescription.includes('thấp')) {
        return 'Nguy cơ thấp';
      }
      else if (lowerCaseDescription.includes('nguy hiểm: trung bình') ||
               lowerCaseDescription.includes('nguy cơ trung bình') ||
               lowerCaseDescription.includes('trung bình')) {
        return 'Nguy cơ trung bình';
      }
      else if (lowerCaseDescription.includes('nguy hiểm: cao') ||
               lowerCaseDescription.includes('nguy cơ cao') ||
               lowerCaseDescription.includes('cao')) {
        return 'Nguy hiểm cao';
      }
    }
    return 'Chưa xác định';
  }

  getRiskIconColor(): string {
    const color = this.getRiskColor();
    switch (color) {
      case 'green': return '#28a745';
      case 'yellowgreen': return '#ffc107';
      case 'orange': return '#fd7e14';
      case 'red': return '#dc3545';
      default: return '#6c757d';
    }
  }

  getRiskAdvice(): string {
    const color = this.getRiskColor();
    switch (color) {
      case 'green': return 'Có thể tin tưởng';
      case 'yellowgreen': return 'Cần thận trọng';
      case 'orange': return 'Không nên tin tưởng';
      case 'red': return 'Tránh xa';
      default: return 'Cần đánh giá';
    }
  }

  getSubjectType(): string {
    switch (this.inputType) {
      case 1: return 'số điện thoại';
      case 2: return 'số tài khoản';
      case 3: return 'website';
      default: return 'đối tượng';
    }
  }

  hasAIRecommendations(): boolean {
    const hasRecommendations = !!(this.recommendations &&
           this.recommendations.trim() !== '' &&
           !this.recommendations.includes('Chưa có khuyến nghị') &&
           !this.recommendations.includes('Không thể tải khuyến nghị') &&
           !this.recommendations.includes('Vui lòng chờ trong khi phân tích') &&
           !this.recommendations.includes('Không có khuyến nghị'));

    return hasRecommendations;
  }
parseAIRecommendations(text: string): string {
    if (!text) return '';

    let html = '';

    const lines = text.split('\n');
    let currentSection = '';

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      if (!line) continue;
      if (line.includes('**Lời khuyến cho người dùng:**') ||
          line.includes('Lời khuyến cho người dùng:')) {

        if (currentSection) {
          html += '</div></div>';
        }

        html += `
          <div class="recommendation-section danger">
            <h4><i class="fas fa-exclamation-triangle"></i> Lời khuyến cho người dùng</h4>
            <div class="recommendation-list">
        `;
        currentSection = 'danger';
        continue;
      }

      if (line.includes('**Các nguồn thông tin đáng tin cậy để tham khảo:**') ||
          line.includes('Các nguồn thông tin đáng tin cậy để tham khảo:') ||
          line.includes('**Các biện pháp phòng ngừa cụ thể:**') ||
          line.includes('Các biện pháp phòng ngừa cụ thể:')) {

        if (currentSection) {
          html += '</div></div>';
        }

        let title = 'Hướng dẫn';
        if (line.includes('nguồn thông tin')) {
          title = 'Các nguồn thông tin đáng tin cậy';
        } else if (line.includes('biện pháp phòng ngừa')) {
          title = 'Biện pháp phòng ngừa';
        }

        html += `
          <div class="recommendation-section safe">
            <h4><i class="fas fa-check-circle"></i> ${title}</h4>
            <div class="recommendation-list">
        `;
        currentSection = 'safe';
        continue;
      }

      if (line.startsWith('-') && currentSection) {
        let content = line.substring(1).trim();

        if (content.includes('**Lời khuyến cho người dùng:**') ||
            content.includes('**Các nguồn thông tin') ||
            content.includes('**Các biện pháp phòng ngừa')) {
          continue;
        }

        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');

        if (content && content.length > 3) {
          html += `
            <div class="recommendation-item">
              <i class="fas fa-chevron-right"></i>
              <span>${content}</span>
            </div>
          `;
        }
      }
    }

    if (currentSection) {
      html += '</div></div>';
    }

    if (!html.trim()) {
      const allBullets = text.split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.substring(1).trim())
        .filter(content => content.length > 10);

      if (allBullets.length > 0) {
        html = `
          <div class="recommendation-section danger">
            <h4><i class="fas fa-exclamation-triangle"></i> Khuyến nghị từ hệ thống</h4>
            <div class="recommendation-list">
        `;

        allBullets.forEach(bullet => {
          const content = bullet.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          html += `
            <div class="recommendation-item">
              <i class="fas fa-chevron-right"></i>
              <span>${content}</span>
            </div>
          `;
        });

        html += '</div></div>';
      } else {
        html = `
          <div class="recommendation-section danger">
            <h4><i class="fas fa-exclamation-triangle"></i> Khuyến nghị từ hệ thống</h4>
            <div class="recommendation-list">
              <div class="recommendation-item">
                <i class="fas fa-chevron-right"></i>
                <span>Luôn cảnh giác với những lời mời chào quá hấp dẫn</span>
              </div>
              <div class="recommendation-item">
                <i class="fas fa-chevron-right"></i>
                <span>Tìm hiểu kỹ về sản phẩm và người bán trước khi mua</span>
              </div>
              <div class="recommendation-item">
                <i class="fas fa-chevron-right"></i>
                <span>Bảo vệ thông tin cá nhân và tài khoản ngân hàng</span>
              </div>
            </div>
          </div>
        `;
      }
    }

    return html;
  }

  getExternalReports(): ExternalCheckResponse[] {
    return this.analysisResult?.externalUrlCheckResponses || [];
  }

  getSafeReportsCount(): number {
    return 0;
  }

  getSafePercentage(): number {
    const total = this.getExternalReports().length;
    if (total === 0) return 0;
    return Math.round((this.getSafeReportsCount() / total) * 100);
  }

  getProgressBarClass(): string {
    const percentage = this.getSafePercentage();
    if (percentage === 100) return 'progress-safe';
    if (percentage >= 75) return 'progress-warning';
    if (percentage >= 50) return 'progress-danger';
    return 'progress-critical';
  }

  getReportCardClass(report: ExternalCheckResponse): string {
    return report.malicious ? 'card-danger' : 'card-not-found';
  }

  getProviderIcon(provider: string): string {
    switch (provider.toLowerCase()) {
      case 'googlesafeBrowse': return 'fab fa-google';
      case 'phishtank': return 'fas fa-fish';
      case 'virustotal': return 'fas fa-shield-virus';
      case 'urlscan': return 'fas fa-search';
      default: return 'fas fa-shield-alt';
    }
  }

  getProviderDisplayName(provider: string): string {
    switch (provider.toLowerCase()) {
      case 'googlesafeBrowse': return 'Google Safe Browse';
      case 'phishtank': return 'PhishTank';
      case 'virustotal': return 'VirusTotal';
      case 'urlscan': return 'UrlScan.io';
      default: return provider;
    }
  }

  getStatusBadgeClass(report: ExternalCheckResponse): string {
    return report.malicious ? 'status-danger' : 'status-not-found';
  }

  getStatusIcon(report: ExternalCheckResponse): string {
    return report.malicious ? 'fas fa-times' : 'fas fa-info-circle';
  }

  getStatusText(report: ExternalCheckResponse): string {
    return report.malicious ? 'Nguy hiểm' : 'Không tìm thấy';
  }

  // Display Methods (chỉ sử dụng real data)
  getDisplaySafeReportsCount(): number {
    return this.getSafeReportsCount();
  }

  getDisplayTotalReportsCount(): number {
    return this.getExternalReports().length;
  }

  getDisplaySafePercentage(): number {
    return this.getSafePercentage();
  }

  getDisplayProgressBarClass(): string {
    return this.getProgressBarClass();
  }

  // Malicious Reports Methods (logic mới)
  getMaliciousReportsCount(): number {
    return this.getExternalReports().filter(report => report.malicious).length;
  }

  getMaliciousPercentage(): number {
    const total = this.getExternalReports().length;
    if (total === 0) return 0;
    return Math.round((this.getMaliciousReportsCount() / total) * 100);
  }

  getMaliciousProgressBarClass(): string {
    const percentage = this.getMaliciousPercentage();
    if (percentage === 0) return 'progress-safe';     
    if (percentage <= 25) return 'progress-warning';  
    if (percentage <= 50) return 'progress-danger';    
    return 'progress-critical';                        
  }

  getFormattedDate(dateString: string | null | undefined): string {
    if (!dateString || dateString === '0001-01-01T00:00:00') {
      return 'N/A';
    }
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN');
    } catch {
      return 'N/A';
    }
  }

  getInputTypeIcon(): string {
    switch (this.inputType) {
      case 1: return 'fas fa-mobile-alt';
      case 2: return 'fas fa-university';
      case 3: return 'fas fa-globe';
      default: return 'fas fa-question-circle';
    }
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('vi-VN');
  }

  getScamAdviserClass(score: number | undefined): string {
    if (!score || score === 0) return 'not-found';
    if (score >= 80) return 'safe';
    if (score >= 60) return 'warning';
    if (score >= 40) return 'danger';
    return 'critical';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const errorDiv = document.createElement('div');
    errorDiv.className = 'image-error';
    errorDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i><p>Không thể tải ảnh</p>';
    img.parentNode?.appendChild(errorDiv);
  }

  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    this.imageLoaded = true;

    const container = img.closest('.image-container');
    if (container) {
      container.classList.remove('loading');

      if (this.isUrlScreenshot()) {
        container.classList.add('url-screenshot');
        img.classList.add('url-image');

        console.log(`URL Screenshot loaded: ${img.naturalWidth}x${img.naturalHeight}px`);
      }
    }
  }

  getImageName(imageUrl: string): string {
    const fileName = imageUrl.split('/').pop() || '';
    return fileName;
  }

  getFullImageUrl(imageUrl: string): string {
    if (this.analysisResult?.type === 3) {
      const fullUrl = `${environment.apiBaseUrl}/check-scam${imageUrl}`;
      return fullUrl;
    } else {
      const fileName = this.getImageName(imageUrl);
      const fullUrl = `${environment.apiBaseUrl}/report/image/${fileName}`;
      return fullUrl;
    }
  }

  isUrlScreenshot(imageUrl?: string): boolean {
    if (!imageUrl) return false;
    return this.analysisResult?.type === 3;
  }

  getImageDisplayInfo(imageUrl: string): string {
    if (this.isUrlScreenshot(imageUrl)) {
      return 'Screenshot Website • Hiển thị full size';
    } else {
      return 'Bằng chứng hình ảnh • Click để phóng to';
    }
  }

  getEvidenceImages(): string[] {
    if (!this.analysisResult) return [];

    let images: string[] = [];

    if (this.analysisResult.type === 1 || this.analysisResult.type === 2) {
      images = this.analysisResult.evidenceUrls || this.analysisResult.evidenceURLs || [];
    } else if (this.analysisResult.type === 3) {
      const screenshotValue = this.analysisResult.screenshot || this.analysisResult.screenShot;

      if (screenshotValue &&
          screenshotValue.trim() !== '' &&
          screenshotValue !== 'null') {

        if (screenshotValue === 'default') {
          images = [];
        } else {
          images = [screenshotValue];
        }
      }
    }

    return images;
  }

  hasValidAnalysisData(): boolean {
    return (
      (this.analysisResult !== null) ||
      (
        this.inputInfo !== undefined &&
        this.inputType !== undefined &&
        this.inputInfo.trim() !== ''
      )
    );
  }

  onImageClick(imageUrl: string): void {
    // Tắt tính năng phóng to ảnh
    // Function này đã được disable để tránh ảnh to ra khi click
    return;
  }

  formatText(text: string): string {
    if (!text) return '';

    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
  }

  getDisplayedImages(): string[] {
    const allImages = this.getEvidenceImages();
    if (this.showAllImagesFlag || allImages.length <= this.maxDisplayImages) {
      return allImages;
    }
    return allImages.slice(0, this.maxDisplayImages);
  }

  getRemainingImagesCount(): number {
    const allImages = this.getEvidenceImages();
    if (this.showAllImagesFlag || allImages.length <= this.maxDisplayImages) {
      return 0;
    }
    return allImages.length - this.maxDisplayImages;
  }

  showAllImages(): void {
    this.showAllImagesFlag = true;
  }

  getCurrentImage(): string {
    const images = this.getEvidenceImages();
    if (images.length === 0) return '';

    if (this.currentImageIndex >= images.length) {
      this.currentImageIndex = 0;
    }
    if (this.currentImageIndex < 0) {
      this.currentImageIndex = images.length - 1;
    }

    return images[this.currentImageIndex];
  }

  nextImage(): void {
    const images = this.getEvidenceImages();
    if (images.length <= 1) return;

    this.currentImageIndex = (this.currentImageIndex + 1) % images.length;
  }

  previousImage(): void {
    const images = this.getEvidenceImages();
    if (images.length <= 1) return;

    this.currentImageIndex = this.currentImageIndex === 0
      ? images.length - 1
      : this.currentImageIndex - 1;
  }

  goToImage(index: number): void {
    const images = this.getEvidenceImages();
    if (index >= 0 && index < images.length) {
      this.currentImageIndex = index;
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.getEvidenceImages().length) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.previousImage();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.nextImage();
        break;
      case 'Home':
        event.preventDefault();
        this.currentImageIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        this.currentImageIndex = this.getEvidenceImages().length - 1;
        break;
      case ' ': 
        event.preventDefault();
        this.toggleAutoPlay();
        break;
    }
  }

  startAutoPlay(): void {
    if (this.getEvidenceImages().length <= 1) return;

    this.stopAutoPlay(); 
    this.isAutoPlayEnabled = true;
    this.autoPlayInterval = setInterval(() => {
      this.nextImage();
    }, 4000); 
  }

  stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
    this.isAutoPlayEnabled = false;
  }

  toggleAutoPlay(): void {
    if (this.isAutoPlayEnabled) {
      this.stopAutoPlay();
    } else {
      this.startAutoPlay();
    }
  }

  onCarouselMouseEnter(): void {
    if (this.isAutoPlayEnabled) {
      this.stopAutoPlay();
    }
  }

  onCarouselMouseLeave(): void {
    if (this.getEvidenceImages().length > 1 && !this.isAutoPlayEnabled) {
      this.startAutoPlay();
    }
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