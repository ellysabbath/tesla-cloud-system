import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { authApi, notificationApi } from '../../api/api';
import type {
  ApiNotificationPrefs,
  ApiPrivacySettings,
} from '../../api/api';
import { useAuth } from '../../context/AuthContext';

type SettingsTab =
  | 'account'
  | 'security'
  | 'notifications'
  | 'appearance'
  | 'privacy';

// ============================================================
// Component
// ============================================================
const Settings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [savedMessage, setSavedMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // ---------- Account form ----------
  const [account, setAccount] = useState({
    fullName: '',
    email: '',
    mobile: '',
    countryCode: '+255',
    region: '',
    city: '',
    education: '',
  });
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // ---------- Security ----------
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactor: false,
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // ---------- Notifications ----------
  const [notifications, setNotifications] = useState({
    emailNews: true,
    emailCourses: true,
    emailExams: true,
    emailCertificates: true,
    smsAlerts: false,
    pushUpdates: true,
  });
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // ---------- Appearance ----------
  const [appearance, setAppearance] = useState({
    theme: 'light' as 'light' | 'dark' | 'system',
    language: 'en' as 'en' | 'sw',
    fontSize: 'medium' as 'small' | 'medium' | 'large',
  });

  // ---------- Privacy ----------
  const [privacy, setPrivacy] = useState({
    showProfile: true,
    showProgress: false,
    showCertificates: true,
    allowMessages: true,
  });
  const [isLoadingPrivacy, setIsLoadingPrivacy] = useState(false);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);

  // ============================================================
  // Prefill account from AuthContext
  // ============================================================
  useEffect(() => {
    if (!user) return;
    setAccount({
      fullName: user.fullName ?? '',
      email: user.email ?? '',
      mobile: user.mobileNumber ?? '',
      countryCode: user.countryCode ?? '+255',
      region: user.region ?? '',
      city: user.currentCity ?? '',
      education: user.educationalBackground ?? '',
    });
  }, [user]);

  // ============================================================
  // Load notification prefs + privacy settings once
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const loadPrefs = async () => {
      setIsLoadingPrefs(true);
      try {
        const res = await notificationApi.getPrefs();
        if (!cancelled && res.success && res.data) {
          const d = res.data as ApiNotificationPrefs;
          setNotifications({
            emailNews: d.email_news,
            emailCourses: d.email_courses,
            emailExams: d.email_exams,
            emailCertificates: d.email_certificates,
            smsAlerts: d.sms_alerts,
            pushUpdates: d.push_updates,
          });
        }
      } catch (err) {
        console.error('Load prefs error:', err);
      } finally {
        if (!cancelled) setIsLoadingPrefs(false);
      }
    };

    const loadPrivacy = async () => {
      setIsLoadingPrivacy(true);
      try {
        const res = await notificationApi.getPrivacy();
        if (!cancelled && res.success && res.data) {
          const d = res.data as ApiPrivacySettings;
          setPrivacy({
            showProfile: d.show_profile,
            showProgress: d.show_progress,
            showCertificates: d.show_certificates,
            allowMessages: d.allow_messages,
          });
        }
      } catch (err) {
        console.error('Load privacy error:', err);
      } finally {
        if (!cancelled) setIsLoadingPrivacy(false);
      }
    };

    loadPrefs();
    loadPrivacy();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // Flash helpers
  // ============================================================
  const flashSaved = (msg = 'Changes saved successfully') => {
    setSavedMessage(msg);
    setErrorMessage('');
    setTimeout(() => setSavedMessage(''), 2500);
  };

  const flashError = (msg: string) => {
    setErrorMessage(msg);
    setSavedMessage('');
    setTimeout(() => setErrorMessage(''), 3500);
  };

  // ============================================================
  // Handlers
  // ============================================================
  const handleAccountChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setAccount({ ...account, [e.target.name]: e.target.value });
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSecurity({
      ...security,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleToggle = (
    group: 'notifications' | 'privacy',
    key: string
  ) => {
    if (group === 'notifications') {
      setNotifications({
        ...notifications,
        [key]: !notifications[key as keyof typeof notifications],
      });
    } else {
      setPrivacy({
        ...privacy,
        [key]: !privacy[key as keyof typeof privacy],
      });
    }
  };

  // ============================================================
  // Save account → PATCH /api/auth/me/
  // ============================================================
  const handleSaveAccount = async () => {
    setIsSavingAccount(true);
    try {
      const res = await authApi.updateProfile({
        fullName: account.fullName.trim(),
        mobileNumber: account.mobile.trim(),
        countryCode: account.countryCode,
        region: account.region.trim(),
        currentCity: account.city.trim(),
        educationalBackground: account.education.trim(),
      });

      if (res.success) {
        await refreshUser();
        flashSaved('Profile updated');
      } else {
        flashError(res.message || 'Could not update profile.');
      }
    } catch (err) {
      console.error('Save account error:', err);
      flashError('Could not reach the server.');
    } finally {
      setIsSavingAccount(false);
    }
  };

  // ============================================================
  // Change password → POST /api/auth/change-password/
  // ============================================================
  const handleChangePassword = async () => {
    if (!security.currentPassword || !security.newPassword) {
      flashError('All password fields are required.');
      return;
    }
    if (security.newPassword.length < 6) {
      flashError('New password must be at least 6 characters.');
      return;
    }
    if (security.newPassword !== security.confirmPassword) {
      flashError('Passwords do not match.');
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await authApi.changePassword({
        currentPassword: security.currentPassword,
        newPassword: security.newPassword,
        confirmPassword: security.confirmPassword,
      });

      if (res.success) {
        setSecurity({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          twoFactor: security.twoFactor,
        });
        flashSaved('Password updated');
      } else {
        flashError(res.message || 'Could not update password.');
      }
    } catch (err) {
      console.error('Change password error:', err);
      flashError('Could not reach the server.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // ============================================================
  // Save notification prefs → PATCH /api/notifications/prefs/
  // ============================================================
  const handleSaveNotificationPrefs = async () => {
    setIsSavingPrefs(true);
    try {
      const res = await notificationApi.updatePrefs({
        email_news: notifications.emailNews,
        email_courses: notifications.emailCourses,
        email_exams: notifications.emailExams,
        email_certificates: notifications.emailCertificates,
        sms_alerts: notifications.smsAlerts,
        push_updates: notifications.pushUpdates,
      });
      if (res.success) flashSaved('Notification preferences saved');
      else flashError(res.message || 'Could not save preferences.');
    } catch (err) {
      console.error('Save prefs error:', err);
      flashError('Could not reach the server.');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  // ============================================================
  // Save privacy → PATCH /api/notifications/privacy/
  // ============================================================
  const handleSavePrivacy = async () => {
    setIsSavingPrivacy(true);
    try {
      const res = await notificationApi.updatePrivacy({
        show_profile: privacy.showProfile,
        show_progress: privacy.showProgress,
        show_certificates: privacy.showCertificates,
        allow_messages: privacy.allowMessages,
      });
      if (res.success) flashSaved('Privacy settings saved');
      else flashError(res.message || 'Could not save privacy settings.');
    } catch (err) {
      console.error('Save privacy error:', err);
      flashError('Could not reach the server.');
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  // ============================================================
  // Tabs
  // ============================================================
  const tabs: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
    {
      key: 'account',
      label: 'Account',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      key: 'security',
      label: 'Security',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      key: 'appearance',
      label: 'Appearance',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
    },
    {
      key: 'privacy',
      label: 'Privacy',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and privacy</p>
      </div>

      {savedMessage && (
        <div className="fixed top-20 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {savedMessage}
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-20 right-6 z-50 bg-red-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
          </svg>
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <Card className="p-2 lg:sticky lg:top-24">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-colors
                    ${activeTab === tab.key
                      ? 'bg-black text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <span className={activeTab === tab.key ? 'text-white' : 'text-gray-500'}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </Card>
        </aside>

        <div className="lg:col-span-3 space-y-6">
          {/* ---------- ACCOUNT ---------- */}
          {activeTab === 'account' && (
            <>
              <Card className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Update your personal details
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    name="fullName"
                    value={account.fullName}
                    onChange={handleAccountChange}
                  />
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={account.email}
                    onChange={handleAccountChange}
                    disabled
                  />
                  <Input
                    label="Mobile Number"
                    name="mobile"
                    value={account.mobile}
                    onChange={handleAccountChange}
                  />
                  <Input
                    label="Region"
                    name="region"
                    value={account.region}
                    onChange={handleAccountChange}
                  />
                  <Input
                    label="Current City"
                    name="city"
                    value={account.city}
                    onChange={handleAccountChange}
                  />
                  <Input
                    label="Educational Background"
                    name="education"
                    value={account.education}
                    onChange={handleAccountChange}
                  />
                </div>

                <div className="mt-6 flex gap-3">
                  <Button onClick={handleSaveAccount} disabled={isSavingAccount}>
                    {isSavingAccount ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (!user) return;
                      setAccount({
                        fullName: user.fullName ?? '',
                        email: user.email ?? '',
                        mobile: user.mobileNumber ?? '',
                        countryCode: user.countryCode ?? '+255',
                        region: user.region ?? '',
                        city: user.currentCity ?? '',
                        education: user.educationalBackground ?? '',
                      });
                    }}
                    disabled={isSavingAccount}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>

              <Card className="p-6 border-l-4 border-red-500">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Danger Zone
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Once you delete your account, all your data will be permanently removed.
                </p>
                <Button variant="danger" disabled>
                  Delete Account
                </Button>
              </Card>
            </>
          )}

          {/* ---------- SECURITY ---------- */}
          {activeTab === 'security' && (
            <>
              <Card className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Use a strong password to keep your account secure
                  </p>
                </div>

                <div className="space-y-4 max-w-md">
                  <Input
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={security.currentPassword}
                    onChange={handleSecurityChange}
                    placeholder="Enter current password"
                  />
                  <Input
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={security.newPassword}
                    onChange={handleSecurityChange}
                    placeholder="Min 6 characters"
                  />
                  <Input
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    value={security.confirmPassword}
                    onChange={handleSecurityChange}
                    placeholder="Re-enter new password"
                  />
                </div>

                <div className="mt-6">
                  <Button onClick={handleChangePassword} disabled={isSavingPassword}>
                    {isSavingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Two-Factor Authentication
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="twoFactor"
                      checked={security.twoFactor}
                      onChange={handleSecurityChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-black transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                  </label>
                </div>
              </Card>
            </>
          )}

          {/* ---------- NOTIFICATIONS ---------- */}
          {activeTab === 'notifications' && (
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Choose how you want to be notified
                </p>
              </div>

              {isLoadingPrefs ? (
                <div className="py-8 text-center text-gray-400 text-sm">
                  Loading preferences...
                </div>
              ) : (
                <div className="space-y-1">
                  {[
                    { key: 'emailNews', label: 'News & Updates', desc: 'Receive news about Tesla Cloud Institute' },
                    { key: 'emailCourses', label: 'Course Updates', desc: 'New lessons, materials and assignments' },
                    { key: 'emailExams', label: 'Exam Results', desc: 'Get notified when your exam is marked' },
                    { key: 'emailCertificates', label: 'Certificates', desc: 'When you earn a new certificate' },
                    { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Important alerts via SMS' },
                    { key: 'pushUpdates', label: 'Push Notifications', desc: 'Browser push notifications' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                    >
                      <div className="pr-4">
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={notifications[item.key as keyof typeof notifications]}
                          onChange={() => handleToggle('notifications', item.key)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-black transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                      </label>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6">
                <Button
                  onClick={handleSaveNotificationPrefs}
                  disabled={isSavingPrefs || isLoadingPrefs}
                >
                  {isSavingPrefs ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </Card>
          )}

          {/* ---------- APPEARANCE ---------- */}
          {activeTab === 'appearance' && (
            <>
              <Card className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Theme</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Choose how Tesla Cloud looks to you
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { value: 'light', label: 'Light', preview: 'bg-white border-gray-300' },
                    { value: 'dark', label: 'Dark', preview: 'bg-gray-900 border-gray-700' },
                    { value: 'system', label: 'System', preview: 'bg-gradient-to-r from-white to-gray-900 border-gray-400' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        setAppearance({ ...appearance, theme: opt.value as typeof appearance.theme })
                      }
                      className={`
                        p-4 rounded-lg border-2 transition-all text-left
                        ${appearance.theme === opt.value
                          ? 'border-black ring-2 ring-black ring-opacity-10'
                          : 'border-gray-200 hover:border-gray-400'
                        }
                      `}
                    >
                      <div className={`h-20 rounded mb-3 ${opt.preview}`} />
                      <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Language</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                  {[
                    { value: 'en', label: 'English' },
                    { value: 'sw', label: 'Kiswahili' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        setAppearance({ ...appearance, language: opt.value as typeof appearance.language })
                      }
                      className={`
                        p-3 rounded-lg border-2 text-sm font-medium transition-all
                        ${appearance.language === opt.value
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 text-gray-700 hover:border-gray-400'
                        }
                      `}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Font Size</h2>
                <div className="flex gap-3">
                  {[
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        setAppearance({ ...appearance, fontSize: opt.value as typeof appearance.fontSize })
                      }
                      className={`
                        px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all
                        ${appearance.fontSize === opt.value
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 text-gray-700 hover:border-gray-400'
                        }
                      `}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="mt-6">
                  <Button onClick={() => flashSaved('Appearance saved')}>
                    Save Appearance
                  </Button>
                </div>
              </Card>
            </>
          )}

          {/* ---------- PRIVACY ---------- */}
          {activeTab === 'privacy' && (
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Privacy Settings</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Control what others can see about you
                </p>
              </div>

              {isLoadingPrivacy ? (
                <div className="py-8 text-center text-gray-400 text-sm">
                  Loading privacy settings...
                </div>
              ) : (
                <div className="space-y-1">
                  {[
                    { key: 'showProfile', label: 'Public Profile', desc: 'Allow other students to view your profile' },
                    { key: 'showProgress', label: 'Show Progress', desc: 'Display your course progress publicly' },
                    { key: 'showCertificates', label: 'Show Certificates', desc: 'Display earned certificates on your profile' },
                    { key: 'allowMessages', label: 'Allow Messages', desc: 'Let other students send you messages' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                    >
                      <div className="pr-4">
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={privacy[item.key as keyof typeof privacy]}
                          onChange={() => handleToggle('privacy', item.key)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-black transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                      </label>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6">
                <Button
                  onClick={handleSavePrivacy}
                  disabled={isSavingPrivacy || isLoadingPrivacy}
                >
                  {isSavingPrivacy ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;