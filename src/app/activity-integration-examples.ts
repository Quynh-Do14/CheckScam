  );
}

// Ví dụ cho Report component
// Trong create-report.component.ts
submitReport() {
  const reportData = this.reportForm.value;
  
  this.reportService.createReport(reportData).subscribe(
    (response) => {
      // Log activity after successful report creation
      const userId = this.getCurrentUserId();
      this.activityService.logReportActivity(
        userId,
        reportData.category,
        reportData.description,
        {
          severity: reportData.severity,
          website: reportData.website,
          evidence_count: reportData.evidences?.length || 0
        }
      );
      
      this.router.navigate(['/report']);
    }
  );
}

// Ví dụ cho Registration component
// Trong register.component.ts
register() {
  this.userService.register(this.registerForm.value).subscribe(
    (response) => {
      // Log join activity for new user
      this.activityService.logJoinActivity(
        response.userId,
        'cộng đồng CheckScam',
        {
          referrer: 'direct_registration',
          registration_method: 'email'
        }
      );
      
      this.router.navigate(['/login']);
    }
  );
}