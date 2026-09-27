import React, { useState } from 'react';
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
  const [videoRecording, setVideoRecording] = useState<boolean>(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (field: 'year' | 'month' | 'day', value: string) => {
    setFormData(prev => ({
      ...prev,
      dateOfBirth: { ...prev.dateOfBirth, [field]: value },
    }));
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, profilePicture: file }));
      const base64 = await fileToBase64(file);
      setProfilePreview(base64);
    }
  };

  const startVideoRecording = () => {
    setVideoRecording(true);
    // Simulate video recording
    setTimeout(() => {
      setVideoRecording(false);
      // In a real implementation, this would use the MediaRecorder API
    }, 3000);
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
      // Get IP address and device info
      const ipAddress = await getIpAddress();
      const deviceName = getDeviceName();
      
      console.log('IP Address:', ipAddress);
      console.log('Device Name:', deviceName);

      const response = await authApi.register(formData);
      
      if (response.success) {
        // Navigate to verification page (simulating email sent)
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-black text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm">Personal Info</span>
            </div>
            <div className="w-16 h-px bg-gray-300 mx-4" />
            <div className={`flex items-center ${step >= 2 ? 'text-black' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-black text-white' : 'bg-gray-200'
              }`}>
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
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
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
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <select
                      value={formData.dateOfBirth.month}
                      onChange={(e) => handleDateChange('month', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="">Month</option>
                      {months.map((month, index) => (
                        <option key={month} value={(index + 1).toString().padStart(2, '0')}>
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
                        <option key={day} value={day.padStart(2, '0')}>{day}</option>
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

                {/* Video Recording */}
                <div className="border border-gray-200 rounded p-4">
                  <p className="text-sm font-medium mb-2">Video Record (Optional)</p>
                  <p className="text-xs text-gray-500 mb-3">
                    Record a short video for verification purposes
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="small"
                    onClick={startVideoRecording}
                    disabled={videoRecording}
                  >
                    {videoRecording ? 'Recording...' : 'Start Recording'}
                  </Button>
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
                  <Button type="submit" fullWidth disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
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