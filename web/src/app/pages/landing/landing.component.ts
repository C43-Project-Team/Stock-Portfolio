import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { catchError, map, of, type Observable } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { MenubarModule } from 'primeng/menubar';
// biome-ignore lint/style/useImportType: angular needs the whole module for elements passed in constructor 
import { AuthService } from '@services/auth.service';
import { ApiService } from '@services/api.service';

@Component({
	selector: "app-landing",
	standalone: true,
	imports: [CommonModule, RouterModule, ButtonModule, MenubarModule],
	templateUrl: "./landing.component.html",
	styles: [],
})
export class LandingComponent implements OnInit {
	isAuthenticated$!: Observable<boolean>;
	user$!: Observable<any>;

  constructor(private authService: AuthService, private router: Router, private apiService: ApiService) {}

  ngOnInit() {
    this.isAuthenticated$ = this.authService.isAuthenticated();
    this.user$ = this.authService.getCredentials().pipe(
      catchError(() => of(null))
    );
    this.apiService.test().then((res) => {
      console.log(res);
    });
  }

	navigateTo(path: string) {
		this.router.navigate([path]);
	}
}
