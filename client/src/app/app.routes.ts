import { Routes } from '@angular/router';
import { LoginComponent } from './components/login.component';
import { RegisterComponent } from './components/register.component';
import { SellerRegisterComponent } from './components/seller-register.component';
import { HomeComponent } from './pages/home.component';
import { ProductDetailComponent } from './pages/product-detail.component';
import { CartComponent } from './pages/cart.component';
import { WishlistComponent } from './pages/wishlist.component';
import { CheckoutComponent } from './pages/checkout.component';
import { ShopsComponent } from './pages/shops.component';
import { ShopDetailComponent } from './pages/shop-detail.component';
import { SearchResultsComponent } from './pages/search-results.component';
import { SellerDashboardComponent } from './pages/seller-dashboard.component';
import { SellerProductsComponent } from './pages/seller-products.component';
import { SellerOrdersComponent } from './pages/seller-orders.component';
import { SellerCustomersComponent } from './pages/seller-customers.component';
import { SellerReviewsComponent } from './pages/seller-reviews.component';
import { SellerSettingsComponent } from './pages/seller-settings.component';
import { ProfileComponent } from './pages/profile.component';
import { AdminDashboardComponent } from './pages/admin-dashboard.component';
import { DriverDashboardComponent } from './pages/driver-dashboard.component';
import { OrderTrackingComponent } from './pages/order-tracking.component';
import { HubDashboardComponent } from './pages/hub-dashboard.component';
import { customerGuard, sellerGuard, adminGuard, driverGuard, hubGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [customerGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [customerGuard] },
  { path: 'product/:id', component: ProductDetailComponent, canActivate: [customerGuard] },
  { path: 'cart', component: CartComponent, canActivate: [customerGuard] },
  { path: 'wishlist', component: WishlistComponent, canActivate: [customerGuard] },
  { path: 'checkout', component: CheckoutComponent, canActivate: [customerGuard] },
  { path: 'shops', component: ShopsComponent, canActivate: [customerGuard] },
  { path: 'shop/:id', component: ShopDetailComponent, canActivate: [customerGuard] },
  { path: 'search', component: SearchResultsComponent, canActivate: [customerGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'seller-register', component: SellerRegisterComponent },
  { path: 'seller/dashboard', component: SellerDashboardComponent, canActivate: [sellerGuard] },
  { path: 'seller/products', component: SellerProductsComponent, canActivate: [sellerGuard] },
  { path: 'seller/orders', component: SellerOrdersComponent, canActivate: [sellerGuard] },
  { path: 'seller/customers', component: SellerCustomersComponent, canActivate: [sellerGuard] },
  { path: 'seller/reviews', component: SellerReviewsComponent, canActivate: [sellerGuard] },
  { path: 'seller/settings', component: SellerSettingsComponent, canActivate: [sellerGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: 'hub-dashboard', component: HubDashboardComponent, canActivate: [hubGuard] },
  { path: 'driver', component: DriverDashboardComponent, canActivate: [driverGuard] },
  { path: 'track/:orderId', component: OrderTrackingComponent, canActivate: [customerGuard] },
];
