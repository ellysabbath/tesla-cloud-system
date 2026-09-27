import React from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { mockEnrolledCourses } from '../../data/mockData';

const MyCourses: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Courses</h1>
        <p className="text-gray-600">All courses you're currently enrolled in</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockEnrolledCourses.map((enrollment) => (
          <Card key={enrollment.id} className="p-6">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              {enrollment.course.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {enrollment.course.description}
            </p>

            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{enrollment.progress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black rounded-full"
                  style={{ width: `${enrollment.progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {enrollment.course.duration} • {enrollment.course.practicals} practicals
              </span>
              <Button size="small">Continue</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MyCourses;