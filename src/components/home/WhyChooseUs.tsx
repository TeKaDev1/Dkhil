import React from 'react';
import { Truck, ShieldCheck, CreditCard, RotateCcw } from 'lucide-react';

const WhyChooseUs: React.FC = () => {
  const features = [
    {
      icon: <Truck className="w-10 h-10 text-primary" />,
      title: 'توصيل سريع',
      description: 'نوفر خدمة توصيل سريعة وموثوقة لجميع مناطق ليبيا'
    },
    {
      icon: <ShieldCheck className="w-10 h-10 text-primary" />,
      title: 'منتجات أصلية',
      description: 'نضمن أن جميع منتجاتنا أصلية وذات جودة عالية'
    },
    {
      icon: <CreditCard className="w-10 h-10 text-primary" />,
      title: 'دفع آمن',
      description: 'طرق دفع متعددة وآمنة لراحتك'
    },
    {
      icon: <RotateCcw className="w-10 h-10 text-primary" />,
      title: 'سياسة إرجاع مرنة',
      description: 'يمكنك إرجاع المنتج خلال 14 يومًا إذا لم يكن مناسبًا'
    }
  ];

  return (
    <section className="py-16 bg-secondary/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-semibold mb-4">لماذا تختار متجرنا؟</h2>
          <p className="text-foreground/70 max-w-2xl mx-auto">
            نسعى دائمًا لتقديم أفضل تجربة تسوق لعملائنا من خلال توفير منتجات عالية الجودة وخدمة ممتازة
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-background rounded-xl p-6 shadow-sm border border-border/50 hover:border-primary/20 hover:shadow-md transition-all duration-300 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
              <p className="text-foreground/70">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
