import { Component, type OnInit } from "@angular/core";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { ActivatedRoute, Router } from "@angular/router";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { ApiService } from "@services/api.service";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { AuthService } from "@services/auth.service";
import { ConfirmationService, MessageService } from "primeng/api";
import type { StocksList } from "@models/stock-list";
import type { HttpErrorResponse } from "@angular/common/http";
import { TableModule } from "primeng/table";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { CheckboxModule } from "primeng/checkbox";
import { FormsModule } from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ToastModule } from "primeng/toast";
import type { Portfolio } from "@models/portfolio";
import environment from "@environment";

@Component({
	selector: "app-user",
	standalone: true,
	imports: [
		TableModule,
		CommonModule,
		ButtonModule,
		DialogModule,
		CheckboxModule,
		FormsModule,
		InputTextModule,
		ConfirmDialogModule,
		ToastModule,
	],
	providers: [MessageService, ConfirmationService],
	templateUrl: "./user.component.html",
	styles: "",
})
export class UserComponent implements OnInit {
	stockLists: StocksList[] = [];
	portfolios: Portfolio[] = [];
	privateStockLists: StocksList[] = [];
	publicStockLists: StocksList[] = [];
	isCurrentUser = false;
	username = "";
	myUsername = "";
	displayCreateStockListDialog = false;
	displayCreatePortfolioDialog = false;
	newStockListName = "";
	newPortfolioName = "";
	initialDeposit = 0;
	isPrivate = false;
	profilePictureUrl = "assets/images/default-pfp.png";

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private apiService: ApiService,
		private authService: AuthService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService,
	) {}

	ngOnInit(): void {
		this.authService.getCredentials().subscribe((user) => {
			this.myUsername = user.username;
			this.checkUser();
		});

		this.route.params.subscribe((params) => {
			// biome-ignore lint/complexity/useLiteralKeys: angular needs it like this
			this.username = params["username"];
			this.checkUser();
			this.loadProfilePicture();
		});
	}

	checkUser() {
		this.isCurrentUser = this.username === this.myUsername;
		if (this.isCurrentUser) {
			this.loadStockLists();
			this.loadPortfolios();
		} else {
			this.loadPrivateStockListsSharedWithUser();
			this.loadPublicStockLists();
		}
	}

	async loadPrivateStockListsSharedWithUser() {
		try {
			this.privateStockLists =
				await this.apiService.getPrivateStockListsSharedWithUser(this.username);
		} catch (error) {
			this.messageService.add({
				severity: "error",
				summary: "Error",
				detail: (error as HttpErrorResponse).error.error,
			});
		}
	}

	async loadPublicStockLists() {
		try {
			this.publicStockLists = await this.apiService.getUserPublicStockLists(
				this.username,
			);
		} catch (error) {
			this.messageService.add({
				severity: "error",
				summary: "Error",
				detail: (error as HttpErrorResponse).error.error,
			});
		}
	}

	async loadStockLists() {
		try {
			this.stockLists = await this.apiService.getUserStockLists();
		} catch (error) {
			this.messageService.add({
				severity: "error",
				summary: "Error",
				detail: (error as HttpErrorResponse).error.error,
			});
		}
	}

	async loadPortfolios() {
		try {
			this.portfolios = await this.apiService.getUserPortfolios();
		} catch (error) {
			this.messageService.add({
				severity: "error",
				summary: "Error",
				detail: (error as HttpErrorResponse).error.error,
			});
		}
	}

	async createStockList() {
		try {
			await this.apiService.createStockList(
				this.newStockListName,
				this.isPrivate,
			);
			this.messageService.add({
				severity: "success",
				summary: "Success",
				detail: "Stock list created successfully",
			});
			this.displayCreateStockListDialog = false;
			this.loadStockLists();
		} catch (error) {
			this.messageService.add({
				severity: "error",
				summary: "Error",
				detail: (error as HttpErrorResponse).error.error,
			});
		}
	}

	async loadProfilePicture() {
		try {
			const response = await this.apiService.getOtherProfilePicture(
				this.username,
			);
			this.profilePictureUrl = `${environment.api_url}${response.profilePicture}`;
		} catch (error) {
			this.messageService.add({
				severity: "error",
				summary: "Error",
				detail: (error as HttpErrorResponse).error.error,
			});
		}
	}

	async createPortfolio() {
		try {
			await this.apiService.createPortfolio(
				this.newPortfolioName,
				this.initialDeposit,
			);
			this.messageService.add({
				severity: "success",
				summary: "Success",
				detail: "Portfolio created successfully",
			});
			this.displayCreatePortfolioDialog = false;
			this.loadPortfolios();
		} catch (error) {
			this.messageService.add({
				severity: "error",
				summary: "Error",
				detail: (error as HttpErrorResponse).error.error,
			});
		}
	}

	async deleteStockList(stockListName: string) {
		try {
			await this.apiService.deleteStockList(stockListName);
			this.messageService.add({
				severity: "success",
				summary: "Success",
				detail: "Stock list deleted successfully",
			});
			this.loadStockLists();
		} catch (error) {
			this.messageService.add({
				severity: "error",
				summary: "Error",
				detail: (error as HttpErrorResponse).error.error,
			});
		}
	}

	async deletePortfolio(portfolioName: string) {
		try {
			await this.apiService.deletePortfolio(portfolioName);
			this.messageService.add({
				severity: "success",
				summary: "Success",
				detail: "Portfolio deleted successfully",
			});
			this.loadPortfolios();
		} catch (error) {
			this.messageService.add({
				severity: "error",
				summary: "Error",
				detail: (error as HttpErrorResponse).error.error,
			});
		}
	}

	confirmDelete(stockListName: string) {
		this.confirmationService.confirm({
			message: "Are you sure you want to delete this stock list?",
			accept: () => {
				this.deleteStockList(stockListName);
			},
		});
	}

	confirmDeletePortfolio(portfolioName: string) {
		this.confirmationService.confirm({
			message: "Are you sure you want to delete this portfolio?",
			accept: () => {
				this.deletePortfolio(portfolioName);
			},
		});
	}

	goToStock(stockListName: string) {
		this.router.navigate(["/stocks", stockListName]);
	}

	goToPortfolio(portfolioName: string) {
		this.router.navigate([
			`/user/id/${this.username}/portfolios`,
			portfolioName,
		]);
	}

	showCreateStockListDialog() {
		this.displayCreateStockListDialog = true;
	}

	showCreatePortfolioDialog() {
		this.displayCreatePortfolioDialog = true;
	}
}
