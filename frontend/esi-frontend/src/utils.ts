export const SUBJECTS: string[] = [
  "Mathematics",
  "Integrated Science",
  "ICT/Computing",
  "Basic Design & Technology",
];

export const LOCATIONS: string[] = [
  "East Legon",
  "Osu",
  "Tema",
  "Spintex",
  "Adenta",
  "Madina",
  "Airport",
  "Cantonments",
  "Dansoman",
  "Kaneshie",
  "Teshie",
  "Accra Central",
];

export const ACADEMIC_LEVELS = ["Upper Primary (P4–P6)", "JHS (JHS 1–3)"];

export const GRADES = [
  "Primary 4", "Primary 5", "Primary 6",
  "JHS 1", "JHS 2", "JHS 3",
];

export const generateStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, i) => i < rating);
};

export const avatarUrl = (name: string, size = 100): string =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${size}&background=4338CA&color=fff&bold=true`;

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};

export const formatTime = (date: string) => {
  return new Date(date).toLocaleTimeString();
};

export const todayStr = () => {
  return new Date().toISOString().split("T")[0];
};