// The SSB Prep Sheet — every topic an aspirant should be able to talk about,
// in the order worth learning them.
//
// Topic ids are stored against each user's progress on the backend
// (prep_progress.topic_id). Never rename or reuse an id once it has shipped —
// people's ticks would silently vanish. Adding, rewording or moving topics is
// fine; ids must stay lowercase-with-dashes and under 80 characters.
//
// level:  must — comes up again and again; do these first.
//         good — common enough that you should have a view.
//         deep — for the aspirant who wants an edge, or a Lecturette pick.
// tests:  where the topic tends to come up at SSB.
// points: what to know, kept short. Not notes to memorise — hooks to talk from.
// ask:    the question to answer out loud before you mark "Can speak".
// answer: how long a good spoken answer is — 'short' (a word or a line, for a
//         plain fact), 'medium' (about a minute) or, if left out, 'long' (about
//         two minutes, for opinion questions). Topics in Know Yourself default
//         to 'medium': a personal PI answer runs about a minute. The timer, the
//         minimum length and the AI's judgement all follow this.
// article: slug of one of our own articles, if we have one.
//
// Facts here are as of mid-2026. The UI tells people to check the latest
// news, and every topic's "ask" is meant to push them towards an opinion
// rather than a number.

// How long a spoken answer should be. minWords must match the backend
// (routes/prep.js ANSWER_MIN_WORDS).
export const ANSWER = {
  short:  { target: 20,  max: 60,  minWords: 1,  label: 'A word or a line', hint: 'A word or a short line is enough. Just get it right.' },
  medium: { target: 60,  max: 120, minWords: 12, label: 'About a minute',   hint: 'Talk for about a minute, without notes. Give real details.' },
  long:   { target: 120, max: 180, minWords: 30, label: 'About two minutes', hint: 'Talk for about two minutes, without notes. Give both sides, then your own view.' },
};

export function answerOf(topic) {
  return topic.answer || (topic.stepId === 'self' ? 'medium' : 'long');
}

export const LEVELS = {
  must: { label: 'Must know',    short: 'Must', className: 'bg-red-50 text-red-700 border-red-100' },
  good: { label: 'Good to know', short: 'Good', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  deep: { label: 'Go deeper',    short: 'Deep', className: 'bg-sky-50 text-sky-700 border-sky-100' },
};

export const STEPS = [
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'self',
    title: 'Know Yourself',
    blurb: 'Most interview questions come from your own PIQ. Start here, not with the news.',
    room: null,
    groups: [
      {
        title: 'Your background',
        topics: [
          { id: 'self-hometown', level: 'must', tests: ['PI'],
            title: 'Your home town and district',
            points: [
              'Population, main crops or industry, famous places, and one big problem it faces.',
              'Who is your MP, MLA and District Collector?',
              'What would you change there if you could? Have one practical idea.',
            ],
            ask: 'Tell me about your home town. What is its biggest problem, and how would you fix it?' },
          { id: 'self-state', level: 'must', tests: ['PI'],
            title: 'Your state',
            points: [
              'Chief Minister, Governor, capital, number of districts, main languages.',
              'Its economy: what it grows, makes and sells.',
              'Its history, famous people, and soldiers or units from your state.',
              'One current issue in the state, with both sides of it.',
            ],
            ask: 'What is going well in your state, and what is not?' },
          { id: 'self-family', level: 'must', tests: ['PI'],
            title: 'Your family',
            points: [
              'What each member does, in simple words. Know your father\'s and mother\'s work properly.',
              'Your relationship with each of them — be honest, not perfect.',
              'Any defence link in the family, and what you learnt from it.',
            ],
            ask: 'Who are you closest to in your family, and why?' },
          { id: 'self-education', level: 'must', tests: ['PI'],
            title: 'Your school, college and marks',
            points: [
              'Why you chose your stream and college.',
              'Your marks — and an honest reason if they dipped. Never blame others.',
              'Basics of your favourite and least favourite subjects. IOs ask both.',
            ],
            ask: 'Your marks fell in Class 12. What happened?' },
        ],
      },
      {
        title: 'Your choices',
        topics: [
          { id: 'self-why-forces', level: 'must', tests: ['PI'],
            title: 'Why do you want to join the forces?',
            points: [
              'Your real reason, in your own words. Not "to serve the nation" alone.',
              'When did the idea start? What have you done about it since?',
              'What do you know about the life — postings, moves, time away from home?',
            ],
            ask: 'Why the forces, and not a well-paid civilian job?' },
          { id: 'self-service-choice', level: 'must', tests: ['PI'],
            title: 'Your service and branch choice',
            points: [
              'Why this service and this arm. Know what a young officer there actually does.',
              'Basic facts: training academy, ranks, a few important units or ships or aircraft.',
              'What you will do if you do not get your first choice.',
            ],
            ask: 'Why the Navy over the Army? What will you do on your first posting?' },
          { id: 'self-hobbies', level: 'must', tests: ['PI'],
            title: 'Your hobbies and sports',
            points: [
              'Only write hobbies you really do. The IO will go deep.',
              'For a sport: rules, famous players, recent big events, your own level.',
              'For reading: last book, author, what you took from it.',
            ],
            ask: 'You wrote "reading" as a hobby. What did you read last month?' },
          { id: 'self-strengths', level: 'good', tests: ['PI'],
            title: 'Strengths, weaknesses and failures',
            points: [
              'Three strengths, each with a real example from your life.',
              'Weaknesses you are actually working on, and how.',
              'One failure, what you learnt, and what you did next.',
            ],
            ask: 'What are your weaknesses? What are you doing about them?' },
          { id: 'self-previous-ssb', level: 'good', tests: ['PI'],
            title: 'Your previous SSB attempts',
            points: [
              'What you think went wrong, honestly.',
              'What you have changed since — specific steps, not "I worked hard".',
            ],
            ask: 'You were not recommended last time. Why do you think so?' },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'forces',
    title: 'Armed Forces Basics',
    blurb: 'You are joining them. Knowing how they work is the least the board expects.',
    room: 'Defence',
    groups: [
      {
        title: 'Structure',
        topics: [
          { id: 'forces-structure', level: 'must', tests: ['PI', 'GD'],
            title: 'How the three services are organised',
            points: [
              'The President is the Supreme Commander. The Ministry of Defence runs the forces.',
              'Chief of Defence Staff (CDS) heads the Department of Military Affairs and advises on joint matters.',
              'Army, Navy and Air Force each have their own Chief and their own commands.',
              'The Andaman and Nicobar Command is the only tri-service command.',
            ],
            answer: 'medium', ask: 'What does the CDS do, and why was the post created?' },
          { id: 'forces-ranks', level: 'must', tests: ['PI'],
            title: 'Ranks and their equivalents',
            points: [
              'Lieutenant (Army) = Sub Lieutenant (Navy) = Flying Officer (Air Force).',
              'Know the full officer ladder of your chosen service, and its equivalent in the other two.',
              'Know what a JCO is in the Army.',
            ],
            answer: 'short', ask: 'What is the Navy equivalent of a Colonel?' },
          { id: 'forces-commands', level: 'good', tests: ['PI'],
            title: 'Commands and their headquarters',
            points: [
              'Army: Northern, Western, South Western, Southern, Central, Eastern, plus the Training Command.',
              'Navy: Western (Mumbai), Eastern (Visakhapatnam), Southern (Kochi).',
              'Air Force: Western, South Western, Central, Eastern, Southern, plus Training and Maintenance.',
            ],
            answer: 'short', ask: 'Which command looks after the border with China in the East?' },
          { id: 'forces-theatre', level: 'good', tests: ['GD', 'Lecturette'],
            title: 'Theatre commands and jointness',
            points: [
              'Idea: put Army, Navy and Air Force units in one region under one commander.',
              'Why: wars today are fought together on land, sea, air, space and cyber.',
              'The debate: how to share limited aircraft and ships, and who commands whom.',
            ],
            ask: 'Should India move to theatre commands? What could go wrong?' },
        ],
      },
      {
        title: 'History and people',
        topics: [
          { id: 'forces-wars', level: 'must', tests: ['PI', 'Lecturette'],
            title: 'India\'s wars since 1947',
            points: [
              '1947–48 Kashmir, 1962 China, 1965 Pakistan, 1971 Bangladesh, 1999 Kargil.',
              'For each: why it started, one turning point, and the result.',
              '1971: 93,000 prisoners of war and the birth of Bangladesh.',
            ],
            answer: 'medium', ask: 'What lesson from 1962 still matters today?' },
          { id: 'forces-operations', level: 'must', tests: ['PI', 'GD'],
            title: 'Recent operations',
            points: [
              'Surgical strikes (2016), Balakot air strike (2019), Galwan clash (2020).',
              'Operation Sindoor (May 2025) after the Pahalgam terror attack.',
              'Evacuations like Operation Ganga (Ukraine) and Operation Kaveri (Sudan).',
            ],
            ask: 'What did Operation Sindoor show about how India now answers terror?' },
          { id: 'forces-gallantry', level: 'good', tests: ['PI'],
            title: 'Gallantry awards and heroes',
            points: [
              'Wartime: Param Vir Chakra, Maha Vir Chakra, Vir Chakra.',
              'Peacetime: Ashoka Chakra, Kirti Chakra, Shaurya Chakra.',
              'Know two or three award winners well, especially from your state or chosen arm.',
            ],
            answer: 'medium', ask: 'Tell me about one Param Vir Chakra winner who inspires you.' },
          { id: 'forces-exercises', level: 'deep', tests: ['PI'],
            title: 'Joint exercises with other countries',
            points: [
              'Malabar (Navy, with US, Japan, Australia), Yudh Abhyas (Army, with US).',
              'Why we hold them: learn from each other, build trust, show partners we can work together.',
            ],
            ask: 'Why does India train with foreign militaries?' },
        ],
      },
      {
        title: 'Reforms and people policy',
        topics: [
          { id: 'forces-agnipath', level: 'must', tests: ['GD', 'PI'],
            title: 'Agnipath scheme',
            points: [
              'Started 2022. Young soldiers (Agniveers) join for four years; up to a quarter can stay on.',
              'For: younger force, lower pension bill, trained youth go back to society.',
              'Against: short service may hurt bonding and skill; worry about jobs after four years.',
            ],
            ask: 'Is Agnipath good for the Army? Give both sides, then your view.' },
          { id: 'forces-women', level: 'must', tests: ['GD', 'PI'],
            title: 'Women in the armed forces',
            points: [
              'Women now get Permanent Commission, fly fighters, serve on warships, and train at NDA.',
              'The 2020 Supreme Court ruling opened Permanent Commission in the Army.',
              'Open questions: combat roles, facilities in remote posts.',
            ],
            ask: 'Should women serve in all combat roles?' },
          { id: 'forces-veterans', level: 'deep', tests: ['GD'],
            title: 'Veterans and One Rank One Pension',
            points: [
              'OROP: same pension for the same rank and length of service, whenever you retired.',
              'Bigger issue: second careers and dignity for soldiers who retire young.',
            ],
            ask: 'How can the country use the skills of retired soldiers better?' },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'defence',
    title: 'Defence & Security',
    blurb: 'The threats India faces, inside and outside, and how it answers them.',
    room: 'Defence',
    groups: [
      {
        title: 'Borders',
        topics: [
          { id: 'def-china-lac', level: 'must', tests: ['GD', 'Lecturette', 'PI'],
            title: 'India–China border (LAC)',
            points: [
              'The Line of Actual Control is not agreed on the ground. Both sides patrol to different lines.',
              'Galwan 2020 was the first deadly clash in decades.',
              'Talks led to disengagement at several points; trust is still low.',
              'India is building roads, tunnels and airfields near the border to catch up.',
            ],
            ask: 'How should India deal with China — talk, compete, or both?' },
          { id: 'def-pakistan-terror', level: 'must', tests: ['GD', 'PI'],
            title: 'Pakistan and cross-border terrorism',
            points: [
              'Line of Control in J&K; ceasefire agreed in 2021 but broken at times.',
              'India\'s position: terror and talks cannot go together.',
              'After Pahalgam (April 2025) India put the Indus Waters Treaty "in abeyance" and launched Operation Sindoor.',
            ],
            ask: 'Can India ever have normal ties with Pakistan?' },
          { id: 'def-border-infra', level: 'good', tests: ['GD', 'Lecturette'],
            title: 'Border infrastructure and Vibrant Villages',
            points: [
              'Roads, tunnels like Atal Tunnel, and bridges let troops move fast.',
              'Vibrant Villages Programme: bring people and jobs back to empty border villages.',
            ],
            ask: 'Why do border villages matter for national security?' },
        ],
      },
      {
        title: 'Inside the country',
        topics: [
          { id: 'def-jk', level: 'must', tests: ['GD', 'PI'],
            title: 'Jammu & Kashmir after Article 370',
            points: [
              'In 2019 Article 370 was removed and the state became two Union Territories.',
              'Supreme Court upheld the move in 2023. Assembly elections were held in 2024.',
              'Debate: development and tourism up; questions on statehood and local trust remain.',
            ],
            ask: 'What has changed in J&K since 2019, and what still needs work?' },
          { id: 'def-lwe', level: 'good', tests: ['GD'],
            title: 'Left-wing extremism (Naxalism)',
            points: [
              'Grew in poor, forest areas where the state was weak.',
              'Answer has two parts: security operations, and roads, schools, phones and jobs.',
              'Violence has fallen sharply; the government set March 2026 as the target to end it.',
            ],
            ask: 'Is Naxalism a law-and-order problem or a development problem?' },
          { id: 'def-northeast', level: 'good', tests: ['GD'],
            title: 'Northeast and Manipur',
            points: [
              'Many old insurgencies have signed peace deals.',
              'Manipur saw ethnic violence between Meitei and Kuki-Zo groups from 2023.',
              'AFSPA has been removed from many areas as things improved.',
            ],
            ask: 'What will bring lasting peace in Manipur?' },
          { id: 'def-cyber', level: 'must', tests: ['GD', 'Lecturette'],
            title: 'Cyber security',
            points: [
              'Attacks on power grids, banks, hospitals and government sites are rising.',
              'Frauds like "digital arrest" scams hit ordinary people.',
              'CERT-In handles national response. Defence has its own cyber agency.',
            ],
            ask: 'Is cyber war a bigger threat than a border war?' },
        ],
      },
      {
        title: 'Building strength',
        topics: [
          { id: 'def-atmanirbhar', level: 'must', tests: ['GD', 'Lecturette', 'PI'],
            title: 'Make in India in defence',
            points: [
              'India was among the world\'s biggest arms importers. The aim is to make more at home.',
              'Examples: Tejas fighter, INS Vikrant carrier, BrahMos missile, Akash air defence.',
              'Defence exports have grown many times over in ten years.',
              'Problems: delays, engines still imported, small private sector.',
            ],
            ask: 'Can India become self-reliant in defence? What is holding it back?' },
          { id: 'def-maritime', level: 'good', tests: ['GD', 'Lecturette'],
            title: 'Indian Ocean and maritime security',
            points: [
              'Most of India\'s trade and oil comes by sea.',
              'China\'s navy and ports in the region are growing.',
              'India acts as first responder: anti-piracy, disaster help, evacuations.',
            ],
            ask: 'Why does the Indian Ocean matter so much to India?' },
          { id: 'def-nuclear', level: 'good', tests: ['GD', 'PI'],
            title: 'Nuclear policy',
            points: [
              'Tests in 1974 and 1998. Policy: No First Use, and a strong reply if attacked.',
              'India has a nuclear triad — land, air and submarine.',
            ],
            ask: 'Should India keep its No First Use policy?' },
          { id: 'def-drones', level: 'good', tests: ['GD', 'Lecturette'],
            title: 'Drones and the changing face of war',
            points: [
              'Ukraine and West Asia show cheap drones can destroy costly tanks and ships.',
              'Drones are also used to drop weapons and drugs across the Punjab border.',
              'Armies now need counter-drone systems and their own drone units.',
            ],
            ask: 'Will drones make tanks and big ships useless?' },
          { id: 'def-space', level: 'deep', tests: ['GD', 'PI'],
            title: 'Space and defence',
            points: [
              'Mission Shakti (2019): India shot down its own satellite to show it could.',
              'Defence Space Agency handles military use of space.',
              'Satellites guide missiles, watch borders and carry military communication.',
            ],
            ask: 'Is space the next battlefield?' },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'ir',
    title: 'International Relations',
    blurb: 'Who India works with, who it competes with, and why.',
    room: 'International Relations',
    groups: [
      {
        title: 'Big powers',
        topics: [
          { id: 'ir-us', level: 'must', tests: ['GD', 'PI'],
            title: 'India–US relations',
            points: [
              'Close partners in defence, technology and the Quad.',
              'Strains over trade and tariffs, and over India buying Russian oil.',
              'Large Indian community in the US; visas matter to students.',
            ],
            ask: 'Is the US a reliable partner for India?' },
          { id: 'ir-china', level: 'must', tests: ['GD', 'Lecturette'],
            title: 'India–China relations',
            points: [
              'Rival and big trade partner at the same time. India buys far more than it sells.',
              'Border tension, China–Pakistan ties, and China\'s reach in South Asia.',
              'Both are in BRICS and SCO, and talk even while competing.',
            ],
            ask: 'Can India reduce its trade dependence on China?' },
          { id: 'ir-russia', level: 'must', tests: ['GD', 'PI'],
            title: 'India–Russia relations',
            points: [
              'Old friend. Much of India\'s military equipment is Russian.',
              'India buys discounted Russian oil since the Ukraine war.',
              'Worry: Russia growing closer to China.',
            ],
            ask: 'Why has India not condemned Russia over Ukraine?' },
          { id: 'ir-autonomy', level: 'must', tests: ['GD', 'Lecturette', 'PI'],
            title: 'Strategic autonomy',
            points: [
              'India makes its own choices and does not join any one camp.',
              'Grew out of Non-Alignment, but today India works with many sides at once.',
              'Example: Quad with the US, and BRICS and SCO with Russia and China.',
            ],
            ask: 'Is it wise for India to stay friends with everyone?' },
        ],
      },
      {
        title: 'Neighbours',
        topics: [
          { id: 'ir-neighbourhood', level: 'must', tests: ['GD', 'PI'],
            title: 'Neighbourhood First',
            points: [
              'India\'s policy to put its neighbours first in aid, trade and connectivity.',
              'Many neighbours also take Chinese money; India must offer a better deal.',
            ],
            ask: 'Why do some neighbours tilt towards China?' },
          { id: 'ir-bangladesh', level: 'good', tests: ['GD'],
            title: 'Bangladesh',
            points: [
              'Change of government in 2024 after mass protests.',
              'Issues: border, river water sharing, illegal migration, safety of minorities.',
            ],
            ask: 'How should India handle the new Bangladesh?' },
          { id: 'ir-nepal-bhutan', level: 'good', tests: ['GD'],
            title: 'Nepal and Bhutan',
            points: [
              'Open border with Nepal; many Nepali citizens serve in the Indian Army\'s Gorkha regiments.',
              'Nepal has had political churn, including youth protests in 2025.',
              'Bhutan: close partner, hydropower, and the Doklam standoff of 2017.',
            ],
            ask: 'What makes the India–Nepal bond special?' },
          { id: 'ir-srilanka-maldives', level: 'good', tests: ['GD'],
            title: 'Sri Lanka and the Maldives',
            points: [
              'India helped Sri Lanka during its 2022 economic crisis.',
              'Maldives had an "India Out" phase, then repaired ties.',
              'Both sit on key sea routes in the Indian Ocean.',
            ],
            ask: 'Why do small island countries matter to India?' },
          { id: 'ir-afghan-myanmar', level: 'deep', tests: ['GD'],
            title: 'Afghanistan and Myanmar',
            points: [
              'Afghanistan: Taliban in power since 2021. India talks to them carefully while sending aid.',
              'Myanmar: military rule since 2021, civil war, refugees into Mizoram and Manipur.',
            ],
            ask: 'Should India engage with the Taliban?' },
        ],
      },
      {
        title: 'Groups and regions',
        topics: [
          { id: 'ir-quad', level: 'must', tests: ['GD', 'PI'],
            title: 'Quad and the Indo-Pacific',
            points: [
              'India, US, Japan, Australia.',
              'Works on sea security, vaccines, tech and disaster help — not a military alliance.',
            ],
            ask: 'Is the Quad an anti-China group?' },
          { id: 'ir-brics-sco', level: 'good', tests: ['GD'],
            title: 'BRICS and SCO',
            points: [
              'BRICS has grown beyond its first five members.',
              'SCO includes China, Russia and Pakistan, plus Central Asia.',
              'India uses them to speak for developing countries, but resists China leading them.',
            ],
            ask: 'What does India gain from BRICS?' },
          { id: 'ir-g20-global-south', level: 'good', tests: ['GD', 'Lecturette'],
            title: 'G20 and the Global South',
            points: [
              'India held the G20 presidency in 2023. The African Union became a member.',
              'India speaks for poorer countries on debt, climate money and fair trade.',
            ],
            ask: 'Can India be the voice of the Global South?' },
          { id: 'ir-un-reform', level: 'good', tests: ['GD', 'PI'],
            title: 'UN reform and the Security Council',
            points: [
              'Five permanent members, set in 1945, hold a veto.',
              'India wants a permanent seat: large population, peacekeeping record, growing economy.',
            ],
            ask: 'Is the UN still useful?' },
          { id: 'ir-west-asia', level: 'good', tests: ['GD'],
            title: 'West Asia (Middle East)',
            points: [
              'Millions of Indians work in the Gulf and send money home.',
              'Most of India\'s oil comes from here.',
              'India keeps good ties with Israel, Arab states and Iran at the same time.',
              'IMEC: a planned trade corridor from India to Europe through the region.',
            ],
            ask: 'How does a war in West Asia affect an Indian village?' },
          { id: 'ir-ukraine', level: 'good', tests: ['GD'],
            title: 'Russia–Ukraine war',
            points: [
              'Began February 2022. Raised food, fuel and fertiliser prices worldwide.',
              'India called for talks and peace, and kept ties with both.',
            ],
            ask: 'What has the Ukraine war taught the world about modern war?' },
          { id: 'ir-act-east', level: 'deep', tests: ['GD'],
            title: 'Act East and ASEAN',
            points: [
              'Build trade, connectivity and security ties with South-East Asia.',
              'The Northeast is India\'s gateway to this region.',
            ],
            ask: 'How can Act East help India\'s Northeast?' },
        ],
      },
      {
        title: 'India\'s influence',
        topics: [
          { id: 'ir-soft-power', level: 'must', tests: ['GD', 'Lecturette', 'PI'],
            title: 'Soft power',
            article: 'ins-sudarshini-lokayan-2026',
            points: [
              'Getting what you want by being liked, not by force or money.',
              'India\'s tools: yoga, films, food, democracy, diaspora, vaccine supplies during Covid.',
              'Soft power works slowly and needs hard power behind it.',
            ],
            answer: 'medium', ask: 'Give an example of India using soft power.' },
          { id: 'ir-diaspora', level: 'good', tests: ['GD'],
            title: 'Indian diaspora',
            points: [
              'One of the largest in the world. Sends the most money home of any country.',
              'Helps build ties abroad; also needs India\'s help in crises.',
            ],
            ask: 'Is brain drain bad for India?' },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'economy',
    title: 'Economy',
    blurb: 'Money, jobs and prices — the topics that touch every family.',
    room: 'Economy',
    groups: [
      {
        title: 'The basics',
        topics: [
          { id: 'eco-gdp', level: 'must', tests: ['GD', 'PI'],
            title: 'GDP and growth',
            points: [
              'GDP = value of everything a country produces in a year.',
              'India is among the fastest-growing big economies and one of the top five by size.',
              'But income per person is still low. Size is not the same as wealth.',
            ],
            ask: 'India is a big economy. Why are so many Indians still poor?' },
          { id: 'eco-inflation-rbi', level: 'must', tests: ['GD', 'PI'],
            title: 'Inflation and the RBI',
            points: [
              'Inflation = prices rising over time.',
              'RBI raises interest rates to cool prices, cuts them to push growth.',
              'Food prices drive much of India\'s inflation.',
            ],
            ask: 'Why do onion prices become national news?' },
          { id: 'eco-rupee', level: 'good', tests: ['GD', 'Lecturette'],
            title: 'The falling rupee',
            article: 'rupee-depreciation',
            points: [
              'The rupee weakens when more people want dollars than rupees.',
              'Hurts importers (oil, gold); helps exporters and IT companies.',
              'RBI does not fix the rate — it stops wild swings.',
            ],
            ask: 'Is a falling rupee always bad?' },
          { id: 'eco-budget', level: 'good', tests: ['GD', 'PI'],
            title: 'The Budget and fiscal deficit',
            points: [
              'Budget = government\'s yearly plan of income and spending.',
              'Fiscal deficit = how much more it spends than it earns, so it borrows.',
              'Key debate: free schemes vs spending on roads, schools and defence.',
            ],
            ask: 'Are freebies good or bad for the country?' },
        ],
      },
      {
        title: 'Jobs and people',
        topics: [
          { id: 'eco-jobs', level: 'must', tests: ['GD', 'Lecturette'],
            title: 'Unemployment and jobs',
            points: [
              'Many young people, not enough good jobs. Many graduates lack job skills.',
              'Most workers are in the informal sector with no job security.',
              'Fixes discussed: factories, skills, small business loans, tourism.',
            ],
            ask: 'How can India create jobs for its youth?' },
          { id: 'eco-agriculture', level: 'must', tests: ['GD', 'PI'],
            title: 'Farmers and agriculture',
            points: [
              'Nearly half of workers depend on farming, but it gives a much smaller share of GDP.',
              'Issues: small land, debt, water, prices. MSP = minimum price government promises for some crops.',
              'Ideas: food processing, better storage, crop variety, less water-hungry crops.',
            ],
            ask: 'Why are Indian farmers struggling when India grows so much food?' },
          { id: 'eco-poverty', level: 'good', tests: ['GD'],
            title: 'Poverty and inequality',
            points: [
              'Hundreds of millions have left extreme poverty in recent decades.',
              'But the gap between rich and poor has grown.',
              'Free ration and direct cash to bank accounts are the big support tools.',
            ],
            ask: 'Is growing inequality a problem if the poor are also getting richer?' },
        ],
      },
      {
        title: 'Business and trade',
        topics: [
          { id: 'eco-make-in-india', level: 'good', tests: ['GD', 'Lecturette'],
            title: 'Make in India and manufacturing',
            points: [
              'Aim: make India a factory for the world, like China.',
              'PLI schemes pay companies for producing more in India — phones are a success story.',
              'Hurdles: land, power, skills, red tape.',
            ],
            ask: 'Can India replace China as the world\'s factory?' },
          { id: 'eco-upi', level: 'must', tests: ['GD', 'Lecturette', 'PI'],
            title: 'Digital India and UPI',
            points: [
              'UPI made instant phone payments normal, even for street vendors.',
              'Aadhaar, Jan Dhan accounts and UPI together let money reach people directly.',
              'Other countries are now adopting UPI.',
              'Risks: online fraud, people left out, data privacy.',
            ],
            answer: 'medium', ask: 'How has UPI changed life in your town?' },
          { id: 'eco-startups', level: 'deep', tests: ['GD'],
            title: 'Startups',
            points: [
              'India has one of the world\'s largest startup systems.',
              'Many succeed in payments, food delivery, education; many also fail.',
            ],
            ask: 'Should a bright student start a company or take a job?' },
          { id: 'eco-trade', level: 'good', tests: ['GD'],
            title: 'Trade, tariffs and trade deals',
            points: [
              'Tariff = tax on goods from another country.',
              'The US put heavy tariffs on Indian goods in 2025, which hit exporters.',
              'India has signed trade deals with the UAE, Australia, the UK and others.',
            ],
            ask: 'Should India protect its industries or open up to trade?' },
          { id: 'eco-energy', level: 'good', tests: ['GD', 'Lecturette'],
            title: 'Energy security',
            points: [
              'India imports most of its oil. Price shocks hurt everyone.',
              'Coal still makes most of India\'s power.',
              'Answer: more solar and wind, nuclear, buying oil from many sources.',
            ],
            ask: 'How can India get cheap power without hurting the planet?' },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'polity',
    title: 'Polity & Governance',
    blurb: 'How India is run. Officers swear an oath to this Constitution.',
    room: 'Society',
    groups: [
      {
        title: 'The Constitution',
        topics: [
          { id: 'pol-constitution', level: 'must', tests: ['PI', 'GD'],
            title: 'Constitution basics',
            points: [
              'Came into force on 26 January 1950. Dr B. R. Ambedkar chaired the Drafting Committee.',
              'Preamble: sovereign, socialist, secular, democratic republic; justice, liberty, equality, fraternity.',
              'Fundamental Rights can be taken to court; Directive Principles guide the government.',
              'Fundamental Duties include defending the country when called.',
            ],
            answer: 'medium', ask: 'Which Fundamental Right matters most to you, and why?' },
          { id: 'pol-federalism', level: 'good', tests: ['GD'],
            title: 'Centre and states',
            points: [
              'Powers are split: some to the Centre, some to states, some shared.',
              'Fights over money (GST share), Governors\' role, and language.',
            ],
            ask: 'Is India becoming too centralised?' },
          { id: 'pol-ucc', level: 'good', tests: ['GD'],
            title: 'Uniform Civil Code',
            points: [
              'One set of personal laws (marriage, divorce, property) for all religions.',
              'Directive Principle in Article 44. Uttarakhand brought one in 2024.',
              'For: equality, especially for women. Against: worry about cultural freedom.',
            ],
            ask: 'Should India have a Uniform Civil Code?' },
        ],
      },
      {
        title: 'Institutions',
        topics: [
          { id: 'pol-elections', level: 'must', tests: ['GD', 'PI'],
            title: 'Elections and One Nation One Election',
            points: [
              'The world\'s largest election. Run by the Election Commission.',
              'One Nation One Election: hold Lok Sabha and state polls together to save money and time.',
              'Concern: national issues may drown out local ones.',
            ],
            ask: 'Should India hold all elections together?' },
          { id: 'pol-judiciary', level: 'good', tests: ['GD'],
            title: 'Courts and delayed justice',
            points: [
              'Crores of cases are pending in Indian courts.',
              'Reasons: too few judges, slow procedures, frequent adjournments.',
              'Fixes: more judges, e-courts, fast-track courts.',
            ],
            ask: 'Justice delayed is justice denied. How do we speed it up?' },
          { id: 'pol-local', level: 'good', tests: ['PI', 'GD'],
            title: 'Panchayats and local government',
            points: [
              '73rd and 74th Amendments (1992) gave villages and towns elected bodies.',
              'One-third of seats are for women.',
              'Problem: little money and power actually reach them.',
            ],
            answer: 'medium', ask: 'How does your village or ward panchayat work?' },
          { id: 'pol-women-reservation', level: 'good', tests: ['GD'],
            title: 'Women\'s reservation in Parliament',
            points: [
              'Law passed in 2023: one-third of Lok Sabha and Assembly seats for women.',
              'It starts only after the next census and redrawing of seats.',
            ],
            ask: 'Will reservation alone bring women into politics?' },
          { id: 'pol-corruption', level: 'good', tests: ['GD', 'Lecturette'],
            title: 'Corruption and transparency',
            points: [
              'RTI Act (2005) lets any citizen ask the government for information.',
              'Lokpal investigates top officials.',
              'Digital payments and online services cut out middlemen.',
            ],
            ask: 'Can technology end corruption?' },
          { id: 'pol-police', level: 'deep', tests: ['GD'],
            title: 'Police reform',
            points: [
              'Too few police per person, heavy workload, political pressure.',
              'The Supreme Court ordered reforms in 2006 (Prakash Singh case); many are still not done.',
              'New criminal laws replaced the IPC, CrPC and Evidence Act in 2024.',
            ],
            ask: 'What one change would make the police better?' },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'society',
    title: 'Society',
    blurb: 'GDs love social issues. Have a calm, balanced view, not an angry one.',
    room: 'Society',
    groups: [
      {
        title: 'Women',
        topics: [
          { id: 'soc-women-work', level: 'must', tests: ['GD', 'Lecturette'],
            title: 'Women at work',
            article: 'women-workforce-paradox',
            points: [
              'More girls are studying, but fewer women work outside the home than in most countries.',
              'Reasons: safety, housework load, social pressure, lack of nearby jobs.',
            ],
            ask: 'Why do educated Indian women leave work?' },
          { id: 'soc-women-safety', level: 'must', tests: ['GD'],
            title: 'Women\'s safety',
            article: 'women-safety-economy',
            points: [
              'Fear of crime limits where women study, work and travel.',
              'Laws are strong on paper; police response and court speed matter more.',
            ],
            ask: 'What can a young officer do to make women feel safe?' },
          { id: 'soc-women-power', level: 'good', tests: ['GD'],
            title: 'Women in politics and leadership',
            article: 'women-proxy-representation',
            points: [
              'Women hold few seats in Parliament and few top jobs in business.',
              '"Sarpanch pati": husbands running panchayats in the wife\'s name.',
            ],
            ask: 'Why are so few Indian women in leadership roles?' },
        ],
      },
      {
        title: 'Youth and education',
        topics: [
          { id: 'soc-education', level: 'must', tests: ['GD', 'PI'],
            title: 'Education and NEP 2020',
            article: 'women-education-gap',
            points: [
              'NEP 2020: early learning, mother tongue in early classes, flexible subjects, skills.',
              'Problem: many children are in school but cannot read or do basic maths well.',
              'Coaching culture and exam pressure on students.',
            ],
            ask: 'What is wrong with India\'s education system?' },
          { id: 'soc-demographic', level: 'must', tests: ['GD', 'Lecturette'],
            title: 'Population and the demographic dividend',
            points: [
              'India is the most populous country (since 2023). Most people are young.',
              'Young population can be a big gift — only if they are healthy, skilled and employed.',
              'Southern states are already ageing; northern states are still young.',
            ],
            ask: 'Is India\'s large population a strength or a burden?' },
          { id: 'soc-social-media', level: 'must', tests: ['GD', 'Lecturette'],
            title: 'Social media and youth',
            points: [
              'Connects people and spreads learning; also fake news, addiction and anxiety.',
              'Reels shorten attention spans; trolling and online bullying hurt.',
            ],
            ask: 'Is social media doing more harm than good to young people?' },
          { id: 'soc-drugs', level: 'good', tests: ['GD'],
            title: 'Drug abuse',
            points: [
              'Serious in Punjab and the Northeast; drones bring drugs across the border.',
              'Needs police action, treatment centres and family support together.',
            ],
            ask: 'How can we keep young people away from drugs?' },
          { id: 'soc-mental-health', level: 'good', tests: ['GD'],
            title: 'Mental health',
            points: [
              'Exam stress and student suicides, for example in coaching hubs.',
              'People still feel shame in asking for help.',
              'Soldiers also face stress in hard postings.',
            ],
            ask: 'Why do we not talk about mental health openly?' },
        ],
      },
      {
        title: 'Society at large',
        topics: [
          { id: 'soc-health', level: 'good', tests: ['GD'],
            title: 'Healthcare',
            article: 'women-health-india',
            points: [
              'Ayushman Bharat gives free hospital cover to poor families.',
              'Villages lack doctors; many families still pay most costs from their own pocket.',
              'Lifestyle diseases like diabetes are rising fast.',
            ],
            ask: 'How would you improve healthcare in your district?' },
          { id: 'soc-caste-reservation', level: 'good', tests: ['GD'],
            title: 'Caste and reservation',
            points: [
              'Reservation was meant to undo centuries of discrimination.',
              'Debates: who benefits, the creamy layer, the 10% quota for poorer general category, caste census.',
              'In a GD, stay calm and fair. Officers lead men from every background.',
            ],
            ask: 'Should reservation be based on caste or on income?' },
          { id: 'soc-urbanisation', level: 'good', tests: ['GD', 'Lecturette'],
            title: 'Cities and migration',
            points: [
              'People move to cities for work; cities struggle with housing, traffic and floods.',
              'Smart Cities Mission and metro rail are the big answers so far.',
              'Covid lockdown showed how insecure migrant workers are.',
            ],
            ask: 'Should we stop people moving to big cities, or make cities better?' },
          { id: 'soc-unity', level: 'good', tests: ['GD', 'PI'],
            title: 'Unity in diversity',
            points: [
              'Many religions, languages and cultures in one country.',
              'The Army is a living example: men from every corner serve side by side.',
            ],
            ask: 'What holds India together?' },
          { id: 'soc-sports', level: 'good', tests: ['GD', 'PI'],
            title: 'Sports in India',
            points: [
              'Cricket dominates; other sports lack money and fans.',
              'Khelo India and TOPS fund young athletes. India wants to host the 2036 Olympics.',
              'Many top athletes come from the forces and from small towns.',
            ],
            ask: 'Why does India win so few Olympic medals for its size?' },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'scitech',
    title: 'Science & Technology',
    blurb: 'Big ideas explained simply. You do not need to be an engineer.',
    room: 'Science & Tech',
    groups: [
      {
        title: 'Space',
        topics: [
          { id: 'sci-isro', level: 'must', tests: ['GD', 'Lecturette', 'PI'],
            title: 'ISRO and India\'s space journey',
            points: [
              'Chandrayaan-3 (2023): first landing near the Moon\'s south pole.',
              'Mangalyaan reached Mars on the first try. Aditya-L1 studies the Sun.',
              'Gaganyaan: India\'s plan to send its own astronauts.',
              'Private companies now build rockets too.',
            ],
            ask: 'Why should a developing country spend on space?' },
        ],
      },
      {
        title: 'New technology',
        topics: [
          { id: 'sci-ai', level: 'must', tests: ['GD', 'Lecturette'],
            title: 'Artificial Intelligence',
            points: [
              'AI can write, see, speak and decide. Used in health, farming, defence.',
              'Fears: lost jobs, fake videos (deepfakes), bias, weapons that choose targets.',
              'India\'s AI Mission aims to build its own computing power and models.',
            ],
            ask: 'Will AI take away more jobs than it creates?' },
          { id: 'sci-semiconductors', level: 'good', tests: ['GD'],
            title: 'Semiconductors (chips)',
            points: [
              'Chips run everything from phones to missiles. Taiwan makes most of the best ones.',
              'India is building its first big chip plants with government support.',
            ],
            ask: 'Why are chips called the new oil?' },
          { id: 'sci-data-privacy', level: 'good', tests: ['GD'],
            title: 'Data privacy',
            points: [
              'The Supreme Court held privacy a Fundamental Right (2017).',
              'Digital Personal Data Protection Act (2023) sets rules on using personal data.',
            ],
            ask: 'Who owns your data — you or the company?' },
          { id: 'sci-evs', level: 'good', tests: ['GD', 'Lecturette'],
            title: 'Electric vehicles',
            points: [
              'Less pollution and less oil import.',
              'Problems: price, charging points, batteries mostly from China, power still from coal.',
              'Two- and three-wheelers are leading the change in India.',
            ],
            ask: 'Is India ready for electric vehicles?' },
          { id: 'sci-nuclear-energy', level: 'deep', tests: ['GD'],
            title: 'Nuclear energy',
            points: [
              'Clean, steady power, but costly and slow to build.',
              'India plans to grow nuclear power and open it to private firms, including small reactors.',
            ],
            ask: 'Should India build more nuclear power plants?' },
          { id: 'sci-biotech', level: 'deep', tests: ['GD'],
            title: 'Vaccines and biotech',
            points: [
              'India is called the "pharmacy of the world" for cheap medicines and vaccines.',
              'Vaccine Maitri: India sent Covid vaccines to many countries.',
            ],
            ask: 'What did Covid teach India about health security?' },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'environment',
    title: 'Environment & Geography',
    blurb: 'The planet is a GD favourite. Know the map, then the debate.',
    room: 'Environment',
    groups: [
      {
        title: 'India on the map',
        topics: [
          { id: 'env-geography', level: 'must', tests: ['PI'],
            title: 'India\'s geography basics',
            points: [
              'Neighbours and which states border them.',
              'Major rivers, where they rise and where they meet the sea.',
              'Mountain ranges, deserts, islands, and the main passes in the north.',
            ],
            answer: 'short', ask: 'Which states border China? Name the rivers of your state.' },
          { id: 'env-monsoon', level: 'good', tests: ['GD', 'Lecturette'],
            title: 'Monsoon and El Niño',
            article: 'super-el-nino',
            points: [
              'Most of India\'s rain comes in four monsoon months.',
              'El Niño, a warming of the Pacific, often means weaker rain in India.',
              'A bad monsoon raises food prices and hurts farmers.',
            ],
            ask: 'How does warm water in the Pacific affect an Indian farmer?' },
        ],
      },
      {
        title: 'Climate and pollution',
        topics: [
          { id: 'env-climate', level: 'must', tests: ['GD', 'Lecturette', 'PI'],
            title: 'Climate change and India',
            points: [
              'Hotter summers, floods, cyclones and melting glaciers.',
              'India\'s position: rich countries polluted first, so they must pay and cut more.',
              'India aims for net zero by 2070 and 500 GW of clean power by 2030.',
            ],
            ask: 'Should India slow its growth to fight climate change?' },
          { id: 'env-renewables', level: 'good', tests: ['GD'],
            title: 'Solar and wind power',
            points: [
              'India is among the top countries for solar power.',
              'International Solar Alliance was started by India and France.',
              'Storage (batteries) is the next big need.',
            ],
            ask: 'Can solar power replace coal in India?' },
          { id: 'env-air', level: 'must', tests: ['GD'],
            title: 'Air pollution',
            points: [
              'Many of the world\'s most polluted cities are in India.',
              'Causes: vehicles, industry, dust, burning crop stubble, firecrackers.',
              'It shortens lives and needs action across state borders.',
            ],
            ask: 'Who is responsible for Delhi\'s smog?' },
          { id: 'env-water', level: 'must', tests: ['GD', 'Lecturette'],
            title: 'Water crisis',
            points: [
              'Groundwater is falling fast, especially in Punjab and Haryana.',
              'Jal Jeevan Mission aims to bring tap water to every rural home.',
              'Fixes: drip irrigation, rainwater harvesting, less water-heavy crops.',
            ],
            ask: 'Will the next war be fought over water?' },
          { id: 'env-plastic', level: 'deep', tests: ['GD'],
            title: 'Plastic and waste',
            points: [
              'Single-use plastic ban since 2022, but hard to enforce.',
              'Swachh Bharat improved toilets and cleanliness; waste processing still lags.',
            ],
            ask: 'What would you do to cut plastic use in your town?' },
        ],
      },
      {
        title: 'Disasters and nature',
        topics: [
          { id: 'env-disasters', level: 'must', tests: ['GD', 'PI'],
            title: 'Disaster management',
            points: [
              'India faces floods, cyclones, earthquakes, landslides and heatwaves.',
              'NDMA plans; NDRF responds. The forces are often first on the scene.',
              'Better warnings have cut cyclone deaths sharply.',
            ],
            ask: 'What role do the armed forces play in disasters?' },
          { id: 'env-himalaya', level: 'good', tests: ['GD'],
            title: 'The fragile Himalayas',
            points: [
              'Floods and landslides in Uttarakhand, Himachal and Sikkim are getting worse.',
              'Roads, dams and hotels built without care add to the risk.',
            ],
            ask: 'Development or the environment in the hills — can we have both?' },
          { id: 'env-wildlife', level: 'deep', tests: ['GD'],
            title: 'Forests and wildlife',
            points: [
              'Project Tiger has helped tiger numbers grow; India has most of the world\'s wild tigers.',
              'Project Cheetah brought cheetahs back to India from Africa in 2022.',
              'Human–animal conflict is rising as forests shrink.',
            ],
            ask: 'Is Project Cheetah worth the cost?' },
        ],
      },
    ],
  },
];

// Flat list in sheet order, with each topic's step attached.
export const TOPICS = STEPS.flatMap(step =>
  step.groups.flatMap(group =>
    group.topics.map(t => ({ ...t, stepId: step.id, stepTitle: step.title, room: step.room }))
  )
);

export const TOPIC_BY_ID = Object.fromEntries(TOPICS.map(t => [t.id, t]));
