import type { CoachAdvice, LogEntry, UserProfile } from './types';
import {
  countType,
  hygieneKinds,
  latestMoodScore,
  mealsByKind,
  movementMinutes,
  sleepMinutesForDay,
  smokingCount,
  sumWaterMl,
} from './scoring';
import { GLASS_ML } from './types';
import { getLocalMinutes } from './timezone';

export function buildCoachAdvice(
  entries: LogEntry[],
  profile: UserProfile,
  now: Date,
): CoachAdvice {
  const live = entries.filter((e) => !e.deletedAt);
  const priorities: CoachAdvice['priorities'] = [];
  const waterMl = sumWaterMl(live);
  const waterLeftMl = Math.max(0, profile.waterGoalMl - waterMl);
  const glassesLeft = Math.ceil(waterLeftMl / GLASS_ML);
  const move = movementMinutes(live);
  const sleep = sleepMinutesForDay(live);
  const meals = mealsByKind(live);
  const minutes = getLocalMinutes(now, profile.timezone);
  const care = hygieneKinds(live);

  if (waterMl < profile.waterGoalMl * 0.75 && glassesLeft > 0) {
    priorities.push({
      emoji: '💧',
      text: `Drink ${Math.min(glassesLeft, 3)} more glass${glassesLeft === 1 ? '' : 'es'} of water`,
      reason: `You're at ${Math.round(waterMl / GLASS_ML)} of ${Math.round(profile.waterGoalMl / GLASS_ML)} glasses.`,
    });
  }

  if (move < Math.min(15, profile.exerciseGoalMinutes)) {
    priorities.push({
      emoji: '🚶',
      text: 'Take a 15-minute walk',
      reason: move > 0 ? `You've moved for ${move} min so far.` : 'A short walk is an easy lift for today.',
    });
  }

  if (sleep === 0 && minutes >= 20 * 60) {
    priorities.push({
      emoji: '🌙',
      text: 'Log last night’s sleep and ease toward your wind-down',
      reason: 'A rough estimate is enough.',
    });
  } else if (sleep > 0 && sleep < profile.sleepGoalMinutes - 30 && minutes >= 20 * 60) {
    priorities.push({
      emoji: '🌙',
      text: 'Try to get closer to your sleep goal tonight',
      reason: `Last night was ${Math.round(sleep / 60)}h toward your ${Math.round(profile.sleepGoalMinutes / 60)}h goal.`,
    });
  }

  const hour = Math.floor(minutes / 60);
  if (hour >= 8 && hour < 11 && !meals.has('breakfast')) {
    priorities.push({ emoji: '🍳', text: 'Have a simple breakfast when you can', reason: 'Breakfast is not logged yet.' });
  }
  if (hour >= 13 && hour < 16 && !meals.has('lunch')) {
    priorities.push({ emoji: '🍱', text: 'Check in on lunch', reason: 'Lunch is not logged yet.' });
  }
  if (hour >= 19 && !meals.has('dinner')) {
    priorities.push({ emoji: '🍽', text: 'Have dinner when you’re ready', reason: 'Dinner is not logged yet.' });
  }

  if (countType(live, 'vegetables') === 0 && meals.size > 0) {
    priorities.push({
      emoji: '🥗',
      text: 'Add a vegetable to your next meal',
      reason: 'No vegetables logged yet today.',
    });
  }

  if (!care.has('brush') && minutes >= 8 * 60) {
    priorities.push({ emoji: '🪥', text: 'Brush your teeth when it fits', reason: 'A tiny personal-care win.' });
  }

  const mood = latestMoodScore(live);
  if (mood !== undefined && mood <= 4 && countType(live, 'relax') === 0) {
    priorities.push({
      emoji: '🧘',
      text: 'Take 5 minutes to reset',
      reason: 'A short pause can take the edge off.',
    });
  }

  if (profile.smokingGoalPerDay !== undefined) {
    const smoked = smokingCount(live);
    if (smoked > profile.smokingGoalPerDay) {
      priorities.push({
        emoji: '🌿',
        text: 'Pause before the next cigarette if you can',
        reason: `You're currently above your personal target of ${profile.smokingGoalPerDay}/day.`,
      });
    }
  }

  const unique = priorities.slice(0, 3);
  const loggedALot = live.length >= 6 && unique.length <= 1;
  const greeting = live.length === 0
    ? 'Nothing logged yet — that’s okay. Pick one tiny thing.'
    : loggedALot
      ? "You've already done most of your basics today."
      : unique.length === 0
        ? "You're doing pretty well today."
        : live.length >= 3
          ? "You're doing pretty well today."
          : 'Nice start. Here’s a gentle next step.';

  const easiest = unique[0]
    ? unique.length === 1
      ? `Your easiest improvement: ${unique[0].text}.`
      : undefined
    : move < 15
      ? 'Your easiest improvement: Take a 10-minute walk.'
      : undefined;

  return { greeting, priorities: unique, easiest };
}
