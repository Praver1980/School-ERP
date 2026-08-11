import { AttendanceStat } from './types';

// Mock Data for Principal Dashboard Charts only (Visuals)
export const WEEKLY_ATTENDANCE: AttendanceStat[] = [
  { day: 'Mon', present: 95, absent: 5 },
  { day: 'Tue', present: 92, absent: 8 },
  { day: 'Wed', present: 96, absent: 4 },
  { day: 'Thu', present: 88, absent: 12 },
  { day: 'Fri', present: 94, absent: 6 },
];

export const CLASS_GRADES = [
  'Nursery', 'L.K.G.', 'U.K.G.', 
  '1st', '2nd', '3rd', '4th', '5th', 
  '6th', '7th', '8th', '9th', '10th', 
  '11th', '12th'
];

export const SECTIONS_JUNIOR = ['A', 'B'];
export const SECTIONS_SENIOR = ['Science', 'Commerce', 'Humanities'];

export const SCHOOL_NAMES = [
  'Greenwood High',
  'St. Mary\'s Academy',
  'Oakridge International',
  'Delhi Public School',
  'Springfield High'
];
