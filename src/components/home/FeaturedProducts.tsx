import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '@/components/products/ProductCard';
import { Product } from '@/data/products'; // Import only the type
import { ArrowRight, Loader2 } from 'lucide-react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { firebaseApp } from '@/lib/firebase';

const FeaturedProducts = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
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
          
          // Only include featured products
          if (product.featured) {
            productsList.push({
              ...product,
              id: key
            });
          }
        });
        
        setFeaturedProducts(productsList);
      } else {
        setFeaturedProducts([]);
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-semibold mb-4">
              المنتجات المميزة
            </h2>
            <p className="text-foreground/60 max-w-2xl">
              اكتشف مجموعتنا المختارة من المنتجات الاستثنائية التي تجمع بين الشكل والوظيفة.
            </p>
          </div>
          <Link 
            to="/products" 
            className="mt-6 md:mt-0 group inline-flex items-center font-medium text-primary hover:text-primary/80 transition-colors"
          >
            عرض جميع المنتجات
            <ArrowRight className="mr-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-foreground/60">جاري تحميل المنتجات المميزة...</p>
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {featuredProducts.map((product, index) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                className="animate-in from-bottom"
                style={{ '--index': index } as React.CSSProperties}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-2xl font-medium mb-2">لا توجد منتجات مميزة</p>
            <p className="text-foreground/60">
              لم نتمكن من العثور على منتجات مميزة. يرجى التحقق مرة أخرى لاحقًا.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
