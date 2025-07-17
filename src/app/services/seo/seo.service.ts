import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  tags?: string[];
  readingTime?: number;
  slug?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly defaultTitle = 'CheckScam - Tin tức bảo mật và phòng chống lừa đảo';
  private readonly defaultDescription = 'Cập nhật tin tức mới nhất về bảo mật, phòng chống lừa đảo và các mối đe dọa trực tuyến. Bảo vệ bản thân khỏi các chiêu trò lừa đảo.';
  private readonly defaultImage = '/assets/images/default-news-image.jpg';
  private readonly siteUrl = 'https://checkscam.vn'; // Thay bằng domain thật

  constructor(
    private meta: Meta,
    private title: Title,
    private router: Router
  ) {}

  /**
   * Cập nhật toàn bộ SEO meta data cho trang
   */
  updateSEO(data: SEOData): void {
    // Update page title
    this.updateTitle(data.title);
    
    // Update basic meta tags
    this.updateBasicMeta(data);
    
    // Update Open Graph tags
    this.updateOpenGraph(data);
    
    // Update Twitter Card tags
    this.updateTwitterCard(data);
    
    // Update additional SEO tags
    this.updateAdditionalMeta(data);
  }

  /**
   * Cập nhật title trang
   */
  private updateTitle(pageTitle?: string): void {
    const title = pageTitle 
      ? `${pageTitle} | CheckScam`
      : this.defaultTitle;
    this.title.setTitle(title);
  }

  /**
   * Cập nhật basic meta tags
   */
  private updateBasicMeta(data: SEOData): void {
    const description = data.description || this.defaultDescription;
    const keywords = data.keywords || 'bảo mật, lừa đảo, an toàn trực tuyến, phishing';
    const currentUrl = data.url || `${this.siteUrl}${this.router.url}`;

    // Basic meta tags
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'keywords', content: keywords });
    this.meta.updateTag({ name: 'author', content: data.author || 'CheckScam Team' });
    
    // Canonical URL
    this.meta.updateTag({ rel: 'canonical', href: currentUrl });
    
    // Robots
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    
    // Viewport (mobile optimization)
    this.meta.updateTag({ name: 'viewport', content: 'width=device-width, initial-scale=1' });
    
    // Language
    this.meta.updateTag({ name: 'language', content: 'vi' });
    
    // Date tags
    if (data.publishedDate) {
      this.meta.updateTag({ name: 'article:published_time', content: data.publishedDate });
    }
    if (data.modifiedDate) {
      this.meta.updateTag({ name: 'article:modified_time', content: data.modifiedDate });
    }
  }

  /**
   * Cập nhật Open Graph tags cho social media
   */
  private updateOpenGraph(data: SEOData): void {
    const title = data.title || this.defaultTitle;
    const description = data.description || this.defaultDescription;
    const image = data.image || this.defaultImage;
    const url = data.url || `${this.siteUrl}${this.router.url}`;
    const type = data.type || 'article';

    // Basic OG tags
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: type });
    this.meta.updateTag({ property: 'og:locale', content: 'vi_VN' });
    this.meta.updateTag({ property: 'og:site_name', content: 'CheckScam' });

    // Article specific OG tags
    if (type === 'article') {
      if (data.author) {
        this.meta.updateTag({ property: 'article:author', content: data.author });
      }
      if (data.publishedDate) {
        this.meta.updateTag({ property: 'article:published_time', content: data.publishedDate });
      }
      if (data.modifiedDate) {
        this.meta.updateTag({ property: 'article:modified_time', content: data.modifiedDate });
      }
      if (data.tags && data.tags.length > 0) {
        data.tags.forEach(tag => {
          this.meta.updateTag({ property: 'article:tag', content: tag });
        });
      }
    }

    // Image meta
    this.meta.updateTag({ property: 'og:image:width', content: '1200' });
    this.meta.updateTag({ property: 'og:image:height', content: '630' });
    this.meta.updateTag({ property: 'og:image:type', content: 'image/jpeg' });
  }

  /**
   * Cập nhật Twitter Card tags
   */
  private updateTwitterCard(data: SEOData): void {
    const title = data.title || this.defaultTitle;
    const description = data.description || this.defaultDescription;
    const image = data.image || this.defaultImage;

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
    this.meta.updateTag({ name: 'twitter:site', content: '@checkscam_vn' }); // Thay bằng Twitter handle thật
    this.meta.updateTag({ name: 'twitter:creator', content: '@checkscam_vn' });
  }

  /**
   * Cập nhật additional meta tags
   */
  private updateAdditionalMeta(data: SEOData): void {
    // Reading time
    if (data.readingTime) {
      this.meta.updateTag({ name: 'reading-time', content: `${data.readingTime} phút` });
    }

    // Content type
    this.meta.updateTag({ name: 'content-type', content: 'text/html; charset=utf-8' });
    
    // Theme color
    this.meta.updateTag({ name: 'theme-color', content: '#4e73df' });
    
    // Mobile app links (nếu có mobile app)
    // this.meta.updateTag({ property: 'al:ios:app_name', content: 'CheckScam' });
    // this.meta.updateTag({ property: 'al:android:app_name', content: 'CheckScam' });
  }

  /**
   * Reset về default SEO data
   */
  resetToDefault(): void {
    this.updateSEO({});
  }

  /**
   * Tạo structured data JSON-LD
   */
  generateStructuredData(data: SEOData): string {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": data.title,
      "description": data.description,
      "image": data.image,
      "author": {
        "@type": "Organization",
        "name": data.author || "CheckScam Team",
        "url": this.siteUrl
      },
      "publisher": {
        "@type": "Organization",
        "name": "CheckScam",
        "url": this.siteUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${this.siteUrl}/assets/images/logo.png`
        }
      },
      "datePublished": data.publishedDate,
      "dateModified": data.modifiedDate || data.publishedDate,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": data.url
      }
    };

    return JSON.stringify(structuredData);
  }

  /**
   * Inject structured data vào page
   */
  injectStructuredData(data: SEOData): void {
    // Remove existing structured data
    const existingScript = document.getElementById('structured-data');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.id = 'structured-data';
    script.type = 'application/ld+json';
    script.text = this.generateStructuredData(data);
    document.head.appendChild(script);
  }

  /**
   * Utility function để tạo slug từ title
   */
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
      .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
      .replace(/[ìíịỉĩ]/g, 'i')
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
      .replace(/[ùúụủũưừứựửữ]/g, 'u')
      .replace(/[ỳýỵỷỹ]/g, 'y')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Tính toán reading time từ content
   */
  calculateReadingTime(content: string): number {
    const wordsPerMinute = 200; // Average reading speed in Vietnamese
    const textLength = content.replace(/<[^>]*>/g, '').split(' ').length;
    return Math.ceil(textLength / wordsPerMinute);
  }
}
