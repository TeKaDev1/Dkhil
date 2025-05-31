import React, { useState } from 'react';
import { getDatabase, ref, update, remove, get } from 'firebase/database';
import { firebaseApp } from '@/lib/firebase';
import { toast } from 'sonner';
import { Package, ChevronDown, ChevronUp, Trash, MessageSquare, AlertTriangle } from 'lucide-react';
import WhatsAppMessage from './WhatsAppMessage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Order status types
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// Order interface
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  key: string;
  name: string;
  phoneNumber: string;
  address: string;
  city: string;
  notes?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  date: string;
}

interface OrderManagerProps {
  orders: Order[];
  onRefresh: () => void;
}

const OrderManager: React.FC<OrderManagerProps> = ({ orders, onRefresh }) => {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showWhatsApp, setShowWhatsApp] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  
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
  
  // Toggle order expansion
  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
    // Close WhatsApp if open
    if (showWhatsApp === orderId) {
      setShowWhatsApp(null);
    }
  };
  
  // Toggle WhatsApp message
  const toggleWhatsApp = (orderId: string) => {
    setShowWhatsApp(showWhatsApp === orderId ? null : orderId);
  };
  
  // Update order status
  const updateOrderStatus = async (orderId: string, status: OrderStatus, order: Order) => {
    try {
      const db = getDatabase(firebaseApp);
      const orderRef = ref(db, `orders/${orderId}`);
      
      await update(orderRef, { status });
      
      // If status is "delivered", reduce stock for each item
      if (status === 'delivered') {
        // Get the order items
        const items = order.items;
        
        // Update stock for each product
        for (const item of items) {
          const productRef = ref(db, `products/${item.id}`);
          
          // Get current product data to update stock
          const productSnapshot = await get(productRef);
          if (productSnapshot.exists()) {
            const productData = productSnapshot.val();
            const currentStock = productData.stock || 0;
            const newStock = Math.max(0, currentStock - item.quantity); // Ensure stock doesn't go below 0
            
            // Update the product stock
            await update(productRef, { stock: newStock });
            console.log(`Updated stock for product ${item.id}: ${currentStock} -> ${newStock}`);
          }
        }
        
        toast.success('تم تحديث حالة الطلب وتخفيض المخزون بنجاح');
      } else {
        toast.success('تم تحديث حالة الطلب بنجاح');
      }
      
      onRefresh();
    } catch (error) {
      console.error('خطأ في تحديث حالة الطلب:', error);
      toast.error('حدث خطأ أثناء تحديث حالة الطلب');
    }
  };
  
  // Show delete confirmation dialog
  const confirmDeleteOrder = (orderId: string) => {
    setOrderToDelete(orderId);
    setDeleteDialogOpen(true);
  };
  
  // Delete order
  const deleteOrder = async () => {
    if (!orderToDelete) return;
    
    try {
      const db = getDatabase(firebaseApp);
      const orderRef = ref(db, `orders/${orderToDelete}`);
      
      await remove(orderRef);
      
      toast.success('تم حذف الطلب بنجاح');
      onRefresh();
      setOrderToDelete(null);
    } catch (error) {
      console.error('خطأ في حذف الطلب:', error);
      toast.error('حدث خطأ أثناء حذف الطلب');
    }
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
  
  return (
    <div className="bg-secondary rounded-xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-medium">إدارة الطلبات</h2>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="font-sans">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-right">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>تأكيد حذف الطلب</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء وسيتم حذف جميع بيانات الطلب نهائيًا.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse sm:justify-start">
            <AlertDialogCancel className="sm:ml-2">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteOrder}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              حذف الطلب
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">لا توجد طلبات</h3>
          <p className="text-foreground/60">لم يتم تقديم أي طلبات بعد.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {orders.map((order) => (
            <div key={order.key} className="transition-all duration-300">
              {/* Order Header */}
              <div 
                className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-secondary/50"
                onClick={() => toggleOrderExpansion(order.key)}
              >
                <div className="flex items-center gap-3 mb-3 md:mb-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">#{order.id}</h3>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColorClass(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/60">{order.name} - {order.phoneNumber}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-4">
                  <div className="text-right">
                    <p className="font-medium">{order.total.toFixed(2)} د.ل</p>
                    <p className="text-xs text-foreground/60">{formatDate(order.date)}</p>
                  </div>
                  
                  <div className="flex items-center">
                    {expandedOrder === order.key ? (
                      <ChevronUp className="w-5 h-5 text-foreground/60" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-foreground/60" />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Order Details */}
              {expandedOrder === order.key && (
                <div className="p-4 pt-0 bg-secondary/50">
                  <div className="border-t border-border pt-4 mt-2">
                    {/* Order Items */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium mb-3">المنتجات</h4>
                      <div className="space-y-3">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-md overflow-hidden bg-secondary/50 flex-shrink-0">
                              <img 
                                src={item.image} 
                                alt={item.name}
                                className="w-full h-full object-cover object-center"
                              />
                            </div>
                            <div className="flex-1">
                              <h5 className="text-sm font-medium">{item.name}</h5>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-foreground/60">
                                  {item.quantity} × {item.price.toFixed(2)} د.ل
                                </span>
                                <span className="text-sm font-medium">
                                  {(item.price * item.quantity).toFixed(2)} د.ل
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Customer Info */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium mb-3">معلومات العميل</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-foreground/60">الاسم</p>
                          <p className="font-medium">{order.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-foreground/60">رقم الهاتف</p>
                          <p className="font-medium">{order.phoneNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-foreground/60">المدينة</p>
                          <p className="font-medium">{order.city}</p>
                        </div>
                        <div>
                          <p className="text-sm text-foreground/60">العنوان</p>
                          <p className="font-medium">{order.address}</p>
                        </div>
                      </div>
                      
                      {order.notes && (
                        <div className="mt-4">
                          <p className="text-sm text-foreground/60">ملاحظات</p>
                          <p className="font-medium">{order.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Status Update */}
                      <div className="flex-1">
                        <h4 className="text-sm font-medium mb-3">تحديث الحالة</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          <button
                            onClick={() => updateOrderStatus(order.key, 'pending', order)}
                            className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                              order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
                                : 'bg-secondary/80 hover:bg-yellow-100 hover:text-yellow-800 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-500'
                            }`}
                          >
                            قيد الانتظار
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.key, 'processing', order)}
                            className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                              order.status === 'processing'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500'
                                : 'bg-secondary/80 hover:bg-blue-100 hover:text-blue-800 dark:hover:bg-blue-900/30 dark:hover:text-blue-500'
                            }`}
                          >
                            قيد المعالجة
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.key, 'shipped', order)}
                            className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                              order.status === 'shipped'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-500'
                                : 'bg-secondary/80 hover:bg-purple-100 hover:text-purple-800 dark:hover:bg-purple-900/30 dark:hover:text-purple-500'
                            }`}
                          >
                            تم الشحن
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.key, 'delivered', order)}
                            className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                              order.status === 'delivered'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'
                                : 'bg-secondary/80 hover:bg-green-100 hover:text-green-800 dark:hover:bg-green-900/30 dark:hover:text-green-500'
                            }`}
                          >
                            تم التسليم
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.key, 'cancelled', order)}
                            className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                              order.status === 'cancelled'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500'
                                : 'bg-secondary/80 hover:bg-red-100 hover:text-red-800 dark:hover:bg-red-900/30 dark:hover:text-red-500'
                            }`}
                          >
                            ملغي
                          </button>
                        </div>
                      </div>
                      
                      {/* Other Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWhatsApp(order.key);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white rounded-md text-sm hover:bg-[#25D366]/90 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>واتساب</span>
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDeleteOrder(order.key);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
                        >
                          <Trash className="w-4 h-4" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* WhatsApp Message */}
                    {showWhatsApp === order.key && (
                      <div className="mt-6">
                        <WhatsAppMessage order={order} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderManager;