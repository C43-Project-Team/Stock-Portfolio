import type { HttpHandlerFn, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import type {
	HttpRequest,
	HttpEvent,
	HttpErrorResponse,
} from "@angular/common/http";
import { type Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import environment from "../environments/environment";

export const authInterceptor: HttpInterceptorFn = (
	req: HttpRequest<any>,
	next: HttpHandlerFn,
): Observable<HttpEvent<any>> => {
	const TOKEN_KEY = environment.token_key;
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
			console.log(error);
			return throwError(() => error);
		}),
	);
};
