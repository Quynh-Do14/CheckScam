import { Injectable } from '@angular/core';

export interface SchemaArticle {
  headline: string;
  description: string;
  image: string[];
  author: string;
  publisher: {
    name: string;
    logo: string;
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

@Injectable({
  providedIn: 'root'
})
export class SchemaService {
  private readonly baseUrl = 'https://checkscam.vn'; // Thay bằng domain thật

  constructor() {}

  /**
   * Tạo Article Schema
   */
  createArticleSchema(data: SchemaArticle): object {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": data.headline,
      "description": data.description,
      "image": data.image,
      "author": {
        "@type": "Organization",
        "name": data.author,
        "url": this.baseUrl
      },
      "publisher": {
        "@type": "Organization", 
        "name": data.publisher.name,
        "url": this.baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": data.publisher.logo,
          "width": 200,
          "height": 60
        }
      },
      "datePublished": data.datePublished,
      "dateModified": data.dateModified || data.datePublished,
      "url": data.url,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": data.url
      },
      "wordCount": data.wordCount,
      "timeRequired": data.readingTime,
      "keywords": data.keywords,
      "articleSection": data.articleSection || "Tin tức bảo mật",
      "articleBody": data.articleBody,
      "inLanguage": "vi-VN"
    };
  }

  /**
   * Tạo NewsArticle Schema (cho tin tức)
   */
  createNewsArticleSchema(data: SchemaArticle): object {
    return {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": data.headline,
      "description": data.description,
      "image": data.image,
      "author": {
        "@type": "Organization",
        "name": data.author,
        "url": this.baseUrl
      },
      "publisher": {
        "@type": "Organization",
        "name": data.publisher.name,
        "url": this.baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": data.publisher.logo,
          "width": 200,
          "height": 60
        }
      },
      "datePublished": data.datePublished,
      "dateModified": data.dateModified || data.datePublished,
      "url": data.url,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": data.url
      },
      "wordCount": data.wordCount,
      "keywords": data.keywords,
      "articleSection": data.articleSection || "Tin tức bảo mật",
      "articleBody": data.articleBody,
      "inLanguage": "vi-VN"
    };
  }

  /**
   * Tạo BreadcrumbList Schema
   */
  createBreadcrumbSchema(breadcrumbs: SchemaBreadcrumb[]): object {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((breadcrumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": breadcrumb.name,
        "item": breadcrumb.url
      }))
    };
  }

  /**
   * Tạo Organization Schema
   */
  createOrganizationSchema(data: SchemaOrganization): object {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": data.name,
      "url": data.url,
      "logo": {
        "@type": "ImageObject",
        "url": data.logo
      },
      "description": data.description,
      "foundingDate": data.foundingDate,
      "contactPoint": data.contactPoint ? {
        "@type": "ContactPoint",
        "telephone": data.contactPoint.telephone,
        "contactType": data.contactPoint.contactType,
        "email": data.contactPoint.email,
        "availableLanguage": ["Vietnamese"]
      } : undefined,
      "sameAs": data.sameAs
    };
  }

  /**
   * Tạo WebSite Schema
   */
  createWebSiteSchema(): object {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "CheckScam",
      "url": this.baseUrl,
      "description": "Nền tảng kiểm tra và cảnh báo lừa đảo trực tuyến hàng đầu Việt Nam",
      "inLanguage": "vi-VN",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${this.baseUrl}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    };
  }

  /**
   * Tạo ImageObject Schema
   */
  createImageSchema(imageUrl: string, alt: string, width?: number, height?: number): object {
    return {
      "@context": "https://schema.org",
      "@type": "ImageObject",
      "url": imageUrl,
      "description": alt,
      "width": width,
      "height": height,
      "contentUrl": imageUrl
    };
  }

  /**
   * Tạo FAQ Schema (cho trang FAQ)
   */
  createFAQSchema(faqs: Array<{question: string, answer: string}>): object {
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
   * Inject schema vào page
   */
  injectSchema(schema: object, id: string = 'schema-markup'): void {
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
   * Inject multiple schemas
   */
  injectMultipleSchemas(schemas: object[]): void {
    // Remove all existing schemas
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());

    // Add new schemas
    schemas.forEach((schema, index) => {
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
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  }

  /**
   * Utility: Count words in text
   */
  countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Utility: Calculate reading time
   */
  calculateReadingTime(wordCount: number): string {
    const wordsPerMinute = 200; // Average reading speed in Vietnamese
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `PT${minutes}M`; // ISO 8601 duration format
  }
}
