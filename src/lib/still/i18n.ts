import type { Emotion, Locale, LockReason, Side } from "./types";

const en = {
  brandSub: "Gold desk",
  navDesk: "Desk",
  navGate: "Gate",
  navJournal: "Journal",
  navPlaybook: "Playbook",
  navBook: "Book",
  signIn: "Sign in",
  signOut: "Sign out",
  langEn: "EN",
  langNp: "NP",
  langSwitchToEn: "English",
  langSwitchToNp: "Nepali",

  hero: "When you lose, you stop.",
  heroBody:
    "Still is a gold desk that remembers the rule after the first red candle — because that is the trade that blanks the book.",
  sessWeekend: "Weekend",
  sessWeekendHint: "Gold is thin. The desk can wait for London.",
  sessOverlap: "London–NY overlap",
  sessOverlapHint: "This is the gold window. One planned trade is enough.",
  sessLondon: "London",
  sessLondonHint: "Sweeps of Asia happen here. Do not invent a second idea.",
  sessNy: "New York",
  sessNyHint: "Continuation or reversal of London. Size stays 1%.",
  sessAsia: "Asia",
  sessAsiaHint: "Range-building. Usually not a gold hunting hour.",
  sessOff: "Off-window",
  sessOffHint: "If you do not already have a level, you do not need a trade.",

  xau: "XAUUSD",
  spot: "Spot",
  futures: "Futures",
  marketClosed: "Gold is shut. This is the last print.",
  marketLive: "Live spot",
  tapeFail: "Tape is quiet. Type the print yourself.",
  useLive: "Use live {price}",
  botName: "Watchman",
  botNeverClicks: "This bot never clicks. It never spends the book. It only tells you to sit.",
  botWeekend: "Weekend. The bot is asleep. Gold will still be there on London.",
  botLocked: "The desk is locked. The bot will not invent a setup to open it.",
  botAfterLoss: "Last trade was red. The bot’s only call is sit.",
  botOpenPlan: "You already have a plan. Do not add a second idea.",
  botNeedSession: "Open a session first. The bot will not hunt without a lock on size.",
  botOffWindow: "This is not a gold hunting hour. Watch. Do not click.",
  botAsia: "Asia is building the box. Usually not the hunt.",
  botNearLevel: "Price is sitting on a round number. Name the pattern, or do not trade.",
  botWatch: "Tape is live. No automatic setup. You still have to name it.",
  botNoQuote: "No live print yet. The bot waits with you.",
  botStateDown: "Sit",
  botStateWait: "Wait",
  botStateWatch: "Watch",
  botStateName: "Name it",

  trueBook: "True book",
  friendsThink: "Friends think {amount}",
  risk1: "1% risk",
  habitHint: "A 3k–4k load is a habit, not a size",
  sampleEquity: "Sample equity",
  from80k: "From an 80k start, after the week",
  verdict: "The verdict",
  verdictDesc: "You asked if it was discipline or the patterns. The book already knows.",
  rulesFollowed: "Rules followed",
  rulesBroken: "Rules broken",
  nTrades: "{n} trades",
  plannedLosses:
    "Planned losses exist. {n} of them sit inside the followed column. The hole is the other column — {revenge} revenge or post-loss trades for {pnl}. The candles were not the weakness. Not stopping was.",
  includesPlanned: "Includes the planned losses",
  thisIsBlank: "This is the blank",
  equity: "Equity",
  book: "Book",
  openSession: "Open session",
  locked: "Locked",
  live: "Live",
  sessionLimitsLine: "Max loss {loss} · {trades} trades · stop after {losses} losses",
  lossBudget: "Loss budget used",
  tradesUsed: "Trades used",
  openTheLock: "Open the lock",
  planNext: "Plan the next gold trade",
  openASession: "Open a session",
  readTheWeek: "Read the week",
  recentGold: "Recent gold",
  unnamed: "Unnamed",
  rulesHeld: "Rules held",
  afterALoss: "after a loss",
  open: "Open",
  deskLocked: "Desk locked",
  cooldownReady: "has elapsed — close the session with a review.",
  cooldownLeft: "{left} remaining.",
  writeReview: "Write the review before gold gets another vote.",
  doTheReview: "Do the review",

  lockMaxLoss: "Daily loss limit hit. The desk is closed.",
  lockMaxTrades: "Trade count for this session is used up.",
  lockConsecutive: "Two losses. You do not take the third.",
  lockCooldown: "Cooldown after a loss. Sit with it.",
  lockManual: "You locked the desk. That was the right call.",
  lockWeekend: "Weekend. Gold will still be there on London.",

  calm: "Calm",
  fear: "Fear",
  revenge: "Revenge",
  fomo: "Chasing",
  long: "Long",
  short: "Short",

  sessionGate: "Session gate",
  openTheDesk: "Open the desk",
  openDeskBody:
    "Gold does not need you every hour. If you open a session, you accept the limits before the first candle.",
  perTradeRisk: "Per-trade risk",
  dailyLossCap: "Daily loss cap",
  maxTrades: "Max trades",
  stopAfter: "Stop after",
  nLosses: "{n} losses",
  lossCooldown: "Loss cooldown",
  nMinutes: "{n} minutes",
  acceptLimits: "I accept the limits",

  pretradeLock: "Pre-trade lock",
  nameIt: "Name it, or do not click.",
  nameItBody: "Every box is the rule you forget when the candle turns. Check them slowly.",
  state: "State",
  stateDesc: "If it is not calm, the gate stays shut.",
  pattern: "Pattern",
  patternDesc: "If you cannot name it, there is no trade.",
  invalidWhen: "Invalid when",
  sizeFromBook: "Size from the true book",
  sizeFromBookDesc:
    "Risk is locked at {pct}% — {amount}. Habit loads of 3k–4k are refused.",
  entry: "Entry (XAUUSD)",
  stop: "Stop",
  target: "Target",
  stopDistance: "Stop distance",
  position: "Position",
  risk: "Risk",
  rewardRisk: "Reward / risk",
  habitRefuse: "That size is how a book goes blank. The gate will not pass it.",
  rulesYouForget: "The rules you forget",
  whyTrade: "Why this trade exists",
  whyTradePh: "One sentence. If it takes a paragraph, you do not have it.",
  lockThePlan: "Lock the plan",
  lockMyself: "Lock myself out",
  endSession: "End session",
  plannedToast: "Trade is planned. Do not add a second idea.",

  openPlan: "Open plan",
  longGold: "Long gold",
  shortGold: "Short gold",
  exit: "Exit",
  pnl: "P&L ({cur})",
  didIKeep: "Did I keep this?",
  whatHappened: "What actually happened.",
  enterPnl: "Enter the P&L as a number.",
  lossLogged: "Loss logged. Desk may lock.",
  winLogged: "Win logged. Do not invent a second trade.",
  closeAndLog: "Close and log",
  cancelPlan: "Cancel the plan — I did not take it",

  sitWithLoss: "Sit with the loss.",
  reviewReady: "Cooldown is over. You still write the review before gold gets another vote.",
  reviewWait: "Cooldown {left}. The review can be written now.",
  session: "Session",
  brokeRuleQ: "Did I break a rule?",
  patternValidQ: "Was the first pattern actually valid?",
  nextTime: "What I will do differently",
  nextTimePh: "One concrete action. Not 'be more disciplined.'",
  closeSession: "Close the session",
  yes: "Yes",
  no: "No",

  journal: "Journal",
  journalHero: "Every gold trade, written down.",
  journalBody:
    "Memory is kind to revenge. The journal is not. {closed} closed trades in this book — {held} held the rules, {broken} did not.",
  filterAll: "All",
  filterHeld: "Rules held",
  filterBroken: "Rules broken",
  journalEmpty: "No trades in this filter. The next one gets written the moment it is closed.",
  held: "Held",
  broken: "Broken",
  afterLossBadge: "After a loss",

  playbook: "Playbook",
  playbookHero: "Study the pattern. Obey the rule.",
  playbookBody:
    "You already know a lot about candles. The missing piece is a written pattern and a rule that still exists after the first loss.",
  rulesSurvive: "Rules that survive the click",
  ruleN: "Rule {n}",
  remove: "Remove",
  addRulePh: "Add a rule in your own words",
  add: "Add",
  goldPatterns: "Gold patterns",
  unused: "Unused",
  patternStats: "{wins}/{count} wins · followed {followed} · broken {broken}",

  theBook: "The book",
  capitalHero: "Size from the number you hid.",
  capitalBody:
    "Friends heard {story}. The real book is {true}. Honesty is a position-sizing tool.",
  trueCapital: "True capital",
  trueCapitalDesc: "The desk only sizes from this number.",
  whatWeCall: "What we call you",
  whatFriendsThink: "What friends think",
  gapLine:
    "{gap} is the gap between the story and the book. Size from the book. Protect the gap.",
  habitTitle: "The 3k–4k habit",
  habitDesc: "You said you usually load 3k–4k and never saw how it went blank. Here is how.",
  habitLoad: "Habit load",
  habitMath: "A {amount} load is {pct} of the true book.",
  habitAllowed:
    "Allowed risk is {risk} ({pct}%). On an $8 gold stop that is {lots} lot — not a 3k swing.",
  habitTwo:
    "Two habit loads in a row is how 80 becomes a number you stop telling people.",
  sessionLimits: "Session limits",
  riskPct: "Risk %",
  dailyLossPct: "Daily loss %",
  lossesThenStop: "Losses then stop",
  cooldownMin: "Cooldown (min)",
  reloadSample: "Reload the sample week",
  wipeBook: "Wipe the book and start honest",

  alertsTitle: "Watchman alerts",
  alertsDesc:
    "Nepal number and email. Watchman pings sit, London, and round-number — never buy or sell.",
  phoneLabel: "Phone (Nepal)",
  phonePh: "+977 98xxxxxxxx",
  emailLabel: "Email",
  emailPh: "you@email.com",
  phoneBad: "Use a Nepal mobile — +977 97 or 98, ten digits.",
  emailBad: "That does not look like an email.",
  channelSms: "SMS draft",
  channelEmail: "Email draft",
  channelPush: "Phone notification",
  whenSit: "When Watchman says sit",
  whenLevel: "When gold sits on a round number",
  whenLondon: "When London / overlap opens",
  saveContact: "Save contact",
  contactSaved: "Saved on this phone.",
  testSms: "Test SMS",
  testEmail: "Test email",
  allowPush: "Allow notifications",
  pushOn: "Notifications allowed",
  pushDenied: "Notifications blocked by the phone.",
  alertsHow:
    "Alerts land in this book. If notifications are on, Watchman taps the phone. Test SMS / email opens a message to yourself so the number is proven. It will never text a buy.",
  inboxEmpty: "No alerts yet. Watchman writes here when it speaks.",
  sendThisSms: "Text this",
  sendThisEmail: "Email this",
  replayTutorial: "Replay the tutorial",
  howLink: "How this works",
  unreadN: "{n} new",

  claimKicker: "Your desk",
  claimTitle: "Put your name on it.",
  claimBody:
    "The week on this desk is a sample, so you can see how a book goes blank. Write the true number. Add a Nepal phone. Watchman still never clicks.",
  claimStudy: "Study the sample week",
  claimFresh: "Start my honest book",
  installTitle: "Put Still on the phone",
  installBody:
    "Open this page on the phone. Then add it to the Home Screen so it sits next to the broker — not inside a chat thread.",
  installIos: "iPhone: Share → Add to Home Screen",
  installAndroid: "Android: Chrome menu → Install app",
  copyLink: "Copy this page",
  linkCopied: "Link copied",
  fromExit: "From the exit",
  useLiveExit: "Use live {price} as exit",

  tutKicker: "How this works",
  tutSkip: "Skip",
  tutBack: "Back",
  tutNext: "Next",
  tutDone: "I understand",
  tutStep: "{n} / {of}",
  "tut.1.title": "This is Still.",
  "tut.1.body":
    "A gold-only desk. It remembers the rule after the first red candle — because that is the trade that blanks the book.",
  "tut.2.title": "It will not trade for you.",
  "tut.2.body":
    "No bot clicks. No broker. No 3k–4k load fired while you sleep. You still name the pattern. Watchman only tells you to sit.",
  "tut.3.title": "Size from the number you hid.",
  "tut.3.body":
    "Friends heard 30k. The real book is more than 80k. The desk sizes 1% from the true number. A habit load is refused.",
  "tut.4.title": "The gate is the point.",
  "tut.4.body":
    "Before every gold trade: calm, name the pattern, write the stop, check the rules you forget. Two losses — no third. After a red trade, you sit.",
  "tut.5.title": "The tape is live. Watchman speaks.",
  "tut.5.body":
    "XAUUSD prints here. Watchman watches the session, the last loss, and round numbers. It never says buy. On a weekend it sleeps.",
  "tut.6.title": "It can tap your phone.",
  "tut.6.body":
    "Put your Nepal number and email on the Book page. Watchman alerts sit, London, and a round-number — in this desk, and as a notification. Never a buy ping.",
  "tut.7.title": "EN or NP. Then add it to the phone.",
  "tut.7.body":
    "Switch language any time. Share → Add to Home Screen. When you lose, you stop. Harauda, timi rok.",

  loginKicker: "Still · Gold desk",
  loginTitle: "Sign in",
  loginBody:
    "Optional. The desk already works on this device. Sign in if you want the same book on another one later.",
  continueWith: "Continue with {label}",
  signInDisabled: "Sign-in is disabled.",
  backToDesk: "Back to the desk",

  errNeedSession: "Open a session first.",
  errDeskLocked: "The desk is locked. Finish the review or wait out the cooldown.",
  errOpenPlan: "Close or cancel the open plan first.",
  errTradeLimit: "Session trade limit reached.",
  errRules: "Every required rule must be checked. That is the point.",
  errNamePattern: "Name the pattern.",
  errThesis: "Write why this trade exists.",
  errEntryStop: "Entry and stop are required.",
  errStopAway: "Stop must be away from entry.",
  errRisk: "Risk must be greater than zero.",
  errRiskBig: "Risk is above {pct}% of the true book. Cut it.",
  errStandDown: "Fear, revenge, and chasing are stand-down states. No trade.",

  "rule.gold-only": "I trade gold. Nothing else.",
  "rule.name-pattern":
    "I can name the pattern before I click. If I cannot name it, I do not trade.",
  "rule.size-from-book":
    "I size from 1% of the true book. A 3k–4k habit load is how a book goes blank.",
  "rule.stop-first": "The stop is written before the entry. No stop, no trade.",
  "rule.after-loss": "After a loss I stop. I do not take the next one to win it back.",
  "rule.emotion": "If I feel fear or revenge I stand down. The next candle is not medicine.",
  "rule.log-it": "I log the trade the moment it is closed. Memory is not a journal.",

  "pat.london-sweep.name": "London sweep, New York reclaim",
  "pat.london-sweep.summary":
    "Asia range is raided in London. Price reclaims the range and the New York open continues the reclaim. Gold loves this more than any other session story.",
  "pat.london-sweep.invalid":
    "Price accepts beyond the raid and never reclaims. That is continuation, not a sweep.",
  "pat.london-sweep.t0": "Clear Asia high or low taken by 20–40 dollars",
  "pat.london-sweep.t1": "Close back inside the range before NY",
  "pat.london-sweep.t2": "First NY impulse holds the reclaim",

  "pat.engulf-session.name": "Session-extreme engulfing",
  "pat.engulf-session.summary":
    "A full-body engulf at the London or NY extreme. Not a random mid-range engulf — only at a session high or low that already matters.",
  "pat.engulf-session.invalid":
    "The engulf sits in the middle of the day's range. Mid-range gold eats those alive.",
  "pat.engulf-session.t0": "Prior candle made the session high or low",
  "pat.engulf-session.t1": "Engulfing body closes through the prior open",
  "pat.engulf-session.t2": "Volume / range expands, not a doji pair",

  "pat.pin-reject.name": "Pin bar rejection",
  "pat.pin-reject.summary":
    "A long wick through a known level — yesterday high, round number, or prior week extreme — and a close back on the inside.",
  "pat.pin-reject.invalid":
    "You are calling every long wick a pin. Most gold wicks are just noise at $2–4.",
  "pat.pin-reject.t0": "Wick is at least 2× the body",
  "pat.pin-reject.t1": "Level was already respected once this week",
  "pat.pin-reject.t2": "Close is inside the prior range, not hanging on the wick",

  "pat.fvg-fill.name": "Fair value gap fill",
  "pat.fvg-fill.summary":
    "A three-candle imbalance left by a violent gold impulse. You wait for the fill, then trade the original impulse — not the fill itself.",
  "pat.fvg-fill.invalid":
    "The gap is already 80% filled and you are late. Late gold FVGs are just entries into the other side.",
  "pat.fvg-fill.t0": "Clear three-candle gap on M15 or H1",
  "pat.fvg-fill.t1": "Fill is shallow, not a full mean-reversion",
  "pat.fvg-fill.t2": "Higher-timeframe bias agrees with the impulse",

  "pat.order-block.name": "Order block bounce",
  "pat.order-block.summary":
    "Last opposing candle before an impulsive break. Gold often revisits it once. One tap is a setup. Three taps is a grave.",
  "pat.order-block.invalid":
    "The block is already broken and you are averaging. That is hope, not a block.",
  "pat.order-block.t0": "Impulse away was clean, not overlapping",
  "pat.order-block.t1": "First return to the block, not the third",
  "pat.order-block.t2": "You have a hard invalidation on the far side of the block",

  "pat.ema-pullback.name": "Trend pullback to 50 EMA",
  "pat.ema-pullback.summary":
    "H1 or H4 trend is obvious. Price pulls to the 50 and prints a small rejection in the trend direction. Simple. Easy to abandon when scared.",
  "pat.ema-pullback.invalid": "The 50 is flat and you are forcing a trend that is not there.",
  "pat.ema-pullback.t0": "Higher highs / lower lows still intact",
  "pat.ema-pullback.t1": "50 EMA is sloping, not flat",
  "pat.ema-pullback.t2": "Rejection candle is small relative to the last impulse",

  "pat.double-extreme.name": "Double top / double bottom",
  "pat.double-extreme.summary":
    "Two tests of the same gold extreme, second test with a weaker push. Neckline break is the trade, not the second wick itself.",
  "pat.double-extreme.invalid":
    "You short the second top in a runaway squeeze. Gold double tops fail in strong trends.",
  "pat.double-extreme.t0": "Second push fails to make a clean new extreme",
  "pat.double-extreme.t1": "You wait for the neckline, not the wick",
  "pat.double-extreme.t2": "Measured move has room before the next round number",

  "pat.asia-box.name": "Asia box break and go",
  "pat.asia-box.summary":
    "Tight Asia range, London breaks it and holds. No fade. You are with the break, stop on the other side of the box.",
  "pat.asia-box.invalid":
    "You fade a tight box because 'gold always comes back.' It does not always come back.",
  "pat.asia-box.t0": "Asia range is unusually tight (under $12)",
  "pat.asia-box.t1": "Break candle closes outside and does not snap back",
  "pat.asia-box.t2": "You are not fading the first break",
} as const;

type Dict = Record<keyof typeof en, string>;

const np: Dict = {
  brandSub: "Sunako desk",
  navDesk: "Desk",
  navGate: "Doka",
  navJournal: "Khata",
  navPlaybook: "Niyam",
  navBook: "Paisa",
  signIn: "Sign in",
  signOut: "Sign out",
  langEn: "EN",
  langNp: "NP",
  langSwitchToEn: "English",
  langSwitchToNp: "Nepali",

  hero: "Harauda, timi rok.",
  heroBody:
    "Still euta sunako desk ho jun pahilo rato candle pachhi ni niyam samjhinchha — kinaki tyahi trade le khata khali banauchha.",
  sessWeekend: "Weekend",
  sessWeekendHint: "Gold patlo chha. London samma desk parkhinchha.",
  sessOverlap: "London–NY overlap",
  sessOverlapHint: "Yo gold ko window ho. Euta planned trade pugchha.",
  sessLondon: "London",
  sessLondonHint: "Asia ko sweep yahi hunchha. Dosro idea nalyaunu.",
  sessNy: "New York",
  sessNyHint: "London ko continue wa ulto. Size 1% nai rakh.",
  sessAsia: "Asia",
  sessAsiaHint: "Range banchha. Gold hunt garne bela hoina.",
  sessOff: "Off-window",
  sessOffHint: "Level chaina bhane trade pani chaina.",

  xau: "XAUUSD",
  spot: "Spot",
  futures: "Futures",
  marketClosed: "Gold band chha. Yo antim print ho.",
  marketLive: "Live spot",
  tapeFail: "Tape chup chha. Print aafai lekha.",
  useLive: "Live {price} use gara",
  botName: "Watchman",
  botNeverClicks: "Yo bot click gardaina. Paisa kharch gardaina. Bas bhanera matra bolchha.",
  botWeekend: "Weekend. Bot suteko chha. Gold London ma ni hunchha.",
  botLocked: "Desk band chha. Bot le kholna lai setup banayera didaina.",
  botAfterLoss: "Pachhillo trade rato thiyo. Bot ko euta kura: bas.",
  botOpenPlan: "Plan pahile nai chha. Dosro idea nalyaunu.",
  botNeedSession: "Pahile seshan khol. Size lock nagarikana bot hunt gardaina.",
  botOffWindow: "Gold hunt garne bela hoina. Hera. Click nagara.",
  botAsia: "Asia le box banaudai chha. Hunt hoina.",
  botNearLevel: "Price round number ma chha. Pattern ko naam de, natra trade nagara.",
  botWatch: "Tape live chha. Automatic setup chaina. Naam timi le nai dinu parchha.",
  botNoQuote: "Live print aaisakeko chaina. Bot parkhirako chha.",
  botStateDown: "Bas",
  botStateWait: "Parkha",
  botStateWatch: "Hera",
  botStateName: "Naam de",

  trueBook: "Asli khata",
  friendsThink: "Sathi haru sochchhan {amount}",
  risk1: "1% risk",
  habitHint: "3k–4k load habit ho, size hoina",
  sampleEquity: "Sample khata",
  from80k: "80k bata suru, ek hapta pachhi",
  verdict: "Faisala",
  verdictDesc: "Timi le sodheko — discipline ki pattern. Khata le pahile nai janechha.",
  rulesFollowed: "Niyam maniyo",
  rulesBroken: "Niyam todiyo",
  nTrades: "{n} trade",
  plannedLosses:
    "Planned loss hunchha. {n} ota followed column ma chhan. Pwal arko column ho — {revenge} ota badla / loss pachhiko trade, {pnl}. Candle kamjori hoina. Naroknu kamjori ho.",
  includesPlanned: "Planned loss pani yahi ho",
  thisIsBlank: "Khata yahi khali hunchha",
  equity: "Khata",
  book: "Khata",
  openSession: "Khuleko seshan",
  locked: "Band",
  live: "Live",
  sessionLimitsLine: "Max loss {loss} · {trades} trade · {losses} loss pachhi rok",
  lossBudget: "Loss budget kharch",
  tradesUsed: "Trade use bhayo",
  openTheLock: "Lock khol",
  planNext: "Arko gold trade plan gara",
  openASession: "Seshan khol",
  readTheWeek: "Hapta padha",
  recentGold: "Recenti gold",
  unnamed: "Naam chaina",
  rulesHeld: "Niyam thiyo",
  afterALoss: "loss pachhi",
  open: "Khula",
  deskLocked: "Desk band",
  cooldownReady: "sakiyo — review lekhera seshan banda gara.",
  cooldownLeft: "{left} baki.",
  writeReview: "Gold lai arko vote dinu aghi review lekh.",
  doTheReview: "Review gara",

  lockMaxLoss: "Aaja ko loss limit pugyo. Desk band.",
  lockMaxTrades: "Yo seshan ko trade sakiyo.",
  lockConsecutive: "Dui ota loss. Tesro linu hudaina.",
  lockCooldown: "Loss pachhi cooldown. Basera her.",
  lockManual: "Timi le desk lock garyau. Thik garyau.",
  lockWeekend: "Weekend. Gold London ma ni hunchha.",

  calm: "Shanta",
  fear: "Dar",
  revenge: "Badla",
  fomo: "Pachhi daudine",
  long: "Long",
  short: "Short",

  sessionGate: "Seshan ko doka",
  openTheDesk: "Desk khol",
  openDeskBody:
    "Gold lai timi harek ghanta chahindaina. Seshan kholyo bhane pahilo candle aghi limit manchhau.",
  perTradeRisk: "Euta trade ko risk",
  dailyLossCap: "Aaja ko max loss",
  maxTrades: "Max trade",
  stopAfter: "Pachhi rok",
  nLosses: "{n} ota loss",
  lossCooldown: "Loss cooldown",
  nMinutes: "{n} minute",
  acceptLimits: "Ma limit manchhu",

  pretradeLock: "Trade aghi ko lock",
  nameIt: "Naam de, natra click nagara.",
  nameItBody: "Yo box haru nai hun niyam jun candle ghumda birsinchhau. Bistari tick gara.",
  state: "Manasthiti",
  stateDesc: "Shanta chaina bhane doka bandai baschha.",
  pattern: "Pattern",
  patternDesc: "Naam dinu sakdainanau bhane trade chaina.",
  invalidWhen: "Invalid hun<fim-middle>chha jab",
  sizeFromBook: "Asli khata bata size",
  sizeFromBookDesc: "Risk {pct}% ma lock chha — {amount}. 3k–4k habit load pass hudaina.",
  entry: "Entry (XAUUSD)",
  stop: "Stop",
  target: "Target",
  stopDistance: "Stop ko duri",
  position: "Position",
  risk: "Risk",
  rewardRisk: "Reward / risk",
  habitRefuse: "Yo size le khata khali hunchha. Doka le pass gardaina.",
  rulesYouForget: "Birsinchhau ti niyam",
  whyTrade: "Yo trade kina chha",
  whyTradePh: "Euta wakya. Paragraph lagyo bhane timi sanga chhaina.",
  lockThePlan: "Plan lock gara",
  lockMyself: "Aafu lai lock gara",
  endSession: "Seshan saka",
  plannedToast: "Trade plan bhayo. Dosro idea nalyaunu.",

  openPlan: "Khuleko plan",
  longGold: "Long gold",
  shortGold: "Short gold",
  exit: "Exit",
  pnl: "P&L ({cur})",
  didIKeep: "Yo niyam rakhe?",
  whatHappened: "Ke bhayo, yathartha ma.",
  enterPnl: "P&L number ma lekh.",
  lossLogged: "Loss lekhiyo. Desk lock huna sakchha.",
  winLogged: "Win lekhiyo. Dosro trade nalyaunu.",
  closeAndLog: "Close gara ra lekh",
  cancelPlan: "Plan cancel — maile lieko hoina",

  sitWithLoss: "Loss sanga bas.",
  reviewReady: "Cooldown sakiyo. Gold lai arko vote dinu aghi review lekh nai.",
  reviewWait: "Cooldown {left}. Review ahile lekhna milchha.",
  session: "Seshan",
  brokeRuleQ: "Maile niyam tode?",
  patternValidQ: "Pahilo pattern asli valid thiyo?",
  nextTime: "Arko choti ma ke farak garchhu",
  nextTimePh: "Euta clear kaam. 'Discipline badhaune' lekhna hunna.",
  closeSession: "Seshan banda gara",
  yes: "Ho",
  no: "Hoina",

  journal: "Khata",
  journalHero: "Sabai gold trade, lekhiyeko.",
  journalBody:
    "Yaad le badla lai mitho banauchha. Khata le banaudaina. Yo kitab ma {closed} close trade — {held} le niyam rakhe, {broken} le rakhenan.",
  filterAll: "Sabai",
  filterHeld: "Niyam thiyo",
  filterBroken: "Niyam todiyo",
  journalEmpty: "Yo filter ma trade chaina. Arko close hune bittikai lekhinchha.",
  held: "Rakhe",
  broken: "Tode",
  afterLossBadge: "Loss pachhi",

  playbook: "Niyam kitab",
  playbookHero: "Pattern padha. Niyam mana.",
  playbookBody:
    "Candle timi lai dherai tha chha. Nabhako kura ho lekhiyeko pattern ra niyam — jun pahilo loss pachhi pani bachchha.",
  rulesSurvive: "Click pachhi ni bachne niyam",
  ruleN: "Niyam {n}",
  remove: "Hataau",
  addRulePh: "Afno sabda ma niyam thap",
  add: "Thap",
  goldPatterns: "Gold ka pattern",
  unused: "Use bhayeko chaina",
  patternStats: "{wins}/{count} win · niyam {followed} · todeko {broken}",

  theBook: "Khata",
  capitalHero: "Lukako number bata size gara.",
  capitalBody:
    "Sathi haru le {story} suneka chhan. Asli khata {true} ho. Imanjari nai position-sizing ho.",
  trueCapital: "Asli capital",
  trueCapitalDesc: "Desk le yahi number bata matra size garchha.",
  whatWeCall: "Hami timilai ke bhanne",
  whatFriendsThink: "Sathi haru ke sochchhan",
  gapLine: "{gap} katha ra khata ko bich ko gap ho. Khata bata size. Gap jogaau.",
  habitTitle: "3k–4k ko bani",
  habitDesc: "Timi le bhaneko — 3k–4k load garchhu, khali kasari bhayo thaha bhayena. Yahi ho.",
  habitLoad: "Habit load",
  habitMath: "{amount} ko load asli khata ko {pct} ho.",
  habitAllowed:
    "Paune risk {risk} ({pct}%) ho. $8 gold stop ma {lots} lot — 3k swing hoina.",
  habitTwo: "Dui choti habit load gare pachhi 80 euta number hunchha jun sathi lai bhandainanau.",
  sessionLimits: "Seshan ko limit",
  riskPct: "Risk %",
  dailyLossPct: "Aaja ko loss %",
  lossesThenStop: "Loss pachhi rok",
  cooldownMin: "Cooldown (min)",
  reloadSample: "Sample hapta feri lyaau",
  wipeBook: "Khata safai gara, imandar suru",

  alertsTitle: "Watchman alert",
  alertsDesc:
    "Nepal number ra email. Watchman sit, London, ra round number ma ping garchha — kinne/bechne kahilyai hoina.",
  phoneLabel: "Phone (Nepal)",
  phonePh: "+977 98xxxxxxxx",
  emailLabel: "Email",
  emailPh: "timi@email.com",
  phoneBad: "Nepal mobile use gara — +977 97 wa 98, das ank.",
  emailBad: "Yo email jasto dekhidaina.",
  channelSms: "SMS draft",
  channelEmail: "Email draft",
  channelPush: "Phone notification",
  whenSit: "Watchman le bas bhanda",
  whenLevel: "Gold round number ma basda",
  whenLondon: "London / overlap khulda",
  saveContact: "Contact save gara",
  contactSaved: "Yo phone ma save bhayo.",
  testSms: "Test SMS",
  testEmail: "Test email",
  allowPush: "Notification allow gara",
  pushOn: "Notification on chha",
  pushDenied: "Phone le notification block gareko chha.",
  alertsHow:
    "Alert yo khata ma aunchha. Notification on bhayo bhane Watchman le phone tap garchha. Test SMS / email le aafailai message kholchha, number prove hunchha. Kinne ping kahilyai aaudaina.",
  inboxEmpty: "Ahile alert chaina. Watchman bolepachhi yahi lekhchha.",
  sendThisSms: "SMS pathau",
  sendThisEmail: "Email pathau",
  replayTutorial: "Tutorial feri her",
  howLink: "Kasari chalne",
  unreadN: "{n} naya",

  claimKicker: "Timi ko desk",
  claimTitle: "Afno naam rakh.",
  claimBody:
    "Yo desk ma euta sample hapta chha, khata kasari khali hunchha dekhauna. Asli number lekh. Nepal phone thap. Watchman feri pani click gardaina.",
  claimStudy: "Sample hapta padha",
  claimFresh: "Afno imandar khata suru",
  installTitle: "Still phone ma rakh",
  installBody:
    "Yo page phone ma khol. Ani Home Screen ma thap — broker ko cheu ma, chat bhitra hoina.",
  installIos: "iPhone: Share → Add to Home Screen",
  installAndroid: "Android: Chrome menu → Install app",
  copyLink: "Yo page copy gara",
  linkCopied: "Link copy bhayo",
  fromExit: "Exit bata",
  useLiveExit: "Live {price} lai exit banaau",

  tutKicker: "Kasari chalne",
  tutSkip: "Skip",
  tutBack: "Pachhi",
  tutNext: "Arko",
  tutDone: "Bujhe",
  tutStep: "{n} / {of}",
  "tut.1.title": "Yo Still ho.",
  "tut.1.body":
    "Gold-matra desk. Pahilo rato candle pachhi ni niyam samjhinchha — kinaki tyahi trade le khata khali banauchha.",
  "tut.2.title": "Yo timi lai trade gardaina.",
  "tut.2.body":
    "Bot click gardaina. Broker chaina. Sutda 3k–4k load fire hudaina. Pattern ko naam timi le nai dinu parchha. Watchman bas bhanera matra bolchha.",
  "tut.3.title": "Lukaeko number bata size.",
  "tut.3.body":
    "Sathi haru le 30k suneka thiye. Asli khata 80k bhanda dherai. Desk le 1% asli number bata size garchha. Habit load refuse hunchha.",
  "tut.4.title": "Doka nai kura ho.",
  "tut.4.body":
    "Harek gold trade aghi: shanta, pattern ko naam, stop lekh, birsine niyam tick. Dui loss — tesro chaina. Rato trade pachhi, bas.",
  "tut.5.title": "Tape live chha. Watchman bolchha.",
  "tut.5.body":
    "XAUUSD yahi print hunchha. Watchman le seshan, pachhillo loss, ra round number herchha. Kinne bhandaina. Weekend ma sutchha.",
  "tut.6.title": "Phone tap garna sakchha.",
  "tut.6.body":
    "Book page ma Nepal number ra email rakh. Watchman le sit, London, ra round-number alert garchha — yo desk ma, ra notification ma. Kinne ping hoina.",
  "tut.7.title": "EN wa NP. Ani phone ma rakh.",
  "tut.7.body":
    "Bhasa jati bela ni switch. Share → Add to Home Screen. Harauda, timi rok.",

  loginKicker: "Still · Sunako desk",
  loginTitle: "Sign in",
  loginBody:
    "Optional. Desk yo device ma chalirako chha. Arko device ma eutai khata chahiyo bhane sign in gara.",
  continueWith: "{label} bata jaau",
  signInDisabled: "Sign-in band chha.",
  backToDesk: "Desk ma pharka",

  errNeedSession: "Pahile seshan khol.",
  errDeskLocked: "Desk band chha. Review saka wa cooldown parkha.",
  errOpenPlan: "Pahile khuleko plan close wa cancel gara.",
  errTradeLimit: "Seshan ko trade limit pugyo.",
  errRules: "Sabai chahine niyam tick hunu parchha. Kura nai tyahi ho.",
  errNamePattern: "Pattern ko naam de.",
  errThesis: "Yo trade kina chha, lekh.",
  errEntryStop: "Entry ra stop chahinchha.",
  errStopAway: "Stop entry bata alag hunu parchha.",
  errRisk: "Risk zero bhanda dherai hunu parchha.",
  errRiskBig: "Risk asli khata ko {pct}% bhanda mathi chha. Ghataau.",
  errStandDown: "Dar, badla, ra pachhi daudine — yo bela trade chaina. Bas.",

  "rule.gold-only": "Ma gold matra trade garchhu. Arko kehi hoina.",
  "rule.name-pattern":
    "Click garnu aghi pattern ko naam dinchhu. Naam dinu sakdina bhane trade gardina.",
  "rule.size-from-book":
    "Asli khata ko 1% bata size garchhu. 3k–4k habit load le khata khali hunchha.",
  "rule.stop-first": "Stop entry aghi lekhinchha. Stop chaina bhane trade chaina.",
  "rule.after-loss": "Loss pachhi ma rokinchhu. Jitna lai arko lidina.",
  "rule.emotion": "Dar wa badla aayo bhane ma baschhu. Arko candle ausadhi hoina.",
  "rule.log-it": "Trade close hune bittikai lekhchhu. Yaad journal hoina.",

  "pat.london-sweep.name": "London sweep, New York reclaim",
  "pat.london-sweep.summary":
    "Asia range London ma raid hunchha. Price range bhitra farkinchha, NY open le reclaim continue garchha. Gold lai yo story sabai bhanda priya.",
  "pat.london-sweep.invalid":
    "Price raid bhanda para accept garchha ra farkidaina. Tyo sweep hoina, continuation ho.",
  "pat.london-sweep.t0": "Asia high wa low 20–40 dollar le chhoieko",
  "pat.london-sweep.t1": "NY aghi range bhitra close",
  "pat.london-sweep.t2": "Pahilo NY impulse le reclaim dharanchha",

  "pat.engulf-session.name": "Session-extreme engulfing",
  "pat.engulf-session.summary":
    "London wa NY extreme ma full-body engulf. Jathabhabi mid-range engulf hoina — session high/low ma matra, jun pahile nai matter garchha.",
  "pat.engulf-session.invalid":
    "Engulf din ko range ko bich ma chha. Mid-range gold le tyaslai khanchha.",
  "pat.engulf-session.t0": "Pahilo candle le session high wa low banayo",
  "pat.engulf-session.t1": "Engulfing body le aghillo open cut garchha",
  "pat.engulf-session.t2": "Range/volume badhchha, doji jodi hoina",

  "pat.pin-reject.name": "Pin bar rejection",
  "pat.pin-reject.summary":
    "Thaha bhako level — hijo high, round number, wa week extreme — parera lammo wick, ani bhitra close.",
  "pat.pin-reject.invalid":
    "Sabai lammo wick lai pin bhanne. Gold ko dherai wick $2–4 ko noise matra.",
  "pat.pin-reject.t0": "Wick body bhanda kam se kam 2 guna",
  "pat.pin-reject.t1": "Yo level yo hapta ek choti respect bhai sakeko",
  "pat.pin-reject.t2": "Close aghillo range bhitra, wick ma jhundieko hoina",

  "pat.fvg-fill.name": "Fair value gap fill",
  "pat.fvg-fill.summary":
    "Gold ko impulsive move le chhodeko teen-candle imbalance. Fill parkha, ani original impulse trade gara — fill nai hoina.",
  "pat.fvg-fill.invalid":
    "Gap 80% fill bhai sakyo, timi late chhau. Late FVG arko side ko entry ho.",
  "pat.fvg-fill.t0": "M15 wa H1 ma clear teen-candle gap",
  "pat.fvg-fill.t1": "Fill shallow, pura mean-reversion hoina",
  "pat.fvg-fill.t2": "Higher timeframe bias impulse sanga mildaina",

  "pat.order-block.name": "Order block bounce",
  "pat.order-block.summary":
    "Impulsive break aghi ko antim opposite candle. Gold ek choti farkinchha. Euta tap setup. Teen tap qabar.",
  "pat.order-block.invalid":
    "Block phuti sakeko chha, timi average gardai chhau. Tyo aasha ho, block hoina.",
  "pat.order-block.t0": "Impulse safa thiyo, overlap hoina",
  "pat.order-block.t1": "Block ma pahilo return, tesro hoina",
  "pat.order-block.t2": "Block ko arko chheu ma hard invalidation chha",

  "pat.ema-pullback.name": "Trend pullback to 50 EMA",
  "pat.ema-pullback.summary":
    "H1 wa H4 trend clear. Price 50 samma tanchha ra trend tira sano rejection dinchha. Sajilo. Dar lagyo bhane chhodna pani sajilo.",
  "pat.ema-pullback.invalid": "50 flat chha, timi chhaina bhanne trend force gardai chhau.",
  "pat.ema-pullback.t0": "Higher high / lower low ajhai intact",
  "pat.ema-pullback.t1": "50 EMA dhalieko chha, flat hoina",
  "pat.ema-pullback.t2": "Rejection candle pachhillo impulse bhanda sano",

  "pat.double-extreme.name": "Double top / double bottom",
  "pat.double-extreme.summary":
    "Eutai gold extreme ma dui test, dosro dhakka kamjor. Trade neckline break ho, dosro wick hoina.",
  "pat.double-extreme.invalid":
    "Strong squeeze ma dosro top short. Gold ko double top strong trend ma fail hunchha.",
  "pat.double-extreme.t0": "Dosro push le naya extreme safa banauna sakdaina",
  "pat.double-extreme.t1": "Wick hoina, neckline parkha",
  "pat.double-extreme.t2": "Arko round number aghi measured move lai thau chha",

  "pat.asia-box.name": "Asia box break and go",
  "pat.asia-box.summary":
    "Asia range saano, London le break garchha ra dharanchha. Fade hoina. Break sanga, stop box ko arko chheu.",
  "pat.asia-box.invalid":
    "Sano box fade garchhau kinaki 'gold jhikkinchha.' Sadhai jhikkindaina.",
  "pat.asia-box.t0": "Asia range unusual saano ($12 muni)",
  "pat.asia-box.t1": "Break candle bahira close, jhikkindaina",
  "pat.asia-box.t2": "Pahilo break fade gardainanau",
};

const tables: Record<Locale, Dict> = { en, np };

export type MessageKey = keyof typeof en;

export function t(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const table = tables[locale] ?? tables.en;
  let out = table[key] ?? tables.en[key] ?? String(key);
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replaceAll(`{${k}}`, String(v));
    }
  }
  return out;
}

export function sideWord(locale: Locale, side: Side): string {
  return t(locale, side === "long" ? "long" : "short");
}

export function emotionWord(locale: Locale, emotion: Emotion): string {
  return t(locale, emotion);
}

export function lockWord(locale: Locale, reason: LockReason): string {
  switch (reason) {
    case "max-loss":
      return t(locale, "lockMaxLoss");
    case "max-trades":
      return t(locale, "lockMaxTrades");
    case "consecutive-losses":
      return t(locale, "lockConsecutive");
    case "cooldown":
      return t(locale, "lockCooldown");
    case "manual":
      return t(locale, "lockManual");
    case "weekend-standdown":
      return t(locale, "lockWeekend");
  }
}

