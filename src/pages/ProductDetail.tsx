import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/products/ProductCard';
import OrderForm from '@/components/order/OrderForm';
import DeliveryCostPreview from '@/components/products/DeliveryCostPreview';
import { Product } from '@/data/products'; // Import only the type
import { Minus, Plus, Heart, Share2, ChevronLeft, Star, CheckCircle, ShoppingBag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getDatabase, ref, increment, update, get, onValue } from 'firebase/database';
import { firebaseApp } from '@/lib/firebase';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [showOrderForm, setShowOrderForm] = useState(false);
  
  // Fetch product data from Firebase
  useEffect(() => {
    if (!id) {
      navigate('/products');
      return;
    }
    
    const db = getDatabase(firebaseApp);
    const productRef = ref(db, `products/${id}`);
    
    const unsubscribe = onValue(productRef, (snapshot) => {
      if (snapshot.exists()) {
        const productData = snapshot.val();
        
        // Ensure images is always an array
        if (!productData.images) {
          productData.images = [];
        }
        
        setProduct({
          ...productData,
          id
        });
        
        // Fetch related products (same category)
        fetchRelatedProducts(productData.category);
      } else {
        toast.error('المنتج غير موجود');
        navigate('/products');
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [id, navigate]);
  
  // Fetch related products
  const fetchRelatedProducts = async (category: string) => {
    if (!category) return;
    
    const db = getDatabase(firebaseApp);
    const productsRef = ref(db, 'products');
    
    try {
      const snapshot = await get(productsRef);
      if (snapshot.exists()) {
        const productsData = snapshot.val();
        const productsList: Product[] = [];
        
        Object.keys(productsData).forEach((key) => {
          if (key !== id) { // Exclude current product
            const product = productsData[key];
            
            // Ensure images is always an array
            if (!product.images) {
              product.images = [];
            }
            
            if (product.category === category) {
              productsList.push({
                ...product,
                id: key
              });
            }
          }
        });
        
        // Limit to 4 related products
        setRelatedProducts(productsList.slice(0, 4));
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };
  
  // Track Facebook ad clicks
  useEffect(() => {
    if (!id) return;
    
    // Check if the user came from a Facebook ad
    const referrer = document.referrer;
    const isFromFacebook =
      referrer.includes('facebook.com') ||
      referrer.includes('fb.com') ||
      location.search.includes('fbclid') ||
      location.search.includes('utm_source=facebook');
    
    if (isFromFacebook) {
      // Update the click count in Firebase
      const db = getDatabase(firebaseApp);
      const productStatsRef = ref(db, `productStats/${id}`);
      
      // Increment the Facebook ad clicks counter
      update(productStatsRef, {
        facebookAdClicks: increment(1)
      }).catch(error => {
        console.error('Error updating Facebook ad click stats:', error);
      });
    }
  }, [id, location]);
  
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  const increaseQuantity = () => {
    if (product && quantity < (product.stock || 0)) {
      setQuantity(quantity + 1);
    } else {
      toast.error(`Sorry, only ${product?.stock || 0} items available`);
    }
  };
  
  const handleOrderNow = () => {
    setShowOrderForm(true);
  };

  // Show loading state while fetching product
  if (loading) {
    return (
      <>
        <Navbar />
        <main className="pt-24 pb-16 min-h-screen">
          <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-foreground/60">جاري تحميل المنتج...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // If product not found, redirect to products page
  if (!product) {
    return null; // Will redirect in the useEffect
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen">
        {showOrderForm && (
          <OrderForm
            onClose={() => setShowOrderForm(false)}
            productId={product.id}
            productName={product.name}
            productPrice={product.price}
            productImage={product.images[0] || '/placeholder.svg'}
          />
        )}
        <div className="max-w-7xl mx-auto px-6">
          {/* Breadcrumbs */}
          <div className="mb-8 flex items-center text-sm text-foreground/60">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
            <span className="mx-2">/</span>
            <span className="truncate">{product.name}</span>
          </div>
          
          {/* Back Button */}
          <Link 
            to="/products" 
            className="inline-flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Products
          </Link>
          
          {/* Product Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square overflow-hidden rounded-xl bg-secondary/50">
                <img 
                  src={product.images[activeImage] || '/placeholder.svg'} 
                  alt={product.name}
                  className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    // Fallback if image fails to load
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              </div>
              
              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto py-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(index)}
                      className={`w-20 h-20 rounded-md overflow-hidden flex-shrink-0 transition-all ${
                        activeImage === index 
                          ? 'ring-2 ring-primary ring-offset-2' 
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={image} 
                        alt={`${product.name} - View ${index + 1}`}
                        className="w-full h-full object-cover object-center"
                        onError={(e) => {
                          // Fallback if image fails to load
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Product Info */}
            <div className="flex flex-col">
              {/* Category & Title */}
              <div className="mb-6">
                <div className="text-sm text-primary font-medium mb-2">{product.category}</div>
                <h1 className="text-3xl font-display font-semibold mb-4">{product.name}</h1>
              </div>
              
              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-2xl font-semibold">${product.price.toFixed(2)}</span>
                {product.originalPrice && (
                  <span className="text-foreground/60 line-through">${product.originalPrice.toFixed(2)}</span>
                )}
                {product.discount && (
                  <span className="bg-primary/10 text-primary text-sm px-2 py-0.5 rounded-md font-medium">
                    {product.discount}% OFF
                  </span>
                )}
              </div>
              
              {/* Description */}
              <p className="text-foreground/80 mb-8">{product.description}</p>
              
              {/* Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="mb-8">
                  <h3 className="font-medium mb-3">المواصفات</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex items-start gap-2">
                        <span className="font-medium">{key}:</span>
                        <span className="text-foreground/80">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Stock Status - only show if showStock is true */}
              {product.showStock !== false && (
                <div className="flex items-center gap-2 mb-6">
                  <div className={`w-3 h-3 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm font-medium">
                    {product.stock > 0 ? `متوفر (${product.stock} في المخزون)` : 'غير متوفر'}
                  </span>
                </div>
              )}
              
              {/* Quantity Selector */}
              {product.stock > 0 && (
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-sm font-medium">الكمية:</span>
                  <div className="flex items-center">
                    <button 
                      onClick={decreaseQuantity}
                      className="w-8 h-8 flex items-center justify-center border border-border rounded-l-md hover:bg-secondary transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="w-12 h-8 flex items-center justify-center border-t border-b border-border">
                      {quantity}
                    </div>
                    <button 
                      onClick={increaseQuantity}
                      className="w-8 h-8 flex items-center justify-center border border-border rounded-r-md hover:bg-secondary transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 mb-8">
                <button
                  onClick={handleOrderNow}
                  disabled={product.stock <= 0}
                  className="flex-1 btn-hover bg-primary text-primary-foreground rounded-md py-3 px-6 font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>اطلب الآن</span>
                </button>
              </div>
              
              {/* Delivery Cost Preview */}
              <DeliveryCostPreview productPrice={product.price} />
            </div>
          </div>
          
          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-display font-semibold mb-8">منتجات ذات صلة</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ProductDetail;
