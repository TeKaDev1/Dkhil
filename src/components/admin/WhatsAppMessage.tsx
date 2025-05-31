import React, { useState } from 'react';
import { Send, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppMessageProps {
  order: {
    id: string;
    name: string;
    phoneNumber: string;
    items: {
      name: string;
      quantity: number;
    }[];
    total: number;
    status: string;
  };
}

const WhatsAppMessage: React.FC<WhatsAppMessageProps> = ({ order }) => {
  const [message, setMessage] = useState(
    `مرحباً ${order.name}،\n\nنشكرك على طلبك من متجر أناقة!\n\nرقم الطلب: #${order.id}\nحالة الطلب: ${getStatusText(order.status)}\n\nالمنتجات:\n${order.items.map(item => `- ${item.name} (${item.quantity}x)`).join('\n')}\n\nالمجموع: ${order.total.toFixed(2)} د.ل\n\nيمكنك متابعة حالة طلبك من خلال الرابط التالي:\n${window.location.origin}/client-dashboard/${order.id}\n\nشكراً لك،\nفريق أناقة`
  );
  
  const [copied, setCopied] = useState(false);
  
  // Get status text in Arabic
  function getStatusText(status: string) {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'processing': return 'قيد المعالجة';
      case 'shipped': return 'تم الشحن';
      case 'delivered': return 'تم التسليم';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  }
  
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };
  
  const handleSendMessage = () => {
    // Format phone number (remove leading 0 and add Libya country code)
    let phoneNumber = order.phoneNumber;
    if (phoneNumber.startsWith('0')) {
      phoneNumber = phoneNumber.substring(1);
    }
    phoneNumber = `218${phoneNumber}`;
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
  };
  
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success('تم نسخ الرسالة');
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  return (
    <div className="bg-secondary rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-medium mb-4">إرسال رسالة واتساب</h2>
      
      <div className="mb-4">
        <label htmlFor="whatsapp-message" className="block text-sm font-medium mb-1.5">
          نص الرسالة
        </label>
        <textarea
          id="whatsapp-message"
          value={message}
          onChange={handleMessageChange}
          rows={10}
          className="w-full px-4 py-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
        ></textarea>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleCopyMessage}
          className="flex-1 flex items-center justify-center gap-2 bg-secondary/80 hover:bg-secondary/50 text-foreground border border-border rounded-md py-2.5 font-medium transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>تم النسخ</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>نسخ الرسالة</span>
            </>
          )}
        </button>
        
        <button
          onClick={handleSendMessage}
          className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#25D366]/90 text-white rounded-md py-2.5 font-medium transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>إرسال عبر واتساب</span>
        </button>
      </div>
    </div>
  );
};

export default WhatsAppMessage;