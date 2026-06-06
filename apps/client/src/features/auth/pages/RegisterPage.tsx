import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema, type RegisterInput } from '@vendorbridge/shared';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { Lock, Mail, User, ArrowRight, Boxes } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { role: 'PROCUREMENT_OFFICER' },
  });

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/auth/register', data);
      const { user, accessToken, refreshToken } = response.data.data;
      setAuth(user, accessToken, refreshToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-6 py-12" id="register-page">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
            <Boxes className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-neutral-900">VendorBridge</span>
        </div>

        <div className="card p-8">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Create account</h2>
          <p className="text-neutral-500 mb-6">Join VendorBridge to manage procurement</p>

          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="reg-name" className="label mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input {...register('name')} type="text" id="reg-name" placeholder="John Doe" className="input pl-10" />
              </div>
              {errors.name && <p className="text-danger-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="reg-email" className="label mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input {...register('email')} type="email" id="reg-email" placeholder="you@company.com" className="input pl-10" />
              </div>
              {errors.email && <p className="text-danger-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="reg-password" className="label mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input {...register('password')} type="password" id="reg-password" placeholder="Min 8 chars, mixed case + special" className="input pl-10" />
              </div>
              {errors.password && <p className="text-danger-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="reg-role" className="label mb-1.5 block">Role</label>
              <select {...register('role')} id="reg-role" className="input">
                <option value="PROCUREMENT_OFFICER">Procurement Officer</option>
                <option value="MANAGER">Manager</option>
                <option value="VENDOR">Vendor</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full" id="register-submit">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
