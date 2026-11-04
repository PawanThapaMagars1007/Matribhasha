# Learning progress

Enrollments and lesson progress are scoped to the authenticated user. Opening a lesson saves an in-progress position; completion requires an explicit learner action and access to previous lessons in the ordered path. Lessons configured with `required-activities` also require passing their embedded assessments. Course requirements can include all published lessons and configured assessments with server-recorded passing attempts.

Assessment attempts contain only the current user's submissions and backend-computed score. Answers are compared with the private assessment answer key; retake limits and pass marks are checked on the server. Feedback is shown after submission.

The revision queue uses due/needs-revision vocabulary reviews, attempted but unfinished sentence exercises, and attempted but incomplete grammar lessons. Achievement thresholds are administrator-configured and evaluated from persisted actions. Streak-day criteria count distinct activity days; no streak is seeded. Certificates are issued only after course completion rules and required assessment passes; verification reveals the course and date but not learner identity. Certificates are completion records and are not represented as externally accredited.
