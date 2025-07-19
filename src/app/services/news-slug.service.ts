import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NewsSlugService {

  constructor() { }

  
  createSlug(title: string): string {
    return title
      .trim()
      .toLowerCase() // Chuyển tất cả thành chữ thường
      // Chuyển đổi ký tự tiếng Việt thành không dấu
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
      .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
      .replace(/[ìíịỉĩ]/g, 'i')
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
      .replace(/[ùúụủũưừứựửữ]/g, 'u')
      .replace(/[ỳýỵỷỹ]/g, 'y')
      .replace(/đ/g, 'd')
      // Loại bỏ các ký tự đặc biệt, chỉ giữ chữ cái, số và khoảng trắng
      .replace(/[^a-z0-9\s]/g, '')
      // Thay thế khoảng trắng bằng dấu gạch ngang
      .replace(/\s+/g, '-')
      // Loại bỏ dấu gạch ngang thừa
      .replace(/-+/g, '-')
      // Loại bỏ dấu gạch ngang ở đầu và cuối
      .replace(/^-|-$/g, '');
  }

  /**
   * Tạo URL đầy đủ cho news
   */
  createNewsUrl(title: string, baseUrl: string = 'https://ai6.vn'): string {
    const slug = this.createSlug(title);
    return `${baseUrl}/list-news/${slug}`;
  }

  /**
   * Parse slug để có thể tìm kiếm tin tức
   * Vì slug không chứa ID, cần tìm theo title pattern
   */
  parseSlugToSearchTitle(slug: string): string {
    return slug
      .replace(/-/g, ' ')
      .toLowerCase()
      .trim();
  }

  /**
   * Tạo slug với ID fallback để đảm bảo unique
   * Format: "google-ai-search-ra-mat-tinh-nang-moi-123"
   */
  createSlugWithId(title: string, id: number): string {
    const baseSlug = this.createSlug(title);
    return `${baseSlug}-${id}`;
  }

  /**
   * Extract ID từ slug có ID
   */
  extractIdFromSlug(slug: string): number | null {
    const parts = slug.split('-');
    const lastPart = parts[parts.length - 1];
    const id = parseInt(lastPart, 10);
    return isNaN(id) ? null : id;
  }

  /**
   * Remove ID từ slug để get clean slug
   */
  removeIdFromSlug(slug: string): string {
    const parts = slug.split('-');
    const lastPart = parts[parts.length - 1];
    const isId = !isNaN(parseInt(lastPart, 10));
    
    if (isId) {
      return parts.slice(0, -1).join('-');
    }
    return slug;
  }

  /**
   * Validate slug format
   */
  isValidSlug(slug: string): boolean {
    // Slug should only contain letters, numbers, and hyphens
    const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    return slugPattern.test(slug) && slug.length > 0;
  }

  /**
   * Get all possible search terms từ slug để tìm news
   */
  getSearchTermsFromSlug(slug: string): string[] {
    const searchTitle = this.parseSlugToSearchTitle(slug);
    const words = searchTitle.split(' ');
    
    // Tạo các combination để search
    const terms = [
      searchTitle, // Full title
      words.slice(0, 3).join(' '), // First 3 words
      words.slice(0, 5).join(' '), // First 5 words
      ...words.filter(word => word.length > 3) // Individual significant words
    ];

    return [...new Set(terms)]; // Remove duplicates
  }
}
