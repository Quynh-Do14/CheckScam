import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubjectDetailComponent } from './subject-detail.component';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

describe('SubjectDetailComponent', () => {
  let component: SubjectDetailComponent;
  let fixture: ComponentFixture<SubjectDetailComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      params: of({ id: 'test-id' })
    };

    await TestBed.configureTestingModule({
      imports: [SubjectDetailComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SubjectDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load subject detail on init', () => {
    expect(component.isLoading).toBe(false);
    expect(component.subjectDetail).toBeTruthy();
  });

  it('should format currency correctly', () => {
    const result = component.formatCurrency(1000000);
    expect(result).toContain('₫');
  });

  it('should get correct type text', () => {
    expect(component.getTypeText(1)).toBe('Số điện thoại');
    expect(component.getTypeText(2)).toBe('Tài khoản ngân hàng');
    expect(component.getTypeText(3)).toBe('Website');
  });

  it('should get correct risk text', () => {
    expect(component.getRiskText('high')).toBe('Nguy hiểm cao');
    expect(component.getRiskText('medium')).toBe('Cảnh báo');
    expect(component.getRiskText('low')).toBe('An toàn');
  });
});