import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getDatabase, ref, onValue } from 'firebase/database';
import { firebaseApp } from '@/lib/firebase';
import { Package, ShoppingBag, Users, LogOut, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import OrderManager from '@/components/admin/OrderManager';
import CityDeliveryManager from '@/components/admin/CityDeliveryManager';
import CategoryManager from '@/components/admin/CategoryManager';
import ProductManager from '@/components/admin/ProductManager';

// Order status types
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// Order interface
interface Order {
  id: string;
  key: string;
  name: string;
  phoneNumber: string;
  address: string;
  city: string;
  notes?: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  total: number;
  status: OrderStatus;
  date: string;
}

// City delivery price interface
interface CityDelivery {
  id: string;
  name: string;
  price: number;
}

// Product interface
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  featured: boolean;
  stock: number;
  images?: string[];
  ratings: {
    average: number;
    count: number;
  };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories' | 'cities'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [cities, setCities] = useState<CityDelivery[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    const auth = getAuth(firebaseApp);
    
    // Check if user is authenticated
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
      } else {
        // Load data from Firebase
        loadData();
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);
  
  const loadData = () => {
    setLoading(true);
    const db = getDatabase(firebaseApp);
    
    // Load orders
    const ordersRef = ref(db, 'orders');
    onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      const ordersList: Order[] = [];
      
      if (data) {
        Object.keys(data).forEach((key) => {
          ordersList.push({
            ...data[key],
            key
          });
        });
        
        // Sort orders by date (newest first)
        ordersList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setOrders(ordersList);
        
        // Calculate stats
        const stats = {
          totalOrders: ordersList.length,
          pendingOrders: ordersList.filter(order => order.status === 'pending').length,
          processingOrders: ordersList.filter(order => order.status === 'processing').length,
          shippedOrders: ordersList.filter(order => order.status === 'shipped').length,
          deliveredOrders: ordersList.filter(order => order.status === 'delivered').length,
          cancelledOrders: ordersList.filter(order => order.status === 'cancelled').length,
          totalRevenue: ordersList.reduce((total, order) => total + order.total, 0)
        };
        
        setStats(stats);
      }
      
      setLoading(false);
    });
    
    // Load cities
    const citiesRef = ref(db, 'cities');
    onValue(citiesRef, (snapshot) => {
      const data = snapshot.val();
      const citiesList: CityDelivery[] = [];
      
      if (data) {
        Object.keys(data).forEach((key) => {
          citiesList.push({
            ...data[key],
            id: key
          });
        });
        
        // Sort cities alphabetically
        citiesList.sort((a, b) => a.name.localeCompare(b.name));
        
        setCities(citiesList);
      }
    });
    
    // Load products
    const productsRef = ref(db, 'products');
    onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      const productsList: Product[] = [];
      
      if (data) {
        Object.keys(data).forEach((key) => {
          const product = data[key];
          
          // Ensure images is always an array
          if (!product.images || !Array.isArray(product.images)) {
            product.images = [];
          }
          
          productsList.push({
            ...product,
            id: key
          });
        });
        
        // Sort products by name
        productsList.sort((a, b) => a.name.localeCompare(b.name));
        
        setProducts(productsList);
      }
    });
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    
    // Simulate a refresh delay
    setTimeout(() => {
      loadData();
      setRefreshing(false);
      toast.success('تم تحديث البيانات بنجاح');
    }, 500);
  };
  
  const handleSignOut = async () => {
    try {
      const auth = getAuth(firebaseApp);
      await signOut(auth);
      navigate('/login');
      toast.success('تم تسجيل الخروج بنجاح');
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Admin Header */}
        <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">لوحة تحكم المسؤول</h1>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className={`flex items-center gap-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors rounded-md px-3 py-1.5 ${
                  refreshing ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>تحديث</span>
              </button>
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors rounded-md px-3 py-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </header>
        
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-secondary rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-foreground/60 text-sm">إجمالي الطلبات</h3>
                  <p className="text-2xl font-semibold">{stats.totalOrders}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-secondary rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-foreground/60 text-sm">طلبات قيد الانتظار</h3>
                  <p className="text-2xl font-semibold">{stats.pendingOrders}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-secondary rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-foreground/60 text-sm">طلبات تم تسليمها</h3>
                  <p className="text-2xl font-semibold">{stats.deliveredOrders}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-secondary rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-foreground/60 text-sm">إجمالي الإيرادات</h3>
                  <p className="text-2xl font-semibold">{stats.totalRevenue.toFixed(2)} د.ل</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-border mb-8">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                الطلبات
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'products'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                المنتجات
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'categories'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                الفئات
              </button>
              <button
                onClick={() => setActiveTab('cities')}
                className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'cities'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                المدن وأسعار التوصيل
              </button>
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="mb-8">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">إدارة الطلبات</h2>
                </div>
                
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="mt-4 text-foreground/60">جاري تحميل الطلبات...</p>
                  </div>
                ) : (
                  <OrderManager orders={orders} onRefresh={handleRefresh} />
                )}
              </div>
            )}
            
            {/* Products Tab */}
            {activeTab === 'products' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">إدارة المنتجات</h2>
                </div>
                
                <ProductManager />
                
                {/* Facebook Ads Section */}
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">إعلانات فيسبوك</h2>
                  </div>
                  
                  <div className="bg-secondary rounded-xl overflow-hidden shadow-sm mb-6">
                    <div className="p-6 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1877F2]/10 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium">إنشاء إعلانات فيسبوك</h3>
                          <p className="text-sm text-foreground/60">قم بإنشاء إعلانات فيسبوك للترويج لمنتجاتك وزيادة المبيعات</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="divide-y divide-border max-h-96 overflow-y-auto">
                      {products.map((product) => (
                        <div key={product.id} className="p-4 flex items-center justify-between hover:bg-secondary/50">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-md overflow-hidden bg-secondary/50 flex-shrink-0">
                              <img
                                src={(product.images && Array.isArray(product.images) && product.images.length > 0) ? product.images[0] : '/placeholder.svg'}
                                alt={product.name || 'منتج'}
                                className="w-full h-full object-cover object-center"
                                onError={(e) => {
                                  // Fallback if image fails to load
                                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                                }}
                              />
                            </div>
                            <div>
                              <h4 className="font-medium">{product.name}</h4>
                              <p className="text-sm text-foreground/60">{product.category}</p>
                            </div>
                          </div>
                          <Link
                            to={`/facebook-ad/${product.id}`}
                            className="px-3 py-1.5 bg-[#1877F2] text-white rounded text-sm hover:bg-[#1877F2]/90 transition-colors"
                          >
                            إنشاء إعلان
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">إدارة الفئات</h2>
                </div>
                
                <CategoryManager />
              </div>
            )}
            
            {/* Cities Tab */}
            {activeTab === 'cities' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">إدارة المدن وأسعار التوصيل</h2>
                </div>
                
                <CityDeliveryManager />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
