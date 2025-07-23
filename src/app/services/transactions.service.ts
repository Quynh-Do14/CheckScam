import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface CreateTransactionPayload {
  dealerName: string;
  dealerEmail: string; // Backend yêu cầu email của giao dịch viên
  partyAName: string;
  partyAEmail: string;
  partyAPhone: string;
  partyBName: string;
  partyBEmail: string;
  partyBPhone: string;
  roomName: string;
  transactionCode: string;
}

export interface CreateTransactionResponse {
  transactionId: string;
  message: string;
  createdDt: string;
  emailSent: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionCreationService {
  private readonly API_URL = `${environment.apiUrl}/api/v1/transactions/create`;

  constructor(private http: HttpClient) { }

  createTransaction(payload: CreateTransactionPayload): Observable<CreateTransactionResponse> {
    console.log('Sending payload to backend:', payload);
    return this.http.post<CreateTransactionResponse>(this.API_URL, payload);
  }
}