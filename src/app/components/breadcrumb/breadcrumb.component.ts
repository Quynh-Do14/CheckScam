import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SchemaService } from '../../services/seo/schema.service';

export interface BreadcrumbItem {
  label: string;
  url?: string;
  active?: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent implements OnInit {
  @Input() items: BreadcrumbItem[] = [];
  @Input() showHome: boolean = true;

  constructor(private schemaService: SchemaService) {}

  ngOnInit(): void {
    this.generateBreadcrumbSchema();
  }

  ngOnChanges(): void {
    this.generateBreadcrumbSchema();
  }

  private generateBreadcrumbSchema(): void {
    if (this.items.length === 0) return;

    const baseUrl = 'https://checkscam.vn'; // Thay bằng domain thật
    const breadcrumbs = [];

    // Add home if showHome is true
    if (this.showHome) {
      breadcrumbs.push({
        position: 1,
        name: 'Trang chủ',
        url: baseUrl
      });
    }

    // Add provided items
    this.items.forEach((item, index) => {
      breadcrumbs.push({
        position: breadcrumbs.length + 1,
        name: item.label,
        url: item.url ? `${baseUrl}${item.url}` : `${baseUrl}`
      });
    });

    // Generate and inject schema
    const schema = this.schemaService.createBreadcrumbSchema(breadcrumbs);
    this.schemaService.injectSchema(schema, 'breadcrumb-schema');
  }
}
