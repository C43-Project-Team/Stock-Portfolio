import { inject } from "@angular/core";
import { type CanActivateFn, Router } from "@angular/router";
import { AuthService } from "@services/auth.service";
import { type Observable, of } from "rxjs";
import { map, catchError } from "rxjs/operators";

export const authGuard: CanActivateFn = (): Observable<boolean> => {
	const authService = inject(AuthService);
	const router = inject(Router);

	return authService.isAuthenticated().pipe(
		map((isAuthenticated) => {
			if (isAuthenticated) {
				return true;
			}
			router.navigate(["/sign-in"]);
			return false;
		}),
		catchError((error) => {
			console.error("Error in auth guard:", error);
			router.navigate(["/sign-in"]);
			return of(false);
		}),
	);
};
