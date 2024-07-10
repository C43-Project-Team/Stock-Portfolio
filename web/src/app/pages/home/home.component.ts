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
		this.isAuthenticated = !!this.authService.getToken();
		if (this.isAuthenticated) {
			this.username = "User"; // Replace with actual user info retrieval logic
		}
	}

	goToSignIn(): void {
		this.router.navigate(["/sign-in"]);
	}

	logout(): void {
		this.authService.logout();
		this.goToSignIn();
	}
}
