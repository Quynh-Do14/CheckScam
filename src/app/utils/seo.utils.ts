/**
 * SEO Utility Functions
 * Các function hỗ trợ cho SEO optimization
 */

export class SeoUtils {
  
  /**
   * Tạo slug từ tiếng Việt
   */
  static createSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      // Chuyển đổi ký tự tiếng Việt
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
      .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
      .replace(/[ìíịỉĩ]/g, 'i')
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
      .replace(/[ùúụủũưừứựửữ]/g, 'u')
      .replace(/[ỳýỵỷỹ]/g, 'y')
      .replace(/đ/g, 'd')
      .replace(/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/g, 'A')
      .replace(/[ÈÉẸẺẼÊỀẾỆỂỄ]/g, 'E')
      .replace(/[ÌÍỊỈĨ]/g, 'I')
      .replace(/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/g, 'O')
      .replace(/[ÙÚỤỦŨƯỪỨỰỬỮ]/g, 'U')
      .replace(/[ỲÝỴỶỸ]/g, 'Y')
      .replace(/Đ/g, 'D')
      // Loại bỏ ký tự đặc biệt
      .replace(/[^a-zA-Z0-9 -]/g, '')
      // Thay space bằng dấu gạch ngang
      .replace(/\s+/g, '-')
      // Loại bỏ dấu gạch ngang thừa
      .replace(/-+/g, '-')
      // Loại bỏ dấu gạch ngang ở đầu và cuối
      .replace(/^-|-$/g, '');
  }

  /**
   * Tính toán thời gian đọc
   */
  static calculateReadingTime(content: string, wordsPerMinute: number = 200): number {
    const textContent = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    const wordCount = textContent.trim().split(/\s+/).filter(word => word.length > 0).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Tạo excerpt từ content
   */
  static createExcerpt(content: string, maxLength: number = 160): string {
    const textContent = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    if (textContent.length <= maxLength) {
      return textContent;
    }
    return textContent.substring(0, maxLength).trim() + '...';
  }

  /**
   * Validate URL
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Tạo meta description từ content nếu không có shortDescription
   */
  static generateMetaDescription(content: string, shortDescription?: string, maxLength: number = 160): string {
    if (shortDescription && shortDescription.trim()) {
      return shortDescription.length > maxLength 
        ? shortDescription.substring(0, maxLength - 3).trim() + '...'
        : shortDescription;
    }
    return this.createExcerpt(content, maxLength);
  }

  /**
   * Tạo keywords từ content (basic implementation)
   */
  static extractKeywords(content: string, maxKeywords: number = 10): string[] {
    const textContent = content.replace(/<[^>]*>/g, '').toLowerCase();
    
    // Danh sách stop words tiếng Việt cơ bản
    const stopWords = [
      'và', 'hoặc', 'nhưng', 'nếu', 'thì', 'của', 'cho', 'với', 'từ', 'tại',
      'trong', 'ngoài', 'trên', 'dưới', 'về', 'theo', 'như', 'để', 'khi', 'mà',
      'đã', 'sẽ', 'có', 'là', 'được', 'bị', 'các', 'những', 'một', 'hai'
    ];

    const words = textContent
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .filter(word => /^[a-zA-ZÀ-ỹ]+$/.test(word));

    // Đếm tần suất từ khóa
    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Sắp xếp theo tần suất và lấy top keywords
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  /**
   * Format date cho schema markup
   */
  static formatDateForSchema(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString();
  }

  /**
   * Tạo canonical URL
   */
  static createCanonicalUrl(baseUrl: string, path: string): string {
    return `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : '/' + path}`;
  }

  /**
   * Validate image URL và trả về fallback nếu cần
   */
  static getValidImageUrl(imageUrl?: string, fallbackUrl: string = '/assets/images/default-news.jpg'): string {
    if (!imageUrl) return fallbackUrl;
    
    // Kiểm tra nếu URL đã đầy đủ
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // Kiểm tra nếu là relative URL
    if (imageUrl.startsWith('/')) {
      return imageUrl;
    }
    
    return fallbackUrl;
  }

  /**
   * Tạo social sharing URLs
   */
  static createSocialUrls(url: string, title: string, description?: string) {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = description ? encodeURIComponent(description) : '';

    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      zalo: `https://zalo.me/share/url?url=${encodedUrl}&title=${encodedTitle}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`
    };
  }

  /**
   * Tối ưu title cho SEO
   */
  static optimizeTitle(title: string, maxLength: number = 60): string {
    if (title.length <= maxLength) {
      return title;
    }
    
    // Cắt tại từ cuối cùng để tránh cắt giữa từ
    const truncated = title.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > maxLength * 0.8) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }
    
    return truncated + '...';
  }
}
