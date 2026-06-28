import type { PersonalitySignals } from "./storage";

export type QuizDefinition = {
  bucket: string;
  keyName: string;
  bucketLabel: string;
  title: string;
  helper: string;
  options: string[];
  limit?: number;
};

const bandOptionsByGenre: Record<string, string[]> = {
  Indie: [
    "The War on Drugs",
    "LCD Soundsystem",
    "Vampire Weekend",
    "The National",
    "Alvvays",
    "Wilco",
    "Big Thief",
    "Father John Misty",
  ],
  Country: [
    "Zach Bryan",
    "Tyler Childers",
    "Jason Isbell",
    "Sturgill Simpson",
    "Chris Stapleton",
    "Turnpike Troubadours",
    "Charley Crockett",
    "Sierra Ferrell",
  ],
  "Hip-hop": [
    "Run the Jewels",
    "Kendrick Lamar",
    "A Tribe Called Quest",
    "Outkast",
    "J. Cole",
    "Nas",
    "Beastie Boys",
    "Wu-Tang Clan",
  ],
  Punk: [
    "IDLES",
    "The Clash",
    "Bad Religion",
    "The Menzingers",
    "Turnstile",
    "Rancid",
    "Viagra Boys",
    "The Gaslight Anthem",
  ],
  Jam: [
    "Phish",
    "Grateful Dead",
    "Goose",
    "Billy Strings",
    "Widespread Panic",
    "Tedeschi Trucks Band",
    "Khruangbin",
    "King Gizzard",
  ],
  Jazz: [
    "Miles Davis",
    "John Coltrane",
    "Kamasi Washington",
    "BADBADNOTGOOD",
    "The Bad Plus",
    "Herbie Hancock",
    "Snarky Puppy",
    "Cory Wong",
  ],
  Metal: [
    "Metallica",
    "Tool",
    "Mastodon",
    "Black Sabbath",
    "Deftones",
    "Gojira",
    "Iron Maiden",
    "Sleep",
  ],
  Folk: [
    "Fleet Foxes",
    "Gregory Alan Isakov",
    "Bon Iver",
    "The Head and the Heart",
    "Watchhouse",
    "Iron & Wine",
    "Noah Kahan",
    "Caamp",
  ],
};

const baseQuizzes: QuizDefinition[] = [
  {
    bucket: "live_music_interest",
    keyName: "genres",
    bucketLabel: "Live music",
    title: "Live music lanes",
    helper: "Genres worth surfacing when local shows come in.",
    options: ["Indie", "Country", "Hip-hop", "Punk", "Jam", "Jazz", "Metal", "Folk"],
  },
  {
    bucket: "live_music_interest",
    keyName: "venues",
    bucketLabel: "Live music",
    title: "Spokane venues",
    helper: "Places you would realistically go for a show.",
    options: [
      "Knitting Factory",
      "The Big Dipper",
      "Lucky You",
      "The Chameleon",
      "Bing Crosby Theater",
      "Riverfront Park",
    ],
  },
  {
    bucket: "live_music_interest",
    keyName: "concert_style",
    bucketLabel: "Live music",
    title: "Concert style",
    helper: "How you prefer music plans to work.",
    options: [
      "Buy tickets early",
      "Day-of decision",
      "Outdoor only",
      "Small venues",
      "Sit-down show",
      "Late night is fine",
    ],
  },
  {
    bucket: "sports_interest",
    keyName: "local_team",
    bucketLabel: "Sports",
    title: "Local teams",
    helper: "Spokane and regional teams you would watch or attend.",
    options: [
      "Spokane Indians",
      "Spokane Chiefs",
      "Spokane Velocity",
      "Mariners",
      "Seahawks",
      "Kraken",
      "Storm",
      "Future Sonics",
      "UW",
      "WSU",
      "Gonzaga",
    ],
  },
  {
    bucket: "sports_interest",
    keyName: "sport_team",
    bucketLabel: "Sports",
    title: "Pro teams",
    helper: "Teams that should influence watch plans.",
    options: [
      "Mariners",
      "Seahawks",
      "Kraken",
      "Storm",
      "Future Sonics",
      "Sounders",
      "Trail Blazers",
      "Other",
    ],
  },
  {
    bucket: "sports_interest",
    keyName: "sports_to_watch",
    bucketLabel: "Sports",
    title: "Sports to watch",
    helper: "Good candidates for brewery or house watch plans.",
    options: ["Baseball", "Football", "Hockey", "Soccer", "Basketball", "MMA", "Golf", "F1"],
  },
  {
    bucket: "sports_interest",
    keyName: "sports_to_play",
    bucketLabel: "Sports",
    title: "Sports to play",
    helper: "Activities that could become recurring plans.",
    options: ["Pickleball", "Basketball", "Golf", "Soccer", "Running", "Softball", "Tennis", "Disc golf"],
  },
  {
    bucket: "sports_interest",
    keyName: "fantasy_interest",
    bucketLabel: "Sports",
    title: "Fantasy sports",
    helper: "Useful for leagues, drafts, and watch-thread matching.",
    options: ["NFL", "MLB", "NBA", "NHL", "Premier League", "No thanks"],
  },
  {
    bucket: "games_interest",
    keyName: "board_games",
    bucketLabel: "Games",
    title: "Board games",
    helper: "Games you would play with people you do not know well yet.",
    options: ["Catan", "Ticket to Ride", "Azul", "Wingspan", "Codenames", "Risk", "Carcassonne", "Sequence"],
  },
  {
    bucket: "games_interest",
    keyName: "card_games",
    bucketLabel: "Games",
    title: "Card games",
    helper: "Cards, gambling-adjacent, and table games.",
    options: ["Poker", "Euchre", "Hearts", "Spades", "Cribbage", "Magic", "Uno", "No cards"],
  },
  {
    bucket: "games_interest",
    keyName: "video_games",
    bucketLabel: "Games",
    title: "Video games",
    helper: "Useful for online nights or arcade-adjacent plans.",
    options: ["Mario Kart", "Smash", "Halo", "FIFA", "Madden", "Fortnite", "Rocket League", "No video games"],
  },
  {
    bucket: "games_interest",
    keyName: "tabletop_games",
    bucketLabel: "Games",
    title: "Tabletop RPGs",
    helper: "Longer-running game interest.",
    options: ["D&D", "Pathfinder", "Warhammer", "Miniatures", "One-shot only", "Curious but new", "No thanks"],
  },
  {
    bucket: "outdoors_interest",
    keyName: "parks",
    bucketLabel: "Outdoors",
    title: "Parks",
    helper: "Places you would meet for a kid-friendly or outdoor plan.",
    options: ["Manito", "Riverfront", "Comstock", "Jefferson", "Ice Age", "Audubon", "Mirabeau", "Palisades"],
  },
  {
    bucket: "outdoors_interest",
    keyName: "activities",
    bucketLabel: "Outdoors",
    title: "Outdoor activities",
    helper: "Low-friction outdoor plan types.",
    options: ["Walk", "Hike", "Bike", "Playground", "Dog park", "Sledding", "Pool", "Fishing"],
  },
  {
    bucket: "food_drink_interest",
    keyName: "breweries",
    bucketLabel: "Food and drink",
    title: "Breweries",
    helper: "Venues you would use for a simple plan.",
    options: ["Brick West", "Uprise", "Lumberbeard", "No-Li", "Whistle Punk", "Iron Goat", "YaYa", "Perry Street"],
  },
  {
    bucket: "food_drink_interest",
    keyName: "coffee",
    bucketLabel: "Food and drink",
    title: "Coffee",
    helper: "Coffee plans and morning meetup fit.",
    options: ["Indaba", "Thomas Hammer", "Ladder", "Rocket", "Meeting House", "Wake Up Call", "Drive-thru only"],
  },
  {
    bucket: "food_drink_interest",
    keyName: "food",
    bucketLabel: "Food and drink",
    title: "Food plans",
    helper: "Useful for lunch, dinner, and kid-friendly defaults.",
    options: ["Pizza", "Burgers", "Tacos", "Wings", "Breakfast", "Food trucks", "Kid-friendly only"],
  },
  {
    bucket: "family_interest",
    keyName: "kid_activities",
    bucketLabel: "Family",
    title: "Kid activities",
    helper: "Plans that can work with kids in tow.",
    options: ["Playgrounds", "Splash pads", "Aquatics", "Library", "Arcade", "Movie matinee", "Museum", "Hike"],
  },
  {
    bucket: "schedule_interest",
    keyName: "planning_style",
    bucketLabel: "Schedule",
    title: "Planning style",
    helper: "How much notice makes a plan usable.",
    options: ["Same day", "One day notice", "Three days", "One week", "Recurring only", "Calendar invite required"],
  },
];

function genreBandQuiz(genre: string): QuizDefinition {
  const key = genre.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return {
    bucket: "live_music_interest",
    keyName: `bands.${key}`,
    bucketLabel: "Live music",
    title: `Favorite ${genre} bands`,
    helper: "Pick up to five, or add one that is missing.",
    limit: 5,
    options: bandOptionsByGenre[genre] ?? [],
  };
}

export function buildQuizzes(signals: PersonalitySignals) {
  const selectedGenres = signals.live_music_interest?.genres ?? [];
  const bandQuizzes = selectedGenres.map(genreBandQuiz);
  const liveMusicGenreIndex = baseQuizzes.findIndex(
    (quiz) => quiz.bucket === "live_music_interest" && quiz.keyName === "genres",
  );
  return [
    ...baseQuizzes.slice(0, liveMusicGenreIndex + 1),
    ...bandQuizzes,
    ...baseQuizzes.slice(liveMusicGenreIndex + 1),
  ];
}

export function quizValues(signals: PersonalitySignals, quiz: QuizDefinition) {
  return signals[quiz.bucket]?.[quiz.keyName] ?? [];
}

export function toggleSignal(
  signals: PersonalitySignals,
  quiz: QuizDefinition,
  value: string,
) {
  const current = quizValues(signals, quiz);
  const exists = current.includes(value);
  const bucketSignals = signals[quiz.bucket] ?? {};
  if (exists) {
    return {
      ...signals,
      [quiz.bucket]: {
        ...bucketSignals,
        [quiz.keyName]: current.filter((item) => item !== value),
      },
    };
  }
  if (quiz.limit && current.length >= quiz.limit) return signals;
  return {
    ...signals,
    [quiz.bucket]: {
      ...bucketSignals,
      [quiz.keyName]: [...current, value],
    },
  };
}

export function selectedCount(signals: PersonalitySignals) {
  return Object.values(signals).reduce(
    (bucketTotal, bucketSignals) =>
      bucketTotal +
      Object.values(bucketSignals).reduce(
        (signalTotal, values) => signalTotal + values.length,
        0,
      ),
    0,
  );
}

export function bucketSummary(signals: PersonalitySignals) {
  const knownQuizzes = buildQuizzes(signals);
  return Object.entries(signals).flatMap(([bucket, bucketSignals]) =>
    Object.entries(bucketSignals)
      .filter(([, values]) => values.length)
      .map(([keyName, values]) => {
        const definition = knownQuizzes.find(
          (quiz) => quiz.bucket === bucket && quiz.keyName === keyName,
        );
        return {
          bucket,
          keyName,
          bucketLabel: definition?.bucketLabel ?? bucket.replaceAll("_", " "),
          title: definition?.title ?? keyName.replaceAll("_", " "),
          values,
        };
      }),
  );
}

export function validateCustomAnswer(
  value: string,
  quiz: QuizDefinition,
  signals: PersonalitySignals,
) {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length < 2) return "Use at least 2 characters.";
  if (trimmed.length > 40) return "Keep it under 40 characters.";
  if (!/^[a-zA-Z0-9 '&./+-]+$/.test(trimmed)) {
    return "Use letters, numbers, spaces, and simple punctuation.";
  }
  const normalized = trimmed.toLowerCase();
  const selected = quizValues(signals, quiz);
  const existing = [...quiz.options, ...selected].map((item) =>
    item.toLowerCase(),
  );
  if (existing.includes(normalized)) return "That answer is already listed.";
  if (quiz.limit && selected.length >= quiz.limit) {
    return `Remove one first. This question allows ${quiz.limit}.`;
  }
  return null;
}
