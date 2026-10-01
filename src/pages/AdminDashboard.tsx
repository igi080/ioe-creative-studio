import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, PricingPackage } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, LogOut, Database, X, Check, Settings, Image as ImageIcon, Briefcase, FileText, LayoutTemplate, HelpCircle, MessageSquare, Scale, CreditCard } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { AdminServices } from '../components/admin/AdminServices';
import { AdminTestimonials } from '../components/admin/AdminTestimonials';
import { AdminFaqs } from '../components/admin/AdminFaqs';
import { AdminSiteSettings } from '../components/admin/AdminSiteSettings';
import { AdminPortfolio } from '../components/admin/AdminPortfolio';
import { AdminHome } from '../components/admin/AdminHome';
import { AdminAbout } from '../components/admin/AdminAbout';
import { AdminMedia } from '../components/admin/AdminMedia';
import { AdminQuoteRequests } from '../components/admin/AdminQuoteRequests';
import { AdminLegalPolicies } from '../components/admin/AdminLegalPolicies';
import { AdminPayments } from '../components/admin/AdminPayments';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'products' | 'packages' | 'home' | 'about' | 'services' | 'portfolio' | 'testimonials' | 'faqs' | 'quotes' | 'contact' | 'branding' | 'media' | 'legal' | 'payments'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  
  const [isEditingPackage, setIsEditingPackage] = useState(false);
  const [currentPackage, setCurrentPackage] = useState<Partial<PricingPackage>>({});
  const [newFeature, setNewFeature] = useState('');
  
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<{id: string, imageUrl?: string} | null>(null);
  const [packageToDelete, setPackageToDelete] = useState<string | null>(null);


  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [packageUploading, setPackageUploading] = useState(false);



  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = (file.type.startsWith('video/'));
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File must be less than ${isVideo ? '50MB' : '5MB'}`);
      return;
    }

    setUploadingImage(true);
    setError(null);
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error("No supabase instance");
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) throw new Error("Authentication error");

      const fileExt = file.name.split('.').pop();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
      const uniqueName = `products/${uuidv4()}-${sanitizedName}`;

      const urlResponse = await fetch('/api/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          filename: uniqueName,
          contentType: file.type
        })
      });

      if (!urlResponse.ok) {
        const errData = await urlResponse.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate upload URL");
      }

      const { uploadUrl, publicUrl } = await urlResponse.json();

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file
      });

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text().catch(() => "");
        throw new Error(`Failed to upload to R2 (${uploadResponse.status}): ${errText.substring(0, 100)}`);
      }

      if (publicUrl) {
         setCurrentProduct(prev => ({ ...prev, image: publicUrl }));
      } else {
         setError("R2_PUBLIC_URL not configured on server.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const supabase = getSupabase();
      if (!supabase) {
        if (mounted) navigate('/admin/login');
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // 1. Get authenticated user safely
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        // 2. If no authenticated user, redirect
        if (userError || !user) {
          console.error("Auth error:", userError);
          if (mounted) navigate('/admin/login');
          return;
        }
        
        // 3. Check if user is active admin using RPC first
        const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin');
        
        let isUserAdmin = isAdmin;
        let dbError = false;
        
        // If RPC fails (maybe cache stale or network error), fallback to direct table
        if (rpcError || isAdmin === null) {
          const { data: adminData, error: adminError } = await supabase
            .from('admin_users')
            .select('is_active, role')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (adminError) {
            console.error('Database error checking admin status:', adminError);
            dbError = true;
          } else {
            isUserAdmin = adminData?.is_active || false;
          }
        }
        
        if (!mounted) return;
        
        // 4. Handle DB/Network error gracefully
        if (dbError) {
          setError('Unable to verify administrator access. Please try again.');
          setLoading(false);
          return;
        }
        
        // 5. Handle authenticated but not an admin
        if (!isUserAdmin) {
          console.error('Access denied: Not an active admin.');
          await supabase.auth.signOut();
          navigate('/admin/login#error=Access%20Denied%3A%20Administrator%20privileges%20required');
          return;
        }
        
        // 6. Success! Fetch products
        fetchProducts(supabase);
          fetchPackages(supabase);
        
      } catch (err) {
        console.error('Unexpected error verifying admin status', err);
        if (mounted) {
          setError('Unable to verify administrator access. Please try again.');
          setLoading(false);
        }
      }
    };
    
    checkAuth();
    
    const { data: authListener } = getSupabase()?.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_OUT' || !session) && mounted) {
        navigate('/admin/login');
      }
    }) || { data: { subscription: { unsubscribe: () => {} } } };
    
    return () => {
      mounted = false;
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate]);

const fetchProducts = async (supabase: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('products').select('*').order('order', { ascending: true });
      if (error) {
         throw error;
      }
      setProducts(data as Product[]);
    } catch (error) {
      console.error('Error fetching products', error);
    } finally {
      setLoading(false);
    }
  };

  const OFFICIAL_IOE_PACKAGES = [
    {
      id: '7a111111-0001-4000-8000-000000000001',
      name: 'BASIC',
      category: 'Creative Design / Digital Services',
      description: 'A professional starter package for individuals, small businesses, brands, and organizations that need quality digital design and a strong visual presence.',
      price: 30000,
      currency: 'NGN',
      billing_period: '',
      features: [
        'Professional logo or brand graphic',
        'Up to 3 static promotional designs',
        'Social media-ready graphics',
        'Basic brand color and typography guidance',
        'High-resolution final files',
        'One revision round',
        'Delivery of final files digitally'
      ],
      is_featured: false,
      is_active: true,
      display_order: 1,
      image: '/images/ioe_basic_pkg_1790170332898.jpg'
    },
    {
      id: '7a222222-0002-4000-8000-000000000002',
      name: 'BUSINESS',
      category: 'Business Branding & Digital Presence',
      description: 'A complete digital design package for growing businesses that need consistent branding and professional promotional content.',
      price: 50000,
      currency: 'NGN',
      billing_period: '',
      features: [
        'Professional logo/brand identity design',
        'Up to 6 static promotional designs',
        'Social media graphics',
        'Business flyer/poster designs',
        'Basic brand style guide',
        'High-resolution final files',
        'Two revision rounds',
        'Web-ready and social-media-ready assets',
        'Digital delivery'
      ],
      is_featured: true,
      is_active: true,
      display_order: 2,
      image: '/images/ioe_business_pkg_1790170346116.jpg'
    },
    {
      id: '7a333333-0003-4000-8000-000000000003',
      name: 'BRAND PRO',
      category: 'Premium Branding & Digital Innovation',
      description: 'A premium creative package for businesses, organizations, and brands that need a stronger visual identity and a more complete digital presence.',
      price: 100000,
      currency: 'NGN',
      billing_period: '',
      features: [
        'Professional logo and visual identity',
        'Brand color palette and typography system',
        'Premium brand style guide',
        'Up to 10 static promotional designs',
        'Social media design assets',
        'Marketing flyer/poster designs',
        'Premium presentation graphics',
        'Basic motion/logo animation',
        'Web-ready brand assets',
        'High-resolution source/final files where applicable',
        'Three revision rounds',
        'Priority project handling',
        'Digital delivery'
      ],
      is_featured: false,
      is_active: true,
      display_order: 3,
      image: '/images/ioe_brand_pro_pkg_1790170357058.jpg'
    }
  ];

  const fetchPackages = async (supabase: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('pricing_packages').select('*').order('display_order', { ascending: true });
      if (error) throw error;
      if (data && data.length === 0) {
        try {
          const { error: insertError } = await supabase.from('pricing_packages').upsert(OFFICIAL_IOE_PACKAGES, { onConflict: 'id' });
          if (!insertError) {
            const { data: refreshedData } = await supabase.from('pricing_packages').select('*').order('display_order', { ascending: true });
            if (refreshedData && refreshedData.length > 0) {
              setPackages(refreshedData as PricingPackage[]);
              return;
            }
          }
        } catch (seedErr) {
          console.warn('Auto-seed packages notice:', seedErr);
        }
      } else if (data && data.length > 0) {
        // Sync default images if any official package has null image
        const packagesNeedingImages = data.filter((p: any) => !p.image);
        if (packagesNeedingImages.length > 0) {
          try {
            const mediaMap: Record<string, string> = {
              '7a111111-0001-4000-8000-000000000001': '/images/ioe_basic_pkg_1790170332898.jpg',
              '7a222222-0002-4000-8000-000000000002': '/images/ioe_business_pkg_1790170346116.jpg',
              '7a333333-0003-4000-8000-000000000003': '/images/ioe_brand_pro_pkg_1790170357058.jpg',
              'basic': '/images/ioe_basic_pkg_1790170332898.jpg',
              'business': '/images/ioe_business_pkg_1790170346116.jpg',
              'brand pro': '/images/ioe_brand_pro_pkg_1790170357058.jpg'
            };
            for (const p of packagesNeedingImages) {
              const img = mediaMap[p.id] || mediaMap[p.name?.toLowerCase()?.trim()];
              if (img) {
                await supabase.from('pricing_packages').update({ image: img }).eq('id', p.id);
              }
            }
            const { data: updatedData } = await supabase.from('pricing_packages').select('*').order('display_order', { ascending: true });
            if (updatedData && updatedData.length > 0) {
              setPackages(updatedData as PricingPackage[]);
              return;
            }
          } catch (syncErr) {
            console.warn('Image sync notice:', syncErr);
          }
        }
      }
      setPackages((data || []) as PricingPackage[]);
    } catch (error) {
      console.error('Error fetching packages', error);
      setError('Unable to load packages.');
    } finally {
      setLoading(false);
    }
  };

  const seedOfficialPackages = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('pricing_packages').upsert(OFFICIAL_IOE_PACKAGES, { onConflict: 'id' });
      if (error) throw error;
      await fetchPackages(supabase);
      showSuccess('Successfully created the 3 official IOE pricing packages.');
    } catch (err: any) {
      console.error('Error seeding packages', err);
      setError('Error creating official packages: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

const uploadPackageImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      if (typeof setError === 'function') setError("File must be smaller than 50MB");
      return;
    }

    setPackageUploading(true);
    if (typeof setError === 'function') setError(null);

    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error("No supabase instance");
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) throw new Error("Authentication error");

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
      const uniqueName = `pricing/${uuidv4()}/${Date.now()}-${sanitizedName}`;

      const urlResponse = await fetch('/api/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          filename: uniqueName,
          contentType: file.type
        })
      });

      if (!urlResponse.ok) {
        const errData = await urlResponse.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate upload URL");
      }

      const { uploadUrl, publicUrl } = await urlResponse.json();

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file
      });

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text().catch(() => "");
        throw new Error(`Failed to upload to R2 (${uploadResponse.status}): ${errText.substring(0, 100)}`);
      }

      if (publicUrl) {
         setCurrentPackage(prev => ({ ...prev, image: publicUrl }));
      } else {
         if (typeof setError === 'function') setError("R2_PUBLIC_URL not configured on server.");
      }

    } catch (err: any) {
      console.error('Error uploading image', err);
      if (typeof setError === 'function') setError('Error uploading image: ' + err.message);
    } finally {
      setPackageUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (typeof setError === 'function') setError(null);
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const payload: any = {
          name: currentProduct.name,
          category: currentProduct.category,
          description: currentProduct.description,
          price: currentProduct.price,
          image: currentProduct.image || '',
          order: currentProduct.order || 0,
          isPublished: currentProduct.isPublished !== undefined ? currentProduct.isPublished : true,
          isFeatured: currentProduct.isFeatured || false
      };
      if (!currentProduct.id) {
          payload.createdAt = Date.now();
      }


      if (currentProduct.id) {
        const { error: updateError } = await supabase
            .from('products')
            .update(payload)
            .eq('id', currentProduct.id);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
            .from('products')
            .insert([payload]);
            
        if (insertError) throw insertError;
      }
      
      setIsEditing(false);
      setCurrentProduct({});
      fetchProducts(supabase);
    } catch (err: any) {
      console.error('Error saving product', err);
      if (typeof setError === 'function') setError('Error saving product: ' + err.message);
    }
  };
const handleDelete = (id: string, imageUrl?: string) => {
    // Iframe blocks window.confirm, so we use a custom React modal instead
    setProductToDelete({ id, imageUrl });
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    const { id, imageUrl } = productToDelete;
    setProductToDelete(null); // Close modal
    
    if (typeof setError === 'function') setError(null);

    const supabase = getSupabase();
    if (!supabase) return;

    try {
      if (imageUrl && imageUrl.includes('r2')) {
         try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
               const urlObj = new URL(imageUrl);
               const key = urlObj.pathname.substring(1);
               await fetch('/api/delete-media', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                  body: JSON.stringify({ key })
               });
            }
         } catch(e) { console.error("Failed to delete media", e) }
      }

      const { data, error: deleteError } = await supabase.from('products').delete().eq('id', id).select();

      if (deleteError) throw deleteError;
      if (!data || data.length === 0) {
         throw new Error("Deletion failed: Record not found or blocked by Row Level Security (RLS). Please ensure you are an authorized admin.");
      }
      
      if (typeof setSuccessMsg === 'function') {
        setSuccessMsg("Product deleted successfully");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
      
      fetchProducts(supabase);
    } catch (err: any) {
      console.error('Error deleting product', err);
      if (typeof setError === 'function') setError('Error deleting product: ' + err.message);
    }
  };

  const handleSavePackage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (typeof setError === 'function') setError(null);
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      if (currentPackage.id) {
        const { error } = await supabase
          .from('pricing_packages')
          .update(currentPackage)
          .eq('id', currentPackage.id);
        if (error) throw error;
        setPackages(packages.map(p => p.id === currentPackage.id ? { ...p, ...currentPackage } as PricingPackage : p));
        showSuccess('Package updated successfully.');
      } else {
        const pkgPayload: any = { ...currentPackage };
        delete pkgPayload.id;
        const { data, error } = await supabase
          .from('pricing_packages')
          .insert([pkgPayload])
          .select()
          .single();
        if (error) throw error;
        setPackages([...packages, data as PricingPackage]);
        showSuccess('Package saved successfully.');
      }
      setIsEditingPackage(false);
    } catch (err: any) {
      console.error('Error saving package', err);
      setError('Error saving package: ' + (err.message || err));
    }
  };

  const confirmDeletePackage = async () => {
    if (!packageToDelete) return;
    const id = packageToDelete;
    setPackageToDelete(null);
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      
      const pkgToDelete = packages.find(p => p.id === id);
      if (pkgToDelete?.image && pkgToDelete.image.includes('r2')) {
         try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
               const urlObj = new URL(pkgToDelete.image);
               const key = urlObj.pathname.substring(1);
               await fetch('/api/delete-media', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                  body: JSON.stringify({ key })
               });
            }
         } catch(e) { console.error("Failed to delete media", e) }
      }
      const { data, error } = await supabase.from('pricing_packages').delete().eq('id', id).select();
      if (error) throw error;
      if (!data || data.length === 0) {
         throw new Error("Deletion failed: Record not found or blocked by Row Level Security (RLS). Please ensure you are an authorized admin.");
      }
      setPackages(packages.filter(p => p.id !== id));
      showSuccess('Package deleted successfully.');
    } catch (err: any) {
      console.error('Error deleting package', err);
      setError('Error deleting package: ' + (err.message || err));
    }
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    const features = currentPackage.features || [];
    setCurrentPackage({ ...currentPackage, features: [...features, newFeature.trim()] });
    setNewFeature('');
  };

  const removeFeature = (index: number) => {
    const features = [...(currentPackage.features || [])];
    features.splice(index, 1);
    setCurrentPackage({ ...currentPackage, features });
  };

const handleLogout = async () => {
    const supabase = getSupabase();
    if (supabase) {
        await supabase.auth.signOut();
    }
    navigate('/admin/login');
  };

  if (loading && products.length === 0 && packages.length === 0 && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Verifying secure access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 font-sans">
      <nav className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center">
            <Database className="w-5 h-5 mr-3 text-teal-600" />
            IOE Studio Management
        </h1>
        
          <button type="button"
            onClick={() => setActiveTab('portfolio')}
            className={`whitespace-nowrap px-4 py-2 text-sm font-bold transition-colors rounded-t-lg ${activeTab === 'portfolio' ? 'bg-slate-100 text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Briefcase className="w-4 h-4 inline-block mr-1" /> Portfolio
          </button>
<button type="button" onClick={handleLogout} className="flex items-center text-sm hover:text-slate-600">
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </button>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 px-4 py-3 rounded-lg mb-6 flex items-start shadow-sm">
            <span className="block sm:inline">{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 px-4 py-4 rounded-lg mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm">
            <span className="block mb-2 sm:mb-0">{error}</span>
            {error.includes('Unable to verify') && (
              <button type="button" 
                onClick={() => window.location.reload()}
                className="bg-rose-500/20 text-rose-300 px-4 py-2 rounded-md hover:bg-rose-500/30 transition font-medium text-sm"
              >
                Retry
              </button>
            )}
          </div>
        )}

        <div className="flex space-x-2 border-b border-slate-300 mb-8 overflow-x-auto pb-1 hide-scrollbar">
          <button type="button" 
            onClick={() => setActiveTab('products')} 
            className={`whitespace-nowrap px-4 py-2 text-sm font-bold transition-colors rounded-t-lg ${activeTab === 'products' ? 'bg-slate-100 text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Briefcase className="w-4 h-4 inline-block mr-1" /> Products
          </button>
          <button type="button" 
            onClick={() => setActiveTab('packages')} 
            className={`whitespace-nowrap px-4 py-2 text-sm font-bold transition-colors rounded-t-lg ${activeTab === 'packages' ? 'bg-slate-100 text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Database className="w-4 h-4 inline-block mr-1" /> Pricing
          </button>
          <button type="button" 
            onClick={() => setActiveTab('services')} 
            className={`whitespace-nowrap px-4 py-2 text-sm font-bold transition-colors rounded-t-lg ${activeTab === 'services' ? 'bg-slate-100 text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <LayoutTemplate className="w-4 h-4 inline-block mr-1" /> Services
          </button>
          <button type="button" 
            onClick={() => setActiveTab('testimonials')} 
            className={`whitespace-nowrap px-4 py-2 text-sm font-bold transition-colors rounded-t-lg ${activeTab === 'testimonials' ? 'bg-slate-100 text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <MessageSquare className="w-4 h-4 inline-block mr-1" /> Testimonials
          </button>
          <button type="button" 
            onClick={() => setActiveTab('faqs')} 
            className={`whitespace-nowrap px-4 py-2 text-sm font-bold transition-colors rounded-t-lg ${activeTab === 'faqs' ? 'bg-slate-100 text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <HelpCircle className="w-4 h-4 inline-block mr-1" /> FAQs
          </button>
          <button type="button" 
            onClick={() => setActiveTab('quotes')} 
            className={`whitespace-nowrap px-4 py-2 text-sm font-bold transition-colors rounded-t-lg ${activeTab === 'quotes' ? 'bg-slate-100 text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <FileText className="w-4 h-4 inline-block mr-1" /> Quote Requests
          </button>
          <button type="button" 
            onClick={() => setActiveTab('payments')} 
            className={`whitespace-nowrap px-4 py-2 text-sm font-bold transition-colors rounded-t-lg ${activeTab === 'payments' ? 'bg-slate-100 text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <CreditCard className="w-4 h-4 inline-block mr-1" /> Payments
          </button>
          <div className="w-px bg-slate-300 mx-2 my-2"></div>
          <button type="button" 
            onClick={() => setActiveTab('home')} 
            className={`whitespace-nowrap px-4 py-2 text-sm font-bold transition-colors rounded-t-lg ${activeTab === 'home' ? 'bg-slate-100 text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <FileText className="w-4 h-4 inline-block mr-1" /> Home
          </button>
          <button type="button" 
            onClick={() => setActiveTab('about')} 
            className={`whitespace-nowrap px-4 py-2 text-sm font-bold transition-colors rounded-t-lg ${activeTab === 'about' ? 'bg-slate-100 text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <FileText className="w-4 h-4 inline-block mr-1" /> About
          </button>
          <button type="button" 
            onClick={() => setActiveTab('contact')} 
            className={`whitespace-nowrap px-4 py-2 text-sm font-bold transition-colors rounded-t-lg ${activeTab === 'contact' ? 'bg-slate-100 text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <FileText className="w-4 h-4 inline-block mr-1" /> Contact
          </button>
          <button type="button" 
            onClick={() => setActiveTab('branding')} 
            className={`whitespace-nowrap px-4 py-2 text-sm font-bold transition-colors rounded-t-lg ${activeTab === 'branding' ? 'bg-slate-100 text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <ImageIcon className="w-4 h-4 inline-block mr-1" /> Branding
          </button>

          <button type="button"
            onClick={() => setActiveTab('media')}
            className={`whitespace-nowrap px-4 py-2 text-sm font-bold transition-colors rounded-t-lg ${activeTab === 'media' ? 'bg-slate-100 text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <ImageIcon className="w-4 h-4 inline-block mr-1" /> Media
          </button>

          <button type="button"
            onClick={() => setActiveTab('legal')}
            className={`whitespace-nowrap px-4 py-2 text-sm font-bold transition-colors rounded-t-lg ${activeTab === 'legal' ? 'bg-slate-100 text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Scale className="w-4 h-4 inline-block mr-1" /> Legal / Policies
          </button>
        </div>

        {activeTab === 'services' && <AdminServices setError={setError} showSuccess={showSuccess} />}
        {activeTab === 'portfolio' && <AdminPortfolio setError={setError} showSuccess={showSuccess} />}
        {activeTab === 'media' && <AdminMedia setError={setError} showSuccess={showSuccess} />}
        {activeTab === 'home' && <AdminHome setError={setError} showSuccess={showSuccess} />}
        {activeTab === 'about' && <AdminAbout setError={setError} showSuccess={showSuccess} />}
        {['contact', 'branding'].includes(activeTab) && <AdminSiteSettings category={activeTab} setError={setError} showSuccess={showSuccess} />}
        {activeTab === 'testimonials' && <AdminTestimonials setError={setError} showSuccess={showSuccess} />}
        {activeTab === 'faqs' && <AdminFaqs setError={setError} showSuccess={showSuccess} />}
        {activeTab === 'quotes' && <AdminQuoteRequests setError={setError} showSuccess={showSuccess} />}
        {activeTab === 'payments' && <AdminPayments setError={setError} showSuccess={showSuccess} />}
        {activeTab === 'legal' && <AdminLegalPolicies setError={setError} showSuccess={showSuccess} />}
                
        {activeTab === 'products' ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Manage Products</h2>
              <button type="button"
                onClick={() => { setCurrentProduct({ isPublished: true, isFeatured: false, order: 0 }); setIsEditing(true); }}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-teal-700 transition shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Product
              </button>
            </div>
        {isEditing && (
          <div className="bg-[#FFFFFF] p-6 rounded-xl shadow-sm border border-slate-300 mb-8">
            <h3 className="text-lg font-bold mb-4">{currentProduct.id ? 'Edit Product' : 'Add Product'}</h3>
            <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Name</label>
                <input required type="text" className="relative z-10 block w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-shadow bg-white hover:bg-slate-50 text-slate-900 " value={currentProduct.name || ''} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                <input required type="text" className="relative z-10 block w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-shadow bg-white hover:bg-slate-50 text-slate-900 " value={currentProduct.category || ''} onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea required rows={3} className="relative z-10 block w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-shadow bg-white hover:bg-slate-50 text-slate-900 " value={currentProduct.description || ''} onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Price (e.g. "$500" or "Contact for Price")</label>
                <input required type="text" className="relative z-10 block w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-shadow bg-white hover:bg-slate-50 text-slate-900 " value={currentProduct.price || ''} onChange={e => setCurrentProduct({...currentProduct, price: e.target.value})} />
              </div>
                            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Image URL or Upload</label>
                <div className="mt-1 flex items-center space-x-4">
                  <input type="text" className="relative z-10 block w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-shadow bg-white hover:bg-slate-50 text-slate-900 " value={currentProduct.image || ''} placeholder="https://..." onChange={e => setCurrentProduct({...currentProduct, image: e.target.value})} />
                  <span className="text-slate-500">OR</span>
                  <input type="file" accept="image/jpeg, image/png, image/webp, image/svg+xml, video/mp4, video/webm" onChange={uploadImage} disabled={uploadingImage} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border-2 border-dashed border-indigo-100 rounded-xl p-2 transition-colors hover:border-indigo-300" />
                </div>
                {uploadingImage && <p className="text-sm text-teal-600 mt-2">Uploading...</p>}
                                {currentProduct.image && (
                   currentProduct.image.match(/\.(mp4|webm|ogg)$/i) ? (
                     <video src={currentProduct.image} controls className="mt-4 h-32 w-auto object-contain rounded-md border border-slate-300" />
                   ) : (
                     <img src={currentProduct.image} alt="Preview" className="mt-4 h-32 w-auto object-contain rounded-md border border-slate-300" />
                   )
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Order (Number for sorting)</label>
                <input type="number" className="relative z-10 block w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-shadow bg-white hover:bg-slate-50 text-slate-900 " value={currentProduct.order || 0} onChange={e => setCurrentProduct({...currentProduct, order: Number(e.target.value)})} />
              </div>
              <div className="flex items-center space-x-6 sm:col-span-2 mt-2">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded text-teal-600 mr-2" checked={currentProduct.isPublished || false} onChange={e => setCurrentProduct({...currentProduct, isPublished: e.target.checked})} />
                  Published
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded text-teal-600 mr-2" checked={currentProduct.isFeatured || false} onChange={e => setCurrentProduct({...currentProduct, isFeatured: e.target.checked})} />
                  Featured
                </label>
              </div>
              <div className="sm:col-span-2 flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded-md hover:bg-[#FFFFFF]">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">Save Changes</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-[#FFFFFF] rounded-xl shadow-sm border border-slate-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#FFFFFF]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Image & Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-[#FFFFFF] divide-y divide-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No products found. Click "Add New" to create your first product.
                    </td>
                  </tr>
                ) : products.map(product => (
                  <tr key={product.id} className="hover:bg-[#FFFFFF]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                          {product.image && (
                            product.image.match(/\.(mp4|webm)$/i) ? (
                              <video src={product.image} className="h-10 w-10 object-contain" muted />
                            ) : (
                              <img src={product.image} alt="" className="h-10 w-10 object-contain" />
                            )
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{product.name}</div>
                          <div className="text-sm text-slate-500">{product.price}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{product.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {product.isPublished ? (
                          <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200"><Eye className="w-3 h-3 mr-1 mt-0.5"/> Published</span>
                        ) : (
                          <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full bg-white text-slate-800 border border-slate-300"><EyeOff className="w-3 h-3 mr-1 mt-0.5"/> Hidden</span>
                        )}
                        {product.isFeatured && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-500/20 text-amber-600"><Star className="w-3 h-3 mr-1 mt-0.5"/> Featured</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button type="button" onClick={() => { setCurrentProduct(product); setIsEditing(true); }} className="text-teal-600 hover:text-blue-300 mr-4 p-2 hover:bg-blue-500/20 rounded-lg transition-colors inline-block">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => handleDelete(product.id, product.image)} className="text-rose-600 hover:text-rose-900 p-2 hover:bg-rose-100 rounded-lg transition-colors inline-block">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          </div>
        ) : null}

        {/* PACKAGES UI */}
        {activeTab === 'packages' ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Manage Packages</h2>
              <div className="flex items-center space-x-3">
                {packages.length === 0 && (
                  <button type="button"
                    onClick={seedOfficialPackages}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-emerald-700 transition shadow-sm font-semibold text-sm"
                  >
                    <Check className="w-4 h-4 mr-2" /> Create 3 Official Packages
                  </button>
                )}
                <button type="button"
                  onClick={() => { setCurrentPackage({ is_active: true, is_featured: false, display_order: 0, features: [], currency: 'NGN' }); setIsEditingPackage(true); }}
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-teal-700 transition shadow-sm text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Package
                </button>
              </div>
            </div>

            {isEditingPackage && (
<div className="bg-[#FFFFFF] p-6 rounded-xl shadow-sm border border-slate-300 mb-8">
                <h3 className="text-lg font-bold mb-4">{currentPackage.id ? 'Edit Package' : 'Add Package'}</h3>
                <form onSubmit={handleSavePackage} className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Package Name</label>
                    <input required type="text" className="relative z-10 block w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-shadow bg-white hover:bg-slate-50 text-slate-900 " value={currentPackage.name || ''} onChange={e => setCurrentPackage({...currentPackage, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Category (e.g. Website, Graphics)</label>
                    <input type="text" className="relative z-10 block w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-shadow bg-white hover:bg-slate-50 text-slate-900 " value={currentPackage.category || ''} onChange={e => setCurrentPackage({...currentPackage, category: e.target.value})} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                    <textarea rows={2} className="relative z-10 block w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-shadow bg-white hover:bg-slate-50 text-slate-900 " value={currentPackage.description || ''} onChange={e => setCurrentPackage({...currentPackage, description: e.target.value})} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Image URL or Upload</label>
                    <div className="mt-1 flex items-center space-x-4">
                      <input type="text" className="relative z-10 block w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-shadow bg-white hover:bg-slate-50 text-slate-900 " value={currentPackage.image || ''} placeholder="https://..." onChange={e => setCurrentPackage({...currentPackage, image: e.target.value})} />
                      <span className="text-slate-500">OR</span>
                      <input type="file" accept="image/jpeg, image/png, image/webp, image/svg+xml, video/mp4, video/webm" onChange={uploadPackageImage} disabled={packageUploading} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border-2 border-dashed border-indigo-100 rounded-xl p-2 transition-colors hover:border-indigo-300" />
                    </div>
                    {packageUploading && <p className="text-sm text-blue-600 mt-2 font-medium flex items-center"><span className="animate-spin mr-2 border-2 border-blue-600 border-t-transparent rounded-full w-4 h-4"></span> Uploading...</p>}
                    {currentPackage.image && (
                      <div className="mt-4">
                        {currentPackage.image.match(/\.(mp4|webm|ogg)(\?.*)?$/i) ? (
                           <video src={currentPackage.image} controls className="h-32 w-auto object-contain rounded-md border border-slate-300 bg-slate-50" />
                        ) : (
                           <img src={currentPackage.image} alt="Preview" className="h-32 w-auto object-contain rounded-md border border-slate-300 bg-slate-50" />
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Price (Numeric)</label>
                    <input type="number" className="relative z-10 block w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-shadow bg-white hover:bg-slate-50 text-slate-900 " value={currentPackage.price || ''} onChange={e => setCurrentPackage({...currentPackage, price: e.target.value === '' ? 0 : parseFloat(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Currency</label>
                    <input type="text" className="relative z-10 block w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-shadow bg-white hover:bg-slate-50 text-slate-900 " value={currentPackage.currency || 'NGN'} onChange={e => setCurrentPackage({...currentPackage, currency: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Billing Period (e.g. /month, /project)</label>
                    <input type="text" className="relative z-10 block w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-shadow bg-white hover:bg-slate-50 text-slate-900 " value={currentPackage.billing_period || ''} onChange={e => setCurrentPackage({...currentPackage, billing_period: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Display Order</label>
                    <input type="number" className="relative z-10 block w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-shadow bg-white hover:bg-slate-50 text-slate-900 " value={currentPackage.display_order || 0} onChange={e => setCurrentPackage({...currentPackage, display_order: Number(e.target.value)})} />
                  </div>
                  
                  {/* Features List */}
                  <div className="sm:col-span-2 mt-4 p-4 border border-slate-300 rounded-md bg-[#FFFFFF]">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Package Features</label>
                    <ul className="space-y-2 mb-3">
                      {(currentPackage.features || []).map((feat, idx) => (
                        <li key={idx} className="flex justify-between items-center p-2 border border-slate-300 rounded text-sm">
                          <span className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> {feat}</span>
                          <button type="button" onClick={() => removeFeature(idx)} className="text-red-500 hover:text-rose-600"><X className="w-4 h-4" /></button>
                        </li>
                      ))}
                      {(!currentPackage.features || currentPackage.features.length === 0) && (
                        <li className="text-sm text-slate-500 italic">No features added yet.</li>
                      )}
                    </ul>
                    <div className="flex space-x-2">
                      <input 
                        type="text" 
                        className="flex-grow bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder:text-slate-600" 
                        placeholder="e.g. Social Media Graphics" 
                        value={newFeature}
                        onChange={e => setNewFeature(e.target.value)}
                        onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                      />
                      <button type="button" onClick={addFeature} className="bg-teal-600/20 text-teal-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-teal-600/30 border border-blue-500/30 transition-all">Add Feature</button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 sm:col-span-2 mt-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded text-teal-600 mr-2" checked={currentPackage.is_active || false} onChange={e => setCurrentPackage({...currentPackage, is_active: e.target.checked})} />
                      Active (Visible)
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded text-teal-600 mr-2" checked={currentPackage.is_featured || false} onChange={e => setCurrentPackage({...currentPackage, is_featured: e.target.checked})} />
                      Featured (Highlighted)
                    </label>
                  </div>
                  <div className="sm:col-span-2 flex justify-end space-x-3 mt-4">
                    <button type="button" onClick={() => setIsEditingPackage(false)} className="px-4 py-2 border rounded-md hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={packageUploading} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed">
                      {packageUploading ? 'Uploading...' : 'Save Package'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-[#FFFFFF] rounded-xl shadow-sm border border-slate-300 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#FFFFFF]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Package</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#FFFFFF] divide-y divide-gray-200">
                    {packages.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                          <p className="mb-4 text-base font-medium text-slate-700">No packages found in the database.</p>
                          <div className="flex justify-center items-center gap-3">
                            <button
                              type="button"
                              onClick={seedOfficialPackages}
                              className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
                            >
                              <Check className="w-4 h-4 mr-1.5" /> Initialize 3 Official Packages (Basic, Business, Brand Pro)
                            </button>
                            <button
                              type="button"
                              onClick={() => { setCurrentPackage({ is_active: true, is_featured: false, display_order: 0, features: [], currency: 'NGN' }); setIsEditingPackage(true); }}
                              className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
                            >
                              <Plus className="w-4 h-4 mr-1.5" /> Add Package
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : packages.map(pkg => (
                      <tr key={pkg.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-12 w-12 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 mr-4 flex items-center justify-center">
                              {(() => {
                                const imgUrl = pkg.image || (
                                  pkg.id === '7a111111-0001-4000-8000-000000000001' || pkg.name?.toLowerCase() === 'basic' ? '/images/ioe_basic_pkg_1790170332898.jpg' :
                                  pkg.id === '7a222222-0002-4000-8000-000000000002' || pkg.name?.toLowerCase() === 'business' ? '/images/ioe_business_pkg_1790170346116.jpg' :
                                  pkg.id === '7a333333-0003-4000-8000-000000000003' || pkg.name?.toLowerCase() === 'brand pro' ? '/images/ioe_brand_pro_pkg_1790170357058.jpg' : ''
                                );
                                if (!imgUrl) return null;
                                return imgUrl.match(/\.(mp4|webm|ogg)(\?.*)?$/i) ? (
                                  <video src={imgUrl} className="h-full w-full object-cover" muted playsInline />
                                ) : (
                                  <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                                );
                              })()}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">{pkg.name}</div>
                              <div className="text-xs text-slate-500">{pkg.category}</div>
                              <div className="text-xs text-slate-500 mt-1">{pkg.features?.length || 0} features</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {pkg.price ? `${pkg.currency} ${pkg.price.toLocaleString()}` : 'Custom'}{pkg.billing_period ? ` ${pkg.billing_period}` : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {pkg.is_active ? (
                              <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200"><Eye className="w-3 h-3 mr-1 mt-0.5"/> Active</span>
                            ) : (
                              <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full bg-white text-slate-800 border border-slate-300"><EyeOff className="w-3 h-3 mr-1 mt-0.5"/> Hidden</span>
                            )}
                            {pkg.is_featured && (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-500/20 text-amber-600"><Star className="w-3 h-3 mr-1 mt-0.5"/> Featured</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button type="button" onClick={() => { setCurrentPackage(pkg); setIsEditingPackage(true); }} className="text-teal-600 hover:text-blue-300 mr-4 p-2 hover:bg-blue-500/20 rounded-lg transition-colors inline-block">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => setPackageToDelete(pkg.id)} className="text-rose-600 hover:text-rose-900 p-2 hover:bg-rose-100 rounded-lg transition-colors inline-block">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}


      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Delete</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Package Delete Confirmation Modal */}
      {packageToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Delete</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to delete this package? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setPackageToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeletePackage}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
