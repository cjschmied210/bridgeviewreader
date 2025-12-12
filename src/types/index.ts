
// import { User } from 'firebase/auth'; // Removed unused import

export type UserRole = 'student' | 'teacher';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    createdAt: number;
}

export interface Teacher extends UserProfile {
    role: 'teacher';
    school?: string;
}

export interface Class {
    id: string;
    name: string;
    description?: string;
    teacherId: string;
    studentIds: string[];
    createdAt: number | object; // Firestore Timestamp or number
    assignments?: {
        assignmentId: string;
        dueDate?: string;
        status: 'Active' | 'Archived';
    }[];
}

export interface Assignment {
    id: string;
    title: string;
    themeImageKeyword: string;
    content: string;
    description?: string;
}

export interface AirlockData {
    primingWords: string[];
    knowledge: string;
    curiosity: string;
}

export interface AnnotationData {
    id: string;
    text: string; // The selected text
    note: string; // The user's thought
    tag: 'Right There' | 'Think & Search' | 'Author & You';
}

export interface SynthesisData {
    gist: string;
    reflection3: string[];
    reflection2: string[];
    reflection1: string;
    learned: string;
}

export interface SpeedBumpData {
    checkpointId: string; // Or index
    reflection: string;
}

export interface Submission {
    id: string;
    assignmentId: string;
    studentId: string;
    classId: string;
    airlockData: AirlockData;
    annotations: AnnotationData[];
    speedBumpReflections?: SpeedBumpData[]; // Added this
    synthesis: SynthesisData;
    submittedAt: number | object; // Firestore Timestamp
    status: 'Completed';
}
