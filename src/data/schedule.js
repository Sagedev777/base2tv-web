// INSTRUCTIONS FOR THE PROGRAMS MANAGER:
// Simply update this file to change the TV Guide schedule on the website.
// - time: Must be in "HH:MM AM/PM" format
// - state: Must be exactly "past", "current", or "future"
// - progress: For "current" shows only (0 to 100). Leave at 0 for past/future.
// - duration: How long the show is in minutes (e.g., 60 for 1 hour)

export const tvSchedule = [
  {
    id: 1,
    time: '06:00 AM',
    title: 'Morning Devotion',
    description: 'Start your day with spiritual upliftment and community prayers.',
    state: 'past',
    progress: 0,
    duration: 60,
    thumbnail: ''
  },
  {
    id: 2,
    time: '07:00 AM',
    title: 'Morning Uganda',
    description: 'Economic Outlook 2026 & National Budget Breakdown.',
    state: 'past',
    progress: 0,
    duration: 180,
    thumbnail: ''
  },
  {
    id: 3,
    time: '10:00 AM',
    title: 'Inside Uganda',
    description: 'Cultural Heritage & The Artisans of Kasubi.',
    state: 'current',
    progress: 65, // 65% completed
    duration: 120,
    thumbnail: ''
  },
  {
    id: 4,
    time: '12:00 PM',
    title: 'Lunchtime News Brief',
    description: 'Midday updates on local and global news.',
    state: 'future',
    progress: 0,
    duration: 60,
    thumbnail: ''
  },
  {
    id: 5,
    time: '01:00 PM',
    title: 'Base2 Entertainment',
    description: 'Kampala Music Scene Showcase & Live Studio Jam.',
    state: 'future',
    progress: 0,
    duration: 180,
    thumbnail: ''
  },
  {
    id: 6,
    time: '04:00 PM',
    title: 'Base2 Sports',
    description: 'Uganda Cranes AFCON Preparation & Highlights.',
    state: 'future',
    progress: 0,
    duration: 120,
    thumbnail: ''
  }
];
