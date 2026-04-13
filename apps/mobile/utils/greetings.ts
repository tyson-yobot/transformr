type TimeSlot = 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'late_night';

interface Greeting {
  text: string;
  timeSlot: TimeSlot;
}

interface GreetingResult {
  text: string;
  timeLabel: string;
}

const greetings: Greeting[] = [
  // Early morning (4-7 AM) — 10 greetings
  { text: 'Most people hit snooze. You chose to show up.', timeSlot: 'early_morning' },
  { text: 'Dark outside, fire inside. Let that carry you today.', timeSlot: 'early_morning' },
  { text: 'The alarm was a choice. You made the right one.', timeSlot: 'early_morning' },
  { text: 'Discipline got you out of bed. Let it run the rest.', timeSlot: 'early_morning' },
  { text: 'Nobody is watching at this hour. That is the point.', timeSlot: 'early_morning' },
  { text: 'You are building while the world is sleeping.', timeSlot: 'early_morning' },
  { text: 'Early hours, earned results. Stack them up.', timeSlot: 'early_morning' },
  { text: 'The gap between you and them grows at 5 AM.', timeSlot: 'early_morning' },
  { text: 'Silence is your advantage right now. Use every minute.', timeSlot: 'early_morning' },
  { text: 'No applause at this hour. Just progress.', timeSlot: 'early_morning' },

  // Morning (7 AM-12 PM) — 10 greetings
  { text: 'Today has no idea what you are about to do to it.', timeSlot: 'morning' },
  { text: 'Pick your hardest task. Do it first. No negotiations.', timeSlot: 'morning' },
  { text: 'You have the whole day in front of you. Attack it.', timeSlot: 'morning' },
  { text: 'Momentum starts with the first rep. This is yours.', timeSlot: 'morning' },
  { text: 'Good morning. Time to turn intentions into actions.', timeSlot: 'morning' },
  { text: 'New day, same mission. Execute with precision.', timeSlot: 'morning' },
  { text: 'The best version of today starts right now.', timeSlot: 'morning' },
  { text: 'No warm-up rounds today. Go full speed from the jump.', timeSlot: 'morning' },
  { text: 'Every hour today is an opportunity. Spend them wisely.', timeSlot: 'morning' },
  { text: 'Set the tone for today before the world sets it for you.', timeSlot: 'morning' },

  // Afternoon (12-5 PM) — 10 greetings
  { text: 'Halfway through is not a finish line. Keep pushing.', timeSlot: 'afternoon' },
  { text: 'The afternoon slump is a test. Pass it.', timeSlot: 'afternoon' },
  { text: 'Good enough is a trap. Finish what you started today.', timeSlot: 'afternoon' },
  { text: 'Most people coast after lunch. You are not most people.', timeSlot: 'afternoon' },
  { text: 'Your morning self made promises. Keep them.', timeSlot: 'afternoon' },
  { text: 'The day is not over. Neither are you.', timeSlot: 'afternoon' },
  { text: 'Second wind incoming. Channel it into your next task.', timeSlot: 'afternoon' },
  { text: 'Coasting kills progress. Stay sharp this afternoon.', timeSlot: 'afternoon' },
  { text: 'You still have hours left. Make them count for something.', timeSlot: 'afternoon' },
  { text: 'Fatigue is temporary. The work you do now compounds.', timeSlot: 'afternoon' },

  // Evening (5-10 PM) — 8 greetings
  { text: 'You showed up today. That matters more than you think.', timeSlot: 'evening' },
  { text: 'Review what you built today. Tomorrow you build on it.', timeSlot: 'evening' },
  { text: 'The day is winding down. You earned whatever comes next.', timeSlot: 'evening' },
  { text: 'Rest is not quitting. It is reloading for tomorrow.', timeSlot: 'evening' },
  { text: 'Look back at today and find one thing you are proud of.', timeSlot: 'evening' },
  { text: 'Tonight, recover. Tomorrow, go harder.', timeSlot: 'evening' },
  { text: 'Progress is not always loud. Sometimes it is a quiet Tuesday.', timeSlot: 'evening' },
  { text: 'You put in the work. Let the evening be yours.', timeSlot: 'evening' },

  // Late night (10 PM-4 AM) — 2 greetings
  { text: 'If you are grinding, set a hard stop. Burnout is real.', timeSlot: 'late_night' },
  { text: 'Sleep is not weakness. It is how you come back stronger.', timeSlot: 'late_night' },
];

const timeSlotLabels: Record<TimeSlot, string> = {
  early_morning: 'Early Morning',
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  late_night: 'Late Night',
};

function getCurrentTimeSlot(): TimeSlot {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 7) return 'early_morning';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'late_night';
}

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export function getTodayGreeting(): GreetingResult {
  const timeSlot = getCurrentTimeSlot();
  const slotGreetings = greetings.filter((g) => g.timeSlot === timeSlot);
  const dayOfYear = getDayOfYear();
  const index = dayOfYear % slotGreetings.length;
  const selected = slotGreetings[index] ?? slotGreetings[0];

  return {
    text: selected ? selected.text : 'Hello',
    timeLabel: timeSlotLabels[timeSlot],
  };
}
