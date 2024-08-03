// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import environment from "@environment";
import type { FriendsTable } from "@models/friends-table";
import type { StocksList } from "@models/stock-list";
import { take } from "rxjs";
import type { Portfolio } from "@models/portfolio";
import type { Investment } from "@models/investment";
import { Stock } from "@models/stock";
import { User } from "@models/user";
import {
	StockCorrelationsResponse,
	StockCovarianceResponse,
} from "@components/stock-matrix/stock-correlation-covariance.interface";
import { Review } from "@models/review";
import { SharedUser } from "@models/shared-user";
import { StockListEntry } from "@models/stock-list-entry";

@Injectable({
	providedIn: "root",
})
export class ApiService {
	private readonly API_URL = environment.api_url;

	constructor(private http: HttpClient) {}

	private async get<T>(endpoint: string): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			this.http
				.get<T>(encodeURI(`${this.API_URL}${endpoint}`))
				.pipe(take(1))
				.subscribe({
					next: (res) => resolve(res),
					error: (err: HttpErrorResponse) => reject(err),
				});
		});
	}

	// biome-ignore lint/suspicious/noExplicitAny: necessary
	private async post<T>(endpoint: string, body: any): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			this.http
				.post<T>(encodeURI(`${this.API_URL}${endpoint}`), body)
				.pipe(take(1))
				.subscribe({
					next: (res) => resolve(res),
					error: (err: HttpErrorResponse) => reject(err),
				});
		});
	}

	// biome-ignore lint/suspicious/noExplicitAny: necessary
	private async patch<T>(endpoint: string, body: any): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			this.http
				.patch<T>(encodeURI(`${this.API_URL}${endpoint}`), body)
				.pipe(take(1))
				.subscribe({
					next: (res) => resolve(res),
					error: (err: HttpErrorResponse) => reject(err),
				});
		});
	}

	// biome-ignore lint/suspicious/noExplicitAny: necessary
	private async delete<T>(endpoint: string, body: any): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.http
				.request<void>("delete", encodeURI(`${this.API_URL}${endpoint}`), {
					body,
				})
				.pipe(take(1))
				.subscribe({
					next: () => resolve(),
					error: (err: HttpErrorResponse) => reject(err),
				});
		});
	}

	/* USER STUFF */

	async getMyProfilePicture(): Promise<{ profilePicture: string }> {
		return this.get<{ profilePicture: string }>("/user/my-profile-picture");
	}

	async getOtherProfilePicture(
		username: string,
	): Promise<{ profilePicture: string }> {
		return this.get<{ profilePicture: string }>(
			`/user/profile-picture/${username}`,
		);
	}

	async searchUsers(query: string): Promise<{ users: User[] }> {
		return this.get<{ users: User[] }>(`/user/search?query=${query}`);
	}

	/* FRIEND STUFF */

	async getConnections(): Promise<{
		connections: FriendsTable[];
		incomingRequests: FriendsTable[];
	}> {
		return this.get<{
			connections: FriendsTable[];
			incomingRequests: FriendsTable[];
		}>("/friends/connections");
	}

	async getSentRequests(): Promise<FriendsTable[]> {
		return this.get<FriendsTable[]>("/friends/sent-requests");
	}

	async requestFriend(username: string): Promise<FriendsTable | null> {
		return this.post<FriendsTable>("/friends/request", { friend: username });
	}

	async acceptFriendRequest(username: string): Promise<FriendsTable | null> {
		return this.post<FriendsTable>("/friends/accept", { friend: username });
	}

	async removeFriend(username: string): Promise<FriendsTable | null> {
		return this.post<FriendsTable>("/friends/remove", { friend: username });
	}

	async withdrawFriendRequest(username: string): Promise<FriendsTable | null> {
		return this.post<FriendsTable>("/friends/withdraw", { friend: username });
	}

	async searchForPotentialFriends(query: string): Promise<{ users: User[] }> {
		return this.get<{ users: User[] }>(`/friends/search?query=${query}`);
	}

	/* STOCK LIST STUFF */

	async getUserStockLists(): Promise<StocksList[]> {
		return this.get<StocksList[]>("/stock-list");
	}

	async createStockList(
		stockListName: string,
		isPrivate: boolean,
	): Promise<{ stockList: StocksList }> {
		return this.post("/stock-list/create", {
			stock_list_name: stockListName,
			private: isPrivate,
		});
	}

	async deleteStockList(stockListName: string): Promise<void> {
		return this.delete<void>("/stock-list/delete", {
			stock_list_name: stockListName,
		});
	}

	async getPrivateStockListsSharedWithUser(
		username: string,
	): Promise<StocksList[]> {
		return this.get<StocksList[]>(`/stock-list/private-shared/${username}`);
	}

	async getAllPrivateStockListsSharedWithUser(): Promise<StocksList[]> {
		return this.get<StocksList[]>("/stock-list/private-shared");
	}

	async getUserPublicStockLists(username: string): Promise<StocksList[]> {
		const endpoint = `/stock-list/public/user/${username}`;
		return this.get<StocksList[]>(endpoint);
	}

	async getPublicStockLists(
		page: number,
		limit: number,
	): Promise<StocksList[]> {
		const endpoint = `/stock-list/public?page=${page}&limit=${limit}`;
		return this.get<StocksList[]>(endpoint);
	}

	async hasAccessToStockList(
		username: string,
		stockListName: string,
	): Promise<boolean> {
		return this.get<boolean>(
			`/stock-list/${username}/${stockListName}/has-access`,
		);
	}

	async getPublicStockListCount(): Promise<{ count: number }> {
		const endpoint = "/stock-list/public/count";
		return this.get<{ count: number }>(endpoint);
	}

	async getStocksInList(
		username: string,
		stockListName: string,
	): Promise<StockListEntry[]> {
		return this.get<StockListEntry[]>(`/stock-list/${username}/${stockListName}/stocks`);
	}

	async isStockListPrivate(
		username: string,
		stockListName: string,
	): Promise<boolean> {
		return this.get<boolean>(
			`/stock-list/${username}/${stockListName}/is-private`,
		);
	}

	async searchUnsharedFriends(
		stockListName: string,
		query: string,
	): Promise<{ users: User[] }> {
		return this.get<{ users: User[] }>(
			`/stock-list/${stockListName}/search-unshared-friends?query=${query}`,
		);
	}

	async revokeSharing(stockListName: string, user: string): Promise<void> {
		return this.post<void>(`/stock-list/${stockListName}/revoke`, {
			user: user,
		});
	}

	async getSharedUsers(
		stockListName: string,
	): Promise<{ users: SharedUser[] }> {
		return this.get<{ users: SharedUser[] }>(
			`/stock-list/${stockListName}/shared-users`,
		);
	}

	async addStockToList(
		stockListName: string,
		stockSymbol: string,
		numShares: number,
	): Promise<void> {
		return this.post<void>(`/stock-list/${stockListName}/add`, {
			stock_symbol: stockSymbol,
			num_shares: numShares,
		});
	}

	async removeSharesFromStockList(
		stockListName: string,
		stockSymbol: string,
		numShares: number,
	): Promise<void> {
		return this.post<void>(`/stock-list/${stockListName}/remove-shares`, {
			stock_symbol: stockSymbol,
			num_shares: numShares,
		});
	}

	async deleteStockFromList(
		stockListName: string,
		stockSymbol: string,
	): Promise<void> {
		return this.post<void>(`/stock-list/${stockListName}/delete-stock`, {
			stock_symbol: stockSymbol,
		});
	}

	async toggleStockListVisibility(
		stockListName: string,
		isPrivate: boolean,
	): Promise<void> {
		return this.patch<void>("/stock-list/toggle-visibility", {
			stock_list_name: stockListName,
			private: isPrivate,
		});
	}

	async shareStockList(stockListName: string, username: string): Promise<void> {
		return this.post<void>(`/stock-list/${stockListName}/share`, {
			user: username,
		});
	}

  async getStockListBeta(
		owner: string,
		stockListName: string,
	): Promise<{ stock_list_beta: number }> {
		return this.post<{ stock_list_beta: number }>("/stock-list/stockList-beta", {
			owner,
			stockListName,
		});
	}

  async getStockListBetaDateRange(
    owner: string,
    stockListName: string,
    startDate: string,
    endDate: string
  ) : Promise<{ stock_list_beta: number }> {
    return this.post<{ stock_list_beta: number }>("/stock-list/stockList-beta-date-range", {
      owner, stockListName, startDate, endDate
    });
  }

	async getStockListStockCorrelations(
		owner: string,
		stockListName: string,
	): Promise<StockCorrelationsResponse> {
		return this.post<StockCorrelationsResponse>(
			"/stock-list/stock-correlations",
			{ owner, stockListName },
		);
	}

  async getStockListStockCorrelationsDateRange(
    owner: string,
    stockListName: string,
    startDate: string,
    endDate: string
  ) : Promise<StockCorrelationsResponse> {
    return this.post<StockCorrelationsResponse>("/stock-list/stock-correlations-date-range", {
      owner, stockListName, startDate, endDate
    });
  }

	async getStockListStockCovariances(
		owner: string,
		stockListName: string,
	): Promise<StockCovarianceResponse> {
		return this.post<StockCovarianceResponse>("/stock-list/stock-covariance", {
			owner,
			stockListName,
		});
	}

  async getStockListStockCovariancesDateRange(
    owner: string,
    stockListName: string,
    startDate: string,
    endDate: string
  ) : Promise<StockCovarianceResponse> {
    return this.post<StockCovarianceResponse>("/stock-list/stock-covariance-date-range", {
      owner, stockListName, startDate, endDate
    });
  }

	/* PORTFOLIO STUFF */

	async getUserPortfolios(): Promise<Portfolio[]> {
		return this.get<Portfolio[]>("/portfolio");
	}

	async createPortfolio(
		portfolioName: string,
		initialDeposit: number,
	): Promise<{ portfolio: Portfolio }> {
		return this.post("/portfolio/create", {
			portfolio_name: portfolioName,
			initialDeposit,
		});
	}

	async deletePortfolio(portfolioName: string): Promise<void> {
		return this.delete("/portfolio/delete", {
			portfolio_name: portfolioName,
		});
	}

	async getPortfolio(portfolioName: string): Promise<{ cash: number }> {
		return this.get<{ cash: number }>(`/portfolio/${portfolioName}`);
	}

	async getPortfolioInvestments(portfolioName: string): Promise<Investment[]> {
		return this.get<Investment[]>(`/portfolio/${portfolioName}/investments`);
	}

	async depositMoney(portfolioName: string, amount: number): Promise<void> {
		return this.post<void>(`/portfolio/${portfolioName}/deposit`, {
			amount,
		});
	}

	async buyShares(
		portfolioName: string,
		stockSymbol: string,
		numShares: number,
	): Promise<void> {
		return this.post<void>(`/portfolio/${portfolioName}/buy`, {
			stock_symbol: stockSymbol,
			num_shares: numShares,
		});
	}

	async sellShares(
		portfolioName: string,
		stockSymbol: string,
		numShares: number,
	): Promise<void> {
		return this.post<void>(`/portfolio/${portfolioName}/sell`, {
			stock_symbol: stockSymbol,
			num_shares: numShares,
		});
	}

	async getPortfolioBeta(
		owner: string,
		portfolioName: string,
	): Promise<{ portfolio_beta: number }> {
		return this.post<{ portfolio_beta: number }>("/portfolio/portfolio-beta", {
			owner,
			portfolioName,
		});
	}

  async getPortfolioBetaDateRange(
    owner: string,
    portfolioName: string,
    startDate: string,
    endDate: string
  ) : Promise<{ portfolio_beta: number }> {
    return this.post<{ portfolio_beta: number }>("/portfolio/portfolio-beta-date-range", {
      owner, portfolioName, startDate, endDate
    });
  }

	async getPortfolioStocksBeta(
		stockTicker: string,
	): Promise<{ stock_beta: number }> {
		return this.post<{ stock_beta: number }>("/portfolio/stock-beta", {
			stock_ticker: stockTicker,
		});
	}

  async getPortfoliosStockBetaDateRange(stockTicker: string, startDate: string, endDate: string): Promise<{ stock_beta: number }> {
    return this.post<{ stock_beta: number }>("/portfolio/stock-beta-date-range", {
      stockTicker, startDate, endDate
    });
  }

	async getPortfolioStockCorrelations(
		owner: string,
		portfolio_name: string,
	): Promise<StockCorrelationsResponse> {
		return this.post<StockCorrelationsResponse>(
			"/portfolio/stock-correlations",
			{ owner, portfolio_name },
		);
	}

  async getPortfolioStockCorrelationsDateRange(
    owner: string,
    portfolioName: string,
    startDate: string,
    endDate: string
  ) : Promise<StockCorrelationsResponse> {
    return this.post<StockCorrelationsResponse>("/portfolio/stock-correlations-date-range", {
      owner, portfolioName, startDate, endDate
    });
  }

	async getPortfolioStockCovariances(
		owner: string,
		portfolio_name: string,
	): Promise<StockCovarianceResponse> {
		return this.post<StockCovarianceResponse>("/portfolio/stock-covariance", {
			owner,
			portfolio_name,
		});
	}

  async getPortfolioStockCovariancesDateRange(
    owner: string,
    portfolioName: string,
    startDate: string,
    endDate: string
  ) : Promise<StockCovarianceResponse> {
    return this.post<StockCovarianceResponse>("/portfolio/stock-covariance-date-range", {
      owner, portfolioName, startDate, endDate
    });
  }

	async getPortfolioStockCOV(
		stockSymbol: string,
	): Promise<{ stock_cov: number }> {
		return this.post<{ stock_cov: number }>("/portfolio/stock-cov", {
			stock_symbol: stockSymbol,
		});
	}

  async getPortfolioStockCOVDateRange(
    stockSymbol: string,
    startDate: string,
    endDate: string
  ) : Promise<{ stock_cov: number }> {
    return this.post<{ stock_cov: number }>("/portfolio/stock-cov-date-range", {
      stockSymbol, startDate, endDate
    });
  }

	async depositBetweenPortfolios(
		owner: string,
		fromPortfolio: string,
		toPortfolio: string,
		amount: number,
	): Promise<void> {
		return this.post<void>("/portfolio/portfolio-cash-transfer", {
			owner,
			from_portfolio_name: fromPortfolio,
			to_portfolio_name: toPortfolio,
			amount,
		});
	}

	/* STOCK STUFF */
	getStockPrice(stockSymbol: string): Promise<{ price: number }> {
		return this.get<{ price: number }>(`/stock/${stockSymbol}/price`);
	}

	searchStocks(query: string): Promise<{ company: Stock[] }> {
		return this.get<{ company: Stock[] }>(
			`/stock/similar/stock-company/${query}`,
		);
	}

	/* REVIEW STUFF */
	async addReview(
		stockListOwner: string,
		stockListName: string,
		content: string,
		rating: number,
	): Promise<void> {
		return this.post<void>(
			`/stock-list/${stockListOwner}/${stockListName}/reviews`,
			{ content, rating },
		);
	}

	async getReviews(
		stock_list_owner: string,
		stock_list_name: string,
	): Promise<Review[]> {
		return this.get<Review[]>(
			`/stock-list/${stock_list_owner}/${stock_list_name}/reviews`,
		);
	}

	async updateReview(
		stockListOwner: string,
		stockListName: string,
		content: string,
		rating: number,
	): Promise<void> {
		return this.patch<void>(
			`/stock-list/${stockListOwner}/${stockListName}/reviews`,
			{ content, rating },
		);
	}

	async deleteReview(
		stockListOwner: string,
		stockListName: string,
		reviewer: string,
	): Promise<void> {
		return this.delete<void>(
			`/stock-list/${stockListOwner}/${stockListName}/reviews`,
			{ reviewer },
		);
	}

  async test() {
    return this.get<any>("/test");
  }
}
