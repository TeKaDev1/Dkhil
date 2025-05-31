import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { firebaseApp } from '@/lib/firebase';
import { toast } from 'sonner';
import { Lock, User, Phone, ArrowRight, Package } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'client' | 'admin'>('client');
  const [loading, setLoading] = useState(false);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [showOrdersList, setShowOrdersList] = useState(false);
  
  // Redirect if user is already logged in (admin only)
  useEffect(() => {
    if (currentUser) {
      // Check if we have a redirect path from the location state
      const from = location.state?.from?.pathname || '/admin-dashboard';
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, location]);
  
  // Admin login form
  const [adminForm, setAdminForm] = useState({
    email: '',
    password: ''
  });
  
  // Client login form
  const [clientForm, setClientForm] = useState({
    orderId: '',
    phoneNumber: ''
  });
  
  const handleAdminInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAdminForm({
      ...adminForm,
      [name]: value
    });
  };
  
  const handleClientInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClientForm({
      ...clientForm,
      [name]: value
    });
    
    // Reset orders list when phone number changes
    if (name === 'phoneNumber') {
      setUserOrders([]);
      setShowOrdersList(false);
    }
  };
  
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminForm.email || !adminForm.password) {
      toast.error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    
    setLoading(true);
    
    try {
      const auth = getAuth(firebaseApp);
      await signInWithEmailAndPassword(auth, adminForm.email, adminForm.password);
      
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/admin-dashboard');
    } catch (error: any) {
      console.error('خطأ في تسجيل الدخول:', error);
      
      if (error.code === 'auth/invalid-credential') {
        toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else {
        toast.error('حدث خطأ أثناء تسجيل الدخول');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const findUserOrders = async () => {
    if (!clientForm.phoneNumber) {
      toast.error('يرجى إدخال رقم الهاتف');
      return;
    }
    
    setLoading(true);
    
    try {
      const db = getDatabase(firebaseApp);
      
      // Query orders by phone number
      const ordersRef = ref(db, 'orders');
      const phoneQuery = query(ordersRef, orderByChild('phoneNumber'), equalTo(clientForm.phoneNumber));
      const snapshot = await get(phoneQuery);
      
      if (snapshot.exists()) {
        const orders: any[] = [];
        
        // Collect all orders for this phone number
        snapshot.forEach((childSnapshot) => {
          const orderData = childSnapshot.val();
          orders.push({
            ...orderData,
            key: childSnapshot.key
          });
        });
        
        // Sort orders by date (newest first)
        orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setUserOrders(orders);
        setShowOrdersList(true);
        
        if (orders.length === 0) {
          toast.error('لم يتم العثور على طلبات مرتبطة برقم الهاتف هذا');
        }
      } else {
        toast.error('لم يتم العثور على طلبات مرتبطة برقم الهاتف هذا');
      }
    } catch (error) {
      console.error('خطأ في البحث عن الطلبات:', error);
      toast.error('حدث خطأ أثناء البحث عن الطلبات');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientForm.orderId || !clientForm.phoneNumber) {
      toast.error('يرجى إدخال رقم الطلب ورقم الهاتف');
      return;
    }
    
    setLoading(true);
    
    try {
      const db = getDatabase(firebaseApp);
      
      // Query orders by phone number
      const ordersRef = ref(db, 'orders');
      const phoneQuery = query(ordersRef, orderByChild('phoneNumber'), equalTo(clientForm.phoneNumber));
      const snapshot = await get(phoneQuery);
      
      if (snapshot.exists()) {
        let orderFound = false;
        let orderKey = '';
        
        // Check if any order matches the order ID
        snapshot.forEach((childSnapshot) => {
          const orderData = childSnapshot.val();
          if (orderData.id === clientForm.orderId) {
            orderFound = true;
            orderKey = childSnapshot.key || '';
          }
        });
        
        if (orderFound && orderKey) {
          toast.success('تم تسجيل الدخول بنجاح');
          
          // Store client login info in localStorage for persistence
          localStorage.setItem('clientOrderKey', orderKey);
          localStorage.setItem('clientPhoneNumber', clientForm.phoneNumber);
          
          // Navigate to client dashboard
          navigate(`/client-dashboard/${orderKey}`);
        } else {
          toast.error('رقم الطلب غير صحيح');
        }
      } else {
        toast.error('لم يتم العثور على طلبات مرتبطة برقم الهاتف هذا');
      }
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      toast.error('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };
  
  const selectOrder = (orderKey: string) => {
    navigate(`/client-dashboard/${orderKey}`);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-LY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get status text
  const getStatusText = (status: string) => {
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
  
  // Get status color class
  const getStatusColorClass = (status: string) => {
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

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen">
        <div className="max-w-md mx-auto px-6">
          <h1 className="text-3xl font-display font-semibold text-center mb-8">تسجيل الدخول</h1>
          
          {/* Login Tabs */}
          <div className="bg-secondary rounded-xl overflow-hidden shadow-sm mb-8">
            <div className="grid grid-cols-2 border-b border-border">
              <button
                onClick={() => setActiveTab('client')}
                className={`py-4 text-center font-medium transition-colors ${
                  activeTab === 'client'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-secondary/80'
                }`}
              >
                العملاء
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`py-4 text-center font-medium transition-colors ${
                  activeTab === 'admin'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-secondary/80'
                }`}
              >
                المسؤول
              </button>
            </div>
            
            <div className="p-6">
              {/* Client Login Form */}
              {activeTab === 'client' && (
                <>
                  {showOrdersList && userOrders.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium">طلباتك ({userOrders.length})</h3>
                        <button
                          onClick={() => setShowOrdersList(false)}
                          className="text-sm text-primary hover:underline"
                        >
                          العودة
                        </button>
                      </div>
                      
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {userOrders.map((order) => (
                          <div
                            key={order.key}
                            onClick={() => selectOrder(order.key)}
                            className="p-3 border border-border rounded-md hover:bg-secondary/80 cursor-pointer transition-colors"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-medium">#{order.id}</span>
                                <span className={`mr-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColorClass(order.status)}`}>
                                  {getStatusText(order.status)}
                                </span>
                              </div>
                              <span className="text-xs text-foreground/60">{formatDate(order.date)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm">
                              <Package className="w-4 h-4 text-primary" />
                              <span>{order.items.length} منتج</span>
                              <span className="text-foreground/60">•</span>
                              <span className="font-medium">{order.total.toFixed(2)} د.ل</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <p className="text-sm text-center text-foreground/60 mt-4">
                        اضغط على أي طلب للاطلاع على تفاصيله
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleClientLogin} className="space-y-4">
                      <div>
                        <label htmlFor="clientPhoneNumber" className="block text-sm font-medium mb-1.5">
                          رقم الهاتف
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                          <input
                            type="tel"
                            id="clientPhoneNumber"
                            name="phoneNumber"
                            value={clientForm.phoneNumber}
                            onChange={handleClientInputChange}
                            placeholder="0911234567"
                            className="w-full pl-10 pr-4 py-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="orderId" className="block text-sm font-medium mb-1.5">
                          رقم الطلب
                        </label>
                        <div className="relative">
                          <ArrowRight className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                          <input
                            type="text"
                            id="orderId"
                            name="orderId"
                            value={clientForm.orderId}
                            onChange={handleClientInputChange}
                            placeholder="أدخل رقم الطلب"
                            className="w-full pl-10 pr-4 py-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-3 mt-6">
                        <button
                          type="button"
                          onClick={findUserOrders}
                          disabled={loading || !clientForm.phoneNumber}
                          className={`flex-1 border border-primary text-primary rounded-md py-3 font-medium hover:bg-primary/10 transition-colors ${
                            (loading || !clientForm.phoneNumber) ? 'opacity-70 cursor-not-allowed' : ''
                          }`}
                        >
                          عرض طلباتي
                        </button>
                        
                        <button
                          type="submit"
                          disabled={loading || !clientForm.orderId || !clientForm.phoneNumber}
                          className={`btn-hover flex-1 bg-primary text-primary-foreground rounded-md py-3 font-medium hover:bg-primary/90 transition-colors ${
                            (loading || !clientForm.orderId || !clientForm.phoneNumber) ? 'opacity-70 cursor-not-allowed' : ''
                          }`}
                        >
                          {loading ? (
                            <span className="inline-block w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></span>
                          ) : (
                            'تسجيل الدخول'
                          )}
                        </button>
                      </div>
                      
                      <p className="text-sm text-center text-foreground/60 mt-4">
                        أدخل رقم الطلب ورقم الهاتف المستخدم عند تقديم الطلب لمتابعة حالة طلبك.
                      </p>
                    </form>
                  )}
                </>
              )}
              
              {/* Admin Login Form */}
              {activeTab === 'admin' && (
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                      البريد الإلكتروني
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={adminForm.email}
                        onChange={handleAdminInputChange}
                        placeholder="أدخل البريد الإلكتروني"
                        className="w-full pl-10 pr-4 py-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                      كلمة المرور
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={adminForm.password}
                        onChange={handleAdminInputChange}
                        placeholder="أدخل كلمة المرور"
                        className="w-full pl-10 pr-4 py-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className={`btn-hover w-full bg-primary text-primary-foreground rounded-md py-3 font-medium hover:bg-primary/90 transition-colors mt-6 ${
                      loading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? (
                      <span className="inline-block w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></span>
                    ) : (
                      'تسجيل الدخول'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Login;
