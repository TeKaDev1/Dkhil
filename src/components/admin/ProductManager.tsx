import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, remove } from 'firebase/database';
import { firebaseApp } from '@/lib/firebase';
import { Link } from 'react-router-dom';
import { Edit, Trash, Plus, Search, Filter, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images?: string[];
  featured?: boolean;
  specifications?: { name: string; value: string }[];
  facebookAdClicks?: number;
}

const ProductManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortField, setSortField] = useState<'name' | 'price' | 'stock'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory, sortField, sortDirection]);

  const loadProducts = async () => {
    setLoading(true);
    const db = getDatabase(firebaseApp);
    const productsRef = ref(db, 'products');
    const productStatsRef = ref(db, 'productStats');
    
    // First get the products
    onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const productsData = snapshot.val();
        const productsList = Object.entries(productsData).map(([key, value]: [string, any]) => {
          // Ensure images is always an array
          if (!value.images || !Array.isArray(value.images)) {
            value.images = [];
          }
          
          return {
            id: key,
            ...value,
            facebookAdClicks: 0 // Default value
          };
        });
        
        // Then get the product stats
        onValue(productStatsRef, (statsSnapshot) => {
          if (statsSnapshot.exists()) {
            const statsData = statsSnapshot.val();
            
            // Merge the stats with the products
            const productsWithStats = productsList.map(product => {
              const stats = statsData[product.id];
              return {
                ...product,
                facebookAdClicks: stats?.facebookAdClicks || 0
              };
            });
            
            setProducts(productsWithStats);
          } else {
            setProducts(productsList);
          }
          setLoading(false);
        });
      } else {
        setProducts([]);
        setLoading(false);
      }
    });
  };

  const loadCategories = async () => {
    const db = getDatabase(firebaseApp);
    const categoriesRef = ref(db, 'categories');
    
    onValue(categoriesRef, (snapshot) => {
      if (snapshot.exists()) {
        const categoriesData = snapshot.val();
        const categoriesList = Object.values(categoriesData).map((category: any) => category.name);
        setCategories(categoriesList);
      } else {
        setCategories([]);
      }
    });
  };

  const filterProducts = () => {
    let filtered = [...products];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    // Sort products
    filtered.sort((a, b) => {
      if (sortField === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      } else if (sortField === 'price') {
        return sortDirection === 'asc' 
          ? a.price - b.price 
          : b.price - a.price;
      } else {
        return sortDirection === 'asc' 
          ? a.stock - b.stock 
          : b.stock - a.stock;
      }
    });
    
    setFilteredProducts(filtered);
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    // Create a toast with confirmation buttons
    toast.info(
      <div>
        <div className="font-medium mb-2">تأكيد حذف المنتج</div>
        <div className="text-sm mb-4">
          هل أنت متأكد من حذف المنتج "{productName}"؟ لا يمكن التراجع عن هذا الإجراء.
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => {
              toast.dismiss();
            }}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-sm"
          >
            إلغاء
          </button>
          <button
            onClick={async () => {
              toast.dismiss();
              
              // Show loading toast
              const loadingToastId = toast.loading('جاري حذف المنتج...');
              
              try {
                const db = getDatabase(firebaseApp);
                const productRef = ref(db, `products/${productId}`);
                await remove(productRef);
                
                // Update toast to success
                toast.success(
                  <div>
                    <div className="font-medium mb-1">تم حذف المنتج بنجاح</div>
                    <div className="text-sm">تم حذف المنتج من قاعدة البيانات</div>
                  </div>,
                  { id: loadingToastId }
                );
              } catch (error) {
                console.error('Error deleting product:', error);
                
                // Update toast to error
                toast.error(
                  <div>
                    <div className="font-medium mb-1">حدث خطأ أثناء حذف المنتج</div>
                    <div className="text-sm">{(error as Error).message}</div>
                  </div>,
                  { id: loadingToastId }
                );
              }
            }}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
          >
            حذف
          </button>
        </div>
      </div>,
      {
        duration: 10000, // 10 seconds
        position: 'top-center',
      }
    );
  };

  const toggleSort = (field: 'name' | 'price' | 'stock') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="bg-secondary rounded-xl shadow-sm overflow-hidden mb-6">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">قائمة المنتجات</h2>
            <p className="text-foreground/60 text-sm mt-1">إدارة المنتجات المتاحة في المتجر</p>
          </div>
          <Link
            to="/admin-product-form"
            className="btn-hover bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2 self-start"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منتج</span>
          </Link>
        </div>
      </div>
      
      <div className="p-6">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/60 w-4 h-4" />
            <input
              type="text"
              placeholder="البحث عن منتج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/60 w-4 h-4" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
            >
              <option value="all">جميع الفئات</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-2"></div>
            <p className="text-foreground/60">جاري تحميل المنتجات...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-background/50 rounded-lg">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-primary/60" />
            </div>
            <h3 className="text-lg font-medium mb-2">لا توجد منتجات</h3>
            <p className="text-foreground/60 mb-6">
              {searchTerm || selectedCategory !== 'all' 
                ? 'لا توجد منتجات تطابق معايير البحث الخاصة بك' 
                : 'لم يتم إضافة أي منتجات بعد'}
            </p>
            <Link
              to="/admin-product-form"
              className="btn-hover bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة منتج جديد</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground/70">الصورة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground/70">
                    <button 
                      onClick={() => toggleSort('name')}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      الاسم
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'name' ? 'text-primary' : 'text-foreground/40'}`} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground/70">الفئة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground/70">
                    <button 
                      onClick={() => toggleSort('price')}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      السعر
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'price' ? 'text-primary' : 'text-foreground/40'}`} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground/70">
                    <button 
                      onClick={() => toggleSort('stock')}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      المخزون
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'stock' ? 'text-primary' : 'text-foreground/40'}`} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground/70">
                    نقرات الإعلان
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground/70">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-background/50">
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-background">
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary/40">
                            <span className="text-xs">لا توجد صورة</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">{product.price} د.ل</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded-md text-xs ${
                        product.stock > 10 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500' 
                          : product.stock > 0 
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500 rounded-md text-xs">
                        {product.facebookAdClicks || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin-product-form/${product.id}`}
                          className="text-blue-500 hover:text-blue-600 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="text-red-500 hover:text-red-600 p-1"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManager;