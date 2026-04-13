import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductCardComponent } from '../components/product-card.component';
import { NavbarComponent } from '../components/navbar.component';
import { FooterComponent } from '../components/footer.component';
import { ProductService } from '../services/product.service';
import { SellerService } from '../services/seller.service';
import { CATEGORIES, Category } from '../data/categories';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, NavbarComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  title = 'EzyMart Marketplace';
  products: any[] = [];
  shops: any[] = [];
  isLoading = false;
  selectedCategory = 'all';

  categories = CATEGORIES;

  constructor(
    private router: Router,
    private productService: ProductService,
    private sellerService: SellerService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadShops();
  }

  loadShops() {
    this.sellerService.getAllShops().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.shops = res.data || [];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.shops = [];
        this.cdr.detectChanges();
      },
    });
  }

  goToShop(id: string) {
    this.router.navigate(['/shop', id]);
  }

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  loadProducts() {
    this.isLoading = true;
    this.productService.getAllProducts().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.products = response.data || [];
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load products:', error);
        this.isLoading = false;
        this.products = [];
        this.cdr.detectChanges();
      },
    });
  }

  get filteredProducts(): any[] {
    if (this.selectedCategory === 'all') {
      return this.products;
    }
    return this.products.filter((product) => product.category === this.selectedCategory);
  }

  selectCategory(categoryId: string) {
    this.selectedCategory = categoryId;
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  viewAllCategories() {
    this.router.navigate(['/search'], { queryParams: { category: 'all' } });
  }

  viewAllDeals() {
    this.router.navigate(['/search'], { queryParams: { deals: 'true' } });
  }
}
