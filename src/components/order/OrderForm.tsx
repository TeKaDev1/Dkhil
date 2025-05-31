import React, { useState, useEffect } from 'react';
import { getDatabase, ref, push, get, query, orderByChild, equalTo } from 'firebase/database';
import { firebaseApp } from '@/lib/firebase';
import { sendOrderConfirmationEmail } from '@/lib/emailjs';
import { toast } from 'sonner';
import { ShoppingBag, Truck, X, Plus, Search, ArrowRight, Minus } from 'lucide-react';
import products from '@/data/products';
import { Link } from 'react-router-dom';

interface OrderFormProps {
  onClose: () => void;
  productId?: string;
  productName?: string;
  productPrice?: number;
  productImage?: string;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

const OrderForm: React.FC<OrderFormProps> = ({
  onClose,
  productId,
  productName,
  productPrice,
  productImage
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    city: '',
    address: '',
    notes: ''
  });
  
  const [cities, setCities] = useState<{id: string; name: string; price: number}[]>([]);
  const [deliveryPrice, setDeliveryPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingCities, setLoadingCities] = useState(true);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showCategoryProducts, setShowCategoryProducts] = useState(false);
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  // Initialize order items
  useEffect(() => {
    if (productId && productName && productPrice && productImage) {
      setOrderItems([{
        id: productId,
        name: productName,
        price: productPrice,
        quantity: 1,
        image: productImage
      }]);
      
      // Find category products
      const product = products.find(p => p.id === productId);
      if (product) {
        const relatedProducts = products.filter(p =>
          p.category === product.category && p.id !== productId
        );
        setCategoryProducts(relatedProducts);
      }
    }
  }, [productId, productName, productPrice, productImage]);
  
  // Calculate total price
  const calculateSubtotal = () => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  const subtotal = calculateSubtotal();
  const total = subtotal + deliveryPrice;
  
  // Load cities from Firebase
  useEffect(() => {
    const loadCities = async () => {
      setLoadingCities(true);
      const db = getDatabase(firebaseApp);
      const citiesRef = ref(db, 'cities');
      
      try {
        const snapshot = await get(citiesRef);
        if (snapshot.exists()) {
          const citiesData = snapshot.val();
          const citiesList = Object.keys(citiesData).map(key => ({
            id: key,
            name: citiesData[key].name,
            price: citiesData[key].price
          }));
          
          // Sort cities alphabetically
          citiesList.sort((a, b) => a.name.localeCompare(b.name));
          
          setCities(citiesList);
        }
      } catch (error) {
        console.error('خطأ في تحميل المدن:', error);
      } finally {
        setLoadingCities(false);
      }
    };
    
    loadCities();
  }, []);
  
  // Handle city change
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityId = e.target.value;
    const selectedCity = cities.find(city => city.id === cityId);
    
    setFormData({
      ...formData,
      city: selectedCity ? selectedCity.name : ''
    });
    
    setDeliveryPrice(selectedCity ? selectedCity.price : 0);
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle quantity change
  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setOrderItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };
  
  // Remove item from order
  const removeOrderItem = (itemId: string) => {
    setOrderItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };
  
  // Add product from category
  const addProductToOrder = (product: any) => {
    // Check if product already exists in order
    const existingItem = orderItems.find(item => item.id === product.id);
    
    if (existingItem) {
      // Update quantity if product already exists
      updateItemQuantity(product.id, existingItem.quantity + 1);
    } else {
      // Add new product
      setOrderItems(prevItems => [
        ...prevItems,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.images[0]
        }
      ]);
    }
    
    // Hide category products after adding
    setShowCategoryProducts(false);
    toast.success(`تمت إضافة ${product.name} إلى الطلب`);
  };
  
  // Filter category products by search query
  const filteredCategoryProducts = categoryProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (orderItems.length === 0) {
      toast.error('يجب إضافة منتج واحد على الأقل');
      return;
    }
    
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال الاسم');
      return;
    }
    
    if (!formData.phoneNumber.trim()) {
      toast.error('يرجى إدخال رقم الهاتف');
      return;
    }
    
    if (!formData.city) {
      toast.error('يرجى اختيار المدينة');
      return;
    }
    
    if (!formData.address.trim()) {
      toast.error('يرجى إدخال العنوان');
      return;
    }
    
    setLoading(true);
    try {
      const db = getDatabase(firebaseApp);
      const ordersRef = ref(db, 'orders');
      
      // Generate order ID starting from 100 and incrementing
      
      // Get the latest order to determine the next ID
      const ordersSnapshot = await get(ordersRef);
      let nextOrderId = 100; // Start from 100 if no orders exist
      
      if (ordersSnapshot.exists()) {
        // Find the highest order ID
        const orders = ordersSnapshot.val();
        const orderIds = Object.values(orders).map((order: any) => {
          const id = parseInt(order.id);
          return isNaN(id) ? 0 : id;
        });
        
        if (orderIds.length > 0) {
          const highestId = Math.max(...orderIds);
          nextOrderId = highestId + 1;
        }
      }
      
      const generatedOrderId = nextOrderId.toString();
      
      // Copy order ID to clipboard for easy access
      try {
        await navigator.clipboard.writeText(generatedOrderId);
        toast.success('تم نسخ رقم الطلب إلى الحافظة', { duration: 3000 });
      } catch (err) {
        console.error('Failed to copy order ID to clipboard:', err);
      }
      
      // Create order object
      const orderData = {
        id: generatedOrderId,
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        city: formData.city,
        address: formData.address,
        notes: formData.notes,
        items: orderItems,
        subtotal,
        deliveryPrice,
        total,
        status: 'pending',
        date: new Date().toISOString()
      };
      
      // Save order to Firebase
      const newOrderRef = await push(ordersRef, orderData);
      
      // Send confirmation email
      await sendOrderConfirmationEmail({
        id: generatedOrderId,
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        address: `${formData.city}, ${formData.address}`,
        items: orderItems,
        total: total
      });
      
      // Set order ID for success message
      setOrderId(generatedOrderId);
      setOrderSuccess(true);
      
      // Show success message
      toast.success('تم إرسال طلبك بنجاح');
    } catch (error) {
      console.error('خطأ في إرسال الطلب:', error);
      toast.error('حدث خطأ أثناء إرسال الطلب');
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-background p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-medium">إتمام الطلب</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {orderSuccess ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-medium mb-2">تم إرسال طلبك بنجاح!</h3>
            <p className="text-foreground/70 mb-6">
              رقم الطلب الخاص بك هو: <span className="font-bold text-primary">{orderId}</span>
            </p>
            <p className="text-foreground/70 mb-6">
              يمكنك متابعة حالة طلبك من خلال تسجيل الدخول باستخدام رقم الطلب ورقم الهاتف.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-md font-medium border border-border hover:bg-secondary transition-colors"
              >
                العودة للتسوق
              </button>
              <Link
                to="/login"
                className="btn-hover bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                <span>متابعة الطلب</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            {/* Order Items */}
            <div className="bg-secondary/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <h3 className="font-medium">المنتجات</h3>
                </div>
                
                {categoryProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowCategoryProducts(!showCategoryProducts)}
                    className="text-sm text-primary font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة منتج</span>
                  </button>
                )}
              </div>
              
              {/* Category Products */}
              {showCategoryProducts && (
                <div className="mb-4 border border-border rounded-md p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                      <input
                        type="text"
                        placeholder="ابحث عن منتج..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredCategoryProducts.length > 0 ? (
                      filteredCategoryProducts.map((product) => (
                        <div key={product.id} className="flex items-center gap-3 p-2 hover:bg-secondary/80 rounded-md">
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-secondary/50 flex-shrink-0">
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover object-center"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">{product.name}</h4>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-foreground/60">
                                {product.category}
                              </span>
                              <span className="text-sm font-medium">
                                {product.price.toFixed(2)} د.ل
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => addProductToOrder(product)}
                            className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md hover:bg-primary/20 transition-colors"
                          >
                            إضافة
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-sm text-foreground/60 py-4">
                        لا توجد منتجات متطابقة مع البحث
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Order Items List */}
              <div className="space-y-3 mb-4">
                {orderItems.length > 0 ? (
                  orderItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-secondary/50 flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover object-center"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <div className="flex justify-between items-center mt-1">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                              className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-foreground/60 hover:bg-secondary/80"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                              className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-foreground/60 hover:bg-secondary/80"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">
                              {(item.price * item.quantity).toFixed(2)} د.ل
                            </span>
                            <button
                              type="button"
                              onClick={() => removeOrderItem(item.id)}
                              className="text-red-500 hover:text-red-600"
                              aria-label="Remove item"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-foreground/60 py-4">
                    لا توجد منتجات في الطلب. يرجى إضافة منتج واحد على الأقل.
                  </p>
                )}
              </div>
              
              {/* Order Summary */}
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>المجموع الفرعي</span>
                  <span>{subtotal.toFixed(2)} د.ل</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>رسوم التوصيل</span>
                  <span>{deliveryPrice.toFixed(2)} د.ل</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t border-border">
                  <span>المجموع</span>
                  <span>{total.toFixed(2)} د.ل</span>
                </div>
              </div>
            </div>
            
            {/* Customer Information */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1.5">
                  الاسم الكامل <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1.5">
                  رقم الهاتف <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="09xxxxxxxx"
                  className="w-full px-4 py-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="city" className="block text-sm font-medium mb-1.5">
                  المدينة <span className="text-red-500">*</span>
                </label>
                <select
                  id="city"
                  name="city"
                  onChange={handleCityChange}
                  className="w-full px-4 py-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                  disabled={loadingCities}
                >
                  <option value="">اختر المدينة</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name} - {city.price.toFixed(2)} د.ل
                    </option>
                  ))}
                </select>
                {loadingCities && (
                  <p className="text-xs text-foreground/60 mt-1">جاري تحميل المدن...</p>
                )}
              </div>
              
              <div>
                <label htmlFor="address" className="block text-sm font-medium mb-1.5">
                  العنوان <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium mb-1.5">
                  ملاحظات (اختياري)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                ></textarea>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={loading || orderItems.length === 0}
                className={`btn-hover w-full bg-primary text-primary-foreground rounded-md py-3 font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 ${
                  (loading || orderItems.length === 0) ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></span>
                    <span>جاري إرسال الطلب...</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-5 h-5" />
                    <span>إرسال الطلب</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default OrderForm;