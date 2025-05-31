
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, ArrowRight, Send, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-secondary pt-16 pb-6 text-foreground/80">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
          {/* Brand & About */}
          <div>
            <Link to="/" className="font-display font-bold text-2xl text-foreground">
              ELEGANCE
            </Link>
            <p className="mt-4 text-sm/relaxed">
              نقدم منتجات استثنائية تجمع بين الأناقة والوظائف العملية 
              والتصميم الخالد. اكتشف تجربة تسوق تحتفي 
              بالبساطة والجودة.
            </p>
            <div className="flex gap-4 mt-6">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-background/50 hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="تابعنا على فيسبوك"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-background/50 hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="تابعنا على انستغرام"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-background/50 hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="تابعنا على تويتر"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-medium text-lg text-foreground mb-5">روابط سريعة</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="group flex items-center text-sm hover:text-primary transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 mr-2 text-primary/60 group-hover:translate-x-1 transition-transform" />
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link to="/products" className="group flex items-center text-sm hover:text-primary transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 mr-2 text-primary/60 group-hover:translate-x-1 transition-transform" />
                  المنتجات
                </Link>
              </li>
              <li>
                <Link to="/about" className="group flex items-center text-sm hover:text-primary transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 mr-2 text-primary/60 group-hover:translate-x-1 transition-transform" />
                  من نحن
                </Link>
              </li>
              <li>
                <Link to="/contact" className="group flex items-center text-sm hover:text-primary transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 mr-2 text-primary/60 group-hover:translate-x-1 transition-transform" />
                  اتصل بنا
                </Link>
              </li>
              <li>
                <Link to="/faq" className="group flex items-center text-sm hover:text-primary transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 mr-2 text-primary/60 group-hover:translate-x-1 transition-transform" />
                  الأسئلة الشائعة
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="group flex items-center text-sm hover:text-primary transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 mr-2 text-primary/60 group-hover:translate-x-1 transition-transform" />
                  سياسة الخصوصية
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact Information */}
          <div>
            <h3 className="font-medium text-lg text-foreground mb-5">اتصل بنا</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 mr-3 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">
                  حي الانتصار, طرابلس
                  ليبيا
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 mr-3 text-primary shrink-0" />
                <a href="tel:+218123456789" className="text-sm hover:text-primary transition-colors">
                  092 207-8595
                </a>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 mr-3 text-primary shrink-0" />
                <a href="mailto:info@elegance.com" className="text-sm hover:text-primary transition-colors">
                  dkhil@info.com
                </a>
              </li>
            </ul>
          </div>
          
          {/* Newsletter */}
          <div>
            <h3 className="font-medium text-lg text-foreground mb-5">النشرة الإخبارية</h3>
            <p className="text-sm mb-4">
              اشترك في نشرتنا الإخبارية لتلقي التحديثات حول المنتجات الجديدة والعروض الخاصة والترويجات.
            </p>
            <form className="flex">
              <input 
                type="email" 
                placeholder="بريدك الإلكتروني" 
                className="flex-1 px-4 py-2 text-sm bg-background rounded-l-md border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
              <button 
                type="submit"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-r-md hover:bg-primary/90 transition-colors"
                aria-label="اشتراك"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-border/50 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-foreground/60 mb-4 md:mb-0">
            © {new Date().getFullYear()} المتجر. جميع الحقوق محفوظة.
          </p>
          <div className="flex gap-4 text-xs text-foreground/60">
            <Link to="/terms" className="hover:text-primary transition-colors">
              شروط الخدمة
            </Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">
              سياسة الخصوصية
            </Link>
            <Link to="/cookies" className="hover:text-primary transition-colors">
              سياسة ملفات تعريف الارتباط
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
