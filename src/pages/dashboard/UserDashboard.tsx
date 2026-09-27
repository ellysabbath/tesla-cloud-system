import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { courses, mockExams, mockEnrolledCourses } from '../../data/mockData';

const UserDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'available' | 'enrolled' | 'exams'>('available');

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(price);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Welcome back, Student!
        </h1>
        <p className="text-gray-600">Continue your learning journey</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Enrolled Courses', value: mockEnrolledCourses.length },
          { label: 'Completed', value: 1 },
          { label: 'Exams Taken', value: mockExams.length },
          { label: 'Certificates', value: 1 },
        ].map((stat) => (
          <Card key={stat.label} className="p-5">
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {[
          { key: 'available', label: 'Available Courses' },
          { key: 'enrolled', label: 'My Courses' },
          { key: 'exams', label: 'My Exams' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`
              whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tab.key
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-800'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Available Courses */}
      {activeTab === 'available' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden flex flex-col">
              <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-sm">{course.category}</span>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-semibold text-gray-900 mb-2">{course.title}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
                  {course.description}
                </p>
                <div className="space-y-1 text-xs text-gray-500 mb-4">
                  <p>Instructor: {course.instructor}</p>
                  <p>Duration: {course.duration}</p>
                  <p>Practicals: {course.practicals}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">{formatPrice(course.price)}</span>
                  <Link to={`/my-courses/${course.id}`}>
                    <Button size="small">View</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* My Courses */}
      {activeTab === 'enrolled' && (
        <div className="space-y-4">
          {mockEnrolledCourses.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-600">You haven't enrolled in any courses yet.</p>
              <Button className="mt-4" onClick={() => setActiveTab('available')}>
                Browse Courses
              </Button>
            </Card>
          ) : (
            mockEnrolledCourses.map((enrollment) => (
              <Card key={enrollment.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">
                      {enrollment.course.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Enrolled: {formatDate(enrollment.enrolledAt)}
                    </p>
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{enrollment.progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-black rounded-full transition-all"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <Link to={`/my-courses/${enrollment.courseId}`}>
                    <Button>Continue Learning</Button>
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* My Exams */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          {mockExams.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-600">No exams taken yet.</p>
            </Card>
          ) : (
            mockExams.map((exam) => (
              <Card key={exam.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{exam.title}</h3>
                    <p className="text-sm text-gray-600">{exam.courseName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted: {formatDate(exam.submissionDate)}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {exam.marks}/{exam.totalMarks}
                    </p>
                    <span
                      className={`
                        inline-block px-3 py-1 rounded-full text-xs font-medium
                        ${exam.status === 'passed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                        }
                      `}
                    >
                      {exam.status === 'passed' ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;