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
import type { Review } from "@models/review";
import { RatingModule } from "primeng/rating";
import type { SharedUser } from "@models/shared-user";
import { InputTextareaModule } from "primeng/inputtextarea";
import type { StockListEntry } from "@models/stock-list-entry";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { StockMatrixComponent } from "@components/stock-matrix/stock-matrix.component";
import { CalendarModule } from "primeng/calendar";


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
		RatingModule,
		InputTextareaModule,
    ProgressSpinnerModule,
    StockMatrixComponent,
    CalendarModule
	],
	providers: [MessageService],
	templateUrl: "./individual-stock-list.component.html",
	styles: "",
})
export class IndividualStockListComponent implements OnInit {
	username = "";
	stockListName = "";
	stocks: StockListEntry[] = [];
	displayAddStockDialog = false;
	displayShareStockListDialog = false;
	displayAddReviewDialog = false;
  displayDateFilterDialog = false;
	buyStockSymbol: Stock = { stock_symbol: "", company: "", description: "" };
	buyNumShares = 0;
	filteredStocks: StockListEntry[] = [];
	isPrivate = false;
	isOwner = false;
	authenticatedUser = "";
	sharedUsers: SharedUser[] = [];
	filteredUsers: User[] = [];
	shareWithUser: User = {
		username: "",
		password_hash: "",
		profile_picture: "",
		full_name: "",
		user_created_at: new Date(),
	};
	reviewContent = "";
	reviewRating = 0;
	reviews: Review[] = [];
	userReview: Review | null = null;
	otherReviews: Review[] = [];
	displayEditReviewDialog = false;
	reviewToEdit: Review | null = null;
	hasAccess = true;
  stockListBeta = 0;
	correlations: any[] = [];
	covariances: any[] = [];
	dateRange: Date[] | null = null;
	loading = false;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private apiService: ApiService,
		private messageService: MessageService,
		private authService: AuthService,
	) {}

	ngOnInit(): void {
		this.route.params.subscribe((params) => {
			// biome-ignore lint/complexity/useLiteralKeys: angular needs it like this
			this.username = params["username"];
			// biome-ignore lint/complexity/useLiteralKeys: angular needs it like this
			this.stockListName = params["stock_list_name"];
			this.authService.getCredentials().subscribe(async (user) => {
				this.authenticatedUser = user.username;
				this.isOwner = this.authenticatedUser === this.username;
				this.hasAccess = await this.apiService.hasAccessToStockList(
					this.username,
					this.stockListName,
				);
				console.log(this.hasAccess);
				if (this.hasAccess) {
					this.loadAllData().then(() => {
						if (this.isOwner && this.isPrivate) {
							this.loadSharedUsers();
						}
					});
					this.loadReviews();
				} else {
					this.logError("You do not have access to this stock list.");
				}
			});
		});
	}

  async loadAllData(startDate?: Date, endDate?: Date) {
		this.loading = true;

		try {
			await Promise.all([
				this.loadStockList(startDate, endDate),
				this.loadStockListBeta(startDate, endDate),
				this.loadCorrelationMatrix(startDate, endDate),
				this.loadCovarianceMatrix(startDate, endDate),
			]);
			if (startDate && endDate) {
				this.logSuccess("Success", "Filter applied successfully");
			}
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		} finally {
			this.loading = false;
		}
	}

	async loadStockList(startDate?: Date, endDate?: Date) {
    const startDateStr = startDate?.toISOString().split("T")[0];
    const endDateStr = endDate?.toISOString().split("T")[0];
		try {
			this.stocks = await this.apiService.getStocksInList(
				this.username,
				this.stockListName,
			);
			this.isPrivate = await this.apiService.isStockListPrivate(
				this.username,
				this.stockListName,
			);

      for (const stockListEntry of this.stocks) {
				const stockBeta =
					startDateStr && endDateStr
						? await this.apiService.getPortfoliosStockBetaDateRange(
								stockListEntry.stock_symbol,
								startDateStr,
								endDateStr,
						  )
						: await this.apiService.getPortfolioStocksBeta(
								stockListEntry.stock_symbol,
						  );
				stockListEntry.stock_beta = Math.round(stockBeta.stock_beta * 1000) / 1000;

				const stockCOV =
					startDateStr && endDateStr
						? await this.apiService.getPortfolioStockCOVDateRange(
								stockListEntry.stock_symbol,
								startDateStr,
								endDateStr,
						  )
						: await this.apiService.getPortfolioStockCOV(stockListEntry.stock_symbol);
				stockListEntry.stock_cov = Math.round(stockCOV.stock_cov * 1000) / 1000;
			}
      
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async loadStockListBeta(startDate?: Date, endDate?: Date) {
    const startDateStr = startDate?.toISOString().split("T")[0];
    const endDateStr = endDate?.toISOString().split("T")[0];
		try {
			const response = await this.apiService.getStockListBeta(
				this.username,
				this.stockListName,
			);
			this.stockListBeta = Math.round(response.stock_list_beta * 1000) / 1000;
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async loadCorrelationMatrix(startDate?: Date, endDate?: Date) {
		const startDateStr = startDate?.toISOString().split("T")[0];
		const endDateStr = endDate?.toISOString().split("T")[0];
		try {
			const res =
				startDateStr && endDateStr
					? await this.apiService.getStockListStockCorrelationsDateRange(
							this.username,
							this.stockListName,
							startDateStr,
							endDateStr,
					  )
					: await this.apiService.getStockListStockCorrelations(
							this.username,
							this.stockListName,
					  );
			this.correlations = res.stock_correlations;
		} catch (error) {
			console.error("Error fetching stock list correlations:", error);
		}
	}

	async loadCovarianceMatrix(startDate?: Date, endDate?: Date) {
		const startDateStr = startDate?.toISOString().split("T")[0];
		const endDateStr = endDate?.toISOString().split("T")[0];
		try {
			const res =
				startDateStr && endDateStr
					? await this.apiService.getStockListStockCovariancesDateRange(
							this.username,
							this.stockListName,
							startDateStr,
							endDateStr,
					  )
					: await this.apiService.getStockListStockCovariances(
							this.username,
							this.stockListName,
					  );
			this.covariances = res.stock_covariances;
		} catch (error) {
			console.error("Error fetching stock list covariances:", error);
		}
	}

  async applyDateFilter() {
    if (!this.dateRange || this.dateRange.length !== 2) {
        this.logError("Please select a valid date range.");
        return;
    }

    const [startDate, endDate] = this.dateRange;

    this.displayDateFilterDialog = false;

    this.loadAllData(startDate, endDate);
}

  showDateFilterDialog() {
    this.displayDateFilterDialog = true;
}

	showEditReviewDialog(review: Review) {
		this.reviewToEdit = { ...review };
		this.displayEditReviewDialog = true;
	}

	async updateReview() {
		if (
			!this.reviewToEdit ||
			!this.reviewToEdit.content ||
			this.reviewToEdit.rating < 0 ||
			this.reviewToEdit.rating > 5
		) {
			this.logError("Please provide valid review content and rating (0-5).");
			return;
		}

		try {
			await this.apiService.updateReview(
				this.username,
				this.stockListName,
				this.reviewToEdit.content,
				this.reviewToEdit.rating,
			);
			this.logSuccess("Success", "Review updated successfully");
			this.displayEditReviewDialog = false;
			this.loadReviews();
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async deleteReview(review: Review) {
		try {
			console.log(review);
			await this.apiService.deleteReview(
				review.stock_list_owner,
				review.stock_list_name,
				review.reviewer,
			);
			this.logSuccess("Success", "Review deleted successfully");
			this.loadReviews();
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async loadReviews() {
		try {
			console.log(this.username, this.stockListName);
			const reviews = await this.apiService.getReviews(
				this.username,
				this.stockListName,
			);
			this.userReview =
				reviews.find((review) => review.reviewer === this.authenticatedUser) ||
				null;
			this.otherReviews = reviews.filter(
				(review) => review.reviewer !== this.authenticatedUser,
			);
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async loadSharedUsers() {
		try {
			const result = await this.apiService.getSharedUsers(this.stockListName);
			this.sharedUsers = result.users;
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

	showAddReviewDialog() {
		this.displayAddReviewDialog = true;
		this.reviewContent = "";
		this.reviewRating = 0;
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

	async revokeSharing(user: SharedUser) {
		try {
			await this.apiService.revokeSharing(this.stockListName, user.user);
			this.logSuccess("Success", "Sharing revoked successfully");
			this.loadSharedUsers();
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
      // @ts-ignore
			this.filteredStocks = results.company;
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async searchUsers(event: any) {
		try {
			const results = await this.apiService.searchUnsharedFriends(
				this.stockListName,
				event.query,
			);
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

	async addReview() {
		if (!this.reviewContent || this.reviewRating < 0 || this.reviewRating > 5) {
			this.logError("Please provide valid review content and rating (0-5).");
			return;
		}

		try {
			await this.apiService.addReview(
				this.username,
				this.stockListName,
				this.reviewContent,
				this.reviewRating,
			);
			this.logSuccess("Success", "Review added successfully");
			this.displayAddReviewDialog = false;
			this.loadReviews();
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
