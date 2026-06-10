# AI Resume Checker — Node.js Backend API

Base URL: `http://localhost:3000`

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Auth Routes

Base: `/user/api`

---

### POST `/user/api/signup`

Create a new account.

**Request Body:**

```json
{
  "name": "Farhan",
  "email": "farhan@gmail.com",
  "password": "123456"
}
```

**Success Response:**

```json
{
  "success": true,
  "message": "Account created successfully.",
  "userId": "23fc9937-d876-4b8b-bc4d-dfbe8726d066"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Email already registered."
}
```

---

### POST `/user/api/login`

Login and get JWT token.

**Request Body:**

```json
{
  "email": "farhan@gmail.com",
  "password": "123456"
}
```

**Success Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "23fc9937-d876-4b8b-bc4d-dfbe8726d066",
    "email": "farhan@gmail.com"
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Wrong password."
}
```

---

### POST `/user/api/profile` 🔒

Get current logged in user info.

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response:**

```json
{
  "success": true,
  "user": {
    "id": "23fc9937-d876-4b8b-bc4d-dfbe8726d066",
    "name": "Farhan",
    "email": "farhan@gmail.com",
    "createdAt": "2026-05-21T02:36:44.000Z"
  }
}
```

---

## Resume Routes

Base: `/resume`

All resume routes are protected. Always include the Authorization header.

---

### POST `/resume/upload` 🔒

Save a PDF URL to the database after uploading to Cloudinary from the frontend.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "pdfUrl": "https://res.cloudinary.com/your-cloud/raw/upload/resume.pdf"
}
```

**Success Response:**

```json
{
  "success": true,
  "message": "Resume saved successfully.",
  "resume": {
    "id": "resume-uuid-here",
    "pdfUrl": "https://res.cloudinary.com/your-cloud/raw/upload/resume.pdf",
    "uploadedAt": "2026-05-21T02:36:44.000Z"
  }
}
```

---

### GET `/resume/all` 🔒

Get all resumes uploaded by the current user.

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response:**

```json
{
  "success": true,
  "resumes": [
    {
      "id": "resume-uuid-here",
      "pdf_url": "https://res.cloudinary.com/your-cloud/raw/upload/resume.pdf",
      "uploadedAt": "2026-05-21T02:36:44.000Z"
    }
  ]
}
```

---

### DELETE `/resume/:id` 🔒

Delete a resume by ID.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Params:**

```
id — the resume UUID
```

**Success Response:**

```json
{
  "success": true,
  "message": "Resume deleted successfully."
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "You do not have permission to delete this resume."
}
```

---

### POST `/resume/analyze` 🔒

Full ATS analysis flow. Sends resume to AI, searches job market, returns complete score and recommendations.

⚠️ This takes 20-30 seconds. Do not cancel the request.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "pdfUrl": "https://res.cloudinary.com/your-cloud/raw/upload/resume.pdf",
  "jobTitle": "software engineer"
}
```

**Success Response:**

```json
{
  "success": true,
  "analysisId": "analysis-uuid-here",
  "resumeId": "resume-uuid-here",
  "data": {
    "meta": {
      "job_title": "software engineer",
      "generated_at": "2026-06-08",
      "powered_by": "ScoreMyResume"
    },
    "hero": {
      "ats_score": 72,
      "verdict": "Needs Work",
      "verdict_emoji": "↗",
      "hire_probability": "Medium",
      "one_liner": "Solid backend dev but missing cloud and AI exposure."
    },
    "score_breakdown": [
      {
        "label": "Skills Match",
        "score": 22,
        "out_of": 30,
        "reason": "Good backend skills, missing cloud"
      },
      {
        "label": "Experience",
        "score": 18,
        "out_of": 25,
        "reason": "Projects are good, no formal work"
      },
      {
        "label": "Projects",
        "score": 15,
        "out_of": 20,
        "reason": "Real projects but no live deploys"
      },
      {
        "label": "Resume Structure",
        "score": 12,
        "out_of": 15,
        "reason": "Clean but missing summary section"
      },
      {
        "label": "ATS Keywords",
        "score": 5,
        "out_of": 10,
        "reason": "Missing REST API, CI/CD keywords"
      }
    ],
    "candidate": {
      "level": "Fresher",
      "is_fresher": true,
      "ready_to_apply": false,
      "strongest_asset": "Strong full-stack project delivery",
      "biggest_blocker": "No cloud experience or certifications"
    },
    "market": {
      "demand": "High",
      "competition": "Fierce",
      "salary_range": "₹6–14 LPA",
      "truth": "Companies want cloud and AI basics even at entry level.",
      "top_skills": [
        { "skill": "Python", "importance": "Must Have" },
        { "skill": "AWS basics", "importance": "Must Have" },
        { "skill": "Docker", "importance": "Good To Have" }
      ]
    },
    "skills": {
      "matched": [
        { "skill": "Node.js", "strength": "Strong" },
        { "skill": "React", "strength": "Strong" }
      ],
      "missing": [
        { "skill": "Python", "priority": "Critical" },
        { "skill": "AWS", "priority": "Important" }
      ],
      "ats_keywords_missing": ["REST API", "CI/CD", "Agile", "Jest"]
    },
    "ats_filter": {
      "will_pass": false,
      "format_issues": [
        {
          "issue": "No summary section",
          "fix": "Add a 3 line professional summary at the top"
        }
      ]
    },
    "resume_fixes": [
      {
        "priority": "High",
        "section": "Summary",
        "fix": "Add a professional summary mentioning your stack",
        "why": "ATS scans the top of resume first"
      }
    ],
    "action_plan": [
      {
        "timeline": "This Week",
        "action": "Add professional summary to resume",
        "impact": "High"
      },
      {
        "timeline": "This Month",
        "action": "Learn basic AWS — S3 and EC2",
        "impact": "High"
      },
      {
        "timeline": "In 3 Months",
        "action": "Get AWS Developer Associate certification",
        "impact": "Medium"
      }
    ],
    "fresher_block": {
      "reality": "Most fresher resumes get filtered by ATS before a human sees them.",
      "unfair_advantage": "Freshers can learn AI tools faster than experienced devs.",
      "fastest_path": "Build 2 deployed projects and add them with live URLs."
    },
    "motivation": "Your foundation is solid. Add cloud basics and you jump from Medium to High hire probability.",
    "final_verdict": "Resume needs ATS keywords and a summary section. Fix those this week and apply confidently."
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Analysis failed. Try again."
}
```

---

### GET `/resume/history` 🔒

Get all past analyses for the current user (summary only, no full result).

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response:**

```json
{
  "success": true,
  "analyses": [
    {
      "id": "analysis-uuid-here",
      "jobTitle": "software engineer",
      "atsScore": 72,
      "createdAt": "2026-05-21T02:36:44.000Z",
      "resumeId": "resume-uuid-here"
    }
  ]
}
```

---

### GET `/resume/history/:id` 🔒

Get one full analysis result by ID.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Params:**

```
id — the analysis UUID
```

**Success Response:**

```json
{
  "success": true,
  "analysis": {
    "id": "analysis-uuid-here",
    "jobTitle": "software engineer",
    "atsScore": 72,
    "fullResult": { ... },
    "createdAt": "2026-05-21T02:36:44.000Z"
  }
}
```

---

### POST `/resume/chat` 🔒

Chat about the resume. Ask questions like "what skills am I missing?" or "how can I improve my resume?".

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "pdfUrl": "https://res.cloudinary.com/your-cloud/raw/upload/resume.pdf",
  "message": "What skills am I missing for a software engineer role?"
}
```

**Success Response:**

```json
{
  "success": true,
  "data": {
    "success": true,
    "answer": "Based on your resume, you are missing cloud experience specifically AWS or GCP...",
    "retrieved_chunks": [
      "Skills section content...",
      "Projects section content..."
    ]
  }
}
```

**Notes:**

- Send `pdfUrl` on the first message to load the resume
- On follow-up messages you can omit `pdfUrl` if the resume is already loaded
- The chat is temporary — not stored in database

---

## How to Upload PDF from Frontend (Cloudinary)

Upload directly from React to Cloudinary — do not send the file to Node.js.

```javascript
const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "your_unsigned_preset");
  formData.append("resource_type", "raw");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/your_cloud_name/raw/upload`,
    { method: "POST", body: formData },
  );

  const data = await response.json();
  return data.secure_url; // use this URL in all API calls
};
```

---

## Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": "Human readable error message."
}
```

## HTTP Status Codes

| Code | Meaning                                  |
| ---- | ---------------------------------------- |
| 200  | Success                                  |
| 201  | Created                                  |
| 400  | Bad request — missing or invalid fields  |
| 401  | Unauthorized — missing or invalid token  |
| 403  | Forbidden — you do not own this resource |
| 404  | Not found                                |
| 500  | Server error — try again                 |
