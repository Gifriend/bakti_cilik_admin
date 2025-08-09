"use client"

import React, { useState, FormEvent, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, Mail, Lock, User, UserPlus, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { api, setCookie } from '@/app/service/api'
import router from 'next/router'

interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

interface PasswordValidation {
  minLength: boolean
  hasUpperCase: boolean
  hasLowerCase: boolean
  hasNumbers: boolean
  isValid: boolean
}

interface RegisterError extends Error {
  message: string
}

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  // Password validation
  const validatePassword = (password: string): PasswordValidation => {
    const minLength = password.length >= 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    
    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers
    }
  }

  const passwordValidation: PasswordValidation = validatePassword(formData.password)
  const passwordsMatch: boolean = formData.password === formData.confirmPassword

  //Functiion for handle registration account
  const handleRegister = async (e: FormEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // validate password in client side
    if (!passwordValidation.isValid) {
      setError('Password harus memiliki minimal 8 karakter, huruf besar, huruf kecil, dan angka');
      setLoading(false);
      return;
    }

    //check if password is matching
    if (!passwordsMatch) {
      setError('Password tidak cocok');
      setLoading(false);
      return;
    }

    try {
      // Try to call register api
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      // Save token to cookie
      setCookie('access_token', response.data.accessToken);
      
      setSuccess('Pendaftaran berhasil! Mengarahkan ke dashboard...');
      
      // Redirect to dashboard after successful registration
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Pendaftaran gagal. Silakan coba lagi.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('') // Clear error when user starts typing
    if (success) setSuccess('') // Clear success message when user starts typing again
  }

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
  )

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8">
      {/* Mobile-optimized background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div 
          className="absolute inset-0 opacity-20 md:opacity-30" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='%23d1fae5' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Floating elements - responsive positioning */}
      <div className="absolute top-16 right-4 md:top-20 md:right-20 w-12 h-12 md:w-16 md:h-16 bg-green-200 rounded-full opacity-20 animate-pulse" />
      <div className="absolute bottom-16 left-4 md:bottom-20 md:left-20 w-16 h-16 md:w-24 md:h-24 bg-emerald-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1000ms' }} />
      <div className="absolute top-1/4 left-8 md:top-1/3 md:left-1/4 w-6 h-6 md:w-8 md:h-8 bg-teal-300 rounded-full opacity-30 animate-bounce" style={{ animationDelay: '500ms' }} />

      <div className="relative z-10 w-full max-w-sm md:max-w-md">
        <Card className="backdrop-blur-sm bg-white bg-opacity-95 shadow-xl md:shadow-2xl border-0 rounded-2xl md:rounded-3xl overflow-hidden">
          {/* Header - mobile optimized */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 md:p-8 text-white text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-white/30 rounded-xl md:rounded-2xl mb-3 md:mb-4">
              <UserPlus className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold mb-2">Buat Akun Baru</h1>
            <p className="text-green-100 text-sm md:text-base">Bergabunglah dengan kami hari ini</p>
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
                  placeholder="Nama lengkap Anda"
                  value={formData.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10 md:pl-11 h-11 md:h-12 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg md:rounded-xl text-sm md:text-base"
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
                  placeholder="anda@example.com"
                  value={formData.email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10 md:pl-11 h-11 md:h-12 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg md:rounded-xl text-sm md:text-base"
                  autoComplete="email"
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
                  className="pl-10 md:pl-11 pr-10 md:pr-11 h-11 md:h-12 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg md:rounded-xl text-sm md:text-base"
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
                  className={`pl-10 md:pl-11 pr-10 md:pr-11 h-11 md:h-12 border-gray-200 focus:ring-green-500 rounded-lg md:rounded-xl text-sm md:text-base ${
                    formData.confirmPassword && !passwordsMatch ? 'border-red-300 focus:border-red-500' : 'focus:border-green-500'
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

            {/* Register Button - Mobile optimized */}
            <Button 
              type="submit" 
              onClick={handleRegister}
              className="w-full h-11 md:h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg md:rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform active:scale-95 md:hover:scale-105 text-sm md:text-base" 
              disabled={loading || !formData.name || !formData.email || !passwordValidation.isValid || !passwordsMatch}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                  Mendaftar...
                </>
              ) : (
                <>
                  Daftar Sekarang
                  <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                </>
              )}
            </Button>

            {/* Login Link - Mobile friendly */}
            <div className="text-center pt-2">
              <p className="text-gray-600 text-sm md:text-base">
                Sudah punya akun?{' '}
                <Link href="/login">
                <button
                  type="button"
                  className="text-green-600 hover:text-green-700 font-semibold hover:underline"
                >
                  Masuk di sini
                </button></Link>
              </p>
            </div>

            {/* Terms and Conditions - Mobile friendly */}
            {/* <div className="pt-2 text-center">
              <p className="text-xs md:text-sm text-gray-500">
                Dengan mendaftar, Anda menyetujui{' '}
                <button
                  type="button"
                  className="text-green-600 hover:text-green-700 underline"
                  onClick={(): void => console.log('Open terms')}
                >
                  Syarat & Ketentuan
                </button>
                {' '}dan{' '}
                <button
                  type="button"
                  className="text-green-600 hover:text-green-700 underline"
                  onClick={(): void => console.log('Open privacy policy')}
                >
                  Kebijakan Privasi
                </button>
              </p>
            </div> */}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default RegisterForm