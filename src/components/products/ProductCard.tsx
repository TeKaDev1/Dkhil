import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Product } from '@/data/products';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  className?: string;
  style?: React.CSSProperties;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, className, style }) => {
  return (
    <div
      className={cn(
        "product-card group relative bg-background rounded-xl overflow-hidden transition-all duration-300",
        "hover:shadow-xl",
        className
      )}
      style={style}
    >
      {/* Product Image */}
      <Link to={`/products/${product.id}`} className="block aspect-square overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Discount Badge */}
        {product.discount && (
          <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-medium px-2.5 py-1 rounded">
            {product.discount}% OFF
          </span>
        )}
      </Link>
      
      {/* Quick Actions */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 transform translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
        <button
          className="w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-primary hover:text-primary-foreground transition-colors"
          aria-label="Add to wishlist"
        >
          <Heart className="w-4 h-4" />
        </button>
      </div>
      
      {/* Product Info */}
      <div className="p-5">
        <h3 className="font-medium text-base mb-1 line-clamp-1">
          <Link to={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        
        <div className="flex items-end gap-2">
          <span className="font-semibold">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="text-sm text-foreground/60 line-through">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
