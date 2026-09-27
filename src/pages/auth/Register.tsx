import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import type { RegisterData } from '../../types';
import { authApi, fileToBase64, getDeviceName, getIpAddress } from '../../api/api';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [profilePreview, setProfilePreview] = useState<string>('');

  // ---------- Video recording state ----------
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [cameraStatus, setCameraStatus] = useState<
    'idle' | 'requesting' | 'recording' | 'done' | 'denied' | 'error'
  >('idle');
  const [countdown, setCountdown] = useState(5);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');

  const [formData, setFormData] = useState<RegisterData>({
    profilePicture: null,
    fullName: '',
    countryCode: '+255',
    mobileNumber: '',
    email: '',
    region: '',
    currentCity: '',
    dateOfBirth: { year: '', month: '', day: '' },
    educationalBackground: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });

  const countryCodes = [
    { code: '+255', country: 'Tanzania' },
    { code: '+254', country: 'Kenya' },
    { code: '+256', country: 'Uganda' },
    { code: '+250', country: 'Rwanda' },
    { code: '+257', country: 'Burundi' },
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const years = Array.from({ length: 50 }, (_, i) => (new Date().getFullYear() - i).toString());
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  const RECORDING_SECONDS = 5;

  // ---------- Start camera automatically on step 2 ----------
  useEffect(() => {
    if (step !== 2) return;
    if (cameraStatus !== 'idle') return;

    let cancelled = false;

    const startCameraAndRecord = async () => {
      setCameraStatus('requesting');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        // Choose a supported mime type
        const mimeType =
          MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
            ? 'video/webm;codecs=vp8'
            : MediaRecorder.isTypeSupported('video/webm')
            ? 'video/webm'
            : '';

        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            setVideoPreviewUrl(base64);
            setFormData((prev) => ({ ...prev, videoRecord: base64 }));
          };
          reader.readAsDataURL(blob);

          // Stop camera tracks
          streamRef.current?.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          setCameraStatus('done');
        };

        recorder.start();
        setCameraStatus('recording');
        setCountdown(RECORDING_SECONDS);

        // Countdown + auto-stop
        let remaining = RECORDING_SECONDS;
        const interval = setInterval(() => {
          remaining -= 1;
          setCountdown(remaining);
          if (remaining <= 0) {
            clearInterval(interval);
            try {
              recorder.stop();
            } catch {
              // ignore
            }
          }
        }, 1000);
      } catch (err) {
        console.error('Camera error:', err);
        if ((err as Error).name === 'NotAllowedError') {
          setCameraStatus('denied');
        } else {
          setCameraStatus('error');
        }
      }
    };

    startCameraAndRecord();

    return () => {
      cancelled = true;
      // Cleanup if user navigates away
      try {
        mediaRecorderRef.current?.state === 'recording' &&
          mediaRecorderRef.current?.stop();
      } catch {
        // ignore
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ---------- Form handlers ----------
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (field: 'year' | 'month' | 'day', value: string) => {
    setFormData((prev) => ({
      ...prev,
      dateOfBirth: { ...prev.dateOfBirth, [field]: value },
    }));
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, profilePicture: file }));
      const base64 = await fileToBase64(file);
      setProfilePreview(base64);
    }
  };

  const validateStep1 = () => {
    if (!formData.fullName.trim()) return 'Full name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.mobileNumber.trim()) return 'Mobile number is required';
    if (!formData.region.trim()) return 'Region is required';
    if (!formData.currentCity.trim()) return 'Current city is required';
    return '';
  };

  const validateStep2 = () => {
    if (!formData.dateOfBirth.year || !formData.dateOfBirth.month || !formData.dateOfBirth.day) {
      return 'Complete date of birth is required';
    }
    if (!formData.password) return 'Password is required';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    if (!formData.termsAccepted) return 'You must accept the terms and policies';
    return '';
  };

  const handleNext = () => {
    const validationError = validateStep1();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateStep2();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const ipAddress = await getIpAddress();
      const deviceName = getDeviceName();

      console.log('IP Address:', ipAddress);
      console.log('Device Name:', deviceName);
      console.log('Video recorded (base64 length):', formData.videoRecord?.length || 0);

      const response = await authApi.register(formData);

      if (response.success) {
        navigate('/acc-verify?token=demo-uuid-token');
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold">
            TESLA CLOUD
          </Link>
          <h1 className="text-2xl font-bold mt-4">Create Your Account</h1>
          <p className="text-gray-600 mt-2">
            Join Tesla Cloud Institute and start your journey
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className={`flex items-center ${step >= 1 ? 'text-black' : 'text-gray-400'}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 1 ? 'bg-black text-white' : 'bg-gray-200'
                }`}
              >
                1
              </div>
              <span className="ml-2 text-sm">Personal Info</span>
            </div>
            <div className="w-16 h-px bg-gray-300 mx-4" />
            <div className={`flex items-center ${step >= 2 ? 'text-black' : 'text-gray-400'}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 2 ? 'bg-black text-white' : 'bg-gray-200'
                }`}
              >
                2
              </div>
              <span className="ml-2 text-sm">Account Setup</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4">
                {/* Profile Picture */}
                <div className="flex flex-col items-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-4">
                    {profilePreview ? (
                      <img
                        src={profilePreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <label className="cursor-pointer text-sm text-blue-600 hover:underline">
                    Upload Profile Picture
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <Input
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Country Code</label>
                    <select
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      {countryCodes.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} {c.country}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Input
                      label="Mobile Number"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      placeholder="Enter mobile number"
                      required
                    />
                  </div>
                </div>

                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Region"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    placeholder="Enter your region"
                    required
                  />
                  <Input
                    label="Current City"
                    name="currentCity"
                    value={formData.currentCity}
                    onChange={handleChange}
                    placeholder="Enter your city"
                    required
                  />
                </div>

                <Button type="button" onClick={handleNext} fullWidth>
                  Next
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                {/* ============ AUTO CAMERA RECORDING ============ */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-black text-white px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {cameraStatus === 'recording' && (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      )}
                      <span className="text-sm font-medium">
                        {cameraStatus === 'idle' && 'Preparing camera...'}
                        {cameraStatus === 'requesting' && 'Requesting camera access...'}
                        {cameraStatus === 'recording' && `Recording... ${countdown}s`}
                        {cameraStatus === 'done' && 'Recording complete'}
                        {cameraStatus === 'denied' && 'Camera access denied'}
                        {cameraStatus === 'error' && 'Camera unavailable'}
                      </span>
                    </div>
                    {cameraStatus === 'recording' && (
                      <span className="text-xs text-gray-300">
                        Auto-stops in {countdown}s
                      </span>
                    )}
                  </div>

                  <div className="bg-gray-900 aspect-video relative flex items-center justify-center">
                    {/* Live camera preview */}
                    {cameraStatus === 'recording' || cameraStatus === 'requesting' ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : null}

                    {/* Recorded playback */}
                    {cameraStatus === 'done' && videoPreviewUrl && (
                      <video
                        src={videoPreviewUrl}
                        controls
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Denied / error states */}
                    {(cameraStatus === 'denied' || cameraStatus === 'error') && (
                      <div className="text-center text-gray-300 p-6">
                        <svg
                          className="w-12 h-12 mx-auto mb-3 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="text-sm">
                          {cameraStatus === 'denied'
                            ? 'Camera access was denied. You can continue without recording.'
                            : 'Camera is not available. You can continue without recording.'}
                        </p>
                      </div>
                    )}

                    {/* Idle shimmer */}
                    {cameraStatus === 'idle' && (
                      <div className="text-gray-500 text-sm">
                        Initializing camera...
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 text-center">
                    A short video is recorded automatically for identity verification.
                    Your privacy is respected — the recording is stored securely.
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <select
                      value={formData.dateOfBirth.year}
                      onChange={(e) => handleDateChange('year', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="">Year</option>
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <select
                      value={formData.dateOfBirth.month}
                      onChange={(e) => handleDateChange('month', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="">Month</option>
                      {months.map((month, index) => (
                        <option
                          key={month}
                          value={(index + 1).toString().padStart(2, '0')}
                        >
                          {month}
                        </option>
                      ))}
                    </select>
                    <select
                      value={formData.dateOfBirth.day}
                      onChange={(e) => handleDateChange('day', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="">Day</option>
                      {days.map((day) => (
                        <option key={day} value={day.padStart(2, '0')}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Educational Background */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Educational Background (Optional)
                  </label>
                  <textarea
                    name="educationalBackground"
                    value={formData.educationalBackground}
                    onChange={handleChange}
                    placeholder="Enter your educational background"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <Input
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password (min 6 characters)"
                  required
                />

                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                />

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="termsAccepted"
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                    className="mt-1 mr-2"
                  />
                  <label htmlFor="termsAccepted" className="text-sm text-gray-600">
                    I agree to the{' '}
                    <Link to="/terms" className="text-blue-600 hover:underline">
                      Terms and Policies
                    </Link>
                  </label>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(1)}
                    fullWidth
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    fullWidth
                    disabled={isLoading || cameraStatus === 'recording'}
                  >
                    {isLoading
                      ? 'Creating Account...'
                      : cameraStatus === 'recording'
                      ? `Please wait (${countdown}s)...`
                      : 'Create Account'}
                  </Button>
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link to="/signin" className="text-blue-600 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;