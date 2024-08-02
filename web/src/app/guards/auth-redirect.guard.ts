import { inject } from "@angular/core";
import type { CanActivateFn } from "@angular/router";
import { AuthService } from "@services/auth.service";
import { Router } from "@angular/router";
import { map, catchError } from "rxjs/operators";
import { of } from "rxjs";

export const authRedirectGuard: CanActivateFn = () => {
	const authService = inject(AuthService);
	const router = inject(Router);

	return authService.isAuthenticated().pipe(
		map((isAuth) => {
			if (isAuth) {
				authService.getCredentials().subscribe((user) => {
					if (user) {
						router.navigate([`/user/id/${user.username}`]);
					}
				});
				return false;
			}
			return true;
		}),
		catchError((error) => {
			console.error("Authentication check error:", error);
			return of(true); // Allow access if there's an error in the auth check
		}),
	);
};
