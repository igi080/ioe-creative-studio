import { StudentResultReport, SchoolProfile, StudentProfile } from './types';

export const DEMO_CREDENTIALS = {
  registrationNumber: 'GIA/2026/001',
  pin: 'IOE2026',
  session: '2025/2026',
  term: 'Third Term'
};

export const AVAILABLE_SESSIONS = [
  '2025/2026',
  '2024/2025',
  '2023/2024'
];

export const AVAILABLE_TERMS = [
  'First Term',
  'Second Term',
  'Third Term'
];

export const GREENFIELD_SCHOOL: SchoolProfile = {
  id: 'gia-001',
  name: 'GREENFIELD INTERNATIONAL ACADEMY',
  shortName: 'GIA',
  motto: 'Excellence, Character & Future Leadership',
  address: 'Plot 18, Greenfield Crescent, Lekki Peninsula, Lagos, Nigeria',
  phone: '+234 1 234 5678 / +234 904 005 9278',
  email: 'admissions@greenfieldacademy.edu.ng',
  website: 'www.greenfieldacademy.edu.ng',
  principalName: 'Dr. (Mrs.) A. O. Balogun',
  principalTitle: 'Principal / Head of Academics'
};

export const DEMO_STUDENT: StudentProfile = {
  id: 'student-gia-001',
  registrationNumber: 'GIA/2026/001',
  fullName: 'Daniel Adekunle',
  gender: 'Male',
  className: 'SS 2',
  classArm: 'Diamond',
  house: 'Emerald House (Green)',
  admissionYear: '2021',
  dateOfBirth: '14th May 2009'
};

/**
 * Calculates grade and remark based on Nigerian Secondary School WAEC/NECO grading scale
 */
export function calculateGrade(score: number): { grade: 'A1' | 'B2' | 'B3' | 'C4' | 'C5' | 'C6' | 'D7' | 'E8' | 'F9'; remark: string } {
  if (score >= 75) return { grade: 'A1', remark: 'Excellent' };
  if (score >= 70) return { grade: 'B2', remark: 'Very Good' };
  if (score >= 65) return { grade: 'B3', remark: 'Good' };
  if (score >= 60) return { grade: 'C4', remark: 'Credit' };
  if (score >= 55) return { grade: 'C5', remark: 'Credit' };
  if (score >= 50) return { grade: 'C6', remark: 'Credit' };
  if (score >= 45) return { grade: 'D7', remark: 'Pass' };
  if (score >= 40) return { grade: 'E8', remark: 'Pass' };
  return { grade: 'F9', remark: 'Fail' };
}

export const DEMO_RESULT_REPORT: StudentResultReport = {
  id: 'report-gia-2026-001-t3',
  student: DEMO_STUDENT,
  school: GREENFIELD_SCHOOL,
  session: '2025/2026',
  term: 'Third Term',
  classPosition: '5th',
  totalStudentsInClass: 32,
  overallTotalScore: 706,
  obtainableScore: 900,
  overallAverage: 78.4,
  attendance: {
    daysPresent: 64,
    daysSchoolOpened: 65,
    percentage: 98.46
  },
  scores: [
    {
      id: 'sub-1',
      subjectName: 'Mathematics',
      caScore: 28,
      examScore: 54,
      totalScore: 82,
      grade: 'A1',
      remark: 'Excellent',
      positionInSubject: '3rd',
      teacherName: 'Mr. K. Adeleke'
    },
    {
      id: 'sub-2',
      subjectName: 'English Language',
      caScore: 25,
      examScore: 52,
      totalScore: 77,
      grade: 'B2',
      remark: 'Very Good',
      positionInSubject: '6th',
      teacherName: 'Mrs. E. Nwosu'
    },
    {
      id: 'sub-3',
      subjectName: 'Physics',
      caScore: 27,
      examScore: 55,
      totalScore: 82,
      grade: 'A1',
      remark: 'Excellent',
      positionInSubject: '2nd',
      teacherName: 'Engr. D. Lawal'
    },
    {
      id: 'sub-4',
      subjectName: 'Chemistry',
      caScore: 24,
      examScore: 50,
      totalScore: 74,
      grade: 'B3',
      remark: 'Good',
      positionInSubject: '7th',
      teacherName: 'Dr. C. Okeke'
    },
    {
      id: 'sub-5',
      subjectName: 'Biology',
      caScore: 26,
      examScore: 53,
      totalScore: 79,
      grade: 'B2',
      remark: 'Very Good',
      positionInSubject: '4th',
      teacherName: 'Mrs. F. Oladipo'
    },
    {
      id: 'sub-6',
      subjectName: 'Economics',
      caScore: 25,
      examScore: 51,
      totalScore: 76,
      grade: 'B2',
      remark: 'Very Good',
      positionInSubject: '5th',
      teacherName: 'Mr. S. Alabi'
    },
    {
      id: 'sub-7',
      subjectName: 'Government',
      caScore: 23,
      examScore: 49,
      totalScore: 72,
      grade: 'B3',
      remark: 'Good',
      positionInSubject: '8th',
      teacherName: 'Mrs. B. Jacobs'
    },
    {
      id: 'sub-8',
      subjectName: 'Computer Studies',
      caScore: 29,
      examScore: 58,
      totalScore: 87,
      grade: 'A1',
      remark: 'Distinction',
      positionInSubject: '1st',
      teacherName: 'Mr. T. Bakare'
    },
    {
      id: 'sub-9',
      subjectName: 'Further Mathematics',
      caScore: 26,
      examScore: 51,
      totalScore: 77,
      grade: 'B2',
      remark: 'Very Good',
      positionInSubject: '4th',
      teacherName: 'Mr. K. Adeleke'
    }
  ],
  affectiveTraits: {
    punctuality: 5,
    neatness: 5,
    politeness: 5,
    honesty: 5,
    leadership: 4,
    attentiveness: 4
  },
  teacherRemark: 'Daniel has demonstrated excellent academic progress this term. He should continue to maintain his focus and consistency.',
  teacherName: 'Mr. O. A. Babatunde (Form Teacher)',
  principalRemark: 'An excellent performance. Keep up the good work.',
  principalName: 'Dr. (Mrs.) A. O. Balogun',
  dateIssued: '24th July 2026',
  nextTermResumptionDate: '14th September 2026',
  verificationCode: 'GIA-VERIFY-2026-8849204',
  isPublished: true
};
