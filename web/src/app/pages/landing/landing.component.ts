import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import type { Observable } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { MenubarModule } from 'primeng/menubar';
// biome-ignore lint/style/useImportType: angular needs the whole module for elements passed in constructor 
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    MenubarModule,
  ],
  templateUrl: './landing.component.html',
  styles: []
})
export class LandingComponent implements OnInit {
  isAuthenticated$!: Observable<boolean>;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.isAuthenticated$ = this.authService.isAuthenticated();
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}