import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, type LoginInput } from '@vendorbridge/shared';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { Lock, Mail, ArrowRight, Boxes } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/auth/login', data);
      const { user, accessToken, refreshToken } = response.data.data;
      setAuth(user, accessToken, refreshToken);
      // Role-based redirect
      if (user.role === 'VENDOR') {
        navigate('/vendor/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.error?.message;
      if (status === 429) {
        setError('Too many login attempts. Please wait a minute and try again.');
      } else if (status === 401) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (!err.response) {
        setError('Cannot connect to the server. Please check that the backend is running.');
      } else {
        setError(serverMsg || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" id="login-page">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Boxes className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold tracking-tight">VendorBridge</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Procurement<br />made simple.
          </h1>
          <p className="text-lg text-blue-100 max-w-md leading-relaxed">
            Streamline vendor management, RFQ workflows, quotation comparison, and purchase orders — all in one platform.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { label: 'Vendors', value: '500+' },
              { label: 'POs Generated', value: '12K' },
              { label: 'Saved Time', value: '60%' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-blue-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900">VendorBridge</span>
          </div>

          <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Welcome back</h2>
          <p className="text-neutral-500 mb-8">Sign in to your account to continue</p>

          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg mb-6 text-sm animate-slide-down" id="login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="email" className="label mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  placeholder="you@company.com"
                  className="input pl-10"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-danger-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="label mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  {...register('password')}
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  className="input pl-10"
                  autoComplete="current-password"
                />
              </div>
              {errors.password && <p className="text-danger-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
              id="login-submit"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-200">
            <p className="text-xs text-neutral-400 text-center mb-3">Demo credentials</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { role: 'Admin', email: 'admin@vendorbridge.com' },
                { role: 'Officer', email: 'officer@vendorbridge.com' },
                { role: 'Manager', email: 'manager@vendorbridge.com' },
                { role: 'Vendor', email: 'vendor1@acme.com' },
              ].map((cred) => (
                <div key={cred.role} className="bg-neutral-50 rounded-lg px-3 py-2">
                  <span className="font-medium text-neutral-700">{cred.role}</span>
                  <br />
                  <span className="text-neutral-400">{cred.email}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
