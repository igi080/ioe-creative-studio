/**
 * School Result Portal Types & Architecture Definitions
 * Designed for Greenfield International Academy Demo & future Supabase integration.
 * Supports future extensions:
 * - Admin login, Student DB, Class & Subject management
 * - Result entry & publishing, PIN batch generation & verification
 */

export interface SchoolProfile {
  id: string;
  name: string;
  shortName: string;
  motto: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  crestUrl?: string;
  principalName: string;
  principalTitle: string;
  principalSignatureUrl?: string;
  stampUrl?: string;
}

export interface StudentProfile {
  id: string;
  registrationNumber: string;
  fullName: string;
  gender: 'Male' | 'Female';
  className: string;
  classArm?: string;
  dateOfBirth?: string;
  admissionYear?: string;
  house?: string;
  photoUrl?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
}

export interface SubjectScore {
  id: string;
  subjectName: string;
  subjectCode?: string;
  caScore: number;       // e.g. out of 30
  examScore: number;     // e.g. out of 70
  totalScore: number;    // caScore + examScore (out of 100)
  grade: 'A1' | 'B2' | 'B3' | 'C4' | 'C5' | 'C6' | 'D7' | 'E8' | 'F9';
  remark: string;        // e.g. "Distinction", "Excellent", "Very Good", "Good", "Credit"
  positionInSubject?: string;
  teacherName?: string;
}

export interface AffectiveDomainAssessment {
  punctuality: number;    // 1-5 rating
  neatness: number;
  politeness: number;
  honesty: number;
  leadership: number;
  attentiveness: number;
}

export interface StudentResultReport {
  id: string;
  student: StudentProfile;
  school: SchoolProfile;
  session: string;         // e.g. "2025/2026"
  term: 'First Term' | 'Second Term' | 'Third Term';
  classPosition: string;   // e.g. "5th"
  totalStudentsInClass: number; // e.g. 32
  overallTotalScore: number;    // e.g. 706
  obtainableScore: number;      // e.g. 900
  overallAverage: number;       // e.g. 78.4%
  attendance: {
    daysPresent: number;
    daysSchoolOpened: number;
    percentage: number;
  };
  scores: SubjectScore[];
  affectiveTraits?: AffectiveDomainAssessment;
  teacherRemark: string;
  teacherName: string;
  principalRemark: string;
  principalName: string;
  dateIssued: string;
  nextTermResumptionDate: string;
  verificationCode: string;
  isPublished: boolean;
}

export interface ResultCheckerInput {
  registrationNumber: string;
  pin: string;
  session: string;
  term: string;
}

export interface ResultCheckerValidationState {
  isValid: boolean;
  errorMessage?: string;
  fieldErrors?: {
    registrationNumber?: string;
    pin?: string;
    session?: string;
    term?: string;
  };
}

/**
 * Architecture hook for future Supabase Database integration:
 * Tables:
 * - `schools` (id, name, motto, logo, settings)
 * - `academic_sessions` (id, session_name, is_active)
 * - `terms` (id, session_id, term_name, is_current)
 * - `classes` (id, name, level, arm)
 * - `subjects` (id, name, code)
 * - `students` (id, reg_no, full_name, class_id, photo_url)
 * - `student_pins` (id, student_id, pin_hash, usage_count, max_uses, is_active)
 * - `results` (id, student_id, session_id, term_id, average, position, remarks, is_published)
 * - `result_scores` (id, result_id, subject_id, ca_score, exam_score, total, grade)
 */
export interface FutureSchoolManagementService {
  adminLogin?: (username: string, passwordHash: string) => Promise<{ token: string }>;
  fetchStudentsByClass?: (classId: string) => Promise<StudentProfile[]>;
  generatePinBatch?: (count: number, sessionId: string) => Promise<string[]>;
  publishClassResults?: (classId: string, termId: string) => Promise<boolean>;
  verifyResultPin?: (regNumber: string, pin: string) => Promise<boolean>;
}
