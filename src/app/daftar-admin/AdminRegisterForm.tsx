'use client';

import React, { useState, FormEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  UserPlus,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Building,
  Briefcase,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, getCookieValue, setCookie } from '@/app/service/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Enum untuk role dan instansi sesuai Prisma model
enum Role {
  ORANG_TUA = 'ORANG_TUA',
  PEGAWAI = 'PEGAWAI',
  DOKTER = 'DOKTER',
  ADMIN = 'ADMIN'
}

enum Instansi {
  RUMAH_SAKIT = 'RUMAH_SAKIT',
  PUSKESMAS = 'PUSKESMAS',
  POSYANDU = 'POSYANDU'
}

interface AdminRegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
  instansi: Instansi | ''; // allow empty string for Select
  namaInstansi: string;
  alamat: string;
}

interface PasswordValidation {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumbers: boolean;
  isValid: boolean;
}

const AdminRegisterForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<AdminRegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: Role.ADMIN,
    instansi: '',
    namaInstansi: '',
    alamat: ''
  });
  
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Validasi password
  const validatePassword = (password: string): PasswordValidation => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers
    };
  };

  const passwordValidation: PasswordValidation = validatePassword(formData.password);
  const passwordsMatch: boolean = formData.password === formData.confirmPassword;

  // Handle registrasi admin
  const handleAdminRegister = async (e: FormEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validasi client-side
    if (!passwordValidation.isValid) {
      setError('Password harus memiliki minimal 8 karakter, huruf besar, huruf kecil, dan angka');
      setLoading(false);
      return;
    }

    if (!passwordsMatch) {
      setError('Password tidak cocok');
      setLoading(false);
      return;
    }

    // Validasi khusus admin
    if (formData.role !== Role.ORANG_TUA && (!formData.instansi || !formData.namaInstansi)) {
      setError('Instansi dan Nama Instansi wajib diisi untuk role ini');
      setLoading(false);
      return;
    }

    try {
      // Kirim data ke endpoint registrasi admin
      const response = await api.post('/admin/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        instansi: formData.instansi,
        namaInstansi: formData.namaInstansi,
        alamat: formData.alamat
      });

      // Simpan token ke cookie
      setCookie('access_token', response.data.accessToken);
      
      setSuccess('Registrasi admin berhasil! Mengarahkan ke dashboard...');
      
      // Redirect ke dashboard setelah 2 detik
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof AdminRegisterFormData, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSelectChange = (field: keyof AdminRegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const PasswordStrengthIndicator: React.FC<{ validation: PasswordValidation }> = ({ validation }) => (
    <div className="mt-2 space-y-1">
      <div className="flex flex-wrap gap-1 text-xs">
        <span className={`px-2 py-1 rounded ${validation.minLength ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          8+ karakter
        </span>
        <span className={`px-2 py-1 rounded ${validation.hasUpperCase ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          Huruf besar
        </span>
        <span className={`px-2 py-1 rounded ${validation.hasLowerCase ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          Huruf kecil
        </span>
        <span className={`px-2 py-1 rounded ${validation.hasNumbers ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          Angka
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div 
          className="absolute inset-0 opacity-20 md:opacity-30" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='%23e0e7ff' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Floating elements */}
      <div className="absolute top-16 left-4 md:top-20 md:left-20 w-12 h-12 md:w-16 md:h-16 bg-blue-200 rounded-full opacity-20 animate-pulse" />
      <div className="absolute bottom-16 right-4 md:bottom-20 md:right-20 w-16 h-16 md:w-24 md:h-24 bg-purple-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1000ms' }} />
      <div className="absolute top-1/4 right-8 md:top-1/3 md:right-1/4 w-6 h-6 md:w-8 md:h-8 bg-indigo-300 rounded-full opacity-30 animate-bounce" style={{ animationDelay: '500ms' }} />

      <div className="relative z-10 w-full max-w-md md:max-w-lg">
        <Card className="backdrop-blur-sm bg-white bg-opacity-95 shadow-xl md:shadow-2xl border-0 rounded-2xl md:rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 md:p-8 text-white text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-white/30 rounded-xl md:rounded-2xl mb-3 md:mb-4">
              <UserPlus className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold mb-2">Registrasi Admin</h1>
            <p className="text-blue-100 text-sm md:text-base">Buat akun administrator baru</p>
          </div>

          <CardContent className="p-6 md:p-8 space-y-5 md:space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 text-sm">{success}</AlertDescription>
              </Alert>
            )}

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 font-medium text-sm md:text-base">
                Nama Lengkap
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Nama lengkap admin"
                  value={formData.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10 md:pl-11 h-11 md:h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg md:rounded-xl text-sm md:text-base"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium text-sm md:text-base">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@instansi.com"
                  value={formData.email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10 md:pl-11 h-11 md:h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg md:rounded-xl text-sm md:text-base"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Role Field */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-700 font-medium text-sm md:text-base">
                Role
              </Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5 z-10" />
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => handleSelectChange('role', value as Role)}
                  disabled={loading}
                >
                  <SelectTrigger className="pl-10 md:pl-11 h-11 md:h-12 border-gray-200 focus:ring-blue-500 rounded-lg md:rounded-xl text-sm md:text-base">
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                    <SelectItem value={Role.DOKTER}>Dokter</SelectItem>
                    <SelectItem value={Role.PEGAWAI}>Pegawai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Instansi Field */}
            {formData.role !== Role.ORANG_TUA && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="instansi" className="text-gray-700 font-medium text-sm md:text-base">
                    Jenis Instansi
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5 z-10" />
                    <Select 
                      value={formData.instansi || ''} 
                      onValueChange={(value) => handleSelectChange('instansi', value as Instansi)}
                      disabled={loading}
                    >
                      <SelectTrigger className="pl-10 md:pl-11 h-11 md:h-12 border-gray-200 focus:ring-blue-500 rounded-lg md:rounded-xl text-sm md:text-base">
                        <SelectValue placeholder="Pilih jenis instansi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Instansi.RUMAH_SAKIT}>Rumah Sakit</SelectItem>
                        <SelectItem value={Instansi.PUSKESMAS}>Puskesmas</SelectItem>
                        <SelectItem value={Instansi.POSYANDU}>Posyandu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="namaInstansi" className="text-gray-700 font-medium text-sm md:text-base">
                    Nama Instansi
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                    <Input
                      id="namaInstansi"
                      type="text"
                      placeholder="Nama lengkap instansi"
                      value={formData.namaInstansi}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('namaInstansi', e.target.value)}
                      required
                      disabled={loading}
                      className="pl-10 md:pl-11 h-11 md:h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg md:rounded-xl text-sm md:text-base"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Alamat Field */}
            <div className="space-y-2">
              <Label htmlFor="alamat" className="text-gray-700 font-medium text-sm md:text-base">
                Alamat
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-4 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                <textarea
                  id="alamat"
                  placeholder="Alamat lengkap"
                  value={formData.alamat}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleInputChange('alamat', e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 md:pl-11 h-24 p-3 border border-gray-200 rounded-lg md:rounded-xl focus:border-blue-500 focus:ring-blue-500 text-sm md:text-base"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium text-sm md:text-base">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Buat password yang kuat"
                  value={formData.password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('password', e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10 md:pl-11 pr-10 md:pr-11 h-11 md:h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg md:rounded-xl text-sm md:text-base"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={(): void => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <Eye className="w-4 h-4 md:w-5 md:h-5" />}
                </button>
              </div>
              {formData.password && <PasswordStrengthIndicator validation={passwordValidation} />}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium text-sm md:text-base">
                Konfirmasi Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ulangi password"
                  value={formData.confirmPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('confirmPassword', e.target.value)}
                  required
                  disabled={loading}
                  className={`pl-10 md:pl-11 pr-10 md:pr-11 h-11 md:h-12 border-gray-200 focus:ring-blue-500 rounded-lg md:rounded-xl text-sm md:text-base ${
                    formData.confirmPassword && !passwordsMatch ? 'border-red-300 focus:border-red-500' : 'focus:border-blue-500'
                  }`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={(): void => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <Eye className="w-4 h-4 md:w-5 md:h-5" />}
                </button>
              </div>
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-600 mt-1">Password tidak cocok</p>
              )}
              {formData.confirmPassword && passwordsMatch && (
                <p className="text-xs text-green-600 mt-1">Password cocok ✓</p>
              )}
            </div>

            {/* Register Button */}
            <Button 
              type="submit" 
              onClick={handleAdminRegister}
              className="w-full h-11 md:h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg md:rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform active:scale-95 md:hover:scale-105 text-sm md:text-base" 
              disabled={loading || 
                !formData.name || 
                !formData.email || 
                !passwordValidation.isValid || 
                !passwordsMatch ||
                !formData.role ||
                (formData.role !== Role.ORANG_TUA && (!formData.instansi || !formData.namaInstansi))
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                  Mendaftarkan Admin...
                </>
              ) : (
                <>
                  Daftarkan Admin
                  <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                </>
              )}
            </Button>

            {/* Back to Dashboard Link */}
            <div className="text-center pt-2">
              <Link href="/admin/dashboard">
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                >
                  Kembali ke Dashboard
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminRegisterForm;