import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { ActivityService } from './activity.service'; // Node.js backend service
import { ActivityMainBackendService } from './activity-main-backend.service'; // Java backend service

@Injectable({
  providedIn: 'root'
})
export class ActivityServiceFactory {
  
  constructor(
    private nodeActivityService: ActivityService,
    private javaActivityService: ActivityMainBackendService
  ) {}

  getActivityService() {
    if (environment.useMainBackendForActivity) {
      console.log('🔄 Using Java Spring Boot backend for activities');
      return this.javaActivityService;
    } else {
      console.log('🔄 Using Node.js backend for activities');
      return this.nodeActivityService;
    }
  }
}