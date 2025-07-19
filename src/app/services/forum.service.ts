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

  constructor(private http: HttpClient) {}

  // Posts
  getPosts(page: number = 1, limit: number = 10): Observable<{data: ForumPostDto[], total: number, page: number, limit: number}> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<{data: ForumPostDto[], total: number, page: number, limit: number}>(`${this.apiUrl}/posts`, { params });
  }

  getPostById(id: string): Observable<ForumPostDto> {
    return this.http.get<ForumPostDto>(`${this.apiUrl}/posts/${id}`);
  }

  createPost(post: CreateForumPostDto): Observable<ForumPostDto> {
    return this.http.post<ForumPostDto>(`${this.apiUrl}/posts`, post);
  }

  updatePost(id: string, post: UpdateForumPostDto): Observable<ForumPostDto> {
    return this.http.put<ForumPostDto>(`${this.apiUrl}/posts/${id}`, post);
  }

  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/posts/${id}`);
  }

  // Comments
  getComments(postId: string): Observable<ForumCommentDto[]> {
    return this.http.get<ForumCommentDto[]>(`${this.apiUrl}/posts/${postId}/comments`);
  }

  createComment(comment: CreateForumCommentDto): Observable<ForumCommentDto> {
    return this.http.post<ForumCommentDto>(`${this.apiUrl}/comments`, comment);
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

  // Upload image
  uploadImage(file: File): Observable<{imageUrl: string}> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<{imageUrl: string}>(`${this.apiUrl}/upload`, formData);
  }
}
