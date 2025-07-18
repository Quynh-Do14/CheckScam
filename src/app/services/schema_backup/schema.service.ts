import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface SchemaArticle {
  headline: string;
  description: string;
  image: string[];
  author: string;
  publisher: {
    name: string;
    logo: string;
    url?: string;
  };
  datePublished: string;
  dateModified?: string;
  url: string;
  wordCount?: number;
  readingTime?: string;
  keywords?: string[];
  articleSection?: string;
  articleBody?: string;
}

export interface SchemaBreadcrumb {
  position: number;
  name: string;
  url: string;
}

export interface SchemaOrganization {
  name: string;
  url: string;
  logo: string;
  description: string;
  foundingDate?: string;
  contactPoint?: {
    telephone: string;
    contactType: string;
    email: string;
  };
  sameAs?: string[];
}

export interface SchemaWebSite {
  name: string;
  url: string;
  description: string;
  searchUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SchemaService {
  private readonly baseUrl = environment.baseUrl;

  constructor() {}

  /**
   * Tạo Article Schema - chỉ sử dụng data từ backend
   */
  createArticleSchema(data: SchemaArticle): object {
    const schema: any = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": data.headline,
      "description": data.description,
      "image": data.image,
      "datePublished": data.datePublished,
      "url": data.url,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": data.url
      },
      "inLanguage": "vi-VN"
    };

    // Chỉ thêm author khi có data
    if (data.author) {
      schema.author = {
        "@type": "Person",
        "name": data.author
      };
    }

    // Chỉ thêm publisher khi có data
    if (data.publisher && data.publisher.name) {
      schema.publisher = {
        "@type": "Organization",
        "name": data.publisher.name
      };

      // Thêm URL nếu có
      if (data.publisher.url) {
        schema.publisher.url = data.publisher.url;
      }

      // Thêm logo nếu có
      if (data.publisher.logo) {
        schema.publisher.logo = {
          "@type": "ImageObject",
          "url": data.publisher.logo
        };
      }
    }

    // Thêm các field optional
    if (data.dateModified) {
      schema.dateModified = data.dateModified;
    }

    if (data.wordCount) {
      schema.wordCount = data.wordCount;
    }

    if (data.readingTime) {
      schema.timeRequired = data.readingTime;
    }

    if (data.keywords && data.keywords.length > 0) {
      schema.keywords = data.keywords;
    }

    if (data.articleSection) {
      schema.articleSection = data.articleSection;
    }

    if (data.articleBody) {
      schema.articleBody = data.articleBody;
    }

    return schema;
  }

  /**
   * Tạo NewsArticle Schema - chỉ sử dụng data từ backend
   */
  createNewsArticleSchema(data: SchemaArticle): object {
    const articleSchema = this.createArticleSchema(data);
    // Chuyển từ Article sang NewsArticle
    (articleSchema as any)["@type"] = "NewsArticle";
    return articleSchema;
  }

  /**
   * Tạo BreadcrumbList Schema - chỉ sử dụng data từ backend
   */
  createBreadcrumbSchema(breadcrumbs: SchemaBreadcrumb[]): object {
    if (!breadcrumbs || breadcrumbs.length === 0) {
      return {};
    }

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((breadcrumb) => ({
        "@type": "ListItem",
        "position": breadcrumb.position,
        "name": breadcrumb.name,
        "item": breadcrumb.url
      }))
    };
  }

  /**
   * Tạo Organization Schema - chỉ sử dụng data từ backend
   */
  createOrganizationSchema(data: SchemaOrganization): object {
    const schema: any = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": data.name,
      "url": data.url,
      "description": data.description
    };

    // Chỉ thêm logo khi có data
    if (data.logo) {
      schema.logo = {
        "@type": "ImageObject",
        "url": data.logo
      };
    }

    // Thêm các field optional
    if (data.foundingDate) {
      schema.foundingDate = data.foundingDate;
    }

    if (data.contactPoint) {
      schema.contactPoint = {
        "@type": "ContactPoint",
        "telephone": data.contactPoint.telephone,
        "contactType": data.contactPoint.contactType,
        "email": data.contactPoint.email,
        "availableLanguage": ["Vietnamese"]
      };
    }

    if (data.sameAs && data.sameAs.length > 0) {
      schema.sameAs = data.sameAs;
    }

    return schema;
  }

  /**
   * Tạo WebSite Schema - ưu tiên data từ backend, fallback về environment
   */
  createWebSiteSchema(data?: SchemaWebSite): object {
    const schema: any = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "inLanguage": "vi-VN"
    };

    // Sử dụng data từ backend, fallback về environment
    if (data?.name) {
      schema.name = data.name;
    }

    const url = data?.url || this.baseUrl;
    if (url) {
      schema.url = url;
    }

    if (data?.description) {
      schema.description = data.description;
    }

    // Tạo search URL từ baseUrl nếu không có searchUrl riêng
    const searchUrl = data?.searchUrl || (this.baseUrl ? `${this.baseUrl}/search?q={search_term_string}` : null);
    if (searchUrl) {
      schema.potentialAction = {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": searchUrl
        },
        "query-input": "required name=search_term_string"
      };
    }

    return schema;
  }

  /**
   * Tạo ImageObject Schema - chỉ sử dụng data từ backend
   */
  createImageSchema(imageUrl: string, alt: string, width?: number, height?: number): object {
    const schema: any = {
      "@context": "https://schema.org",
      "@type": "ImageObject",
      "url": imageUrl,
      "contentUrl": imageUrl
    };

    if (alt) {
      schema.description = alt;
    }

    if (width) {
      schema.width = width;
    }

    if (height) {
      schema.height = height;
    }

    return schema;
  }

  /**
   * Tạo FAQ Schema - chỉ sử dụng data từ backend
   */
  createFAQSchema(faqs: Array<{question: string, answer: string}>): object {
    if (!faqs || faqs.length === 0) {
      return {};
    }

    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };
  }

  /**
   * Inject schema vào page - chỉ inject khi có data
   */
  injectSchema(schema: object, id: string = 'schema-markup'): void {
    // Kiểm tra schema có data không
    if (!schema || Object.keys(schema).length === 0) {
      return;
    }

    // Remove existing schema
    const existingScript = document.getElementById(id);
    if (existingScript) {
      existingScript.remove();
    }

    // Add new schema
    const script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  /**
   * Inject multiple schemas - chỉ inject khi có data
   */
  injectMultipleSchemas(schemas: object[]): void {
    // Lọc ra các schema có data
    const validSchemas = schemas.filter(schema => 
      schema && Object.keys(schema).length > 0
    );

    if (validSchemas.length === 0) {
      return;
    }

    // Remove all existing schemas
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());

    // Add new schemas
    validSchemas.forEach((schema, index) => {
      const script = document.createElement('script');
      script.id = `schema-markup-${index}`;
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    });
  }

  /**
   * Utility: Extract text content from HTML
   */
  extractTextFromHTML(html: string): string {
    if (!html) return '';
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  }

  /**
   * Utility: Count words in text
   */
  countWords(text: string): number {
    if (!text) return 0;
    
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Utility: Calculate reading time in ISO 8601 format
   */
  calculateReadingTime(wordCount: number): string {
    if (!wordCount || wordCount <= 0) return 'PT1M';
    
    const wordsPerMinute = 200; // Average reading speed in Vietnamese
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `PT${minutes}M`; // ISO 8601 duration format
  }

  /**
   * Utility: Tạo absolute URL từ relative path
   */
  createAbsoluteUrl(path: string): string {
    if (!path) return this.baseUrl || '';
    
    // Nếu đã là absolute URL thì return luôn
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // Nếu không có baseUrl thì return path gốc
    if (!this.baseUrl) {
      return path;
    }

    // Kết hợp baseUrl với path
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl.replace(/\/$/, '')}${cleanPath}`;
  }

  /**
   * Utility: Validate schema before injection
   */
  validateSchema(schema: object): boolean {
    if (!schema || typeof schema !== 'object') {
      return false;
    }

    const schemaObj = schema as any;
    return !!(schemaObj['@context'] && schemaObj['@type']);
  }

  /**
   * Utility: Lấy baseUrl từ environment
   */
  getBaseUrl(): string {
    return this.baseUrl || '';
  }
}
