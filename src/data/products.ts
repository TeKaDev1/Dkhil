export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  category: string;
  featured: boolean;
  stock: number;
  showStock?: boolean;
  specifications?: Record<string, string>;
  videoUrl?: string;
}

const products: Product[] = [
  {
    id: "1",
    name: "سماعات لاسلكية فاخرة",
    description: "استمتع بجودة صوت استثنائية مع سماعاتنا اللاسلكية الفاخرة. تتميز بخاصية إلغاء الضوضاء النشطة، وعمر بطارية يصل إلى 40 ساعة، وراحة فاخرة لجلسات الاستماع الطويلة.",
    price: 299.99,
    originalPrice: 399.99,
    discount: 25,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2670&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1577174881658-0f30ed549adc?q=80&w=2574&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=2565&auto=format&fit=crop",
    ],
    category: "صوتيات",
    featured: true,
    stock: 15,
    specifications: {
      "Battery Life": "40 hours",
      "Connectivity": "Bluetooth 5.2",
      "Noise Cancellation": "Active",
      "Weight": "250g",
      "Color": "Matte Black"
    }
  },
  {
    id: "2",
    name: "ساعة ذكية بتصميم بسيط",
    description: "ساعة ذكية مصممة بشكل جميل مع جميع الميزات الأساسية وجمالية بسيطة وأنيقة. تتبع صحتك، واستقبل الإشعارات، وعبر عن أسلوبك مع أحزمة قابلة للتبديل.",
    price: 199.99,
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2699&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=2672&auto=format&fit=crop",
    ],
    category: "أجهزة قابلة للارتداء",
    featured: true,
    stock: 22,
    specifications: {
      "Display": "1.3\" AMOLED",
      "Battery Life": "5 days",
      "Water Resistance": "5 ATM",
      "Sensors": "Heart rate, SpO2, Accelerometer",
      "Compatibility": "iOS, Android"
    }
  },
  {
    id: "3",
    name: "لابتوب فائق النحافة",
    description: "المزيج المثالي بين القوة وإمكانية التنقل. يتميز لابتوب فائق النحافة بشاشة مذهلة، وعمر بطارية طوال اليوم، وأداء استثنائي في تصميم رفيع وخفيف الوزن بشكل ملحوظ.",
    price: 1299.99,
    originalPrice: 1499.99,
    discount: 13,
    images: [
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=2671&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1530893609608-32a9af3aa95c?q=80&w=2564&auto=format&fit=crop",
    ],
    category: "أجهزة كمبيوتر",
    featured: true,
    stock: 8,
    specifications: {
      "Processor": "Intel Core i7-1260P",
      "RAM": "16GB DDR5",
      "Storage": "512GB NVMe SSD",
      "Display": "14\" 2.8K OLED",
      "Weight": "1.2kg"
    }
  },
  {
    id: "4",
    name: "كاميرا احترافية",
    description: "التقط صوراً وفيديوهات مذهلة مع كاميرتنا الاحترافية. تتميز بتركيز تلقائي متقدم، وتسجيل فيديو بدقة 4K، وأداء استثنائي في الإضاءة المنخفضة للمصورين من جميع المستويات.",
    price: 1499.99,
    images: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1738&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=1740&auto=format&fit=crop",
    ],
    category: "تصوير",
    featured: false,
    stock: 5,
    specifications: {
      "Sensor": "24.2MP APS-C CMOS",
      "Video": "4K/60fps, 1080p/120fps",
      "Autofocus": "Hybrid phase-detection/contrast",
      "Connectivity": "Wi-Fi, Bluetooth",
      "Battery Life": "Approx. 500 shots"
    }
  },
  {
    id: "5",
    name: "سماعة بلوتوث محمولة",
    description: "خذ موسيقاك في أي مكان مع سماعة البلوتوث المدمجة والقوية. تتميز بصوت 360 درجة، وتصميم مقاوم للماء، و12 ساعة من التشغيل للترفيه اللامتناهي.",
    price: 89.99,
    originalPrice: 129.99,
    discount: 31,
    images: [
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=2574&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=1888&auto=format&fit=crop",
    ],
    category: "صوتيات",
    featured: false,
    stock: 35,
    specifications: {
      "Sound": "360° audio",
      "Battery Life": "12 hours",
      "Water Resistance": "IPX7",
      "Connectivity": "Bluetooth 5.0",
      "Weight": "540g"
    }
  },
  {
    id: "6",
    name: "مصباح مكتب بتصميم أنيق",
    description: "أضف إضاءة متطورة إلى مساحة عملك مع مصباح المكتب المصمم هذا. يتميز بسطوع قابل للتعديل، والتحكم في درجة حرارة اللون، وتصميم عصري أنيق.",
    price: 129.99,
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=2574&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=2670&auto=format&fit=crop",
    ],
    category: "منزل",
    featured: false,
    stock: 18,
    specifications: {
      "Brightness": "Adjustable (5 levels)",
      "Color Temperature": "2700K-6500K",
      "Power": "12W LED",
      "Material": "Aluminum, Silicone",
      "Features": "Touch controls, Memory function"
    }
  }
];

export default products;
