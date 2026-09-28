// src/data/coursesData.ts
import { courses as seedCourses } from './mockData';
import type { Course } from '../types';

const STORAGE_KEY = 'tci_courses';

// ---------- Read ----------
export const loadCourses = (): Course[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with the built-in courses on first run
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedCourses));
      return seedCourses;
    }
    return JSON.parse(raw) as Course[];
  } catch {
    return seedCourses;
  }
};

// ---------- Write ----------
export const saveCourses = (list: Course[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

// ---------- Create ----------
export const createCourse = (course: Course): Course[] => {
  const all = loadCourses();
  all.unshift(course);
  saveCourses(all);
  return all;
};

// ---------- Update ----------
export const updateCourse = (course: Course): Course[] => {
  const all = loadCourses().map((c) => (c.id === course.id ? course : c));
  saveCourses(all);
  return all;
};

// ---------- Delete ----------
export const deleteCourse = (id: string): Course[] => {
  const all = loadCourses().filter((c) => c.id !== id);
  saveCourses(all);
  return all;
};

// ---------- Factory ----------
export const emptyCourse = (): Course => ({
  id: crypto.randomUUID(),
  title: '',
  description: '',
  fullDescription: '',
  whatWillLearn: [],
  whyLearn: '',
  price: 0,
  instructor: '',
  duration: '',
  practicals: 0,
  theoryDays: '',
  practicalDays: '',
  theoryExam: '',
  practicalExam: '',
  image: '',
  category: '',
});