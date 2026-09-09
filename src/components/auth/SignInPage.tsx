'use client';

import React, { useState } from 'react';
import { useRole, UserRole, ROLE_DEFINITIONS } from '@/lib/context/RoleContext';
import {
  Waves,
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  User,
  ChevronLeft,
  Check
} from 'lucide-react';

export const SignInPage: React.FC = () => {
  const { login } = useRole();

  // Auth flow steps: 'role-selection' | 'auth-form'
  const [authStep, setAuthStep] = useState<'role-selection' | 'auth-form'>('role-selection');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Selected Role
  const [selectedRole, setSelectedRole] = useState<UserRole>('FISHERMAN');

  // Form fields
  const [name, setName] = useState('Captain Rajesh Varma');
  const [email, setEmail] = useState('rajesh.varma@fisheries.in');
  const [password, setPassword] = useState('••••••••••••');
  const [confirmPassword, setConfirmPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleList: UserRole[] = [
    'FISHERMAN',
    'RESEARCHER',
    'COASTAL_AUTHORITY',
    'DISASTER_MANAGEMENT',
    'MARITIME_OPERATOR',
  ];

  const handleContinueToAuth = () => {
    // Populate realistic default credentials based on role
    if (selectedRole === 'FISHERMAN') {
      setName('Captain Rajesh Varma');
      setEmail('rajesh.varma@fisheries.in');
    } else if (selectedRole === 'RESEARCHER') {
      setName('Dr. Ananya Nair');
      setEmail('ananya.nair@ocean-institute.res.in');
    } else if (selectedRole === 'COASTAL_AUTHORITY') {
      setName('Commander Arun Mehta');
      setEmail('arun.mehta@coastal-board.gov.in');
    } else if (selectedRole === 'DISASTER_MANAGEMENT') {
      setName('Officer Priya Sharma');
      setEmail('priya.sharma@sdma.gov.in');
    } else if (selectedRole === 'MARITIME_OPERATOR') {
      setName('Capt. Vikramaditya Rathore');
      setEmail('v.rathore@indian-shipping.com');
    }
    setAuthStep('auth-form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      login({
        name: name || ROLE_DEFINITIONS[selectedRole].title,
        email: email || 'user@orca-marine.in',
        role: selectedRole,
        organization: selectedRole === 'FISHERMAN' ? 'Coastal Fisheries Cooperative' : 'Marine Operations Directorate',
      });
      setIsSubmitting(false);
    }, 300);
  };

  const currentRoleInfo = ROLE_DEFINITIONS[selectedRole];

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 antialiased">
      <div className="max-w-5xl w-full mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">

        {/* Left Interactive Panel: Role Selection / Auth Form (~60% width) */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
          <div>
            {/* Top Brand & Step Indicator */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-sky-400 flex items-center justify-center shadow-xs">
                  <Waves className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base tracking-tight text-slate-900">
                      ORCA
                    </span>
                    {/* <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                      OPERATIONS
                    </span> */}
                  </div>
                </div>
              </div>

              {/* Step indicator */}
              <div className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 whitespace-nowrap shrink-0">
                {authStep === 'role-selection' ? 'Step 1 of 2' : 'Step 2 of 2'}
              </div>
            </div>

            {/* ---------------- STEP 1: ROLE SELECTION ---------------- */}
            {authStep === 'role-selection' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Select operational role
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Choose your operating profile to access relevant marine workflows
                  </p>
                </div>

                {/* Selectable Role Cards */}
                <div className="space-y-2">
                  {roleList.map((r) => {
                    const info = ROLE_DEFINITIONS[r];
                    const isSelected = selectedRole === r;

                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRole(r)}
                        className={`w-full text-left p-3 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 group ${isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600/30'
                          : 'border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300'
                          }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="text-xl w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                            {info.icon}
                          </span>
                          <div className="min-w-0">
                            <span className={`text-xs sm:text-sm font-bold block truncate ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                              {info.title}
                            </span>
                            <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">
                              {info.tagline}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 pr-1">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-slate-300 group-hover:border-slate-400 bg-white" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Primary Continue Button */}
                <button
                  type="button"
                  onClick={handleContinueToAuth}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer mt-4"
                >
                  <span>Continue as {currentRoleInfo.title}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ---------------- STEP 2: SIGN IN / SIGN UP ---------------- */}
            {authStep === 'auth-form' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Back to Role Selection Button */}
                <button
                  type="button"
                  onClick={() => setAuthStep('role-selection')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Change role (currently: {currentRoleInfo.title})</span>
                </button>

                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {authMode === 'signin' ? 'Sign in to workspace' : 'Create operational account'}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    {authMode === 'signin'
                      ? `Access console as ${currentRoleInfo.title}`
                      : `Setup credentials for ${currentRoleInfo.title}`}
                  </p>
                </div>

                {/* Selected Role Context Pill */}
                <div className="p-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{currentRoleInfo.icon}</span>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block leading-tight">
                        {currentRoleInfo.title}
                      </span>
                      <span className="text-[11px] text-slate-500 block leading-tight">
                        {currentRoleInfo.tagline}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthStep('role-selection')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    Change
                  </button>
                </div>

                {/* Sign In / Sign Up Tabs */}
                <div className="flex p-0.5 bg-slate-100 rounded-xl text-xs font-semibold border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${authMode === 'signin'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${authMode === 'signup'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Auth Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                          placeholder="Captain Rajesh Varma"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email or Operational ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                        placeholder="rajesh.varma@fisheries.in"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                        placeholder="••••••••••••"
                      />
                    </div>
                  </div>

                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                          placeholder="••••••••••••"
                        />
                      </div>
                    </div>
                  )}

                  {authMode === 'signin' && (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                        />
                        <span>Remember credentials</span>
                      </label>
                      <a href="#" className="font-semibold text-blue-600 hover:text-blue-700">
                        Forgot Password?
                      </a>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50 mt-2 cursor-pointer"
                  >
                    <span>{isSubmitting ? 'Authenticating...' : authMode === 'signin' ? `Sign In as ${currentRoleInfo.title}` : `Create Account as ${currentRoleInfo.title}`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Secondary Switch */}
                <div className="text-center text-xs text-slate-500 pt-1">
                  {authMode === 'signin' ? (
                    <p>
                      Need a new profile?{' '}
                      <button
                        type="button"
                        onClick={() => setAuthMode('signup')}
                        className="font-bold text-blue-600 hover:underline"
                      >
                        Sign Up
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already registered?{' '}
                      <button
                        type="button"
                        onClick={() => setAuthMode('signin')}
                        className="font-bold text-blue-600 hover:underline"
                      >
                        Sign In
                      </button>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Notice */}
          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Role-Based Access Control
            </span>
            <span>Indian EEZ Marine Platform</span>
          </div>
        </div>

        {/* Right Marine Brand & Capability Panel (~40% width) */}
        <div className="hidden lg:flex lg:col-span-5 bg-[#0a1124] border-l border-slate-800/80 p-8 sm:p-10 flex-col justify-between text-white relative">
          {/* Header Brand Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase font-mono">
                Marine Intelligence Platform
              </span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-white font-sans">
              ORCA
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-normal leading-relaxed">
              Real-time marine intelligence for safer decisions.
            </p>
          </div>

          {/* Capabilities List (Clean vertical layout) */}
          <div className="my-8 space-y-5">
            <div className="flex items-start gap-4">
              <span className="font-mono text-xs font-bold text-sky-400/90 pt-0.5 select-none">
                01
              </span>
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-slate-100">
                  Live Marine Conditions
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                  Weather, ocean and environmental awareness
                </p>
              </div>
            </div>

            <div className="h-px bg-slate-800/80" />

            <div className="flex items-start gap-4">
              <span className="font-mono text-xs font-bold text-sky-400/90 pt-0.5 select-none">
                02
              </span>
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-slate-100">
                  Risk &amp; Hazard Intelligence
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                  Clear safety assessment and hazard awareness
                </p>
              </div>
            </div>

            <div className="h-px bg-slate-800/80" />

            <div className="flex items-start gap-4">
              <span className="font-mono text-xs font-bold text-sky-400/90 pt-0.5 select-none">
                03
              </span>
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-slate-100">
                  Route &amp; Coastal Intelligence
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                  Better operational awareness for marine users
                </p>
              </div>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="text-[11px] text-slate-500 pt-6 border-t border-slate-800/80 flex items-center justify-between font-mono">
            {/* <span>OPERATIONAL ACCESS</span> */}
            {/* <span>SECURE SESSION</span> */}
          </div>
        </div>

      </div>
    </div>
  );
};
