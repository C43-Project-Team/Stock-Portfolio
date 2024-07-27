import { CommonModule } from "@angular/common";
import { Component, type OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { ActivatedRoute, Router } from "@angular/router";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { ApiService } from "@services/api.service";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { TableModule } from "primeng/table";
import { ToastModule } from "primeng/toast";
import { AutoCompleteModule } from "primeng/autocomplete";
import type { Stock } from "@models/stock";
import type { HttpErrorResponse } from "@angular/common/http";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { AuthService } from "@services/auth.service";
import { ToggleButtonModule } from "primeng/togglebutton";
import type { User } from "@models/user";

@Component({
	selector: "app-individual-stock-list",
	standalone: true,
	imports: [
		ButtonModule,
		DialogModule,
		TableModule,
		FormsModule,
		CommonModule,
		InputTextModule,
		ToastModule,
		AutoCompleteModule,
		ToggleButtonModule,
	],
	providers: [MessageService],
	templateUrl: "./individual-stock-list.component.html",
	styles: "",
})
export class IndividualStockListComponent implements OnInit {
	username = "";
	stockListName = "";
	stocks: Stock[] = [];
	displayAddStockDialog = false;
	displayShareStockListDialog = false;
	buyStockSymbol: Stock = { stock_symbol: "", company: "", description: "" };
	buyNumShares = 0;
	filteredStocks: Stock[] = [];
	isPrivate = false;
	isOwner = false;
	authenticatedUser = "";
	sharedUsers: User[] = [];
	filteredUsers: User[] = [];
	shareWithUser: User = {
		username: "",
		password_hash: "",
		profile_picture: "",
		full_name: "",
		user_created_at: new Date(),
	};

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private apiService: ApiService,
		private messageService: MessageService,
		private authService: AuthService,
	) {}

	ngOnInit(): void {
		this.route.params.subscribe((params) => {
			// biome-ignore lint/complexity/useLiteralKeys: Angular needs it like this
			this.username = params["username"];
			// biome-ignore lint/complexity/useLiteralKeys: Angular needs it like this
			this.stockListName = params["stock_list_name"];
			this.authService.getCredentials().subscribe((user) => {
				this.authenticatedUser = user.username;
				this.isOwner = this.authenticatedUser === this.username;
				this.loadStockList().then(() => {
					if (this.isOwner && this.isPrivate) {
						this.loadSharedUsers();
					}
				});
			});
		});
	}

	async loadStockList() {
		try {
			// Load the stocks in the list and the privacy status
			this.stocks = await this.apiService.getStocksInList(
				this.username,
				this.stockListName,
			);
			this.isPrivate = await this.apiService.isStockListPrivate(
				this.username,
				this.stockListName,
			);
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async loadSharedUsers() {
		try {
			const result = await this.apiService.getSharedUsers(this.stockListName);
			this.sharedUsers = result.users;
			console.log(this.sharedUsers);
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	showAddStockDialog() {
		this.displayAddStockDialog = true;
		this.buyStockSymbol.stock_symbol = "";
		this.buyNumShares = 0;
	}

	showShareStockListDialog() {
		this.displayShareStockListDialog = true;
		this.shareWithUser.username = "";
	}

	async addStock(stock_symbol?: string, num_shares?: number) {
		const stock_symbol_param = stock_symbol || this.buyStockSymbol.stock_symbol;
		const num_shares_param = num_shares || this.buyNumShares;

		try {
			await this.apiService.addStockToList(
				this.stockListName,
				stock_symbol_param,
				num_shares_param,
			);
			this.logSuccess("Success", "Stock added successfully");
			this.displayAddStockDialog = false;
			this.loadStockList();
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async removeShares(stock_symbol: string, num_shares: number) {
		try {
			await this.apiService.removeSharesFromStockList(
				this.stockListName,
				stock_symbol,
				num_shares,
			);
			this.logSuccess("Success", "Shares removed successfully");
			this.loadStockList();
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async deleteStock(stock_symbol: string) {
		try {
			await this.apiService.deleteStockFromList(
				this.stockListName,
				stock_symbol,
			);
			this.logSuccess("Success", "Stock deleted successfully");
			this.loadStockList();
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async toggleVisibility() {
		try {
			await this.apiService.toggleStockListVisibility(
				this.stockListName,
				this.isPrivate,
			);
			this.logSuccess("Success", "Visibility toggled successfully");
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	goToStock(stockSymbol: string) {
		this.router.navigate(["/stocks", stockSymbol]);
	}

	async searchStocks(event: any) {
		try {
			const results = await this.apiService.searchStocks(event.query);
			this.filteredStocks = results.company;
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async searchUsers(event: any) {
		try {
			const results = await this.apiService.searchUnsharedUsers(
				this.stockListName,
				event.query,
			);
			console.log(results);
			this.filteredUsers = results.users;
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async shareStockList() {
		if (!this.shareWithUser) {
			this.logError("Please select a user to share with.");
			return;
		}

		try {
			await this.apiService.shareStockList(
				this.stockListName,
				this.shareWithUser.username,
			);
			this.logSuccess("Success", "Stock list shared successfully");
			this.loadSharedUsers();
			this.shareWithUser.username = "";
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	logSuccess(summary: string, detail: string) {
		this.messageService.add({
			severity: "success",
			summary,
			detail,
		});
	}

	logError(detail: string) {
		this.messageService.add({
			severity: "error",
			summary: "Error",
			detail: detail,
		});
	}
}
