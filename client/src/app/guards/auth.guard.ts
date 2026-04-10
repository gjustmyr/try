import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Allows only customer users (or unauthenticated visitors). Redirects sellers/admin/drivers to their portals. */
export const customerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.getCurrentUser();

  if (!user) return true; // guests can browse

  switch (user.userType) {
    case 'seller':
      router.navigate(['/seller/dashboard']);
      return false;
    case 'admin':
      router.navigate(['/admin']);
      return false;
    case 'driver':
      router.navigate(['/driver']);
      return false;
    default:
      return true;
  }
};

/** Allows only seller users. */
export const sellerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.getCurrentUser();

  if (!user) {
    router.navigate(['/login']);
    return false;
  }
  if (user.userType !== 'seller') {
    router.navigate(['/']);
    return false;
  }
  return true;
};

/** Allows only admin users. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.getCurrentUser();

  if (!user) {
    router.navigate(['/login']);
    return false;
  }
  if (user.userType !== 'admin') {
    router.navigate(['/']);
    return false;
  }
  return true;
};

/** Allows only driver users. */
export const driverGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.getCurrentUser();

  if (!user) {
    router.navigate(['/login']);
    return false;
  }
  if (user.userType !== 'driver') {
    router.navigate(['/']);
    return false;
  }
  return true;
};
