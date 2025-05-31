import React, { useState, useEffect } from 'react';
import { getDatabase, ref, get } from 'firebase/database';
import { firebaseApp } from '@/lib/firebase';
import { Truck, MapPin, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface DeliveryCostPreviewProps {
  productPrice: number;
}

const DeliveryCostPreview: React.FC<DeliveryCostPreviewProps> = ({ productPrice }) => {
  const { currentUser } = useAuth();
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [deliveryCost, setDeliveryCost] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cities from Firebase
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const db = getDatabase(firebaseApp);
        const citiesRef = ref(db, 'cities');
        const snapshot = await get(citiesRef);
        
        if (snapshot.exists()) {
          const citiesData: any[] = [];
          snapshot.forEach((childSnapshot) => {
            const cityData = childSnapshot.val();
            citiesData.push({
              id: childSnapshot.key,
              ...cityData
            });
          });
          
          // Sort cities by name
          citiesData.sort((a, b) => a.name.localeCompare(b.name));
          setCities(citiesData);
          
          // If there are cities, select the first one by default
          if (citiesData.length > 0) {
            setSelectedCity(citiesData[0].id);
            setDeliveryCost(citiesData[0].price);
          }
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
        setError('حدث خطأ أثناء تحميل المدن');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchCities();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  // Update delivery cost when selected city changes
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityId = e.target.value;
    setSelectedCity(cityId);
    
    const selectedCityData = cities.find(city => city.id === cityId);
    if (selectedCityData) {
      setDeliveryCost(selectedCityData.price);
    } else {
      setDeliveryCost(null);
    }
  };

  // If user is not logged in, don't show anything
  if (!currentUser) {
    return null;
  }

  // Calculate total cost
  const totalCost = productPrice + (deliveryCost || 0);

  return (
    <div className="mt-6 p-4 border border-border rounded-lg bg-secondary/30">
      <div className="flex items-center gap-2 mb-3">
        <Truck className="w-5 h-5 text-primary" />
        <h3 className="font-medium">تكلفة التوصيل</h3>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-3">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      ) : cities.length === 0 ? (
        <p className="text-sm text-foreground/60">لا توجد معلومات توصيل متاحة حاليًا</p>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-foreground/60" />
            <select
              value={selectedCity}
              onChange={handleCityChange}
              className="flex-1 px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-sm"
            >
              {cities.map(city => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-foreground/60">سعر المنتج:</div>
            <div className="text-right font-medium">{productPrice.toFixed(2)} د.ل</div>
            
            <div className="text-foreground/60">تكلفة التوصيل:</div>
            <div className="text-right font-medium">{deliveryCost?.toFixed(2)} د.ل</div>
            
            <div className="text-foreground/60 font-medium pt-2 border-t border-border">الإجمالي:</div>
            <div className="text-right font-semibold pt-2 border-t border-border">{totalCost.toFixed(2)} د.ل</div>
          </div>
        </>
      )}
    </div>
  );
};

export default DeliveryCostPreview;