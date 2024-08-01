import type { Routes } from "@angular/router";
import { SignInComponent } from "./pages/sign-in/sign-in.component";
import { SignUpComponent } from "./pages/sign-up/sign-up.component";
import { HomeComponent } from "./pages/home/home.component";
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

export const routes: Routes = [
	{ path: "", component: LandingComponent },
	{ path: "sign-in", component: SignInComponent },
	{ path: "sign-up", component: SignUpComponent },
	{
		path: "user",
		component: LayoutComponent,
		canActivate: [authGuard],
		children: [
			{ path: "connections", component: ConnectionsComponent },
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
