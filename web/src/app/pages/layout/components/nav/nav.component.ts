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
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { StockService } from "@services/stocks.service";
import type { StockCompany } from "@pages/stocks/stockCompany.interface";
import { FormsModule } from "@angular/forms";
import {
	type AutoCompleteCompleteEvent,
	AutoCompleteModule,
	type AutoCompleteSelectEvent,
} from "primeng/autocomplete";

@Component({
	selector: "app-nav",
	standalone: true,
	imports: [MenuModule, MenubarModule, FormsModule, AutoCompleteModule],
	providers: [MessageService],
	templateUrl: "./nav.component.html",
	styles: "",
})
export class NavbarComponent implements OnInit {
	items: MenuItem[] = [];
	userItems: MenuItem[] = [];
	tickers: StockCompany[] = [];
	selectedTicker: any;
	profilePictureUrl = "assets/images/default-pfp.png"; // Default profile picture
	username = ""; // Add a username property

	constructor(
		private messageService: MessageService,
		private router: Router,
		private apiService: ApiService,
		private authService: AuthService,
		private stockService: StockService,
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
							this.router.navigate(["/stock-lists/mine"]);
						},
					},
					{
						label: "Shared Stock Lists",
						command: () => {
							this.router.navigate(["/stock-lists/shared"]);
						},
					},
					{
						label: "Public Stock Lists",
						command: () => {
							this.router.navigate(["/stock-lists/public"]);
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

		// Fetch the profile picture URL and username
		this.loadProfilePicture();
		this.loadUsernameAndSetupMenu();
	}

	search(event: AutoCompleteCompleteEvent) {
		this.stockService
			.getStockCompanies(event.query.length === 0 ? "*" : event.query)
			.subscribe((data) => {
				this.tickers = this.transformaData(Object.values(data));
			});
	}

	onTickerSelect(event: AutoCompleteSelectEvent) {
		this.router.navigate([
			"/stocks",
			this.selectedTicker.stockCompany.split(" - ")[0].trim(),
		]);
	}

	transformaData(data: any): any {
		if (data && Array.isArray(data) && data.length > 0) {
			const innerData = data[0];
			if (Array.isArray(innerData) && innerData.length > 0) {
				return innerData.map((stock) => ({
					stockCompany: `${stock.stock_symbol} - ${stock.company}`,
				}));
			}
		}
	}

	loadProfilePicture() {
		this.apiService
			.getMyProfilePicture()
			.then((response) => {
				console.log(response.profilePicture);
				this.profilePictureUrl = `${environment.api_url}${response.profilePicture}`;
			})
			.catch((error) => {
				console.error("Error fetching profile picture:", error);
			});
	}

	loadUsernameAndSetupMenu() {
		this.authService.getCredentials().subscribe((user) => {
			this.username = user.username;
			this.updateUserItems(); // Update the user menu items after fetching the username
		});
	}

	updateUserItems() {
		this.userItems = [
			{
				label: `Logged in as: ${this.username}`,
				disabled: true,
			},
			{
				label: "My Account",
				icon: "pi pi-fw pi-user",
				command: () => {
					this.router.navigate([`/user/id/${this.username}`]);
				},
			},
			{
				label: "Logout",
				icon: "pi pi-fw pi-sign-out",
				command: () => {
					this.logout();
				},
			},
		];
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
