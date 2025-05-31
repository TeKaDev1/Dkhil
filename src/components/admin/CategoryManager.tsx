import React, { useState, useEffect } from 'react';
import { getDatabase, ref, push, update, remove, onValue } from 'firebase/database';
import { firebaseApp } from '@/lib/firebase';
import { toast } from 'sonner';
import { Plus, Pencil, Trash, Check, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  arabicName: string;
  description?: string;
  icon?: string;
}

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', arabicName: '', description: '', icon: '' });
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ name: '', arabicName: '', description: '', icon: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const db = getDatabase(firebaseApp);
      const categoriesRef = ref(db, 'categories');
      
      onValue(categoriesRef, (snapshot) => {
        if (snapshot.exists()) {
          const categoriesData = snapshot.val();
          const categoriesList = Object.entries(categoriesData).map(([key, value]: [string, any]) => ({
            id: key,
            name: value.name,
            arabicName: value.arabicName || value.name, // Fallback to name if arabicName doesn't exist
            description: value.description || '',
            icon: value.icon || ''
          }));
          
          // Sort categories alphabetically
          categoriesList.sort((a, b) => a.name.localeCompare(b.name));
          
          setCategories(categoriesList);
        } else {
          setCategories([]);
        }
      });
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('حدث خطأ أثناء تحميل الفئات');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('يرجى إدخال اسم الفئة');
      return;
    }

    if (!newCategory.arabicName.trim()) {
      toast.error('يرجى إدخال اسم الفئة بالعربية');
      return;
    }

    setLoading(true);
    try {
      const db = getDatabase(firebaseApp);
      const categoriesRef = ref(db, 'categories');
      
      await push(categoriesRef, { 
        name: newCategory.name.trim(),
        arabicName: newCategory.arabicName.trim(),
        description: newCategory.description.trim(),
        icon: newCategory.icon.trim()
      });
      
      setNewCategory({ name: '', arabicName: '', description: '', icon: '' });
      toast.success('تمت إضافة الفئة بنجاح');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('حدث خطأ أثناء إضافة الفئة');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category.id);
    setEditValues({
      name: category.name,
      arabicName: category.arabicName,
      description: category.description || '',
      icon: category.icon || ''
    });
  };

  const handleUpdateCategory = async () => {
    if (!editValues.name.trim()) {
      toast.error('يرجى إدخال اسم الفئة');
      return;
    }

    if (!editValues.arabicName.trim()) {
      toast.error('يرجى إدخال اسم الفئة بالعربية');
      return;
    }

    if (!editingCategory) return;

    setLoading(true);
    try {
      const db = getDatabase(firebaseApp);
      const categoryRef = ref(db, `categories/${editingCategory}`);
      
      await update(categoryRef, { 
        name: editValues.name.trim(),
        arabicName: editValues.arabicName.trim(),
        description: editValues.description.trim(),
        icon: editValues.icon.trim()
      });
      
      setEditingCategory(null);
      toast.success('تم تحديث الفئة بنجاح');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('حدث خطأ أثناء تحديث الفئة');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفئة؟')) {
      return;
    }

    setLoading(true);
    try {
      const db = getDatabase(firebaseApp);
      const categoryRef = ref(db, `categories/${categoryId}`);
      
      await remove(categoryRef);
      toast.success('تم حذف الفئة بنجاح', {
        description: 'تم حذف الفئة من قاعدة البيانات'
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('حدث خطأ أثناء حذف الفئة');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingCategory(null);
  };

  return (
    <div className="bg-secondary rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-semibold">إدارة فئات المنتجات</h2>
        <p className="text-foreground/60 text-sm mt-1">إضافة وتعديل وحذف فئات المنتجات</p>
      </div>
      
      <div className="p-6">
        {/* Add new category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1.5">اسم الفئة (بالإنجليزية)</label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
              placeholder="اسم الفئة بالإنجليزية"
              className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">اسم الفئة (بالعربية)</label>
            <input
              type="text"
              value={newCategory.arabicName}
              onChange={(e) => setNewCategory({...newCategory, arabicName: e.target.value})}
              placeholder="اسم الفئة بالعربية"
              className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">الوصف (اختياري)</label>
            <input
              type="text"
              value={newCategory.description}
              onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
              placeholder="وصف الفئة"
              className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">الأيقونة (اختياري)</label>
            <input
              type="text"
              value={newCategory.icon}
              onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
              placeholder="رمز الأيقونة (مثال: shopping-bag)"
              className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        
        <div className="flex justify-end mb-6">
          <button
            onClick={handleAddCategory}
            disabled={loading}
            className="btn-hover bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة فئة</span>
          </button>
        </div>
        
        {/* Categories list */}
        <div className="space-y-3">
          {categories.length === 0 ? (
            <div className="text-center py-8 text-foreground/60">
              لا توجد فئات. أضف فئة جديدة للبدء.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground/70">الفئة (بالإنجليزية)</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground/70">الفئة (بالعربية)</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground/70">الوصف</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground/70">الأيقونة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground/70">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-background/50">
                      {editingCategory === category.id ? (
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
                              type="text"
                              value={editValues.arabicName}
                              onChange={(e) => setEditValues({...editValues, arabicName: e.target.value})}
                              className="w-full px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editValues.description}
                              onChange={(e) => setEditValues({...editValues, description: e.target.value})}
                              className="w-full px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editValues.icon}
                              onChange={(e) => setEditValues({...editValues, icon: e.target.value})}
                              className="w-full px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleUpdateCategory}
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
                          <td className="px-4 py-3 font-medium">{category.name}</td>
                          <td className="px-4 py-3">{category.arabicName}</td>
                          <td className="px-4 py-3">{category.description || '-'}</td>
                          <td className="px-4 py-3">{category.icon || '-'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditCategory(category)}
                                className="text-blue-500 hover:text-blue-600 p-1"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(category.id)}
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

export default CategoryManager;