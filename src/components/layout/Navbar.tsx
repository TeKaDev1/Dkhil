
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, ChevronDown } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header 
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-3 border-b',
        isScrolled 
          ? 'bg-background/95 backdrop-blur-md shadow-sm border-primary/10' 
          : 'bg-background/50 backdrop-blur-sm border-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-10">
        {/* Logo */}
        <Link 
          to="/" 
          className="font-tajawal font-bold text-xl md:text-2xl tracking-tight transition-transform hover:scale-105 text-primary"
        >
          أناقة
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:block">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/" className={navigationMenuTriggerStyle()}>
                  الرئيسية
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>المنتجات</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-2 rtl">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <Link
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-primary/50 to-primary p-6 no-underline outline-none focus:shadow-md"
                          to="/products"
                        >
                          <div className="mb-2 mt-4 text-lg font-medium text-white">
                            جميع المنتجات
                          </div>
                          <p className="text-sm leading-tight text-white/90">
                            استكشف مجموعتنا الكاملة من المنتجات المميزة
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/products?category=clothing"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">الملابس</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            أحدث صيحات الموضة والملابس العصرية
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/products?category=accessories"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">الإكسسوارات</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            قطع مميزة تكمل إطلالتك
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/about" className={navigationMenuTriggerStyle()}>
                  من نحن
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/contact" className={navigationMenuTriggerStyle()}>
                  اتصل بنا
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          
          <Link
            to="/login"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full hover:bg-secondary transition-colors"
            aria-label="حسابي"
          >
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">حسابي</span>
          </Link>
        </div>
        
        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="relative w-10 h-10 flex flex-col items-center justify-center gap-[5px] z-50 focus:outline-none"
            aria-label={isMobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
          >
            <span className={`w-5 h-[2px] bg-current transform transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''}`}></span>
            <span className={`w-5 h-[2px] bg-current transform transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
            <span className={`w-5 h-[2px] bg-current transform transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`}></span>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div className={`fixed inset-x-0 top-[57px] bg-background border-b border-primary/10 shadow-lg transition-all duration-300 overflow-hidden ${isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} md:hidden`}>
        <nav className="flex flex-col p-4 gap-3">
          <Link 
            to="/" 
            className="font-medium w-full text-right py-3 px-4 hover:bg-secondary rounded-md transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            الرئيسية
          </Link>
          <Link 
            to="/products" 
            className="font-medium w-full text-right py-3 px-4 hover:bg-secondary rounded-md transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            المنتجات
          </Link>
          <Link 
            to="/about" 
            className="font-medium w-full text-right py-3 px-4 hover:bg-secondary rounded-md transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            من نحن
          </Link>
          <Link 
            to="/contact" 
            className="font-medium w-full text-right py-3 px-4 hover:bg-secondary rounded-md transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            اتصل بنا
          </Link>
          <Link 
            to="/login" 
            className="font-medium w-full text-right py-3 px-4 hover:bg-secondary rounded-md transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            تسجيل الدخول
          </Link>
          {/* No cart link needed */}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
