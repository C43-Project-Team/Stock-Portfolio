import type { HttpHandlerFn, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import type {
	HttpRequest,
	HttpHandler,
	HttpEvent,
	HttpErrorResponse,
} from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";

export const authInterceptor: HttpInterceptorFn = (
	req: HttpRequest<any>, next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
	const TOKEN_KEY = "authTokenStockMS";
	const token = localStorage.getItem(TOKEN_KEY);

	if (token) {
		req = req.clone({
			setHeaders: {
				Authorization: `Bearer ${token}`,
			},
		});
	}

	const router = inject(Router);

	return next(req).pipe(
		catchError((error: HttpErrorResponse) => {
			if (error.status === 401) {
				// Handle unauthorized access
				router.navigate(["/signin"]);
			}
			return throwError(() => new Error(error.message));
		}),
	);
};
