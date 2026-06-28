const userKey = "dadbuds:userId";
const emailKey = "dadbuds:email";
const authTokenKey = "dadbuds:authToken";
const personalityPromptDismissedKey = "dadbuds:personalityPromptDismissed";
const personalitySignalsKey = "dadbuds:personalitySignals";

export function saveLocalUser(userId: number, email: string, authToken?: string) {
  localStorage.setItem(userKey, String(userId));
  localStorage.setItem(emailKey, email);
  if (authToken) localStorage.setItem(authTokenKey, authToken);
}

export function getLocalUserId() {
  const value = localStorage.getItem(userKey);
  return value ? Number(value) : null;
}

export function getLocalEmail() {
  return localStorage.getItem(emailKey) ?? "";
}

export function getAuthToken() {
  return localStorage.getItem(authTokenKey) ?? "";
}

export function clearLocalUser() {
  localStorage.removeItem(userKey);
  localStorage.removeItem(emailKey);
  localStorage.removeItem(authTokenKey);
}

export type PersonalitySignals = Record<string, Record<string, string[]>>;

const emptyPersonalitySignals: PersonalitySignals = {
  live_music_interest: {
    bands: [],
    genres: [],
    venues: [],
    concert_style: [],
  },
  sports_interest: {
    local_team: [],
    sport_team: [],
    sports_to_watch: [],
    sports_to_play: [],
    fantasy_interest: [],
  },
  games_interest: {
    board_games: [],
    card_games: [],
    video_games: [],
    tabletop_games: [],
  },
  outdoors_interest: {
    parks: [],
    activities: [],
  },
  food_drink_interest: {
    breweries: [],
    coffee: [],
    food: [],
  },
  family_interest: {
    kid_activities: [],
  },
  schedule_interest: {
    planning_style: [],
  },
};

export function getPersonalityPromptDismissed() {
  return localStorage.getItem(personalityPromptDismissedKey) === "true";
}

export function dismissPersonalityPrompt() {
  localStorage.setItem(personalityPromptDismissedKey, "true");
}

export function getPersonalitySignals(): PersonalitySignals {
  const fallback = structuredClone(emptyPersonalitySignals);
  const value = localStorage.getItem(personalitySignalsKey);
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value) as PersonalitySignals & {
      bands?: string[];
      localTeams?: string[];
      sportsTeams?: string[];
      games?: string[];
    };
    const migrated = structuredClone(fallback);
    for (const [bucket, bucketSignals] of Object.entries(parsed)) {
      if (!bucketSignals || Array.isArray(bucketSignals)) continue;
      migrated[bucket] = {
        ...(migrated[bucket] ?? {}),
        ...bucketSignals,
      };
    }
    if (parsed.bands?.length) {
      migrated.live_music_interest.bands = parsed.bands;
    }
    if (parsed.localTeams?.length) {
      migrated.sports_interest.local_team = parsed.localTeams;
    }
    if (parsed.sportsTeams?.length) {
      migrated.sports_interest.sport_team = parsed.sportsTeams;
    }
    if (parsed.games?.length) {
      migrated.games_interest.board_games = parsed.games;
    }
    return migrated;
  } catch {
    return fallback;
  }
}

export function savePersonalitySignals(signals: PersonalitySignals) {
  localStorage.setItem(personalitySignalsKey, JSON.stringify(signals));
}
