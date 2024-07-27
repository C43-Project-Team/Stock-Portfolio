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
	depositAmount = 0;
	buyStockSymbol = "";
	buyNumShares = 0;
	buyPricePerShare = 0;
	sellStockSymbol = "";
	sellNumShares = 0;
	sellPricePerShare = 0;
	totalCost = 0;
	totalGain = 0;
	hasEnoughFunds = true;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private apiService: ApiService,
		private messageService: MessageService,
	) {}

	ngOnInit(): void {
		this.route.params.subscribe((params) => {
			// biome-ignore lint/complexity/useLiteralKeys: angular needs it like this
			this.username = params["username"];
			// biome-ignore lint/complexity/useLiteralKeys: angular needs it like this
			this.portfolioName = params["portfolio_name"];
			this.loadPortfolio();
			this.loadInvestments();
		});
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
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	showDepositDialog() {
		this.displayDepositDialog = true;
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

	async buyShares() {
		try {
			await this.apiService.buyShares(
				this.portfolioName,
				this.buyStockSymbol,
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
		if (!this.buyStockSymbol || !this.buyNumShares) {
			this.totalCost = 0;
			this.hasEnoughFunds = true;
			return;
		}

		try {
			const response = await this.apiService.getStockPrice(this.buyStockSymbol);
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
