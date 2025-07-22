import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { UserComponent } from './components/user/user.component';
import { NewsComponent } from './components/news/news.component';
import { CreateNewsComponent } from './components/news/create-news/create-news.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { CreateReportComponent } from './components/report/create/create.component';
import { ViewNewsComponent } from './components/news/view-news/view-news.component';
import { CreateUserComponent } from './components/user/create-user/create-user.component';
import { DetailNewsComponent } from './components/news/detail-news/detail-news.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AboutUsComponent } from './components/about-us/about-us.component';
import { ChatBoxComponent } from './components/chat-box/chat-box.component';
import { ListNewsComponent } from './components/news/list-news/list-news.component';
import { UpdateNewsComponent } from './components/news/update-news/update-news.component';
import { SubjectDetailComponent } from './components/subject-detail/subject-detail.component';

import { AnalyzeComponent } from './components/analyze/analyze.component';
import { RankingComponent } from './components/ranking/ranking.component';
import { PrivacyComponent } from './components/policy/privacy/privacy.component';
import { TermsofserviceComponent } from './components/policy/termsofservice/termsofservice.component';
import { RefundComponent } from './components/policy/refund/refund.component';
import { PaymentComponent } from './components/policy/payment/payment.component';
import { StandardComponent } from './components/policy/standard/standard.component';
import { ReportComponent } from './components/report/report.component';
import { MistakeComponent } from './components/report/mistake/mistake.component';

import { AuthGuard } from './guards/auth.guard';
import { AuthChildGuard } from './guards/auth-child.guard';
import { PublicGuard } from './guards/public.guard'; 

import { ReportMangementComponent } from './components/report/report-management/report-management.component';
import { MistakeManagementComponent } from './components/report/mistake-management/mistake-management.component';


import { TransactionsComponent } from './components/transactions/transactions.component';
import { AgentDetailComponent } from './components/transactions/agent-detail/agent-detail.component';

import { ProfileComponent } from './components/profile/profile.component';
import { ReportDetailComponent } from './components/report/report-detail/report-detail.component';
import { MistakeDetailComponent } from './components/report/mistake-detail/mistake-detail.component';
import { RegisterComponent } from './components/register/register.component';
import { AccessDeniedComponent } from './components/access-denied/access-denied.component';
import { ForumComponent } from './components/forum/forum.component';
import { CreatePostComponent } from './components/forum/create-post/create-post.component';
import { PostDetailComponent } from './components/forum/post-detail/post-detail.component';
import { UserProfileComponent } from './components/forum/user-profile/user-profile.component';
import { ForumTestComponent } from './components/forum/forum-test.component';
import { ForumSimpleComponent } from './components/forum/forum-simple.component';
import { EmailVerificationComponent } from './components/emailverification/emailverification.component';
import { PartnersComponent } from './components/partners/partners.component';

export const routes: Routes = [
    { path: '', component: HomeComponent, pathMatch: 'full' },
    {
        path: 'admin',
        component: LayoutComponent,
        canActivate: [AuthGuard],
        canActivateChild: [AuthChildGuard],
        data: { roles: ['ADMIN', 'COLLAB'] },
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', component: DashboardComponent },
          {
            path: 'news',
            component: NewsComponent,
          },
          {
            path: 'users',
            component: UserComponent,
            data: { roles: ['ADMIN'] }
          },
          {
            path: 'create-user',
            component: CreateUserComponent,
            data: { roles: ['ADMIN'] }
          },
          {
            path: 'create-news',
            component: CreateNewsComponent,
          },
          {
            path: 'reports',
            component: ReportMangementComponent,
          },
          { path: 'detail-news/:id', component: DetailNewsComponent },
          {
            path: 'update-news/:id',
            component: UpdateNewsComponent,
          },
          { path: 'report-detail/:id', component: ReportDetailComponent },
          { path: 'mistake-detail/:id', component: MistakeDetailComponent },
          { path: 'mistakes', component: MistakeManagementComponent },
          { path: 'profile', component: ProfileComponent },
        ],
    },
    { path: 'register', component: RegisterComponent, canActivate: [PublicGuard] }, 
    { path: 'login', component: LoginComponent, canActivate: [PublicGuard] },       
    { path: 'verify-email', component: EmailVerificationComponent, canActivate: [PublicGuard] }, // Đã thêm dòng này
    { path: 'list-news', component: ListNewsComponent },
    { path: 'list-news/:slug', component: ViewNewsComponent },
    { path: 'view-news/:id', component: ViewNewsComponent }, // Keep for backward compatibility
    { path: 'chatbox', component: ChatBoxComponent },
    { path: 'analyze', component: AnalyzeComponent },
    { path: 'ranking', component: RankingComponent },
    { path: 'create-report', component: CreateReportComponent },
    { path: 'about-us', component: AboutUsComponent },
    { path: 'policy/privacy', component: PrivacyComponent },
    { path: 'policy/termsofservice', component: TermsofserviceComponent },
    { path: 'policy/refund', component: RefundComponent },
    { path: 'policy/standard', component: StandardComponent },
    { path: 'policy/payment', component: PaymentComponent },
    { path: 'report', component: ReportComponent },
    { path: 'report/create', component: CreateReportComponent },
    { path: 'report/mistake', component: MistakeComponent },
    { path: 'subject-detail/:id', component: SubjectDetailComponent },

    { path: 'transactions', component: TransactionsComponent },
    { path: 'transactions/agent/:id', component: AgentDetailComponent },
    { path: 'forum', component: ForumComponent },
    { path: 'forum-test', component: ForumTestComponent },
    { path: 'forum-full', component: ForumComponent },
    { path: 'forum/create-post', component: CreatePostComponent },
    { path: 'forum/post/:id', component: PostDetailComponent },
    { path: 'forum/user/:id', component: UserProfileComponent },
    { path: 'partners', component: PartnersComponent },
    { path: 'access-denied', component: AccessDeniedComponent },
    { path: '**', redirectTo: '' },
];