import { Component, type OnInit } from "@angular/core";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { Router } from "@angular/router";
import type { MenuItem } from "primeng/api";
import { MessageService } from "primeng/api";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { ApiService } from "@services/api.service";
import { MenuModule } from "primeng/menu";
import { MenubarModule } from "primeng/menubar";
import environment from "@environment";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { AuthService } from "@services/auth.service";

@Component({
	selector: "app-nav",
	standalone: true,
	imports: [MenuModule, MenubarModule],
	providers: [MessageService],
	templateUrl: "./nav.component.html",
	styles: "",
})
export class NavbarComponent implements OnInit {
	items: MenuItem[] = [];
	userItems: MenuItem[] = [];
	profilePictureUrl = "assets/images/default-pfp.png"; // Default profile picture

	constructor(
		private messageService: MessageService,
		private router: Router,
		private apiService: ApiService,
		private authService: AuthService,
	) {}

	ngOnInit() {
		this.items = [
			{
				label: "Portfolios",
				icon: "pi pi-fw pi-briefcase",
				command: () => {
					this.router.navigate(["/user/portfolios"]);
				},
			},
			{
				label: "Stock Lists",
				icon: "pi pi-fw pi-list",
				items: [
					{
						label: "My Stock Lists",
						command: () => {
							this.router.navigate(["/user/stock-lists/my"]);
						},
					},
					{
						label: "Shared Stock Lists",
						command: () => {
							this.router.navigate(["/user/stock-lists/shared"]);
						},
					},
					{
						label: "Public Stock Lists",
						command: () => {
							this.router.navigate(["/user/stock-lists/public"]);
						},
					},
				],
			},
			{
				label: "Connections",
				icon: "pi pi-fw pi-users",
				command: () => {
					this.router.navigate(["/user/connections"]);
				},
			},
		];

		this.userItems = [
			{
				label: "Logout",
				icon: "pi pi-fw pi-sign-out",
				command: () => {
					this.logout();
				},
			},
		];

		// Fetch the profile picture URL
		this.loadProfilePicture();
	}

	loadProfilePicture() {
		this.apiService
			.getProfilePicture()
			.then((response) => {
				console.log(response.profilePicture);
				this.profilePictureUrl = `${environment.api_url}${response.profilePicture}`;
			})
			.catch((error) => {
				console.error("Error fetching profile picture:", error);
			});
	}

	logout() {
		// Implement your logout logic here
		this.messageService.add({
			severity: "success",
			summary: "Logged out",
			detail: "You have been logged out",
		});
		this.authService.logout();
		this.router.navigate(["/sign-in"]);
	}
}
