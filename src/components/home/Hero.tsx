import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Package, ShoppingBag, Truck, Star, Sparkles, Heart, Gift } from 'lucide-react';

const Hero = () => {
  const floatingElementsRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  // Parallax effect on mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!floatingElementsRef.current) return;
      
      const elements = floatingElementsRef.current.querySelectorAll('.floating-element');
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      elements.forEach((el) => {
        const element = el as HTMLElement;
        const speed = parseFloat(element.dataset.speed || '0.05');
        const x = (clientX - centerX) * speed;
        const y = (clientY - centerY) * speed;
        
        element.style.transform = `translate(${x}px, ${y}px)`;
      });
    };
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-gradient-to-b from-background via-background/95 to-secondary/20">
      {/* Animated Background Elements */}
      <div ref={floatingElementsRef} className="absolute inset-0 z-0 overflow-hidden">
        {/* Decorative floating elements */}
        <div className="floating-element absolute top-[15%] left-[10%] w-20 h-20 bg-primary/10 rounded-full blur-xl animate-pulse" style={{ animationDuration: '8s' }} data-speed="0.03"></div>
        <div className="floating-element absolute top-[60%] left-[80%] w-32 h-32 bg-primary/20 rounded-full blur-xl animate-pulse" style={{ animationDuration: '12s' }} data-speed="0.05"></div>
        <div className="floating-element absolute top-[30%] left-[70%] w-24 h-24 bg-secondary/30 rounded-full blur-xl animate-pulse" style={{ animationDuration: '10s' }} data-speed="0.07"></div>
        <div className="floating-element absolute top-[80%] left-[20%] w-40 h-40 bg-secondary/20 rounded-full blur-xl animate-pulse" style={{ animationDuration: '15s' }} data-speed="0.04"></div>
        
        {/* Animated icons */}
        <div className="floating-element absolute top-[20%] left-[20%] text-primary/20 animate-float" style={{ animationDuration: '8s' }} data-speed="0.06">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <div className="floating-element absolute top-[70%] left-[75%] text-primary/20 animate-float" style={{ animationDuration: '10s', animationDelay: '1s' }} data-speed="0.08">
          <Package className="w-16 h-16" />
        </div>
        <div className="floating-element absolute top-[40%] left-[85%] text-secondary/30 animate-float" style={{ animationDuration: '9s', animationDelay: '0.5s' }} data-speed="0.05">
          <Sparkles className="w-10 h-10" />
        </div>
        <div className="floating-element absolute top-[85%] left-[30%] text-secondary/30 animate-float" style={{ animationDuration: '11s', animationDelay: '1.5s' }} data-speed="0.07">
          <Truck className="w-14 h-14" />
        </div>
        <div className="floating-element absolute top-[25%] left-[50%] text-primary/20 animate-float" style={{ animationDuration: '12s', animationDelay: '2s' }} data-speed="0.09">
          <Heart className="w-12 h-12" />
        </div>
        <div className="floating-element absolute top-[65%] left-[15%] text-secondary/30 animate-float" style={{ animationDuration: '9.5s', animationDelay: '0.7s' }} data-speed="0.06">
          <Gift className="w-14 h-14" />
        </div>
      </div>
      
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent animate-pulse" style={{ animationDuration: '15s' }}></div>
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 w-full" style={{ transform: `translateY(${scrollY * 0.1}px)` }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="order-2 md:order-1">
            <div className="relative">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-pulse" style={{ animationDuration: '6s' }}></div>
              <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-secondary/20 rounded-full blur-xl animate-pulse" style={{ animationDuration: '8s' }}></div>
              
              <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6 text-right animate-in from-bottom" style={{ '--index': 1 } as React.CSSProperties}>
                <span className="relative inline-block">
                  <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-primary/70">أفضل المنتجات</span>
                  <span className="absolute -top-6 -right-6 text-primary animate-ping opacity-75">
                    <Sparkles className="w-6 h-6" />
                  </span>
                </span> <br />
                <span className="relative">
                  بأسعار مناسبة
                  <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></span>
                </span>
              </h1>
            </div>
            
            <p className="text-foreground/75 text-lg mb-8 max-w-md text-right animate-in from-bottom" style={{ '--index': 2 } as React.CSSProperties}>
              نوفر لك تشكيلة متنوعة من المنتجات عالية الجودة مع توصيل سريع لجميع مناطق ليبيا. تسوق الآن واستمتع بتجربة تسوق مميزة.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-end animate-in from-bottom" style={{ '--index': 3 } as React.CSSProperties}>
              <Link
                to="/products"
                className="relative overflow-hidden group bg-primary text-primary-foreground px-8 py-4 rounded-full font-medium inline-flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  <span>تسوق الآن</span>
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-primary-foreground/0 via-primary-foreground/10 to-primary-foreground/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
              </Link>
              
              <Link
                to="/products"
                className="group px-8 py-4 rounded-full font-medium inline-flex items-center justify-center border border-foreground/20 hover:border-primary/50 transition-colors hover:bg-secondary/50"
              >
                تعرف علينا
                <ArrowRight className="mr-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {/* Features */}
            <div className="grid grid-cols-2 gap-4 mt-12 animate-in from-bottom" style={{ '--index': 4 } as React.CSSProperties}>
              <div className="flex items-center gap-3 bg-secondary/50 p-3 rounded-lg backdrop-blur-sm">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Truck className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">توصيل سريع</span>
              </div>
              
              <div className="flex items-center gap-3 bg-secondary/50 p-3 rounded-lg backdrop-blur-sm">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">منتجات أصلية</span>
              </div>
            </div>
          </div>
          
          {/* 3D Product Display */}
          <div className="order-1 md:order-2 animate-in from-bottom" style={{ '--index': 2 } as React.CSSProperties}>
            <div className="relative perspective-[1000px]">
              {/* Main product image with 3D effect */}
              <div className="relative w-full max-w-md mx-auto transform-style-3d animate-float" style={{ animationDuration: '6s' }}>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl transform rotate-y-[-5deg] hover:rotate-y-[5deg] transition-transform duration-700 group">
                  <img
                    src="https://images.unsplash.com/photo-1576323146872-ac3c5037858a?q=80&w=2070&auto=format&fit=crop"
                    alt="منتج مميز"
                    className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  {/* Glowing overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700"></div>
                  
                  {/* Product badge */}
                  <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm text-foreground px-4 py-2 rounded-full text-sm font-medium animate-pulse">
                    منتج جديد
                  </div>
                  
  
                  
                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center p-6">
                    <button className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium transform translate-y-10 group-hover:translate-y-0 transition-transform duration-500">
                      عرض المنتج
                    </button>
                  </div>
                </div>
                
                {/* Floating elements around the product */}
                <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground p-4 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 animate-bounce" style={{ animationDuration: '3s' }}>
                  <Package className="w-8 h-8" />
                </div>
                
                <div className="absolute -top-4 -right-4 bg-secondary text-foreground p-3 rounded-full shadow-lg animate-spin-slow">
                  <Star className="w-6 h-6" />
                </div>
                
                <div className="absolute bottom-12 -right-8 bg-background/80 backdrop-blur-sm text-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-pulse" style={{ animationDuration: '4s' }}>
                  توصيل سريع
                </div>
                
                <div className="absolute top-1/2 -left-10 bg-background/80 backdrop-blur-sm text-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}>
                  جودة عالية
                </div>
              </div>
              
              {/* Reflection effect */}
              <div className="w-3/4 h-12 bg-gradient-to-t from-primary/20 to-transparent rounded-full mx-auto mt-8 blur-md animate-pulse" style={{ animationDuration: '4s' }}></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-8 h-12 rounded-full border-2 border-foreground/20 flex items-start justify-center p-1.5">
          <div className="w-1.5 h-3 bg-foreground/40 rounded-full"></div>
        </div>
      </div>
      
      {/* Decorative bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-r from-primary/10 via-secondary/20 to-primary/10 opacity-50"></div>
    </section>
  );
};

export default Hero;
