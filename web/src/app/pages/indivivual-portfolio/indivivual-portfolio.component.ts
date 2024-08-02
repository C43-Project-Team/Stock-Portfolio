import { CommonModule } from "@angular/common";
import type { HttpErrorResponse } from "@angular/common/http";
import { Component, type OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { ActivatedRoute, Router } from "@angular/router";
import type { Investment } from "@models/investment";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { ApiService } from "@services/api.service";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { TableModule } from "primeng/table";
import { ToastModule } from "primeng/toast";
import { Subject } from "rxjs";
import { DataViewModule } from "primeng/dataview";
import { AutoCompleteModule } from "primeng/autocomplete";
import type { Stock } from "@models/stock";
import { StockMatrixComponent } from "@components/stock-matrix/stock-matrix.component";
import { Portfolio } from "@models/portfolio";
import { DropdownModule } from "primeng/dropdown";
import { AuthService } from "@services/auth.service";

@Component({
	selector: "app-indivivual-portfolio",
	standalone: true,
	imports: [
		ButtonModule,
		DialogModule,
		TableModule,
		FormsModule,
		CommonModule,
		InputTextModule,
		ToastModule,
		DataViewModule,
		AutoCompleteModule,
		StockMatrixComponent,
		DropdownModule,
	],
	providers: [MessageService],
	templateUrl: "./indivivual-portfolio.component.html",
	styles: "",
})
export class IndivivualPortfolioComponent implements OnInit {
	username = "";
	portfolioName = "";
	portfolioCash = 0;
	investments: Investment[] = [];
	displayDepositDialog = false;
	displayBuySharesDialog = false;
	displaySellSharesDialog = false;
	displayDepositOptionsDialog = false;
	displayBetweenPortfoliosDialog = false;
	depositAmount = 0;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	buyStockSymbol: any = "";
	buyNumShares = 0;
	buyPricePerShare = 0;
	sellStockSymbol = "";
	sellNumShares = 0;
	sellPricePerShare = 0;
	totalCost = 0;
	totalGain = 0;
	portfolioBeta = 0;
	hasEnoughFunds = true;
	filteredStocks: Stock[] = [];
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	correlations: any[] = [];
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	covariances: any[] = [];
	portfolios: Portfolio[] = [];
	selectedPortfolio: Portfolio | null = null;
	hasAccess = false;

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
			this.portfolioName = params["portfolio_name"];
			this.authService.getCredentials().subscribe(async (user) => {
				if (user.username !== this.username) {
					this.logError("You do not have access to this portfolio.");
					return;
				}
				this.hasAccess = true;
				await this.loadPortfolio();
				this.loadInvestments();
				this.loadPortfolioBeta();
				this.loadCorrelationMatrix();
				this.loadCovarianceMatrix();
				this.loadUserPortfolios();
			});
		});
	}

	async loadUserPortfolios() {
		try {
			this.portfolios = await this.apiService.getUserPortfolios();
			this.portfolios = this.portfolios.filter(
				(portfolio) => portfolio.portfolio_name !== this.portfolioName,
			);
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async loadCorrelationMatrix() {
		try {
			const res = await this.apiService.StockCorrelations(
				this.username,
				this.portfolioName,
			);
			this.correlations = res.stock_correlations;
		} catch (error) {
			console.error("Error fetching stock correlations:", error);
		}
	}

	async loadCovarianceMatrix() {
		try {
			const res = await this.apiService.StockCovariances(
				this.username,
				this.portfolioName,
			);
			this.covariances = res.stock_covariances;
			// console.log(this.covariances);
		} catch (error) {
			console.error("Error fetching stock covariances:", error);
		}
	}

	async loadPortfolio() {
		try {
			const portfolio = await this.apiService.getPortfolio(this.portfolioName);
			this.portfolioCash = portfolio.cash;
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async loadInvestments() {
		try {
			this.investments = await this.apiService.getPortfolioInvestments(
				this.portfolioName,
			);

			for (const investment of this.investments) {
				const stockBeta = await this.apiService.getPortfolioStocksBeta(
					investment.stock_symbol,
				);
				investment.stock_beta = Math.round(stockBeta.stock_beta * 1000) / 1000;

				const stockCOV = await this.apiService.getPortfolioStockCOV(
					investment.stock_symbol,
				);
				investment.stock_cov = Math.round(stockCOV.stock_cov * 1000) / 1000;
			}
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async loadPortfolioBeta() {
		try {
			const response = await this.apiService.getPortfolioBeta(
				this.username,
				this.portfolioName,
			);
			this.portfolioBeta = Math.round(response.portfolio_beta * 1000) / 1000;
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	showDepositOptionsDialog() {
		// New
		this.displayDepositOptionsDialog = true;
	}

	showDepositDialog() {
		// Updated
		this.displayDepositDialog = true;
		this.displayDepositOptionsDialog = false;
	}

	showBetweenPortfoliosDialog() {
		// New
		this.displayBetweenPortfoliosDialog = true;
		this.displayDepositOptionsDialog = false;
	}

	showBuyNewStockDialog() {
		this.displayBuySharesDialog = true;
		this.buyStockSymbol = "";
		this.buyNumShares = 0;
		this.totalCost = 0;
	}

	showBuySharesDialog(stockSymbol: string) {
		this.displayBuySharesDialog = true;
		this.buyStockSymbol = stockSymbol;
		this.buyNumShares = 0;
		this.totalCost = 0;
	}

	showSellSharesDialog(stockSymbol: string) {
		this.displaySellSharesDialog = true;
		this.sellStockSymbol = stockSymbol;
		this.sellNumShares = 0;
		this.totalGain = 0;
	}

	async depositMoney() {
		try {
			await this.apiService.depositMoney(
				this.portfolioName,
				this.depositAmount,
			);
			this.logSuccess("Success", "Money deposited successfully");
			this.displayDepositDialog = false;
			this.loadPortfolio();
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async transferBetweenPortfolios() {
		if (!this.selectedPortfolio) return;

		if (this.depositAmount > this.selectedPortfolio.cash) {
			this.logError("Not enough funds in the selected portfolio");
			return;
		}

		try {
			await this.apiService.depositBetweenPortfolios(
				this.username,
				this.selectedPortfolio.portfolio_name,
				this.portfolioName,
				this.depositAmount,
			);
			this.logSuccess("Success", "Funds transferred successfully");
			this.displayBetweenPortfoliosDialog = false;
			this.loadPortfolio();
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async buyShares() {
		try {
			await this.apiService.buyShares(
				this.portfolioName,
				this.buyStockSymbol.stock_symbol,
				this.buyNumShares,
			);
			this.logSuccess("Success", "Shares bought successfully");
			this.displayBuySharesDialog = false;
			this.loadPortfolio();
			this.loadInvestments();
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async sellShares() {
		try {
			await this.apiService.sellShares(
				this.portfolioName,
				this.sellStockSymbol,
				this.sellNumShares,
			);
			this.logSuccess("Success", "Shares sold successfully");
			this.displaySellSharesDialog = false;
			this.loadPortfolio();
			this.loadInvestments();
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async calculateTotalCost() {
		if (!this.buyStockSymbol.stock_symbol || !this.buyNumShares) {
			this.totalCost = 0;
			this.hasEnoughFunds = true;
			return;
		}

		try {
			const response = await this.apiService.getStockPrice(
				this.buyStockSymbol.stock_symbol,
			);
			this.buyPricePerShare = response.price;
			this.totalCost = this.buyPricePerShare * this.buyNumShares;
			this.hasEnoughFunds = this.portfolioCash >= this.totalCost;
		} catch (error) {
			this.totalCost = 0;
			this.hasEnoughFunds = true;
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async calculateTotalGain() {
		if (!this.sellStockSymbol || !this.sellNumShares) {
			this.totalGain = 0;
			return;
		}

		try {
			const response = await this.apiService.getStockPrice(
				this.sellStockSymbol,
			);
			this.sellPricePerShare = response.price;
			this.totalGain = this.sellPricePerShare * this.sellNumShares;
		} catch (error) {
			this.totalGain = 0;
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
