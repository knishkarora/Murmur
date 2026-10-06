export const BRANCH_OPTIONS = [
  "Computer Science & Engineering (CSE)",
  "Information Technology (IT)",
  "Electronics & Communication Engineering (ECE)",
  "Electrical & Electronics Engineering (EEE)",
  "Artificial Intelligence & Data Science (AI & DS)",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical / Biotechnology Engineering",
  "BCA / MCA",
  "B.Sc / M.Sc Computer Science",
  "Dual Degree / Integrated M.Tech",
  "Other Degree / Branch",
] as const;

export type BranchOption = (typeof BRANCH_OPTIONS)[number];

export const TARGET_ROLE_OPTIONS = [
  "Software Development Engineer (SDE)",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Scientist / Machine Learning Engineer",
  "AI & Prompt Engineer",
  "Data Analyst / Business Analyst",
  "Embedded Systems & IoT Engineer",
  "DevOps & Cloud Engineer",
  "Cybersecurity Analyst",
  "Mobile Application Developer (iOS / Android)",
  "Product Management / Associate PM",
  "Quality Assurance (QA) & Automation Tester",
  "Core Engineering (VLSI / Embedded / Hardware)",
  "Other / General Tech",
] as const;

export type TargetRoleOption = (typeof TARGET_ROLE_OPTIONS)[number];

export const FOCUS_AREA_OPTIONS = [
  "Data Structures & Algorithms (DSA)",
  "System Design (LLD & HLD)",
  "Web Development Projects",
  "Core CS Fundamentals (OS, DBMS, CN)",
  "Object Oriented Programming (OOP)",
  "Competitive Programming",
  "Resume & Portfolio Building",
  "Aptitude & Quantitative Reasoning",
  "Mock Interviews & Behavioral Prep",
  "Machine Learning & AI Projects",
  "Open Source Contributions",
  "Cloud & DevOps Practices",
  "Cybersecurity & Cryptography",
  "Internship / Placement Roadmaps",
] as const;

export type FocusAreaOption = (typeof FOCUS_AREA_OPTIONS)[number];
