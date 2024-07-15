import { Component, OnInit } from "@angular/core";
import { AuthService } from "../../services/auth.service";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";

@Component({
	selector: "app-home",
	standalone: true,
	imports: [CommonModule],
	templateUrl: "./home.component.html",
	styles: "",
})
export class HomeComponent implements OnInit {
	isAuthenticated = false;
	username: string | null = null;

	constructor(
		private authService: AuthService,
		private router: Router,
	) {}

	ngOnInit(): void {
		this.authService.getCredentials().subscribe({
			next: (user) => {
				this.isAuthenticated = true;
				console.log(user);
				this.username = user.username;
			},
			error: () => {
				this.isAuthenticated = false;
				this.username = null;
			},
		});
	}

	goToSignIn(): void {
		this.router.navigate(["/sign-in"]);
	}

	logout(): void {
		this.authService.logout();
		this.goToSignIn();
	}
}
