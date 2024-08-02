import type { Routes } from "@angular/router";
import { SignInComponent } from "./pages/sign-in/sign-in.component";
import { SignUpComponent } from "./pages/sign-up/sign-up.component";
import { LayoutComponent } from "@pages/layout/layout.component";
import { Component } from "@angular/core";
import { ConnectionsComponent } from "@pages/connections/connections.component";
import { authGuard } from "@guards/auth.guard";
import { StocksComponent } from "@pages/stocks/stocks.component";
import { UserComponent } from "@pages/user/user.component";
import { PublicStockListsComponent } from "@pages/public-stock-lists/public-stock-lists.component";
import { IndivivualPortfolioComponent } from "@pages/indivivual-portfolio/indivivual-portfolio.component";
import { IndividualStockListComponent } from "@pages/individual-stock-list/individual-stock-list.component";
import { LandingComponent } from "@pages/landing/landing.component";
import { authRedirectGuard } from "@guards/auth-redirect.guard";
import { PortfoliosComponent } from "@pages/portfolios/portfolios.component";
import { StockListsMineComponent } from "@pages/stock-lists-mine/stock-lists-mine.component";
import { StockListsSharedComponent } from "@pages/stock-lists-shared/stock-lists-shared.component";

export const routes: Routes = [
	{ path: "", component: LandingComponent },
	{
		path: "sign-in",
		component: SignInComponent,
		canActivate: [authRedirectGuard],
	},
	{
		path: "sign-up",
		component: SignUpComponent,
		canActivate: [authRedirectGuard],
	},
	{
		path: "user",
		component: LayoutComponent,
		canActivate: [authGuard],
		children: [
			{ path: "connections", component: ConnectionsComponent },
			{ path: "portfolios", component: PortfoliosComponent },
			{
				path: "id/:username",
				children: [
					{ path: "", component: UserComponent },
					{
						path: "portfolios/:portfolio_name",
						component: IndivivualPortfolioComponent,
					},
				],
			},
		],
	},
	{
		path: "stock-lists",
		component: LayoutComponent,
		canActivate: [authGuard],
		children: [
			{ path: "public", component: PublicStockListsComponent },
			{ path: "mine", component: StockListsMineComponent },
			{ path: "shared", component: StockListsSharedComponent },
			{
				path: "user/:username",
				children: [
					{ path: ":stock_list_name", component: IndividualStockListComponent },
				],
			},
		],
	},
	{ path: "stocks/:ticker", component: StocksComponent },
	{ path: "**", redirectTo: "" },
];
