import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../services/product.service';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';
import { ReviewService } from '../services/review.service';
import { NavbarComponent } from '../components/navbar.component';
import { FooterComponent } from '../components/footer.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit {
  product: any = null;
  isLoading = true;
  selectedImageIndex = 0;
  quantity = 1;
  activeTab: 'description' | 'reviews' = 'description';
  reviewFilter: number = 0; // 0 = all, 1-5 = star filter
  cartMessage = '';
  reviews: any[] = [];
  reviewData: any = {
    avgRating: 0,
    total: 0,
    distribution: [],
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private reviewService: ReviewService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private cartService: CartService,
  ) {}

  ngOnInit() {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(productId);
    }
  }

  loadProduct(productId: string) {
    this.isLoading = true;
    this.productService.getProductPublic(productId).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.product = response.data;
          this.loadReviews(productId);
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load product:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadReviews(productId: string) {
    this.reviewService.getProductReviews(productId).subscribe({
      next: (response) => {
        if (response.success) {
          this.reviews = response.data.reviews || [];
          this.reviewData = {
            avgRating: response.data.avgRating || 0,
            total: response.data.total || 0,
            distribution: response.data.distribution || [],
          };
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load reviews:', error);
        this.cdr.detectChanges();
      },
    });
  }

  selectImage(index: number) {
    this.selectedImageIndex = index;
  }

  get selectedImage(): string {
    if (this.product?.images?.length > 0) {
      return this.product.images[this.selectedImageIndex]?.url || '';
    }
    return '';
  }

  get discountPercent(): number {
    if (this.product?.compareAtPrice && this.product.compareAtPrice > this.product.price) {
      return Math.round(
        ((this.product.compareAtPrice - this.product.price) / this.product.compareAtPrice) * 100,
      );
    }
    return 0;
  }

  get averageRating(): number {
    return this.reviewData.avgRating || 0;
  }

  getStars(rating: number): number[] {
    return Array(5)
      .fill(0)
      .map((_, i) => (i < Math.round(rating) ? 1 : 0));
  }

  get filteredReviews(): any[] {
    if (this.reviewFilter === 0) return this.reviews;
    return this.reviews.filter((r) => r.rating === this.reviewFilter);
  }

  get ratingCounts(): number[] {
    const counts = [0, 0, 0, 0, 0, 0];
    this.reviewData.distribution.forEach((d: any) => {
      counts[d.star] = d.count;
    });
    return counts;
  }

  ratingPercent(star: number): number {
    if (this.reviewData.total === 0) return 0;
    return Math.round((this.ratingCounts[star] / this.reviewData.total) * 100);
  }

  setReviewFilter(star: number) {
    this.reviewFilter = this.reviewFilter === star ? 0 : star;
  }

  incrementQuantity() {
    if (this.quantity < (this.product?.quantity || 0)) {
      this.quantity++;
    }
  }

  decrementQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }

  goToShop(sellerId: string) {
    if (sellerId) {
      this.router.navigate(['/shop', sellerId]);
    }
  }

  addToCart() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.cartService.addToCart(this.product.id, this.quantity).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.cartMessage = 'Added to cart!';
        } else {
          this.cartMessage = res.message || 'Failed to add to cart';
        }
        this.cdr.detectChanges();
        setTimeout(() => {
          this.cartMessage = '';
          this.cdr.detectChanges();
        }, 2000);
      },
      error: (err: any) => {
        this.cartMessage = err.error?.message || 'Failed to add to cart';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.cartMessage = '';
          this.cdr.detectChanges();
        }, 2000);
      },
    });
  }

  addToWishlist() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.cartMessage = 'Added to wishlist!';
    setTimeout(() => {
      this.cartMessage = '';
      this.cdr.detectChanges();
    }, 2000);
  }
}
