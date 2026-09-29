import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import {
  authApi,
  fileToBase64,
  getAccessToken,
  getMyRegistrationVideo,
  type RegistrationVideo,
} from '../../api/api';

// ============================================================
// Types
// ============================================================
interface ApiUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'student' | 'tutor' | 'admin' | 'super-admin' | 'moderator';
  status: 'active' | 'suspended' | 'pending';
  isVerified: boolean;
  profilePicture: string | null;
  countryCode: string;
  mobileNumber: string;
  region: string | null;
  currentCity: string | null;
  dateOfBirth: { year: string; month: string; day: string } | null;
  educationalBackground: string | null;
  createdAt: string;
}

const MyProfile: React.FC = () => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [video, setVideo] = useState<RegistrationVideo | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [error, setError] = useState('');

  // ---------- Profile picture state (new) ----------
  const [isSavingPicture, setIsSavingPicture] = useState(false);
  const [pictureError, setPictureError] = useState('');
  const [pictureSuccess, setPictureSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ============================================================
  // 1. Load the user
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!getAccessToken()) {
        setError('You are not signed in.');
        setIsLoadingUser(false);
        return;
      }

      try {
        const res = await authApi.me();
        if (cancelled) return;

        if (res.success && res.data) {
          setUser(res.data as ApiUser);
        } else {
          setError(res.message || 'Could not load your profile.');
        }
      } catch (err) {
        console.error('Profile load error:', err);
        if (!cancelled) {
          setError('Could not reach the server. Please try again.');
        }
      } finally {
        if (!cancelled) setIsLoadingUser(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // 2. Load the registration video
  // ============================================================
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setIsLoadingVideo(true);

    (async () => {
      try {
        const v = await getMyRegistrationVideo();
        if (!cancelled) setVideo(v);
      } catch (err) {
        console.error('Video fetch error:', err);
      } finally {
        if (!cancelled) setIsLoadingVideo(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // ============================================================
  // 3. Profile picture — picker + upload (new)
  // ============================================================
  const openFilePicker = () => {
    setPictureError('');
    setPictureSuccess('');
    fileInputRef.current?.click();
  };

  const handleFilePicked = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    // Reset the input so picking the same file twice still fires.
    e.target.value = '';
    if (!file) return;

    // Basic client-side validation.
    if (!file.type.startsWith('image/')) {
      setPictureError('Please choose an image file.');
      return;
    }
    const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
    if (file.size > MAX_BYTES) {
      setPictureError('Image is too large. Please choose a file under 2 MB.');
      return;
    }

    setIsSavingPicture(true);
    setPictureError('');
    setPictureSuccess('');

    try {
      const base64 = await fileToBase64(file);
      const res = await authApi.updateProfile({
        profilePicture: base64,
      });

      if (res.success) {
        // Optimistically update the displayed image without refetching.
        setUser((prev) =>
          prev ? { ...prev, profilePicture: base64 } : prev
        );
        setPictureSuccess('Profile picture updated.');
        setTimeout(() => setPictureSuccess(''), 2500);
      } else {
        setPictureError(
          res.message || 'Could not update the profile picture.'
        );
      }
    } catch (err) {
      console.error('Profile picture update error:', err);
      setPictureError('Could not reach the server.');
    } finally {
      setIsSavingPicture(false);
    }
  };

  const handleRemovePicture = async () => {
    if (!user?.profilePicture) return;
    if (
      !window.confirm(
        'Remove your profile picture? You can always upload another one.'
      )
    ) {
      return;
    }

    setIsSavingPicture(true);
    setPictureError('');
    setPictureSuccess('');

    try {
      const res = await authApi.updateProfile({ profilePicture: null });
      if (res.success) {
        setUser((prev) =>
          prev ? { ...prev, profilePicture: null } : prev
        );
        setPictureSuccess('Profile picture removed.');
        setTimeout(() => setPictureSuccess(''), 2500);
      } else {
        setPictureError(
          res.message || 'Could not remove the profile picture.'
        );
      }
    } catch (err) {
      console.error('Profile picture remove error:', err);
      setPictureError('Could not reach the server.');
    } finally {
      setIsSavingPicture(false);
    }
  };

  // ============================================================
  // Helpers
  // ============================================================
  const initials = (name: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[parts.length - 1].charAt(0).toUpperCase()
    );
  };

  const formatBytes = (n: number | null): string => {
    if (!n || n <= 0) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let v = n;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i += 1;
    }
    return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
  };

  const formatDateOfBirth = (dob: ApiUser['dateOfBirth']): string => {
    if (!dob?.year || !dob?.month || !dob?.day) return '—';
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const m = parseInt(dob.month, 10);
    return `${dob.day} ${monthNames[m - 1] ?? dob.month} ${dob.year}`;
  };

  // ============================================================
  // Loading state
  // ============================================================
  if (isLoadingUser) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My Profile</h1>
          <p className="text-gray-600">Manage your personal information</p>
        </div>

        <Card className="p-6 animate-pulse">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-200" />
            <div className="flex-1 w-full">
              <div className="h-5 bg-gray-200 rounded w-48 mb-2 mx-auto sm:mx-0" />
              <div className="h-4 bg-gray-200 rounded w-64 mb-2 mx-auto sm:mx-0" />
              <div className="h-3 bg-gray-200 rounded w-40 mx-auto sm:mx-0" />
            </div>
          </div>
        </Card>

        <Card className="p-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-40" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // ============================================================
  // Error state
  // ============================================================
  if (error || !user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My Profile</h1>
          <p className="text-gray-600">Manage your personal information</p>
        </div>

        <Card className="p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Cannot load your profile
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {error || 'Something went wrong.'}
          </p>
          <Link to="/signin">
            <Button>Back to Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // ============================================================
  // Loaded state
  // ============================================================
  const fields = [
    { label: 'Full Name', value: user.fullName || '—' },
    { label: 'Username', value: user.username || '—' },
    { label: 'Email', value: user.email || '—' },
    {
      label: 'Mobile Number',
      value:
        `${user.countryCode || ''} ${user.mobileNumber || ''}`.trim() || '—',
    },
    { label: 'Region', value: user.region || '—' },
    { label: 'Current City', value: user.currentCity || '—' },
    { label: 'Date of Birth', value: formatDateOfBirth(user.dateOfBirth) },
    {
      label: 'Educational Background',
      value: user.educationalBackground || '—',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Profile</h1>
        <p className="text-gray-600">Manage your personal information</p>
      </div>

      {/* ============================================================
          Header card — with profile picture upload
      ============================================================ */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* ---------- Avatar with edit button (new) ---------- */}
          <div className="relative shrink-0 group">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.fullName}
                className="w-24 h-24 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-black text-white flex items-center justify-center text-3xl font-bold">
                {initials(user.fullName)}
              </div>
            )}

            {/* Camera overlay button */}
            <button
              type="button"
              onClick={openFilePicker}
              disabled={isSavingPicture}
              title="Change profile picture"
              className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40"
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h1.5l1-2h9l1 2H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            </button>

            {/* Saving indicator */}
            {isSavingPicture && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFilePicked}
            />
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">
              {user.fullName}
            </h2>
            <p className="text-gray-600 truncate">{user.email}</p>
            <p className="text-sm text-gray-500 mt-1">
              Username: <span className="font-mono">{user.username}</span>
            </p>

            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  user.isVerified
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {user.isVerified ? '✓ Verified' : '⏳ Unverified'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 capitalize">
                {user.role.replace('-', ' ')}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${
                  user.status === 'active'
                    ? 'bg-blue-100 text-blue-700'
                    : user.status === 'suspended'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {user.status}
              </span>
            </div>

            {/* ---------- Picture action buttons + messages (new) ---------- */}
            <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
              <Button
                variant="outline"
                size="small"
                onClick={openFilePicker}
                disabled={isSavingPicture}
              >
                {isSavingPicture
                  ? 'Saving...'
                  : user.profilePicture
                  ? 'Change picture'
                  : 'Upload picture'}
              </Button>
              {user.profilePicture && (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={handleRemovePicture}
                  disabled={isSavingPicture}
                >
                  Remove
                </Button>
              )}
            </div>

            {pictureError && (
              <p className="text-xs text-red-600 mt-2">{pictureError}</p>
            )}
            {pictureSuccess && (
              <p className="text-xs text-green-600 mt-2">
                {pictureSuccess}
              </p>
            )}
          </div>

          <Link to="/settings">
            <Button variant="outline">Edit Profile</Button>
          </Link>
        </div>
      </Card>

      {/* ============================================================
          Registration video — unchanged
      ============================================================ */}
      {isLoadingVideo && (
        <Card className="p-5">
          <div className="flex flex-col md:flex-row gap-5 items-start animate-pulse">
            <div className="w-full md:w-64 shrink-0 aspect-video bg-gray-200 rounded-lg" />
            <div className="flex-1 w-full">
              <div className="h-4 bg-gray-200 rounded w-48 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-64 mb-3" />
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {!isLoadingVideo && video?.data && (
        <Card className="p-5">
          <div className="flex flex-col md:flex-row gap-5 items-start">
            <div className="w-full md:w-64 shrink-0">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  src={video.data}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  controlsList="nodownload"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest bg-red-600/90 text-white px-1.5 py-0.5 rounded-full pointer-events-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  ID Video
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1">
                Registration Recording
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                The short video captured during your sign-up for identity
                verification. It plays automatically, muted.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-gray-50 rounded-lg py-2 px-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">
                    Recorded
                  </p>
                  <p className="font-medium text-gray-900">
                    {new Date(video.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg py-2 px-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">
                    Format
                  </p>
                  <p className="font-medium text-gray-900">
                    {video.mimeType?.split('/')[1]?.toUpperCase() || 'WEBM'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg py-2 px-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">
                    Size
                  </p>
                  <p className="font-medium text-gray-900">
                    {formatBytes(video.fileSize)}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 mt-3">
                Video is stored securely with your account.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ============================================================
          Personal Information — unchanged
      ============================================================ */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={field.label} className="border-b border-gray-100 pb-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                {field.label}
              </p>
              <p className="text-sm text-gray-900 break-words">
                {field.value}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default MyProfile;