import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDatabase, ref, get } from 'firebase/database';
import { firebaseApp } from '@/lib/firebase';
import FacebookAd from '@/components/marketing/FacebookAd';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const FacebookAdPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!productId) return;
    
    const loadProduct = async () => {
      setLoading(true);
      const db = getDatabase(firebaseApp);
      const productRef = ref(db, `products/${productId}`);
      
      try {
        const snapshot = await get(productRef);
        if (snapshot.exists()) {
          setProduct({
            id: productId,
            ...snapshot.val()
          });
        } else {
          toast.error('المنتج غير موجود');
        }
      } catch (error) {
        console.error('خطأ في تحميل بيانات المنتج:', error);
        toast.error('حدث خطأ أثناء تحميل بيانات المنتج');
      } finally {
        setLoading(false);
      }
    };
    
    loadProduct();
  }, [productId]);
  
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8">
            <Link 
              to="/admin-dashboard" 
              className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>العودة للوحة التحكم</span>
            </Link>
            <h1 className="text-2xl font-display font-semibold mt-4">معاينة إعلان فيسبوك</h1>
            <p className="text-foreground/60">
              هذه معاينة لإعلان فيسبوك للمنتج المحدد. يمكنك استخدام هذا الإعلان للترويج للمنتج على منصة فيسبوك.
            </p>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <p className="mt-4 text-foreground/60">جاري تحميل بيانات المنتج...</p>
            </div>
          ) : product ? (
            <div className="mb-8">
              <FacebookAd product={product} />
              
              <div className="mt-8 bg-secondary rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-medium mb-4">كيفية استخدام هذا الإعلان</h2>
                <ol className="list-decimal list-inside space-y-2 text-foreground/80">
                  <li>قم بأخذ لقطة شاشة للإعلان أعلاه</li>
                  <li>انتقل إلى صفحتك على فيسبوك وانقر على "إنشاء إعلان"</li>
                  <li>اختر هدف الإعلان (مثل: زيادة المبيعات، زيادة الزيارات)</li>
                  <li>قم بتحميل لقطة الشاشة كصورة للإعلان</li>
                  <li>أضف نص الإعلان المعروض أعلاه</li>
                  <li>أضف رابط المنتج: <code className="bg-background px-2 py-1 rounded text-sm">{window.location.origin}/products/{productId}</code></li>
                  <li>حدد الجمهور المستهدف والميزانية ومدة الإعلان</li>
                  <li>راجع الإعلان وقم بنشره</li>
                </ol>
              </div>
              
              <div className="mt-8 flex justify-center">
                <Link 
                  to={`/products/${productId}`}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors"
                >
                  الانتقال إلى صفحة المنتج
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-secondary rounded-xl">
              <p className="text-foreground/60">المنتج غير موجود</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default FacebookAdPage;