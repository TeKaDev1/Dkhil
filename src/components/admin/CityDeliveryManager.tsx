import React, { useState, useEffect } from 'react';
import { getDatabase, ref, push, update, remove, onValue } from 'firebase/database';
import { firebaseApp } from '@/lib/firebase';
import { toast } from 'sonner';
import { Plus, Pencil, Trash, Check, X, Upload } from 'lucide-react';

interface City {
  id: string;
  name: string;
  price: number;
  region: string;
}

const regions = [
  'المنطقة الغربية',
  'المنطقة الشرقية',
  'المنطقة الجنوبية',
  'المنطقة الوسطى',
  'منطقة الجبل الغربي'
];

// Libyan cities data with regions and prices
const libyanCities = [
  // المنطقة الغربية (Western Region)
  { name: 'طرابلس', price: 10, region: 'المنطقة الغربية' },
  { name: 'الزاوية', price: 15, region: 'المنطقة الغربية' },
  { name: 'صبراتة', price: 20, region: 'المنطقة الغربية' },
  { name: 'صرمان', price: 20, region: 'المنطقة الغربية' },
  { name: 'العجيلات', price: 25, region: 'المنطقة الغربية' },
  { name: 'زوارة', price: 30, region: 'المنطقة الغربية' },
  { name: 'الجميل', price: 35, region: 'المنطقة الغربية' },
  { name: 'رقدالين', price: 35, region: 'المنطقة الغربية' },
  { name: 'زلطن', price: 40, region: 'المنطقة الغربية' },
  
  // المنطقة الشرقية (Eastern Region)
  { name: 'بنغازي', price: 40, region: 'المنطقة الشرقية' },
  { name: 'المرج', price: 45, region: 'المنطقة الشرقية' },
  { name: 'البيضاء', price: 50, region: 'المنطقة الشرقية' },
  { name: 'طبرق', price: 60, region: 'المنطقة الشرقية' },
  { name: 'درنة', price: 55, region: 'المنطقة الشرقية' },
  { name: 'اجدابيا', price: 45, region: 'المنطقة الشرقية' },
  { name: 'توكرة', price: 45, region: 'المنطقة الشرقية' },
  { name: 'شحات', price: 50, region: 'المنطقة الشرقية' },
  
  // المنطقة الجنوبية (Southern Region)
  { name: 'سبها', price: 70, region: 'المنطقة الجنوبية' },
  { name: 'مرزق', price: 80, region: 'المنطقة الجنوبية' },
  { name: 'غات', price: 90, region: 'المنطقة الجنوبية' },
  { name: 'أوباري', price: 85, region: 'المنطقة الجنوبية' },
  { name: 'الكفرة', price: 100, region: 'المنطقة الجنوبية' },
  { name: 'تراغن', price: 85, region: 'المنطقة الجنوبية' },
  
  // المنطقة الوسطى (Central Region)
  { name: 'سرت', price: 50, region: 'المنطقة الوسطى' },
  { name: 'مصراتة', price: 30, region: 'المنطقة الوسطى' },
  { name: 'زليتن', price: 35, region: 'المنطقة الوسطى' },
  { name: 'الخمس', price: 25, region: 'المنطقة الوسطى' },
  { name: 'ترهونة', price: 20, region: 'المنطقة الوسطى' },
  { name: 'بني وليد', price: 40, region: 'المنطقة الوسطى' },
  { name: 'تاورغاء', price: 35, region: 'المنطقة الوسطى' },
  
  // منطقة الجبل الغربي (Western Mountain Region)
  { name: 'غريان', price: 25, region: 'منطقة الجبل الغربي' },
  { name: 'نالوت', price: 45, region: 'منطقة الجبل الغربي' },
  { name: 'يفرن', price: 30, region: 'منطقة الجبل الغربي' },
  { name: 'الزنتان', price: 35, region: 'منطقة الجبل الغربي' },
  { name: 'جادو', price: 40, region: 'منطقة الجبل الغربي' },
  { name: 'الرجبان', price: 40, region: 'منطقة الجبل الغربي' },
  { name: 'الأصابعة', price: 30, region: 'منطقة الجبل الغربي' },
  { name: 'مزدة', price: 45, region: 'منطقة الجبل الغربي' }
];

const CityDeliveryManager: React.FC = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [newCity, setNewCity] = useState({ name: '', price: '', region: regions[0] });
  const [editingCity, setEditingCity] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ name: '', price: '', region: '' });
  const [loading, setLoading] = useState(false);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [addingBulk, setAddingBulk] = useState(false);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const db = getDatabase(firebaseApp);
      const citiesRef = ref(db, 'cities');
      
      onValue(citiesRef, (snapshot) => {
        if (snapshot.exists()) {
          const citiesData = snapshot.val();
          const citiesList = Object.entries(citiesData).map(([key, value]: [string, any]) => ({
            id: key,
            name: value.name,
            price: value.price,
            region: value.region || 'المنطقة الغربية' // Default region if not specified
          }));
          setCities(citiesList);
        } else {
          setCities([]);
        }
      });
    } catch (error) {
      console.error('Error loading cities:', error);
      toast.error('حدث خطأ أثناء تحميل المدن');
    }
  };

  const handleAddCity = async () => {
    if (!newCity.name.trim()) {
      toast.error('يرجى إدخال اسم المدينة');
      return;
    }

    if (!newCity.price || isNaN(Number(newCity.price)) || Number(newCity.price) < 0) {
      toast.error('يرجى إدخال سعر توصيل صحيح');
      return;
    }

    setLoading(true);
    try {
      const db = getDatabase(firebaseApp);
      const citiesRef = ref(db, 'cities');
      
      await push(citiesRef, { 
        name: newCity.name.trim(), 
        price: Number(newCity.price),
        region: newCity.region
      });
      
      setNewCity({ name: '', price: '', region: regions[0] });
      toast.success('تمت إضافة المدينة بنجاح');
    } catch (error) {
      console.error('Error adding city:', error);
      toast.error('حدث خطأ أثناء إضافة المدينة');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCity = (city: City) => {
    setEditingCity(city.id);
    setEditValues({
      name: city.name,
      price: city.price.toString(),
      region: city.region
    });
  };

  const handleUpdateCity = async () => {
    if (!editValues.name.trim()) {
      toast.error('يرجى إدخال اسم المدينة');
      return;
    }

    if (!editValues.price || isNaN(Number(editValues.price)) || Number(editValues.price) < 0) {
      toast.error('يرجى إدخال سعر توصيل صحيح');
      return;
    }

    if (!editingCity) return;

    setLoading(true);
    try {
      const db = getDatabase(firebaseApp);
      const cityRef = ref(db, `cities/${editingCity}`);
      
      await update(cityRef, { 
        name: editValues.name.trim(), 
        price: Number(editValues.price),
        region: editValues.region
      });
      
      setEditingCity(null);
      toast.success('تم تحديث المدينة بنجاح');
    } catch (error) {
      console.error('Error updating city:', error);
      toast.error('حدث خطأ أثناء تحديث المدينة');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCity = async (cityId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المدينة؟')) {
      return;
    }

    setLoading(true);
    try {
      const db = getDatabase(firebaseApp);
      const cityRef = ref(db, `cities/${cityId}`);
      
      await remove(cityRef);
      toast.success('تم حذف المدينة بنجاح', {
        description: 'تم حذف المدينة من قاعدة البيانات'
      });
    } catch (error) {
      console.error('Error deleting city:', error);
      toast.error('حدث خطأ أثناء حذف المدينة');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingCity(null);
  };
  
  const handleAddAllLibyanCities = async () => {
    if (!confirm('هل أنت متأكد من إضافة جميع المدن الليبية؟ سيتم إضافة 40 مدينة.')) {
      return;
    }
    
    setAddingBulk(true);
    const db = getDatabase(firebaseApp);
    const citiesRef = ref(db, 'cities');
    
    try {
      // Get existing cities to avoid duplicates
      const existingCities = cities.map(city => city.name.trim().toLowerCase());
      
      // Filter out cities that already exist
      const citiesToAdd = libyanCities.filter(
        city => !existingCities.includes(city.name.trim().toLowerCase())
      );
      
      if (citiesToAdd.length === 0) {
        toast.info('جميع المدن موجودة بالفعل');
        setAddingBulk(false);
        return;
      }
      
      // Add cities in batches to avoid overwhelming the database
      const batchSize = 5;
      let addedCount = 0;
      
      for (let i = 0; i < citiesToAdd.length; i += batchSize) {
        const batch = citiesToAdd.slice(i, i + batchSize);
        
        // Add each city in the batch
        await Promise.all(
          batch.map(async (city) => {
            await push(citiesRef, {
              name: city.name,
              price: city.price,
              region: city.region
            });
            addedCount++;
          })
        );
        
        // Show progress
        toast.success(`تم إضافة ${Math.min(addedCount, citiesToAdd.length)} من ${citiesToAdd.length} مدينة`);
      }
      
      toast.success(`تمت إضافة ${addedCount} مدينة بنجاح`);
    } catch (error) {
      console.error('Error adding cities:', error);
      toast.error('حدث خطأ أثناء إضافة المدن');
    } finally {
      setAddingBulk(false);
    }
  };

  const filteredCities = activeRegion
    ? cities.filter(city => city.region === activeRegion)
    : cities;

  return (
    <div className="bg-secondary rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-semibold">إدارة المدن وأسعار التوصيل</h2>
        <p className="text-foreground/60 text-sm mt-1">إضافة وتعديل وحذف المدن وأسعار التوصيل</p>
      </div>
      
      <div className="p-6">
        {/* Add new city */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1.5">اسم المدينة</label>
            <input
              type="text"
              value={newCity.name}
              onChange={(e) => setNewCity({...newCity, name: e.target.value})}
              placeholder="اسم المدينة"
              className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">سعر التوصيل (د.ل)</label>
            <input
              type="number"
              value={newCity.price}
              onChange={(e) => setNewCity({...newCity, price: e.target.value})}
              placeholder="سعر التوصيل"
              min="0"
              className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">المنطقة</label>
            <select
              value={newCity.region}
              onChange={(e) => setNewCity({...newCity, region: e.target.value})}
              className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {regions.map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex justify-between mb-6">
          <button
            onClick={handleAddAllLibyanCities}
            disabled={loading || addingBulk}
            className="btn-hover bg-secondary text-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors flex items-center gap-2 border border-border"
          >
            <Upload className="w-4 h-4" />
            <span>{addingBulk ? 'جاري الإضافة...' : 'إضافة جميع المدن الليبية'}</span>
          </button>
          
          <button
            onClick={handleAddCity}
            disabled={loading}
            className="btn-hover bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مدينة</span>
          </button>
        </div>
        
        {/* Region filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveRegion(null)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeRegion === null 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary hover:bg-secondary/80 text-foreground/70'
              }`}
            >
              جميع المناطق
            </button>
            {regions.map((region) => (
              <button
                key={region}
                onClick={() => setActiveRegion(region)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeRegion === region 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary hover:bg-secondary/80 text-foreground/70'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
        
        {/* Cities list */}
        <div className="space-y-3">
          {filteredCities.length === 0 ? (
            <div className="text-center py-8 text-foreground/60">
              {activeRegion 
                ? `لا توجد مدن في ${activeRegion}. أضف مدينة جديدة للبدء.`
                : 'لا توجد مدن. أضف مدينة جديدة للبدء.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground/70">المدينة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground/70">سعر التوصيل</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground/70">المنطقة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground/70">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCities.map((city) => (
                    <tr key={city.id} className="hover:bg-background/50">
                      {editingCity === city.id ? (
                        <>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editValues.name}
                              onChange={(e) => setEditValues({...editValues, name: e.target.value})}
                              className="w-full px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={editValues.price}
                              onChange={(e) => setEditValues({...editValues, price: e.target.value})}
                              min="0"
                              className="w-full px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={editValues.region}
                              onChange={(e) => setEditValues({...editValues, region: e.target.value})}
                              className="w-full px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                              {regions.map((region) => (
                                <option key={region} value={region}>{region}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleUpdateCity}
                                className="text-green-500 hover:text-green-600 p-1"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="text-red-500 hover:text-red-600 p-1"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-medium">{city.name}</td>
                          <td className="px-4 py-3">{city.price} د.ل</td>
                          <td className="px-4 py-3">{city.region}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditCity(city)}
                                className="text-blue-500 hover:text-blue-600 p-1"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCity(city.id)}
                                className="text-red-500 hover:text-red-600 p-1"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CityDeliveryManager;