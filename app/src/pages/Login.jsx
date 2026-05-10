import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Shield, User, Users } from 'lucide-react';

const Login = () => {
  const [mode, setMode] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('credentials');
  const [loginData, setLoginData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, verifyOtp, parentLogin, parentVerifyOtp } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'parent') {
        const res = await parentLogin(studentId, phone);
        setLoginData({ studentId, phone, otp: res.otp });
        setStep('otp');
      } else {
        const res = await login(email, password);
        setLoginData({ email, otp: res.otp });
        setStep('otp');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'parent') {
        await parentVerifyOtp(loginData.studentId, loginData.phone, otp);
      } else {
        await verifyOtp(loginData.email, otp);
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('credentials');
    setOtp('');
    setError('');
    setLoginData(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <GraduationCap className="w-16 h-16 text-white mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white">College ERP</h1>
          <p className="text-blue-100 mt-1">Login to your account</p>
        </div>

        <div className="p-6">
          {step === 'credentials' && (
            <>
              {/* Mode Selection */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                <button
                  onClick={() => { setMode('admin'); reset(); }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                    mode === 'admin' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-medium">Admin</span>
                </button>
                <button
                  onClick={() => { setMode('teacher'); reset(); }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                    mode === 'teacher' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-medium">Teacher</span>
                </button>
                <button
                  onClick={() => { setMode('parent'); reset(); }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                    mode === 'parent' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-medium">Parent</span>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {mode === 'parent' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="e.g. STU001"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="+91XXXXXXXXXX"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder={mode === 'admin' ? 'admin@college.edu' : 'teacher@college.edu'}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Enter password"
                        required
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Please wait...' : 'Send OTP'}
                </button>
              </form>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
                <p className="font-medium mb-1">Demo credentials:</p>
                <p>Admin: admin@college.edu / admin123</p>
                <p>Teacher: teacher@college.edu / teacher123</p>
                <p>Parent: STU001 / +911234567890</p>
              </div>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Enter OTP</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enter the 6-digit code sent to your registered contact
                </p>
                {loginData?.otp && (
                  <p className="text-sm font-mono bg-gray-100 inline-block px-3 py-1 rounded mt-2">
                    Dev OTP: {loginData.otp}
                  </p>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl tracking-[1em] font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>

              <button
                onClick={reset}
                className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Back to login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
