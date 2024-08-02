import { inject } from "@angular/core";
import type { CanActivateFn } from "@angular/router";
import { AuthService } from "@services/auth.service";
import { Router } from "@angular/router";
import { map } from "rxjs/operators";

export const authRedirectGuard: CanActivateFn = () => {
	const authService = inject(AuthService);
	const router = inject(Router);

	return authService.getCredentials().pipe(
		map((user) => {
			if (user) {
				router.navigate([`/user/id/${user.username}`]);
				return false;
			}
			return true;
		}),
	);
};
