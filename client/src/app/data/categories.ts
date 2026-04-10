export interface Category {
  id: string;
  name: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: 'electronics', name: 'Electronics', icon: 'pi pi-mobile' },
  { id: 'fashion', name: 'Fashion', icon: 'pi pi-shopping-bag' },
  { id: 'home', name: 'Home', icon: 'pi pi-home' },
  { id: 'beauty', name: 'Beauty', icon: 'pi pi-heart' },
  { id: 'sports', name: 'Sports', icon: 'pi pi-car' },
  { id: 'books', name: 'Books', icon: 'pi pi-book' },
  { id: 'food', name: 'Food & Grocery', icon: 'pi pi-apple' },
  { id: 'toys', name: 'Toys & Games', icon: 'pi pi-gift' },
  { id: 'automotive', name: 'Automotive', icon: 'pi pi-wrench' },
  { id: 'others', name: 'Others', icon: 'pi pi-th-large' },
];
