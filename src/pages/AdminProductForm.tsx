import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, push, update, get } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { firebaseApp } from '@/lib/firebase';
import { toast } from 'sonner';
import { X, Upload, Plus, ArrowLeft, Video, Image, AlertCircle, CheckCircle2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { useDropzone } from 'react-dropzone'; // Or whatever is being imported


interface ProductFormData {
  name: string;
  description: string;
  price?: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  featured: boolean;
  stock?: number;
  images?: string[];
  videoUrl?: string;
  videoFile?: File | null;
  specifications?: Record<string, string>;
}

const AdminProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: undefined,
    category: '',
    featured: false,
    stock: undefined,
    images: [],
    videoUrl: '',
    videoFile: null,
    specifications: {}
  });
  
  // For direct image URL input
  const [imageUrl, setImageUrl] = useState('');
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  
  // Track upload status for each file
  const [fileUploads, setFileUploads] = useState<{
    [key: string]: {
      file: File;
      progress: number;
      status: 'pending' | 'uploading' | 'success' | 'error';
      url?: string;
      error?: string;
    }
  }>({});
  
  // Track if all uploads are complete
  const [allUploadsComplete, setAllUploadsComplete] = useState(true);
  
  // Track upload progress
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    percentage: number;
  }>({ current: 0, total: 0, percentage: 0 });
  
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  
  // Helper function to compress images using browser-image-compression
  const optimizeImage = useCallback(async (file: File): Promise<File> => {
    // If file is smaller than 500KB, don't optimize
    if (file.size < 500 * 1024) {
      console.log(`File ${file.name} is already small (${file.size} bytes), skipping optimization`);
      return file;
    }
    
    try {
      const options = {
        maxSizeMB: 1, // Max file size in MB
        maxWidthOrHeight: 1200, // Max width/height in pixels
        useWebWorker: true, // Use web worker for better performance
        fileType: 'image/jpeg', // Output format
        initialQuality: 0.8, // Initial quality (0-1)
      };
      
      console.log(`Optimizing image: ${file.name} (${file.size} bytes)`);
      const compressedFile = await imageCompression(file, options);
      console.log(`Optimized image: ${file.size} bytes -> ${compressedFile.size} bytes`);
      
      return compressedFile;
    } catch (error) {
      console.error('Error optimizing image:', error);
      return file; // Return original file if optimization fails
    }
  }, []);

  useEffect(() => {
    const auth = getAuth(firebaseApp);
    
    // Check if user is authenticated
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
      } else if (isEditMode) {
        // Load product data if in edit mode
        loadProductData();
      }
      
      // Load categories
      loadCategories();
    });
    
    return () => unsubscribe();
  }, [navigate, id, isEditMode]);
  
  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, formData[field as keyof ProductFormData]);
    setFormErrors(prev => ({ ...prev, [field]: error || '' }));
  };
  
  const handleAddImageUrl = () => {
    if (!imageUrl.trim()) return;
    
    // Validate URL
    try {
      new URL(imageUrl);
    } catch (e) {
      toast.error('الرجاء إدخال رابط صحيح');
      return;
    }
    
    // Add URL to images array
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), imageUrl]
    }));
    
    // Clear input
    setImageUrl('');
    toast.success('تمت إضافة الصورة بنجاح');
  };
  
  // Specification handling
  const addSpecification = () => {
    setFormData(prev => {
      const specs = prev.specifications || {};
      const newKey = `خاصية ${Object.keys(specs).length + 1}`;
      return {
        ...prev,
        specifications: {
          ...specs,
          [newKey]: ''
        }
      };
    });
  };
  
  const handleSpecificationChange = (oldKey: string, newKey: string, value: string) => {
    if (!newKey.trim()) return;
    
    setFormData(prev => {
      const specs = {...(prev.specifications || {})};
      delete specs[oldKey];
      return {
        ...prev,
        specifications: {
          ...specs,
          [newKey]: value
        }
      };
    });
  };
  
  const handleSpecificationValueChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...(prev.specifications || {}),
        [key]: value
      }
    }));
  };
  
  const removeSpecification = (key: string) => {
    setFormData(prev => {
      const specs = {...(prev.specifications || {})};
      delete specs[key];
      return {
        ...prev,
        specifications: specs
      };
    });
  };
  
  const loadProductData = async () => {
    if (!id) return;
    
    setLoading(true);
    const db = getDatabase(firebaseApp);
    const productRef = ref(db, `products/${id}`);
    
    try {
      const snapshot = await get(productRef);
      if (snapshot.exists()) {
        const productData = snapshot.val();
        
        // Ensure images is always an array
        if (!productData.images || !Array.isArray(productData.images)) {
          productData.images = [];
        }
        
        // Ensure specifications is always an object
        if (!productData.specifications) {
          productData.specifications = {};
        }
        
        setFormData(productData);
      } else {
        toast.error('المنتج غير موجود');
        navigate('/admin-dashboard');
      }
    } catch (error) {
      console.error('خطأ في تحميل بيانات المنتج:', error);
      toast.error('حدث خطأ أثناء تحميل بيانات المنتج');
    } finally {
      setLoading(false);
    }
  };
  
  const loadCategories = async () => {
    const db = getDatabase(firebaseApp);
    const categoriesRef = ref(db, 'categories');
    
    try {
      const snapshot = await get(categoriesRef);
      if (snapshot.exists()) {
        const categoriesData = snapshot.val();
        const categoriesList = Object.values(categoriesData).map((cat: any) => cat.name);
        setCategories(categoriesList);
      }
    } catch (error) {
      console.error('خطأ في تحميل الفئات:', error);
    }
  };
  
  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'name':
        return value.trim() === '' ? 'اسم المنتج مطلوب' : '';
      case 'description':
        return value.trim() === '' ? 'وصف المنتج مطلوب' : '';
      case 'price':
        return value <= 0 ? 'يجب أن يكون السعر أكبر من صفر' : '';
      case 'category':
        return value.trim() === '' ? 'الفئة مطلوبة' : '';
      case 'stock':
        return value < 0 ? 'يجب أن يكون المخزون صفر أو أكثر' : '';
      default:
        return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: any;
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      newValue = target.checked;
      setFormData({
        ...formData,
        [name]: newValue
      });
    } else if (type === 'number') {
      newValue = parseFloat(value) || 0;
      setFormData({
        ...formData,
        [name]: newValue
      });
    } else {
      newValue = value;
      setFormData({
        ...formData,
        [name]: newValue
      });
    }
    
    // Validate the field
    const error = validateField(name, newValue);
    setFormErrors(prev => ({
      ...prev,
      [name]: error
    }));
    
    // Calculate discount if original price and price are set
    if (name === 'originalPrice' || name === 'price') {
      const originalPrice = name === 'originalPrice'
        ? parseFloat(value) || 0
        : formData.originalPrice || 0;
      
      const price = name === 'price'
        ? parseFloat(value) || 0
        : formData.price;
      
      if (originalPrice > 0 && price > 0 && originalPrice > price) {
        const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
        setFormData(prev => ({
          ...prev,
          discount
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          discount: undefined
        }));
      }
    }
  };
  
  // Setup react-dropzone for image uploads
  const {
    getRootProps: getImageRootProps,
    getInputProps: getImageInputProps,
    isDragActive: isImageDragActive
  } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 6,
    onDrop: (acceptedFiles) => {
      // Limit to 6 images total
      const totalImages = Object.keys(fileUploads).length + (formData.images ? formData.images.length : 0);
      if (totalImages + acceptedFiles.length > 6) {
        toast.error('يمكنك إضافة 6 صور كحد أقصى');
        return;
      }
      
      // Create a unique ID for each file
      const newFileUploads = { ...fileUploads };
      
      acceptedFiles.forEach(file => {
        const fileId = `image-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        newFileUploads[fileId] = {
          file,
          progress: 0,
          status: 'pending'
        };
      });
      
      setFileUploads(newFileUploads);
      setAllUploadsComplete(false);
      
      // Start uploading immediately
      Object.entries(newFileUploads)
        .filter(([_, data]) => data.status === 'pending')
        .forEach(([fileId, data]) => {
          uploadSingleFile(fileId, data.file);
        });
    }
  });
  
  // Upload a single file with progress tracking
  const uploadSingleFile = async (fileId: string, file: File) => {
    try {
      // Update status to uploading
      setFileUploads(prev => ({
        ...prev,
        [fileId]: {
          ...prev[fileId],
          status: 'uploading'
        }
      }));
      
      // Optimize image
      const optimizedFile = await optimizeImage(file);
      
      // Upload to Firebase Storage
      const storage = getStorage(firebaseApp);
      const fileRef = storageRef(storage, `products/${Date.now()}_${optimizedFile.name}`);
      
      // Create upload task with progress monitoring
      const uploadTask = uploadBytesResumable(fileRef, optimizedFile);
      
      uploadTask.on('state_changed',
        (snapshot) => {
          // Track progress
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setFileUploads(prev => ({
            ...prev,
            [fileId]: {
              ...prev[fileId],
              progress
            }
          }));
        },
        (error) => {
          // Handle error
          console.error('Error uploading file:', error);
          setFileUploads(prev => ({
            ...prev,
            [fileId]: {
              ...prev[fileId],
              status: 'error',
              error: error.message
            }
          }));
          
          // Check if all uploads are complete
          checkAllUploadsComplete();
        },
        async () => {
          // Upload completed successfully
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          setFileUploads(prev => ({
            ...prev,
            [fileId]: {
              ...prev[fileId],
              status: 'success',
              progress: 100,
              url: downloadURL
            }
          }));
          
          // Add URL to form data
          setFormData(prev => ({
            ...prev,
            images: [...(prev.images || []), downloadURL]
          }));
          
          // Check if all uploads are complete
          checkAllUploadsComplete();
        }
      );
    } catch (error) {
      console.error('Error in upload process:', error);
      setFileUploads(prev => ({
        ...prev,
        [fileId]: {
          ...prev[fileId],
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
      
      // Check if all uploads are complete
      checkAllUploadsComplete();
    }
  };
  
  // Check if all uploads are complete
  const checkAllUploadsComplete = () => {
    const allComplete = Object.values(fileUploads).every(
      upload => upload.status === 'success' || upload.status === 'error'
    );
    
    setAllUploadsComplete(allComplete);
  };
  
  // Legacy image change handler for backward compatibility
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Limit to 6 images total
      const totalImages = Object.keys(fileUploads).length + (formData.images ? formData.images.length : 0);
      if (totalImages + files.length > 6) {
        toast.error('يمكنك تحميل 6 صور كحد أقصى');
        return;
      }
      
      // Create a unique ID for each file and add to fileUploads
      const newFileUploads = { ...fileUploads };
      
      files.forEach(file => {
        const fileId = `image-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        newFileUploads[fileId] = {
          file,
          progress: 0,
          status: 'pending'
        };
      });
      
      setFileUploads(newFileUploads);
      setAllUploadsComplete(false);
      
      // Start uploading immediately
      Object.entries(newFileUploads)
        .filter(([_, data]) => data.status === 'pending')
        .forEach(([fileId, data]) => {
          uploadSingleFile(fileId, data.file);
        });
    }
  };
  
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (limit to 100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast.error('حجم الفيديو كبير جدًا. الحد الأقصى هو 100 ميجابايت');
        return;
      }
      
      // Create preview URL
      const videoUrl = URL.createObjectURL(file);
      setVideoPreview(videoUrl);
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        videoFile: file,
        videoUrl: '' // Clear URL if file is selected
      }));
    }
  };
  
  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData(prev => ({
      ...prev,
      videoUrl: url,
      videoFile: null // Clear file if URL is entered
    }));
    setVideoPreview(null);
  };
  
  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const removeExistingImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images && prev.images.length > 0
        ? prev.images.filter((_, i) => i !== index)
        : []
    }));
  };
  
  // Handle adding a new category
  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    
    // Add the new category to the list
    setCategories(prev => [...prev, newCategory.trim()]);
    
    // Set the form data category to the new category
    setFormData(prev => ({
      ...prev,
      category: newCategory.trim()
    }));
    
    // Reset the new category input and hide it
    setNewCategory('');
    setShowCategoryInput(false);
  };
  
  const uploadImages = useCallback(async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];
    
    setUploadingImages(true);
    const storage = getStorage(firebaseApp);
    
    // Create a toast ID for updating progress
    const toastId = toast.loading(
      <div className="cursor-pointer">
        <div className="font-medium mb-1">جاري تحضير الصور...</div>
        <div className="text-sm">0 من {imageFiles.length} صور</div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div className="bg-primary h-2.5 rounded-full" style={{ width: '0%' }}></div>
        </div>
      </div>,
      { duration: 100000 } // Long duration
    );
    
    try {
      // Optimize images first
      toast.loading(
        <div className="cursor-pointer">
          <div className="font-medium mb-1">جاري تحسين جودة الصور...</div>
          <div className="text-sm">يرجى الانتظار...</div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div className="bg-primary h-2.5 rounded-full" style={{ width: '10%' }}></div>
          </div>
        </div>,
        { id: toastId }
      );
      
      // Optimize images in parallel
      const optimizationPromises = imageFiles.map(file => optimizeImage(file));
      const optimizedFiles = await Promise.all(optimizationPromises);
      
      // Upload images one by one for better progress tracking
      const results: string[] = [];
      
      for (let i = 0; i < optimizedFiles.length; i++) {
        try {
          const file = optimizedFiles[i];
          
          // Update progress toast
          toast.loading(
            <div className="cursor-pointer">
              <div className="font-medium mb-1">جاري رفع الصور...</div>
              <div className="text-sm">{i} من {optimizedFiles.length} صور</div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{ width: `${Math.round((i / optimizedFiles.length) * 100)}%` }}
                ></div>
              </div>
            </div>,
            { id: toastId }
          );
          
          // Use timestamp and random string to prevent filename collisions
          const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
          const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
          const imageRef = storageRef(storage, `products/${uniqueId}_${safeFileName}`);
          
          // Upload the file
          await uploadBytes(imageRef, file);
          
          // Get the download URL
          const downloadURL = await getDownloadURL(imageRef);
          results.push(downloadURL);
          
          // Update progress toast
          const percentage = Math.round(((i + 1) / optimizedFiles.length) * 100);
          toast.loading(
            <div className="cursor-pointer">
              <div className="font-medium mb-1">جاري رفع الصور...</div>
              <div className="text-sm">{i + 1} من {optimizedFiles.length} صور ({percentage}%)</div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>,
            { id: toastId }
          );
        } catch (error) {
          console.error(`خطأ في رفع الصورة ${i + 1}:`, error);
          toast.error(`حدث خطأ أثناء رفع الصورة ${i + 1}`);
        }
      }
      
      // Update toast with success message
      if (results.length > 0) {
        toast.success(
          <div>
            <div className="font-medium mb-1">تم رفع الصور بنجاح</div>
            <div className="text-sm">تم رفع {results.length} من {optimizedFiles.length} صور</div>
          </div>,
          { id: toastId }
        );
      } else {
        toast.error(
          <div>
            <div className="font-medium mb-1">فشل رفع الصور</div>
            <div className="text-sm">لم يتم رفع أي صورة</div>
          </div>,
          { id: toastId }
        );
      }
      
      return results;
    } catch (error) {
      console.error('خطأ في معالجة الصور:', error);
      toast.error('حدث خطأ أثناء معالجة الصور');
      return [];
    } finally {
      setUploadingImages(false);
    }
  }, [imageFiles]);
  
  const uploadVideo = async (): Promise<string | null> => {
    if (!formData.videoFile) return formData.videoUrl || null;
    
    setUploadingVideo(true);
    const storage = getStorage(firebaseApp);
    
    // Create a toast ID for updating progress
    const toastId = toast.loading(
      <div className="cursor-pointer">
        <div className="font-medium mb-1">جاري رفع الفيديو...</div>
        <div className="text-sm">0%</div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div className="bg-primary h-2.5 rounded-full" style={{ width: '0%' }}></div>
        </div>
      </div>,
      { duration: 100000 } // Long duration
    );
    
    try {
      // Create a safe filename
      const safeFileName = formData.videoFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const videoRef = storageRef(storage, `products/videos/${Date.now()}_${safeFileName}`);
      
      // Upload the video
      const uploadTask = uploadBytesResumable(videoRef, formData.videoFile);
      
      // Monitor upload progress
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            toast.loading(
              <div className="cursor-pointer">
                <div className="font-medium mb-1">جاري رفع الفيديو...</div>
                <div className="text-sm">{progress}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>,
              { id: toastId }
            );
          },
          (error) => {
            console.error('خطأ في رفع الفيديو:', error);
            toast.error('حدث خطأ أثناء رفع الفيديو', { id: toastId });
            setUploadingVideo(false);
            reject(null);
          },
          async () => {
            // Upload complete
            const videoUrl = await getDownloadURL(uploadTask.snapshot.ref);
            toast.success('تم رفع الفيديو بنجاح', { id: toastId });
            setUploadingVideo(false);
            resolve(videoUrl);
          }
        );
      });
    } catch (error) {
      console.error('خطأ في رفع الفيديو:', error);
      toast.error('حدث خطأ أثناء رفع الفيديو');
      setUploadingVideo(false);
      return null;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allFields = ['name', 'description', 'price', 'category', 'stock'];
    const newTouched = allFields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as {[key: string]: boolean});
    
    setTouched(newTouched);
    
    // Validate all fields
    const errors: {[key: string]: string} = {};
    allFields.forEach(field => {
      const error = validateField(field, formData[field as keyof ProductFormData]);
      if (error) {
        errors[field] = error;
      }
    });
    
    setFormErrors(errors);
    
    // Check if there are any errors
    if (Object.keys(errors).length > 0) {
      toast.error('يرجى تصحيح الأخطاء في النموذج', {
        className: 'form-error-toast',
        position: 'top-center',
        duration: 3000,
        icon: <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5V9M8 11V11.01M15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      });
      
      // Scroll to the first error
      const firstErrorField = document.getElementById(Object.keys(errors)[0]);
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorField.focus();
      }
      
      return;
    }
    
    if ((!formData.images || formData.images.length === 0) && Object.keys(fileUploads).length === 0) {
      toast.error('يجب إضافة صورة واحدة على الأقل', {
        className: 'form-error-toast',
        position: 'top-center',
        duration: 3000,
      });
      return;
    }
    
    // Check if uploads are still in progress
    if (!allUploadsComplete) {
      toast.error('يرجى الانتظار حتى اكتمال رفع الصور', {
        className: 'form-error-toast',
        position: 'top-center',
        duration: 3000,
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // First, save the product data without waiting for image uploads
      const db = getDatabase(firebaseApp);
      
      // Create a temporary product object with existing images
      const initialProductData = {
        ...formData,
        images: formData.images ? [...formData.images] : [], // Use existing images only initially
        videoUrl: formData.videoUrl,
        videoFile: null,
        uploading: true // Flag to indicate images are still uploading
      };
      
      let productKey: string;
      
      if (isEditMode) {
        // Update existing product
        productKey = id as string;
        const productRef = ref(db, `products/${productKey}`);
        await update(productRef, initialProductData);
        toast.success('تم حفظ بيانات المنتج', {
          description: 'جاري رفع الصور...'
        });
      } else {
        // Add new product
        const productsRef = ref(db, 'products');
        const newProductRef = await push(productsRef, initialProductData);
        productKey = newProductRef.key as string;
        toast.success('تم إضافة المنتج بنجاح', {
          description: 'جاري رفع الصور...'
        });
        
        // Don't navigate immediately, wait for image uploads to complete
      }
      
      // Wait for image uploads to complete before navigating
      try {
        // Upload new images
        const uploadedImageUrls = await uploadImages();
        
        // Combine existing and new image URLs
        const allImages = [...(formData.images || []), ...uploadedImageUrls];
        
        // Upload video if provided
        let finalVideoUrl = formData.videoUrl;
        if (formData.videoFile) {
          finalVideoUrl = await uploadVideo();
        }
        
        // Update the product with the image URLs
        const productRef = ref(db, `products/${productKey}`);
        await update(productRef, {
          images: allImages,
          videoUrl: finalVideoUrl,
          uploading: false // Mark upload as complete
        });
        
        toast.success('تم رفع جميع الصور بنجاح');
        
        // Navigate to dashboard after everything is complete
        navigate('/admin-dashboard');
      } catch (error) {
        console.error('خطأ في رفع الصور:', error);
        toast.error('تم حفظ المنتج ولكن حدث خطأ أثناء رفع بعض الصور');
        
        // Update the product to mark upload as complete even if some images failed
        const productRef = ref(db, `products/${productKey}`);
        await update(productRef, {
          uploading: false
        });
        
        // Still navigate to dashboard even if there was an error
        navigate('/admin-dashboard');
      }
    } catch (error) {
      console.error('خطأ في حفظ المنتج:', error);
      toast.error('حدث خطأ أثناء حفظ المنتج');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">
            {isEditMode ? 'تعديل منتج' : 'إضافة منتج جديد'}
          </h1>
          <button 
            onClick={() => navigate('/admin-dashboard')}
            className="flex items-center gap-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors rounded-md px-3 py-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة للوحة التحكم</span>
          </button>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <p className="mt-4 text-foreground/60">جاري التحميل...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="admin-form bg-secondary/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-border/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Product Name */}
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium mb-1">اسم المنتج *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('name')}
                  className={`w-full px-3 py-2 border ${touched.name && formErrors.name ? 'border-red-500' : 'border-border'} rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground`}
                  dir="rtl"
                />
                {touched.name && formErrors.name && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                )}
              </div>
              
              {/* Description */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium mb-1">وصف المنتج *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('description')}
                  rows={5}
                  className={`w-full px-3 py-2 border ${touched.description && formErrors.description ? 'border-red-500' : 'border-border'} rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground`}
                  dir="rtl"
                />
                {touched.description && formErrors.description && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
                )}
              </div>
              
              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium mb-1">السعر *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price || ''}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('price')}
                  className={`w-full px-3 py-2 border ${touched.price && formErrors.price ? 'border-red-500' : 'border-border'} rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground`}
                  min="0"
                  step="0.01"
                  dir="rtl"
                />
                {touched.price && formErrors.price && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.price}</p>
                )}
              </div>
              
              {/* Original Price */}
              <div>
                <label htmlFor="originalPrice" className="block text-sm font-medium mb-1">السعر الأصلي (اختياري)</label>
                <input
                  type="number"
                  id="originalPrice"
                  name="originalPrice"
                  value={formData.originalPrice || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                  min="0"
                  step="0.01"
                  dir="rtl"
                />
                <p className="mt-1 text-xs text-foreground/60">أدخل السعر الأصلي إذا كان المنتج معروضًا بخصم</p>
              </div>
              
              {/* Discount */}
              {formData.discount !== undefined && (
                <div>
                  <label className="block text-sm font-medium mb-1">نسبة الخصم</label>
                  <div className="px-3 py-2 border border-border rounded-md bg-secondary/50 text-foreground">
                    {formData.discount}%
                  </div>
                </div>
              )}
              
              {/* Stock */}
              <div>
                <label htmlFor="stock" className="block text-sm font-medium mb-1">المخزون *</label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock || ''}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('stock')}
                  className={`w-full px-3 py-2 border ${touched.stock && formErrors.stock ? 'border-red-500' : 'border-border'} rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground`}
                  min="0"
                  dir="rtl"
                />
                {touched.stock && formErrors.stock && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.stock}</p>
                )}
              </div>
              
              {/* Featured */}
              <div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary/50"
                  />
                  <label htmlFor="featured" className="ml-2 block text-sm font-medium">منتج مميز</label>
                </div>
                <p className="mt-1 text-xs text-foreground/60">عرض المنتج في قسم المنتجات المميزة في الصفحة الرئيسية</p>
              </div>
              
              {/* Category */}
              <div className="md:col-span-2">
                <label htmlFor="category" className="block text-sm font-medium mb-1">الفئة *</label>
                {showCategoryInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                      placeholder="أدخل اسم الفئة الجديدة"
                      dir="rtl"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      إضافة
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCategoryInput(false)}
                      className="px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('category')}
                      className={`flex-1 px-3 py-2 border ${touched.category && formErrors.category ? 'border-red-500' : 'border-border'} rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground`}
                      dir="rtl"
                    >
                      <option value="">اختر الفئة</option>
                      {categories.map((category, index) => (
                        <option key={index} value={category}>{category}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCategoryInput(true)}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      فئة جديدة
                    </button>
                  </div>
                )}
                {touched.category && formErrors.category && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.category}</p>
                )}
              </div>
              
              {/* Specifications */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">المواصفات (اختياري)</label>
                <div className="space-y-3 mb-3">
                  {Object.entries(formData.specifications || {}).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => handleSpecificationChange(key, e.target.value, value)}
                        className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                        placeholder="اسم المواصفة"
                        dir="rtl"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleSpecificationValueChange(key, e.target.value)}
                        className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                        placeholder="قيمة المواصفة"
                        dir="rtl"
                      />
                      <button
                        type="button"
                        onClick={() => removeSpecification(key)}
                        className="p-2 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addSpecification}
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  إضافة مواصفة
                </button>
              </div>
              
              {/* Images */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">صور المنتج *</label>
                
                {/* Existing Images */}
                {formData.images && formData.images.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">الصور الحالية:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {formData.images && formData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`صورة ${index + 1}`}
                            className="w-full h-24 object-cover rounded-md border border-border"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* New Images */}
                {imageFiles.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">الصور الجديدة:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {imageFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`صورة ${index + 1}`}
                            className="w-full h-24 object-cover rounded-md border border-border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Image Upload with React Dropzone */}
                <div className="mb-4">
                  <div
                    {...getImageRootProps()}
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
                      isImageDragActive
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-secondary/50'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-foreground/60 mb-2" />
                      <p className="mb-2 text-sm text-foreground/80">
                        <span className="font-medium">انقر لتحميل الصور</span> أو اسحب وأفلت
                      </p>
                      <p className="text-xs text-foreground/60">PNG, JPG, WEBP حتى 6 صور</p>
                    </div>
                    <input {...getImageInputProps()} />
                  </div>
                </div>
                
                {/* Upload Progress */}
                {Object.keys(fileUploads).length > 0 && (
                  <div className="mb-4 space-y-2">
                    <h3 className="text-sm font-medium mb-2">جاري رفع الصور</h3>
                    {Object.entries(fileUploads).map(([fileId, data]) => (
                      <div key={fileId} className="flex items-center space-x-2 rtl:space-x-reverse">
                        <div className="w-10 h-10 bg-secondary/50 rounded-md flex items-center justify-center overflow-hidden relative">
                          {data.status === 'success' && data.url ? (
                            <img src={data.url} alt="Uploaded" className="w-full h-full object-cover" />
                          ) : (
                            <Image className="w-6 h-6 text-foreground/60" />
                          )}
                          {data.status === 'error' && (
                            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                              <AlertCircle className="w-5 h-5 text-red-500" />
                            </div>
                          )}
                          {data.status === 'success' && (
                            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs truncate max-w-[200px] text-foreground/80">
                              {data.file.name}
                            </span>
                            <span className="text-xs text-foreground/60">
                              {data.status === 'success'
                                ? 'تم الرفع'
                                : data.status === 'error'
                                  ? 'فشل الرفع'
                                  : `${data.progress}%`}
                            </span>
                          </div>
                          <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                data.status === 'error'
                                  ? 'bg-red-500'
                                  : data.status === 'success'
                                    ? 'bg-green-500'
                                    : 'bg-primary'
                              }`}
                              style={{ width: `${data.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Image URL Input */}
                <div>
                  <p className="text-sm font-medium mb-2">أو أضف صورة عبر رابط:</p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                      placeholder="أدخل رابط الصورة"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      إضافة
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Video */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">فيديو المنتج (اختياري)</label>
                
                {/* Video Upload */}
                <div className="mb-4">
                  <div className="flex flex-col gap-4">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-md cursor-pointer hover:bg-secondary/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Video className="w-8 h-8 text-foreground/60 mb-2" />
                        <p className="mb-2 text-sm text-foreground/80">
                          <span className="font-medium">انقر لتحميل فيديو</span> أو اسحب وأفلت
                        </p>
                        <p className="text-xs text-foreground/60">MP4, WEBM حتى 100MB</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="video/*"
                        onChange={handleVideoChange}
                      />
                    </label>
                    
                    {/* Video Preview */}
                    {videoPreview && (
                      <div>
                        <p className="text-sm font-medium mb-2">معاينة الفيديو:</p>
                        <video
                          src={videoPreview}
                          controls
                          className="w-full h-auto rounded-md border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setVideoPreview(null);
                            setFormData(prev => ({ ...prev, videoFile: null }));
                          }}
                          className="mt-2 text-sm text-red-500 hover:text-red-700 transition-colors"
                        >
                          حذف الفيديو
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Video URL Input */}
                <div>
                  <p className="text-sm font-medium mb-2">أو أضف فيديو عبر رابط:</p>
                  <input
                    type="url"
                    name="videoUrl"
                    value={formData.videoUrl || ''}
                    onChange={handleVideoUrlChange}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                    placeholder="أدخل رابط الفيديو (YouTube, Vimeo, إلخ)"
                  />
                  {formData.videoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, videoUrl: '' }))}
                      className="mt-2 text-sm text-red-500 hover:text-red-700 transition-colors"
                    >
                      حذف رابط الفيديو
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || uploadingImages}
                className="btn-hover bg-primary text-primary-foreground rounded-md py-3 px-6 font-medium hover:bg-primary/90 transition-colors"
              >
                {isEditMode ? 'تحديث المنتج' : 'إضافة المنتج'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminProductForm;
