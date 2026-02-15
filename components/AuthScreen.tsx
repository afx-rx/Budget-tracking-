import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  CheckCircle2
} from 'lucide-react';

interface AuthScreenProps {
  onGuestLogin: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onGuestLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    upper: false,
    number: false,
    special: false
  });

  useEffect(() => {
    setPasswordCriteria({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  }, [password]);

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  const getFriendlyErrorMessage = (err: any) => {
    const message = err.message?.toLowerCase() || "";
    if (message.includes("rate limit") || message.includes("too many requests") || err.status === 429) {
      if (message.includes("email")) {
        return "Too many attempts. Please check your email for a confirmation link or wait 60 seconds.";
      }
      return "Too many requests. Please wait a minute before trying again.";
    }
    if (message.includes("invalid login credentials")) {
      return "Invalid email or password. Please try again.";
    }
    if (message.includes("user already registered")) {
      return "This email is already registered. Please sign in instead.";
    }
    return err.message || "An error occurred during authentication.";
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!isLogin) {
         // Sign Up Logic
         setTouchedPassword(true);
         if (!isPasswordValid) {
           setError("Please meet all password requirements.");
           setLoading(false);
           return;
         }
         if (password !== confirmPassword) {
           setError("Passwords do not match.");
           setLoading(false);
           return;
         }

         const { error: signUpError } = await supabase.auth.signUp({
           email,
           password,
           options: {
             data: {
               full_name: fullName,
               gender: gender
             }
           }
         });

         if (signUpError) throw signUpError;
         
         // If successful but session is null, it usually means email confirmation is required
         const { data } = await supabase.auth.getSession();
         if (!data.session) {
            setVerificationSent(true);
            setLoading(false);
            return;
         }

      } else {
        // Sign In Logic
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="w-full max-w-md mx-auto p-6 flex flex-col justify-center min-h-[80vh] animate-in fade-in zoom-in duration-500">
        <div className="bg-card border border-slate-700 p-8 rounded-3xl shadow-2xl shadow-indigo-500/10 text-center">
          <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail size={40} />
          </div>
          <h2 className="text-2xl font-black text-white mb-4">Check your email</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            We've sent a confirmation link to <span className="text-white font-medium">{email}</span>. 
            <br/>Please verify your email to access your account.
          </p>
          <button
            onClick={() => {
              setVerificationSent(false);
              setIsLogin(true);
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all border border-slate-700"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 flex flex-col justify-center min-h-[80vh] animate-in fade-in duration-700">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-black text-white mb-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-slate-400">
          {isLogin ? 'Enter your details to access your budget' : 'Start your financial journey with Budgy'}
        </p>
      </div>

      <div className="bg-card border border-slate-700 p-6 rounded-3xl shadow-2xl shadow-indigo-500/10">
        <form onSubmit={handleAuth} className="space-y-4">
          
          {error && (
            <div className={`p-3 rounded-xl flex items-start gap-3 text-sm animate-in slide-in-from-top-2 ${
              error.includes("Account created") 
                ? "bg-success/10 border border-success/20 text-success" 
                : "bg-danger/10 border border-danger/20 text-danger"
            }`}>
              {error.includes("Account created") ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
              <span>{error}</span>
            </div>
          )}

          {!isLogin && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase ml-1">Gender</label>
                <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setGender('Male')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${gender === 'Male' ? 'bg-primary text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('Female')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${gender === 'Female' ? 'bg-pink-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Female
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 uppercase ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 uppercase ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (!isLogin) setTouchedPassword(true);
                }}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-11 pr-11 text-white focus:outline-none focus:border-primary transition-all"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && touchedPassword && (
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-2">
              <p className="text-xs text-slate-400 font-medium mb-2">Password must contain:</p>
              <div className="grid grid-cols-1 gap-1.5">
                <div className={`flex items-center gap-2 text-xs ${passwordCriteria.length ? 'text-success' : 'text-slate-500'}`}>
                   {passwordCriteria.length ? <CheckCircle2 size={12} /> : <div className="w-3 h-3 rounded-full border border-slate-600" />}
                   At least 8 characters
                </div>
                <div className={`flex items-center gap-2 text-xs ${passwordCriteria.upper ? 'text-success' : 'text-slate-500'}`}>
                   {passwordCriteria.upper ? <CheckCircle2 size={12} /> : <div className="w-3 h-3 rounded-full border border-slate-600" />}
                   One upper case letter
                </div>
                <div className={`flex items-center gap-2 text-xs ${passwordCriteria.number ? 'text-success' : 'text-slate-500'}`}>
                   {passwordCriteria.number ? <CheckCircle2 size={12} /> : <div className="w-3 h-3 rounded-full border border-slate-600" />}
                   One number
                </div>
                <div className={`flex items-center gap-2 text-xs ${passwordCriteria.special ? 'text-success' : 'text-slate-500'}`}>
                   {passwordCriteria.special ? <CheckCircle2 size={12} /> : <div className="w-3 h-3 rounded-full border border-slate-600" />}
                   One special character (!@#$...)
                </div>
              </div>
            </div>
          )}

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase ml-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full bg-slate-800 border rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none transition-all ${
                     confirmPassword && confirmPassword !== password ? 'border-danger focus:border-danger' : 'border-slate-700 focus:border-primary'
                  }`}
                />
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-danger ml-1">Passwords do not match</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-slate-500">Or continue without account</span>
          </div>
        </div>

        <button
          onClick={onGuestLogin}
          className="w-full bg-slate-800 text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-700 hover:text-white transition-colors flex items-center justify-center gap-2 border border-slate-700"
        >
          <User size={20} />
          Continue as Guest
        </button>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setTouchedPassword(false);
              }}
              className="text-primary font-bold ml-1 hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};