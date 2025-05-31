import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, ArrowRight } from 'lucide-react';
import { Product } from '@/data/products';

interface FacebookAdProps {
  product: Product;
}

const FacebookAd: React.FC<FacebookAdProps> = ({ product }) => {
  // Format price with Libyan Dinar
  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} د.ل`;
  };

  return (
    <div className="facebook-ad bg-white rounded-lg overflow-hidden shadow-lg max-w-3xl mx-auto">
      {/* Facebook Header */}
      <div className="bg-[#1877F2] text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <span className="text-[#1877F2] font-bold text-xl">f</span>
          </div>
          <div>
            <h3 className="font-bold">متجر أناقة</h3>
            <p className="text-xs opacity-80">إعلان ممول</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded">متابعة</button>
          <button className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded">إعجاب</button>
        </div>
      </div>

      {/* Ad Content */}
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          عرض خاص! احصل على {product.name} بخصم {product.discount}%
        </h2>
        <p className="text-gray-600 mb-4">
          منتج مميز من متجر أناقة. جودة عالية وسعر مناسب مع توصيل سريع لجميع مناطق ليبيا.
        </p>
      </div>

      {/* Product Image */}
      <div className="relative">
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-80 object-cover object-center"
        />
        
        {/* Discount Badge */}
        {product.discount && (
          <div className="absolute top-4 left-4 bg-red-500 text-white text-lg font-bold px-4 py-2 rounded-full transform -rotate-12 shadow-lg">
            خصم {product.discount}%
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-6 bg-gray-50">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-xl text-gray-800 mb-1">{product.name}</h3>
            <div className="flex items-center gap-1 mb-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.floor(product.ratings.average) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">({product.ratings.count} تقييم)</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-end gap-2">
              <span className="font-bold text-2xl text-gray-800">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="text-gray-500 line-through">{formatPrice(product.originalPrice)}</span>
              )}
            </div>
            <p className="text-sm text-green-600">متوفر في المخزون</p>
          </div>
        </div>

        <p className="text-gray-600 mb-6 line-clamp-2">{product.description}</p>

        <div className="flex gap-4">
          <Link 
            to={`/products/${product.id}`}
            className="flex-1 bg-[#1877F2] text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-[#1877F2]/90 transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>اطلب الآن</span>
          </Link>
          <Link 
            to="/products"
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-300 transition-colors"
          >
            <span>تصفح المزيد</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Facebook Footer */}
      <div className="border-t border-gray-200 p-4 flex justify-between items-center text-gray-500 text-sm">
        <div className="flex gap-4">
          <button className="flex items-center gap-1 hover:text-[#1877F2]">
            <span>إعجاب</span>
            <span>(245)</span>
          </button>
          <button className="flex items-center gap-1 hover:text-[#1877F2]">
            <span>تعليق</span>
            <span>(32)</span>
          </button>
          <button className="flex items-center gap-1 hover:text-[#1877F2]">
            <span>مشاركة</span>
            <span>(18)</span>
          </button>
        </div>
        <span className="text-xs">تم النشر منذ 3 ساعات</span>
      </div>
    </div>
  );
};

export default FacebookAd;