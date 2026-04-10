import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { ProductService } from '../services/product.service';
import { CATEGORIES } from '../data/categories';

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  providers: [ProductService],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <i class="pi pi-shopping-bag"></i>
          <span>{{ shopName }}</span>
        </div>

        <nav class="sidebar-nav">
          <a class="nav-item" (click)="navigate('/seller/dashboard')">
            <i class="pi pi-home"></i>
            <span>Dashboard</span>
          </a>
          <a class="nav-item active">
            <i class="pi pi-box"></i>
            <span>Products</span>
          </a>
          <a class="nav-item" (click)="navigate('/seller/orders')">
            <i class="pi pi-shopping-cart"></i>
            <span>Orders</span>
          </a>
          <a class="nav-item" (click)="navigate('/seller/customers')">
            <i class="pi pi-users"></i>
            <span>Customers</span>
          </a>
          <a class="nav-item" (click)="navigate('/seller/reviews')">
            <i class="pi pi-star"></i>
            <span>Reviews</span>
          </a>
          <a class="nav-item" (click)="navigate('/seller/settings')">
            <i class="pi pi-cog"></i>
            <span>Settings</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <button class="logout-btn" (click)="logout()">
            <i class="pi pi-sign-out"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Top Bar -->
        <header class="top-bar">
          <div class="top-bar-left">
            <h1>Products</h1>
            <p class="breadcrumb">Home / Products</p>
          </div>
          <div class="top-bar-right">
            <button class="add-btn" (click)="showAddModal = true">
              <i class="pi pi-plus"></i>
              <span>Add Product</span>
            </button>
          </div>
        </header>

        <!-- Products Content -->
        <div class="products-content">
          <!-- Filters -->
          <div class="filters-bar">
            <div class="search-box">
              <i class="pi pi-search"></i>
              <input type="text" placeholder="Search products..." [(ngModel)]="searchQuery" (input)="onSearch()" />
            </div>
            <select class="filter-select" [(ngModel)]="statusFilter" (change)="loadProducts()">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <!-- Products Table -->
          @if (isLoading) {
            <div class="loading-state">
              <i class="pi pi-spin pi-spinner"></i>
              <p>Loading products...</p>
            </div>
          } @else if (filteredProducts.length === 0) {
            <div class="empty-state">
              <i class="pi pi-box"></i>
              <h3>No products yet</h3>
              <p>Start by adding your first product</p>
            </div>
          } @else {
            <div class="products-table">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Sales</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (product of filteredProducts; track product.id) {
                    <tr>
                      <td>
                        <div class="product-cell">
                          @if (product.images && product.images.length > 0) {
                            <img [src]="product.images[0].url" alt="{{ product.name }}" />
                          } @else {
                            <div class="no-image">
                              <i class="pi pi-image"></i>
                            </div>
                          }
                          <div class="product-info">
                            <span class="product-name">{{ product.name }}</span>
                            <span class="product-sku">SKU: {{ product.sku || 'N/A' }}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="price">₱{{ product.price }}</span>
                      </td>
                      <td>
                        <span [class.low-stock]="product.quantity < 10">
                          {{ product.quantity }}
                        </span>
                      </td>
                      <td>
                        <span class="status-badge" [class]="product.status">
                          {{ product.status }}
                        </span>
                      </td>
                      <td>{{ product.sales || 0 }}</td>
                      <td>
                        <div class="actions">
                          <button class="icon-btn" title="Edit" (click)="openEditModal(product)">
                            <i class="pi pi-pencil"></i>
                          </button>
                          <button
                            class="icon-btn"
                            title="Delete"
                            (click)="deleteProduct(product.id)"
                          >
                            <i class="pi pi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </main>
    </div>

    <!-- Add Product Modal -->
    @if (showAddModal) {
      <div class="modal-overlay" (click)="showAddModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Add New Product</h2>
            <button class="close-btn" (click)="showAddModal = false">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <form (ngSubmit)="addProduct()">
            <div class="modal-body">
              <div class="form-group">
                <label>Product Name <span class="required">*</span></label>
                <input type="text" [(ngModel)]="newProduct.name" name="name" required />
              </div>

              <div class="form-group">
                <label>Description</label>
                <textarea
                  [(ngModel)]="newProduct.description"
                  name="description"
                  rows="4"
                ></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Price <span class="required">*</span></label>
                  <input
                    type="number"
                    [(ngModel)]="newProduct.price"
                    name="price"
                    step="0.01"
                    required
                  />
                </div>
                <div class="form-group">
                  <label>Compare at Price</label>
                  <input
                    type="number"
                    [(ngModel)]="newProduct.compareAtPrice"
                    name="compareAtPrice"
                    step="0.01"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>SKU</label>
                  <input type="text" [(ngModel)]="newProduct.sku" name="sku" />
                </div>
                <div class="form-group">
                  <label>Quantity <span class="required">*</span></label>
                  <input type="number" [(ngModel)]="newProduct.quantity" name="quantity" required />
                </div>
              </div>

              <div class="form-group">
                <label>Category</label>
                <select [(ngModel)]="newProduct.category" name="category">
                  <option value="">Select a category</option>
                  @for (cat of categories; track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Product Images <span class="required">*</span></label>
                <input
                  type="file"
                  (change)="onFileSelect($event)"
                  accept="image/*"
                  multiple
                  id="imageUpload"
                  style="display: none;"
                />
                <label for="imageUpload" class="upload-btn">
                  <i class="pi pi-cloud-upload"></i>
                  <span>Choose Images</span>
                </label>
                <small
                  >At least 1 image required. Max 5 images, 5MB each. First image will be
                  featured.</small
                >

                @if (imagePreviews.length > 0) {
                  <div class="image-previews">
                    @for (preview of imagePreviews; track preview.url; let i = $index) {
                      <div class="preview-item" [class.featured]="preview.isFeatured">
                        <img [src]="preview.url" alt="Preview" />
                        @if (preview.isFeatured) {
                          <span class="featured-badge">
                            <i class="pi pi-star-fill"></i>
                            Featured
                          </span>
                        }
                        <div class="preview-actions">
                          @if (!preview.isFeatured) {
                            <button
                              type="button"
                              class="set-featured-btn"
                              (click)="setFeaturedImage(i)"
                              title="Set as featured"
                            >
                              <i class="pi pi-star"></i>
                            </button>
                          }
                          <button
                            type="button"
                            class="remove-btn"
                            (click)="removeImage(i)"
                            title="Remove"
                          >
                            <i class="pi pi-times"></i>
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="cancel-btn" (click)="showAddModal = false">
                Cancel
              </button>
              <button type="submit" class="submit-btn" [disabled]="isSubmitting">
                @if (isSubmitting) {
                  <i class="pi pi-spin pi-spinner"></i>
                  <span>Adding...</span>
                } @else {
                  <span>Add Product</span>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Edit Product Modal -->
    @if (showEditModal && editProduct) {
      <div class="modal-overlay" (click)="showEditModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Edit Product</h2>
            <button class="close-btn" (click)="showEditModal = false">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <form (ngSubmit)="updateProduct()">
            <div class="modal-body">
              <div class="form-group">
                <label>Product Name <span class="required">*</span></label>
                <input type="text" [(ngModel)]="editProduct.name" name="editName" required />
              </div>

              <div class="form-group">
                <label>Description</label>
                <textarea [(ngModel)]="editProduct.description" name="editDescription" rows="4"></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Price <span class="required">*</span></label>
                  <input type="number" [(ngModel)]="editProduct.price" name="editPrice" step="0.01" required />
                </div>
                <div class="form-group">
                  <label>Compare at Price</label>
                  <input type="number" [(ngModel)]="editProduct.compareAtPrice" name="editCompareAtPrice" step="0.01" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>SKU</label>
                  <input type="text" [(ngModel)]="editProduct.sku" name="editSku" />
                </div>
                <div class="form-group">
                  <label>Quantity <span class="required">*</span></label>
                  <input type="number" [(ngModel)]="editProduct.quantity" name="editQuantity" required />
                </div>
              </div>

              <div class="form-group">
                <label>Category</label>
                <select [(ngModel)]="editProduct.category" name="editCategory">
                  <option value="">Select a category</option>
                  @for (cat of categories; track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Status</label>
                <select [(ngModel)]="editProduct.status" name="editStatus">
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div class="form-group">
                <label>Current Images</label>
                @if (editProduct.existingImages && editProduct.existingImages.length > 0) {
                  <div class="image-previews">
                    @for (img of editProduct.existingImages; track img.url; let i = $index) {
                      <div class="preview-item">
                        <img [src]="img.url" alt="Product image" />
                        <div class="preview-actions">
                          <button type="button" class="remove-btn" (click)="removeExistingImage(i)" title="Remove">
                            <i class="pi pi-times"></i>
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <p style="color: #6b7280; font-size: 13px;">No images</p>
                }
              </div>

              <div class="form-group">
                <label>Add New Images</label>
                <input type="file" (change)="onEditFileSelect($event)" accept="image/*" multiple id="editImageUpload" style="display: none;" />
                <label for="editImageUpload" class="upload-btn">
                  <i class="pi pi-cloud-upload"></i>
                  <span>Choose Images</span>
                </label>
                @if (editImagePreviews.length > 0) {
                  <div class="image-previews">
                    @for (preview of editImagePreviews; track preview.url; let i = $index) {
                      <div class="preview-item">
                        <img [src]="preview.url" alt="Preview" />
                        <div class="preview-actions">
                          <button type="button" class="remove-btn" (click)="removeEditImage(i)" title="Remove">
                            <i class="pi pi-times"></i>
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="cancel-btn" (click)="showEditModal = false">Cancel</button>
              <button type="submit" class="submit-btn" [disabled]="isSubmitting">
                @if (isSubmitting) {
                  <i class="pi pi-spin pi-spinner"></i>
                  <span>Updating...</span>
                } @else {
                  <span>Update Product</span>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styleUrls: ['./seller-dashboard.component.css'],
})
export class SellerProductsComponent implements OnInit {
  shopName = '';
  sellerId = '';
  products: any[] = [];
  filteredProducts: any[] = [];
  isLoading = false;
  searchQuery = '';
  statusFilter = '';
  showAddModal = false;
  showEditModal = false;
  isSubmitting = false;
  selectedFiles: File[] = [];
  imagePreviews: { file: File; url: string; isFeatured: boolean }[] = [];
  editImagePreviews: { file: File; url: string }[] = [];
  editProduct: any = null;
  categories = CATEGORIES;

  newProduct = {
    name: '',
    description: '',
    price: 0,
    compareAtPrice: null as number | null,
    sku: '',
    quantity: 0,
    category: '',
  };

  constructor(
    private authService: AuthService,
    private productService: ProductService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user && user.seller) {
      this.shopName = user.seller.shopName;
      this.sellerId = user.seller.id;
      this.loadProducts();
    }
  }

  loadProducts() {
    this.isLoading = true;
    this.productService.getSellerProducts(this.sellerId, this.statusFilter).subscribe({
      next: (response) => {
        console.log('Products loaded:', response);
        this.isLoading = false;

        if (!response.success) {
          console.error('Failed to load products:', response.message);
          this.products = [];
          this.cdr.detectChanges();
          return;
        }

        this.products = response.data || [];
        this.onSearch();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Load products error:', error);
        this.isLoading = false;
        this.products = [];
        this.cdr.detectChanges();
      },
    });
  }

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.filteredProducts = this.products;
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredProducts = this.products.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q),
      );
    }
  }

  onFileSelect(event: any) {
    const files = Array.from(event.target.files) as File[];

    if (files.length === 0) return;

    // Limit to 5 images
    if (this.imagePreviews.length + files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    files.forEach((file) => {
      // Check file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is 5MB`);
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews.push({
          file: file,
          url: e.target.result,
          isFeatured: this.imagePreviews.length === 0, // First image is featured by default
        });
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    });

    // Clear the input
    event.target.value = '';
  }

  removeImage(index: number) {
    const wasFeatured = this.imagePreviews[index].isFeatured;
    this.imagePreviews.splice(index, 1);

    // If removed image was featured, make first image featured
    if (wasFeatured && this.imagePreviews.length > 0) {
      this.imagePreviews[0].isFeatured = true;
    }
  }

  setFeaturedImage(index: number) {
    this.imagePreviews.forEach((preview, i) => {
      preview.isFeatured = i === index;
    });
  }

  addProduct() {
    // Validate at least one image
    if (this.imagePreviews.length === 0) {
      alert('Please add at least one product image');
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('sellerId', this.sellerId);
    formData.append('name', this.newProduct.name);
    formData.append('description', this.newProduct.description);
    formData.append('price', this.newProduct.price.toString());
    if (this.newProduct.compareAtPrice) {
      formData.append('compareAtPrice', this.newProduct.compareAtPrice.toString());
    }
    formData.append('sku', this.newProduct.sku);
    formData.append('quantity', this.newProduct.quantity.toString());
    formData.append('category', this.newProduct.category);
    formData.append('status', 'active');

    // Append images in order (featured first)
    const sortedPreviews = [...this.imagePreviews].sort((a, b) =>
      b.isFeatured ? 1 : a.isFeatured ? -1 : 0,
    );

    sortedPreviews.forEach((preview) => {
      formData.append('images', preview.file);
    });

    this.productService.createProduct(formData).subscribe({
      next: (response) => {
        console.log('Product added:', response);
        this.isSubmitting = false;

        if (!response.success) {
          alert(response.message || 'Failed to add product. Please try again.');
          this.cdr.detectChanges();
          return;
        }

        this.showAddModal = false;
        this.resetForm();
        this.cdr.detectChanges();
        this.loadProducts();
      },
      error: (error) => {
        console.error('Add product error:', error);
        this.isSubmitting = false;
        this.cdr.detectChanges();
        alert(error.error?.message || 'Failed to add product. Please try again.');
      },
    });
  }

  deleteProduct(productId: string) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(productId).subscribe({
        next: (response) => {
          if (!response.success) {
            alert(response.message || 'Failed to delete product.');
            return;
          }
          this.loadProducts();
        },
        error: (error) => {
          console.error('Delete product error:', error);
          alert(error.error?.message || 'Failed to delete product.');
        },
      });
    }
  }

  openEditModal(product: any) {
    this.editProduct = {
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      compareAtPrice: product.compareAtPrice || null,
      sku: product.sku || '',
      quantity: product.quantity,
      category: product.category || '',
      status: product.status || 'active',
      existingImages: product.images ? [...product.images] : [],
    };
    this.editImagePreviews = [];
    this.showEditModal = true;
  }

  removeExistingImage(index: number) {
    this.editProduct.existingImages.splice(index, 1);
  }

  onEditFileSelect(event: any) {
    const files = Array.from(event.target.files) as File[];
    if (files.length === 0) return;

    const totalImages = this.editProduct.existingImages.length + this.editImagePreviews.length + files.length;
    if (totalImages > 5) {
      alert('Maximum 5 images allowed in total');
      return;
    }

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is 5MB`);
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editImagePreviews.push({ file: file, url: e.target.result });
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    });
    event.target.value = '';
  }

  removeEditImage(index: number) {
    this.editImagePreviews.splice(index, 1);
  }

  updateProduct() {
    if (!this.editProduct) return;
    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('name', this.editProduct.name);
    formData.append('description', this.editProduct.description);
    formData.append('price', this.editProduct.price.toString());
    if (this.editProduct.compareAtPrice) {
      formData.append('compareAtPrice', this.editProduct.compareAtPrice.toString());
    }
    formData.append('sku', this.editProduct.sku);
    formData.append('quantity', this.editProduct.quantity.toString());
    formData.append('category', this.editProduct.category);
    formData.append('status', this.editProduct.status);

    // Send existing images as JSON so the backend knows which are kept
    formData.append('existingImages', JSON.stringify(this.editProduct.existingImages));

    // Append new image files
    this.editImagePreviews.forEach((preview) => {
      formData.append('images', preview.file);
    });

    this.productService.updateProduct(this.editProduct.id, formData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (!response.success) {
          alert(response.message || 'Failed to update product.');
          this.cdr.detectChanges();
          return;
        }
        this.showEditModal = false;
        this.editProduct = null;
        this.editImagePreviews = [];
        this.cdr.detectChanges();
        this.loadProducts();
      },
      error: (error) => {
        console.error('Update product error:', error);
        this.isSubmitting = false;
        this.cdr.detectChanges();
        alert(error.error?.message || 'Failed to update product.');
      },
    });
  }

  resetForm() {
    this.newProduct = {
      name: '',
      description: '',
      price: 0,
      compareAtPrice: null as number | null,
      sku: '',
      quantity: 0,
      category: '',
    };
    this.selectedFiles = [];
    this.imagePreviews = [];
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }

  logout() {
    this.authService.logout();
  }
}
