import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getDatabase, ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { firebaseApp } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/products/ProductCard';
import { Package, Phone, ArrowLeft, Clock, MapPin, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import products from '@/data/products';

// Order status types
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// Order interface
interface Order {
  id: string;
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

const ClientDashboard = () => {
  const { orderId, phoneNumber } = useParams<{ orderId: string; phoneNumber: string }>();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  
  useEffect(() => {
    // Check if we have an orderId parameter or stored client info
    const storedOrderKey = localStorage.getItem('clientOrderKey');
    const storedPhoneNumber = localStorage.getItem('clientPhoneNumber');
    
    if (!orderId && !storedOrderKey) {
      // No authentication info, redirect to login
      navigate('/login');
      return;
    }
    
    // Use the orderId from URL params or from localStorage
    const orderIdToUse = orderId || storedOrderKey;
    
    if (orderIdToUse) {
      loadOrderData(orderIdToUse);
    }
  }, [orderId, navigate]);
  
  useEffect(() => {
    // If we have an orderId and orders are loaded, select that order
    if (orderId && orders.length > 0) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        findRelatedProducts(order);
      }
    } else if (orders.length > 0) {
      // Otherwise select the most recent order
      setSelectedOrder(orders[0]);
      findRelatedProducts(orders[0]);
    }
  }, [orderId, orders]);
  
  const loadOrderData = (orderKey: string) => {
    setLoading(true);
    const db = getDatabase(firebaseApp);
    
    try {
      // Get the specific order by key
      const orderRef = ref(db, `orders/${orderKey}`);
      
      onValue(orderRef, (snapshot) => {
        if (snapshot.exists()) {
          const orderData = snapshot.val();
          
          // Store the phone number for future use
          if (orderData.phoneNumber) {
            localStorage.setItem('clientPhoneNumber', orderData.phoneNumber);
          }
          
          // Create an order object
          const order = {
            id: orderKey,
            ...orderData
          };
          
          // Set the orders array with just this order
          setOrders([order]);
          setSelectedOrder(order);
          findRelatedProducts(order);
          setLoading(false);
        } else {
          // Order not found
          toast.error('لم يتم العثور على الطلب');
          localStorage.removeItem('clientOrderKey');
          localStorage.removeItem('clientPhoneNumber');
          navigate('/login');
          setLoading(false);
        }
      }, (error) => {
        console.error("Error loading order:", error);
        toast.error('حدث خطأ أثناء تحميل الطلب');
        setLoading(false);
      });
    } catch (error) {
      console.error("Error in query setup:", error);
      toast.error('حدث خطأ أثناء تحميل الطلب');
      setLoading(false);
    }
  };
  
  const findRelatedProducts = (order: Order) => {
    // Find related products based on categories
    if (order.items && order.items.length > 0) {
      const categories = new Set();
      order.items.forEach((item: any) => {
        const product = products.find(p => p.id === item.id);
        if (product) {
          categories.add(product.category);
        }
      });
      
      // Get related products from the same categories
      const related = products
        .filter(p => categories.has(p.category) && !order.items.some((item: any) => item.id === p.id))
        .slice(0, 4);
      
      setRelatedProducts(related);
    }
  };
  
  const handleSignOut = () => {
    // Clear client login info from localStorage
    localStorage.removeItem('clientOrderKey');
    localStorage.removeItem('clientPhoneNumber');
    navigate('/login');
  };
  
  const selectOrder = (order: Order) => {
    setSelectedOrder(order);
    findRelatedProducts(order);
    
    // Store the selected order key in localStorage
    localStorage.setItem('clientOrderKey', order.id);
    
    // Update URL without reloading the page
    navigate(`/client-dashboard/${order.id}`, { replace: true });
  };
  
  // Get status color class
  const getStatusColorClass = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-500';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  // Get status text
  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'قيد الانتظار';
      case 'processing':
        return 'قيد المعالجة';
      case 'shipped':
        return 'تم الشحن';
      case 'delivered':
        return 'تم التسليم';
      case 'cancelled':
        return 'ملغي';
      default:
        return '';
    }
  };
  
  // Get status step
  const getStatusStep = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 1;
      case 'processing':
        return 2;
      case 'shipped':
        return 3;
      case 'delivered':
        return 4;
      case 'cancelled':
        return 0;
      default:
        return 0;
    }
  };

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <p className="mt-4 text-foreground/60">جاري تحميل بيانات الطلب...</p>
            </div>
          ) : orders.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Orders List - New Section */}
              <div className="lg:col-span-3 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-display font-semibold">طلباتي</h1>
                  <div className="flex gap-3">
                    <Link 
                      to="/" 
                      className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>الرئيسية</span>
                    </Link>
                    <button 
                      onClick={handleSignOut}
                      className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                    >
                      تسجيل الخروج
                    </button>
                  </div>
                </div>
                
                <div className="bg-secondary rounded-xl overflow-hidden shadow-sm mb-8">
                  <div className="p-6 border-b border-border">
                    <h2 className="text-lg font-medium">جميع الطلبات</h2>
                  </div>
                  
                  <div className="divide-y divide-border">
                    {orders.map((order) => (
                      <div 
                        key={order.id} 
                        className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-background/50 transition-colors ${
                          selectedOrder?.id === order.id ? 'bg-background/80' : ''
                        }`}
                        onClick={() => selectOrder(order)}
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-6 h-6 text-primary" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium">طلب #{order.id}</h3>
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColorClass(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-sm text-foreground/60">
                              {new Date(order.date).toLocaleDateString('ar-LY')}
                            </span>
                            <span className="font-medium">
                              {order.total.toFixed(2)} د.ل
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {selectedOrder && (
                <>
                  {/* Order Details */}
                  <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                      <h1 className="text-2xl font-display font-semibold">تفاصيل الطلب #{selectedOrder.id}</h1>
                    </div>
                    
                    {/* Order Status */}
                    <div className="bg-secondary rounded-xl p-6 shadow-sm mb-8">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-medium">حالة الطلب</h2>
                        <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${getStatusColorClass(selectedOrder.status)}`}>
                          {getStatusText(selectedOrder.status)}
                        </span>
                      </div>
                      
                      {selectedOrder.status !== 'cancelled' && (
                        <div className="relative">
                          {/* Progress Bar */}
                          <div className="h-1 bg-border rounded-full mb-8">
                            <div 
                              className="h-1 bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${(getStatusStep(selectedOrder.status) / 4) * 100}%` }}
                            ></div>
                          </div>
                          
                          {/* Steps */}
                          <div className="grid grid-cols-4 relative">
                            {/* Step 1: Pending */}
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                                getStatusStep(selectedOrder.status) >= 1 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-border/50 text-foreground/40'
                              }`}>
                                <Clock className="w-4 h-4" />
                              </div>
                              <span className="text-xs text-center">قيد الانتظار</span>
                            </div>
                            
                            {/* Step 2: Processing */}
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                                getStatusStep(selectedOrder.status) >= 2 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-border/50 text-foreground/40'
                              }`}>
                                <Package className="w-4 h-4" />
                              </div>
                              <span className="text-xs text-center">قيد المعالجة</span>
                            </div>
                            
                            {/* Step 3: Shipped */}
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                                getStatusStep(selectedOrder.status) >= 3 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-border/50 text-foreground/40'
                              }`}>
                                <MapPin className="w-4 h-4" />
                              </div>
                              <span className="text-xs text-center">تم الشحن</span>
                            </div>
                            
                            {/* Step 4: Delivered */}
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                                getStatusStep(selectedOrder.status) >= 4 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-border/50 text-foreground/40'
                              }`}>
                                <Package className="w-4 h-4" />
                              </div>
                              <span className="text-xs text-center">تم التسليم</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Order Items */}
                    <div className="bg-secondary rounded-xl overflow-hidden shadow-sm mb-8">
                      <div className="p-6 border-b border-border">
                        <h2 className="text-lg font-medium">المنتجات</h2>
                      </div>
                      
                      <div className="divide-y divide-border">
                        {selectedOrder.items.map((item, index) => (
                          <div key={index} className="p-6 flex items-center gap-4">
                            <div className="w-16 h-16 rounded-md overflow-hidden bg-secondary/50 flex-shrink-0">
                              <img 
                                src={item.image} 
                                alt={item.name}
                                className="w-full h-full object-cover object-center"
                              />
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="font-medium">{item.name}</h3>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-sm text-foreground/60">
                                  {item.quantity} × {item.price.toFixed(2)} د.ل
                                </span>
                                <span className="font-medium">
                                  {(item.price * item.quantity).toFixed(2)} د.ل
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="p-6 bg-secondary/50 border-t border-border">
                        <div className="flex justify-between items-center font-medium">
                          <span>المجموع</span>
                          <span>{selectedOrder.total.toFixed(2)} د.ل</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Order Summary */}
                  <div className="lg:col-span-1">
                    <div className="bg-secondary rounded-xl p-6 shadow-sm sticky top-24">
                      <h2 className="text-lg font-medium mb-6">ملخص الطلب</h2>
                      
                      <div className="space-y-4 mb-6">
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-medium text-sm">تاريخ الطلب</h3>
                            <p className="text-foreground/60 text-sm">
                              {new Date(selectedOrder.date).toLocaleDateString('ar-LY')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-medium text-sm">عنوان التوصيل</h3>
                            <p className="text-foreground/60 text-sm">
                              {selectedOrder.city}، {selectedOrder.address}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-medium text-sm">رقم الهاتف</h3>
                            <p className="text-foreground/60 text-sm">
                              {selectedOrder.phoneNumber}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Customer Service Section */}
                      <div className="bg-primary/5 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                          <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-medium">خدمة العملاء</h3>
                            <p className="text-foreground/70 text-sm mb-2">
                              هل لديك استفسار حول طلبك؟ اتصل بنا على:
                            </p>
                            <a
                              href="tel:0922078595"
                              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                            >
                              <Phone className="w-4 h-4" />
                              0922078595
                            </a>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-border pt-6">
                        <a
                          href="tel:+2180922078595"
                          className="btn-hover w-full bg-primary text-primary-foreground rounded-md py-3 font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                        >
                          <Phone className="w-4 h-4" />
                          <span>اتصل بخدمة العملاء: 0922078595</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-medium mb-2">لا توجد طلبات</h2>
              <p className="text-foreground/60 mb-6">
                لم يتم العثور على أي طلبات مرتبطة برقم الهاتف هذا.
              </p>
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                العودة لتسجيل الدخول
              </Link>
            </div>
          )}
          
          {/* Related Products */}
          {selectedOrder && (
            <div className="mt-16 related-products-section">
              <h2 className="text-2xl font-display font-semibold mb-8 related-products-title">منتجات قد تعجبك</h2>
              {relatedProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 related-products-grid">
                  {relatedProducts.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      className="animate-in from-bottom shadow-lg hover:shadow-xl transition-all duration-300"
                      style={{ '--index': index } as React.CSSProperties}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-secondary/50 rounded-xl p-8 text-center">
                  <h3 className="text-lg font-medium mb-2">لا توجد منتجات مشابهة حالياً</h3>
                  <p className="text-foreground/60 mb-4">يمكنك تصفح المزيد من المنتجات في صفحة المنتجات</p>
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
                  >
                    تصفح جميع المنتجات
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ClientDashboard;