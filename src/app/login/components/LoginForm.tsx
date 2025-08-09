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
  Shield,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, setCookie } from '@/app/service/api';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginError extends Error {
  message: string;
}

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleLogin = async (e: FormEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Panggil API login
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });

      // Simpan token ke cookie
      setCookie('access_token', response.data.accessToken);
      
      // Redirect ke dashboard
      router.push('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login gagal. Silakan coba lagi.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof LoginFormData,
    value: string
  ): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8">
      {/* Mobile-optimized background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div
          className="absolute inset-0 opacity-20 md:opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='%23e0e7ff' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Floating elements - responsive positioning */}
      <div className="absolute top-16 left-4 md:top-20 md:left-20 w-12 h-12 md:w-16 md:h-16 bg-blue-200 rounded-full opacity-20 animate-pulse" />
      <div
        className="absolute bottom-16 right-4 md:bottom-20 md:right-20 w-16 h-16 md:w-24 md:h-24 bg-purple-200 rounded-full opacity-20 animate-pulse"
        style={{ animationDelay: '1000ms' }}
      />
      <div
        className="absolute top-1/4 right-8 md:top-1/3 md:right-1/4 w-6 h-6 md:w-8 md:h-8 bg-indigo-300 rounded-full opacity-30 animate-bounce"
        style={{ animationDelay: '500ms' }}
      />

      <div className="relative z-10 w-full max-w-sm md:max-w-md">
        <Card className="backdrop-blur-sm bg-white bg-opacity-95 shadow-xl md:shadow-2xl border-0 rounded-2xl md:rounded-3xl overflow-hidden">
          {/* Header - mobile optimized */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 md:p-8 text-white text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-white/30 rounded-xl md:rounded-2xl mb-3 md:mb-4">
              <Shield className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold mb-2">
              Selamat Datang Kembali
            </h1>
            <p className="text-blue-100 text-sm md:text-base">
              Silakan masuk ke akun Anda
            </p>
          </div>

          <CardContent className="p-6 md:p-8 space-y-5 md:space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-700 text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-gray-700 font-medium text-sm md:text-base">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange('email', e.target.value)
                  }
                  required
                  disabled={loading}
                  className="pl-10 md:pl-11 h-11 md:h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg md:rounded-xl text-sm md:text-base"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-gray-700 font-medium text-sm md:text-base">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password Anda"
                  value={formData.password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange('password', e.target.value)
                  }
                  required
                  disabled={loading}
                  className="pl-10 md:pl-11 pr-10 md:pr-11 h-11 md:h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg md:rounded-xl text-sm md:text-base"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={(): void => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  disabled={loading}>
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 md:w-5 md:h-5" />
                  ) : (
                    <Eye className="w-4 h-4 md:w-5 md:h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link - Mobile friendly */}
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                onClick={(): void => console.log('Forgot password clicked')}>
                Lupa Password?
              </button>
            </div>

            {/* Login Button - Mobile optimized */}
            <Button
              type="submit"
              onClick={handleLogin}
              className="w-full h-11 md:h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg md:rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform active:scale-95 md:hover:scale-105 text-sm md:text-base"
              disabled={loading || !formData.email || !formData.password}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                  Masuk...
                </>
              ) : (
                <>
                  Masuk
                  <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                </>
              )}
            </Button>

            {/* Register Link - Mobile friendly */}
            <div className="text-center pt-2">
              <p className="text-gray-600 text-sm md:text-base">
                Belum punya akun?{' '}
                <Link href="/register">
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700 font-semibold hover:underline hover:cursor-pointer">
                    Daftar di sini
                  </button>
                </Link>
              </p>
            </div>

            {/* PWA Demo credentials */}
            {/* <div className="mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-xs md:text-sm text-gray-600 font-medium mb-1">Demo Credentials:</p>
              <p className="text-xs text-gray-500">Email: admin@example.com</p>
              <p className="text-xs text-gray-500">Password: password</p>
            </div> */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;
