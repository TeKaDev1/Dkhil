import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/products/ProductCard';
import { Filter, ChevronDown, Grid, List, Search, Loader2 } from 'lucide-react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { firebaseApp } from '@/lib/firebase';
import { Product } from '@/data/products'; // Import only the type

const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [sortOption, setSortOption] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>(['الكل']);
  const [loading, setLoading] = useState(true);
  
  // Fetch products from Firebase
  useEffect(() => {
    const db = getDatabase(firebaseApp);
    const productsRef = ref(db, 'products');
    
    const unsubscribe = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const productsData = snapshot.val();
        const productsList: Product[] = [];
        
        Object.keys(productsData).forEach((key) => {
          const product = productsData[key];
          
          // Ensure images is always an array
          if (!product.images) {
            product.images = [];
          }
          
          productsList.push({
            ...product,
            id: key
          });
        });
        
        setProducts(productsList);
        
        // Extract unique categories
        const uniqueCategories = ['الكل', ...Array.from(new Set(productsList.map(p => p.category)))];
        setCategories(uniqueCategories);
      } else {
        setProducts([]);
        setCategories(['الكل']);
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Filter and sort products when these values change
  useEffect(() => {
    if (products.length === 0) {
      setFilteredProducts([]);
      return;
    }
    
    let result = [...products];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        (product.category && product.category.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (selectedCategory !== 'الكل') {
      result = result.filter(product => product.category === selectedCategory);
    }
    
    // Apply sorting
    switch (sortOption) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        // For a real app, you would sort by date
        // This is just for demo purposes
        result.sort((a, b) => b.id.localeCompare(a.id));
        break;
      case 'rating':
        // @ts-ignore - Ignoring TypeScript error for now
        result.sort((a, b) => (b.ratings?.average || 0) - (a.ratings?.average || 0));
        break;
      case 'featured':
      default:
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }
    
    setFilteredProducts(result);
  }, [products, selectedCategory, sortOption, searchQuery]);

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen">
        {/* Header */}
        <div className="bg-secondary py-16 px-6 mb-12">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-display font-semibold mb-4">
              منتجاتنا
            </h1>
            <p className="text-foreground/60 max-w-xl mx-auto">
              تصفح مجموعتنا المختارة بعناية من المنتجات الفاخرة المصممة ببساطة وعملية.
            </p>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6">
          {/* Search Bar */}
          <div className="relative mb-8">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن منتجات..."
                className="w-full px-4 py-3 pl-10 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
            </div>
          </div>
          
          {/* Filter & Sort Controls */}
          <div className="flex flex-wrap justify-between items-center mb-8">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-border md:hidden"
            >
              <Filter className="w-4 h-4" />
              <span>تصفية</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div className="hidden md:flex items-center gap-4">
              <span className="text-sm text-foreground/60">تصفية حسب:</span>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      selectedCategory === category
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-foreground/60">ترتيب حسب:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="featured">المميزة</option>
                <option value="price-low">السعر: من الأقل إلى الأعلى</option>
                <option value="price-high">السعر: من الأعلى إلى الأقل</option>
                <option value="newest">الأحدث</option>
                <option value="rating">التقييم</option>
              </select>
            </div>
          </div>
          
          {/* Mobile Filters (Collapsible) */}
          {isFilterOpen && (
            <div className="md:hidden mb-8 p-4 bg-secondary rounded-md">
              <h3 className="font-medium mb-3">تصفية حسب الفئة</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      selectedCategory === category
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-background/80'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Products Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-foreground/60">جاري تحميل المنتجات...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-2xl font-medium mb-2">لا توجد منتجات</p>
              <p className="text-foreground/60">
                لم نتمكن من العثور على منتجات تطابق معايير البحث الخاصة بك.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Products;
