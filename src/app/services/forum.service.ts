import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { 
  ForumPostDto, 
  CreateForumPostDto, 
  UpdateForumPostDto,
  ForumCommentDto,
  CreateForumCommentDto,
  UserForumProfileDto 
} from '../dtos/forum-post.dto';

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private apiUrl = environment.apiBaseUrl + '/forum';

  constructor(private http: HttpClient) {
    console.log('ForumService initialized with API URL:', environment.apiBaseUrl + '/forum');
  }

  // Posts
  getPosts(page: number = 0, size: number = 10): Observable<{message: string, status: string, data: {data: ForumPostDto[], total: number, page: number, size: number, totalPages: number}}> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<{message: string, status: string, data: {data: ForumPostDto[], total: number, page: number, size: number, totalPages: number}}>(`${this.apiUrl}/posts`, { params });
  }

  getPostById(id: string): Observable<ForumPostDto> {
    return this.http.get<ForumPostDto>(`${this.apiUrl}/posts/${id}`);
  }

  createPost(post: CreateForumPostDto): Observable<{message: string, status: string, data: ForumPostDto}> {
    // Add required fields to match API expected format from Postman collection
    const postData: any = {
      content: post.content,
      type: 'DISCUSSION',  // Required by API
      tags: ['forum', 'discussion'],  // Required by API
      imageUrl: post.imageUrl || null  // Can be null if no image
    };
    
    // Only include title if it exists
    if (post.title) {
      postData.title = post.title;
    }
    
    console.log('ForumService: Sending post data to API:', postData);
    return this.http.post<{message: string, status: string, data: ForumPostDto}>(`${this.apiUrl}/posts`, postData);
  }

  updatePost(id: string, post: UpdateForumPostDto): Observable<ForumPostDto> {
    return this.http.put<ForumPostDto>(`${this.apiUrl}/posts/${id}`, post);
  }

  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/posts/${id}`);
  }

  // Comments
  getComments(postId: string): Observable<{message?: string, status?: string, data?: ForumCommentDto[]} | ForumCommentDto[]> {
    return this.http.get<{message?: string, status?: string, data?: ForumCommentDto[]} | ForumCommentDto[]>(`${this.apiUrl}/posts/${postId}/comments`);
  }

  createComment(comment: CreateForumCommentDto): Observable<{message: string, status: string, data: ForumCommentDto}> {
    return this.http.post<{message: string, status: string, data: ForumCommentDto}>(`${this.apiUrl}/comments`, comment);
  }

  deleteComment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/comments/${id}`);
  }

  // Likes
  likePost(postId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/posts/${postId}/like`, {});
  }

  unlikePost(postId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/posts/${postId}/like`);
  }

  likeComment(commentId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/comments/${commentId}/like`, {});
  }

  unlikeComment(commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/comments/${commentId}/like`);
  }

  // User Profile
  getUserProfile(userId: string): Observable<UserForumProfileDto> {
    return this.http.get<UserForumProfileDto>(`${this.apiUrl}/users/${userId}/profile`);
  }

  getUserPosts(userId: string, page: number = 1, limit: number = 10): Observable<{data: ForumPostDto[], total: number}> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<{data: ForumPostDto[], total: number}>(`${this.apiUrl}/users/${userId}/posts`, { params });
  }

  uploadImage(file: File): Observable<{message: string, status: string, data: {imageUrl: string}}> {
    const formData = new FormData();
    formData.append('file', file);  // Backend expects 'file' not 'image'
    
    console.log('ForumService: Uploading file:', file.name, 'Size:', file.size);
    return this.http.post<{message: string, status: string, data: {imageUrl: string}}>(`${this.apiUrl}/upload`, formData);
  }
}
