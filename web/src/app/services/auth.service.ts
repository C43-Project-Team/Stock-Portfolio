// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, map, type Observable, take, throwError } from "rxjs";
import environment from "../../environments/environment";

@Injectable({
	providedIn: "root",
})
export class AuthService {
	private readonly TOKEN_KEY = environment.token_key;
	private readonly API_URL = environment.api_url;

	constructor(private http: HttpClient) {}

	login(username: string, password: string): Observable<any> {
		return this.http
			.post<{ token: string }>(`${this.API_URL}/auth/signin`, {
				username,
				password,
			})
			.pipe(
				take(1), // Ensure the subscription completes after the first emission
				map((response) => {
					this.setToken(response.token);
					return response;
				}),
				catchError((error) => {
					console.error("Login error:", error);
					return throwError(() => new Error(error.message || "Login failed"));
				}),
			);
	}

	signUp(
		fullName: string,
		username: string,
		password: string,
	): Observable<any> {
		return this.http
			.post<{ token: string }>(`${this.API_URL}/auth/signup`, {
				fullName,
				username,
				password,
			})
			.pipe(
				take(1), // Ensure the subscription completes after the first emission
				map((response) => {
					this.setToken(response.token);
					return response;
				}),
				catchError((error) => {
					console.error("Sign-up error:", error);
					return throwError(() => new Error(error.message || "Login failed"));
				}),
			);
	}

	getCredentials(): Observable<any> {
		return this.http.get<{ user: any }>(`${this.API_URL}/auth/me`).pipe(
			map((response) => response.user),
			catchError((error) => {
				return throwError(
					() => new Error(error.message || "Failed to fetch credentials"),
				);
			}),
		);
	}

	private setToken(token: string): void {
		localStorage.setItem(this.TOKEN_KEY, token);
	}

	logout(): void {
		localStorage.removeItem(this.TOKEN_KEY);
	}

	getToken(): string | null {
		return localStorage.getItem(this.TOKEN_KEY);
	}
}
