# Implementation Plan - Student Revision & Teacher Awareness

## Problem
Currently, when a student reopens a completed assignment, they only see a static report of their synthesis. They cannot view the text, add annotations, or revise their work. Teachers are not notified of revisions.

## Solution
1. **Student Experience**:
   - Allow students to enter "Revision Mode" from the Grade Report.
   - In Revision Mode, load their previous annotations and the full text.
   - Allow adding new annotations and updating the synthesis.
   - Add a "Resubmit" button that updates the submission and flags it as revised.

2. **Teacher Experience**:
   - Add a visual alert in the **Class Dashboard** for submissions with pending revisions.
   - In the **Review View**, highlight annotations that were added *after* the last grading timestamp.
   - Auto-clear the revision flag when the teacher saves new feedback.

## Proposed Changes

### 1. Update Types (`src/types/index.ts`)
- Add `createdAt` timestamp to `AnnotationData` to track when notes are added.
- Add `hasPendingRevision` boolean to `Submission` to flag updates.

### 2. Update Student Assignment Page (`src/app/assignment/[id]/page.tsx`)
- **State Hydration**: When an existing submission is found, populate `annotations`, `kwlData`, and `speedBumpReflections` into the state.
- **UI Update**: In the "Grade Report" view (`status === 'Completed'`), add a **"Review & Revise"** button.
- **Action**: When clicked, switch `phase` to `READING` so the student can see the text and annotations.
- **Resubmission**: Update `handleSynthesisComplete` (or create `handleResubmit`) to:
  - Use `updateDoc` instead of `addDoc`.
  - Set `hasPendingRevision: true`.
  - Preserve the original `submittedAt` (or add `lastUpdatedAt`).

### 3. Update Text Annotator (`src/components/features/TextAnnotator.tsx`)
- Ensure `onAnnotate` attaches a `createdAt` timestamp (serverTimestamp or client date) to the annotation object.
- *Note*: I need to check `TextAnnotator` to see where the annotation object is created.

### 4. Update Class Dashboard (`src/app/dashboard/class/[id]/page.tsx`)
- In the student submission card, check `submission.hasPendingRevision`.
- Display a **"Revision Pending"** badge or icon (e.g., distinct form "Completed").

### 5. Update Teacher Review Page (`src/app/dashboard/review/[submissionId]/page.tsx`)
- **Highlighting**: In the annotations list, compare `annotation.createdAt` vs `submission.gradedAt`.
- If `created > graded`, style the annotation distinctly (e.g., "New" badge, different border color).
- **Clearing Flag**: When the teacher clicks "Save Feedback", update `hasPendingRevision: false` in Firestore.

## Verification
- **Student**: Submit -> Teacher Grades -> Student Revises (adds note) -> Resubmits.
- **Teacher**: Dashboard shows alert -> Open Review -> See highlighted note -> Save -> Alert clears.
