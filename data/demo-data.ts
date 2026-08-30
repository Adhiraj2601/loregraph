import { ideaRepo, nodeRepo, edgeRepo, isSeeded, markSeeded } from '@/lib/storage/repository';

export function seedDemoData() {
  if (typeof window === 'undefined') return;
  if (isSeeded()) return;

  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();

  // ─── THE ASH DRAGONS ───────────────────────────────────────────────────────
  const ashDragons = ideaRepo.create({
    title: 'The Ash Dragons',
    description:
      'A species born beneath volcanic mountains, carrying ancestral memories through generations of fire and ruin.',
    tags: ['dragon', 'creature', 'magic', 'lore'],
    coverColor: '#7C3A2D',
  });

  // Force specific timestamps
  ideaRepo.update(ashDragons.id, { createdAt: hoursAgo(72), updatedAt: hoursAgo(2) });

  const ashRoot = nodeRepo.create({
    ideaId: ashDragons.id,
    title: 'Ash Dragons',
    description:
      'Ancient draconic creatures born in the caldera of dying volcanoes. Unlike their kin, Ash Dragons breathe superheated volcanic ash rather than fire. They are among the most intelligent beings in the known world, with memories that pass between generations through a process called Memory Inheritance.',
    type: 'CREATURE',
    tags: ['dragon', 'ancient', 'volcanic'],
    position: { x: 400, y: 300 },
    isRoot: true,
  });

  const appearance = nodeRepo.create({
    ideaId: ashDragons.id,
    title: 'Appearance',
    description:
      'Ash Dragons are slate-grey to obsidian black, with scales that absorb light rather than reflecting it. Their eyes glow with deep amber — the color of magma seen through thick basalt. When agitated, fine cracks appear between their scales revealing the orange heat within.',
    type: 'LORE',
    tags: ['visual', 'design'],
    position: { x: 100, y: 100 },
  });

  const ashBreath = nodeRepo.create({
    ideaId: ashDragons.id,
    title: 'Ash Breath',
    description:
      "Ash Dragons don't breathe conventional fire. They eject superheated volcanic ash capable of obscuring entire battlefields. The ash reaches temperatures hot enough to melt iron and carries paralytic minerals that seep through skin on contact. A single exhalation can cover several acres.",
    type: 'ABILITY',
    tags: ['combat', 'fire', 'ash', 'magic'],
    position: { x: 700, y: 100 },
  });

  const volcanicCaves = nodeRepo.create({
    ideaId: ashDragons.id,
    title: 'Volcanic Caves',
    description:
      'Ash Dragons nest in the magma chambers of dormant volcanoes. These chambers, called Hearthrooms by dragon scholars, are carved over centuries. The ambient heat keeps eggs viable for decades. Multiple clan families often share a single volcano, with elaborate territorial markers etched into the stone.',
    type: 'LOCATION',
    tags: ['habitat', 'volcano', 'home'],
    position: { x: 100, y: 500 },
  });

  const dragonClans = nodeRepo.create({
    ideaId: ashDragons.id,
    title: 'Dragon Clans',
    description:
      'Ash Dragons organize themselves into Clans, family groups united by shared ancestral memory. The eldest dragon in a clan — often called the Memory Keeper — holds the accumulated experiences of all deceased clan members. Clans rarely war with one another, as killing clan leaders means destroying irreplaceable history.',
    type: 'FACTION',
    tags: ['society', 'culture', 'organization'],
    position: { x: 700, y: 500 },
  });

  const elderDragons = nodeRepo.create({
    ideaId: ashDragons.id,
    title: 'Elder Dragons',
    description:
      'Ash Dragons who have lived beyond five centuries. Their scales have fully mineralized, making them nearly impervious to conventional weapons. They speak in long, rolling sentences that span minutes, as if their minds process time differently. Elder Dragons are considered living libraries.',
    type: 'CHARACTER',
    tags: ['elder', 'ancient', 'powerful'],
    position: { x: 400, y: 550 },
  });

  const warOfEmbers = nodeRepo.create({
    ideaId: ashDragons.id,
    title: 'War of Embers',
    description:
      "Three centuries ago, the human Ember Empire attempted to harvest Ash Dragon eggs for weapons research. The resulting conflict lasted forty years and ended with the complete dissolution of the Empire. The Ash Dragons refer to this as the Second Remembering — the first time collective ancestral memory was used as a weapon of war, coordinating attacks across continents without any communication network.",
    type: 'EVENT',
    tags: ['war', 'history', 'empire', 'conflict'],
    position: { x: 400, y: 100 },
  });

  const memoryInheritance = nodeRepo.create({
    ideaId: ashDragons.id,
    title: 'Memory Inheritance',
    description:
      'When an Ash Dragon dies near kin, its memories transfer to the closest living relative through a process not yet understood by scholars. The inheritor experiences the memories as vivid waking dreams for several weeks afterward. Some Elder Dragons carry thousands of years of inherited experience.',
    type: 'MAGIC',
    tags: ['magic', 'memory', 'death', 'inheritance'],
    position: { x: 700, y: 300 },
  });

  const dragonEggs = nodeRepo.create({
    ideaId: ashDragons.id,
    title: 'Dragon Eggs',
    description:
      'Ash Dragon eggs appear as rough volcanic rock. They are nearly indistinguishable from natural basalt to the untrained eye. Eggs incubate for ten to fifteen years. During incubation, the developing dragon can apparently hear the thoughts of nearby adults — making the egg-chamber a school before birth.',
    type: 'OBJECT',
    tags: ['egg', 'birth', 'reproduction'],
    position: { x: 100, y: 300 },
  });

  const dragonboneMountains = nodeRepo.create({
    ideaId: ashDragons.id,
    title: 'Dragonbone Mountains',
    description:
      'A mountain range formed from the calcified skeletons of dragons who died in the ancient First Age. As Ash Dragon bones continue growing after death, over millennia they fuse into ridgelines and peaks. The mountains are considered sacred ground and are avoided by nearly every human civilization.',
    type: 'LOCATION',
    tags: ['location', 'sacred', 'ancient', 'mountains'],
    position: { x: 400, y: -100 },
  });

  const ancientReligion = nodeRepo.create({
    ideaId: ashDragons.id,
    title: 'Ancient Dragon Religion',
    description:
      'Ash Dragons do not worship gods — they worship the Accumulated. The Accumulated is the theoretical ultimate form of Memory Inheritance: a being that has absorbed the memories of every Ash Dragon who ever lived. Scholars debate whether the Accumulated exists, is a myth, or is simply an Elder Dragon too old to communicate anymore.',
    type: 'CONCEPT',
    tags: ['religion', 'belief', 'philosophy'],
    position: { x: -100, y: 300 },
  });

  // Edges for Ash Dragons
  edgeRepo.create({ ideaId: ashDragons.id, source: ashRoot.id, target: appearance.id, relationship: 'has' });
  edgeRepo.create({ ideaId: ashDragons.id, source: ashRoot.id, target: ashBreath.id, relationship: 'possesses' });
  edgeRepo.create({ ideaId: ashDragons.id, source: ashRoot.id, target: volcanicCaves.id, relationship: 'inhabits' });
  edgeRepo.create({ ideaId: ashDragons.id, source: ashRoot.id, target: dragonClans.id, relationship: 'organizes into' });
  edgeRepo.create({ ideaId: ashDragons.id, source: ashRoot.id, target: dragonEggs.id, relationship: 'lays' });
  edgeRepo.create({ ideaId: ashDragons.id, source: ashRoot.id, target: memoryInheritance.id, relationship: 'practices' });
  edgeRepo.create({ ideaId: ashDragons.id, source: dragonClans.id, target: elderDragons.id, relationship: 'led by' });
  edgeRepo.create({ ideaId: ashDragons.id, source: warOfEmbers.id, target: ashRoot.id, relationship: 'fought by' });
  edgeRepo.create({ ideaId: ashDragons.id, source: memoryInheritance.id, target: elderDragons.id, relationship: 'defines' });
  edgeRepo.create({ ideaId: ashDragons.id, source: volcanicCaves.id, target: dragonEggs.id, relationship: 'shelters' });
  edgeRepo.create({ ideaId: ashDragons.id, source: ashRoot.id, target: dragonboneMountains.id, relationship: 'created' });
  edgeRepo.create({ ideaId: ashDragons.id, source: ancientReligion.id, target: memoryInheritance.id, relationship: 'venerates' });

  // ─── THE MOON KINGDOM ─────────────────────────────────────────────────────
  const moonKingdom = ideaRepo.create({
    title: 'The Moon Kingdom',
    description:
      'A civilization that only manifests during lunar eclipses. Between eclipses, its citizens exist as formless shadows interwoven with moonlight.',
    tags: ['kingdom', 'magic', 'eclipse', 'mystery'],
    coverColor: '#2D3A5C',
  });
  ideaRepo.update(moonKingdom.id, { createdAt: hoursAgo(48), updatedAt: hoursAgo(5) });

  const moonRoot = nodeRepo.create({
    ideaId: moonKingdom.id,
    title: 'Moon Kingdom',
    description:
      'An ancient civilization whose physical existence is tied to lunar eclipses. During totality, its cities materialize fully. Between eclipses, citizens exist as conscious shadows, able to observe but not interact with the physical world.',
    type: 'FACTION',
    tags: ['kingdom', 'moon', 'eclipse'],
    position: { x: 400, y: 300 },
    isRoot: true,
  });

  const queenAria = nodeRepo.create({
    ideaId: moonKingdom.id,
    title: 'Queen Aria',
    description:
      'The eternal queen of the Moon Kingdom. She has ruled for nine hundred years, never aging because she exists between moments. During eclipses she is the only one who remains solid at all times.',
    type: 'CHARACTER',
    tags: ['royalty', 'eternal', 'ruler'],
    position: { x: 150, y: 150 },
  });

  const shadowForm = nodeRepo.create({
    ideaId: moonKingdom.id,
    title: 'Shadow Form',
    description:
      'The state Moon Kingdom citizens exist in between eclipses. They can perceive the world around them but cannot touch, speak, or interact with physical matter. Communication among shadow-forms is through a wordless empathic resonance.',
    type: 'MAGIC',
    tags: ['shadow', 'form', 'intangible'],
    position: { x: 650, y: 150 },
  });

  const eclipseGates = nodeRepo.create({
    ideaId: moonKingdom.id,
    title: 'Eclipse Gates',
    description:
      'Massive stone archways that only become visible and passable during lunar eclipses. They connect the Moon Kingdom to the physical world. Scholars have located seventeen such gates scattered across the known world.',
    type: 'OBJECT',
    tags: ['gate', 'portal', 'eclipse'],
    position: { x: 400, y: 500 },
  });

  const moonMemory = nodeRepo.create({
    ideaId: moonKingdom.id,
    title: 'The Moon Memory',
    description:
      'A ritual performed by Queen Aria once per eclipse cycle in which she transfers the accumulated knowledge of the shadow-years into physical records. These records, written in silver ink on obsidian, form the most complete historical archive in existence.',
    type: 'LORE',
    tags: ['archive', 'history', 'ritual'],
    position: { x: 650, y: 450 },
  });

  const eclipseWar = nodeRepo.create({
    ideaId: moonKingdom.id,
    title: 'The Eclipse War',
    description:
      'A conflict between the Moon Kingdom and a coalition of physical-world nations who attempted to artificially trigger eclipses to control when the Moon Kingdom would materialize, using them as a surprise military force.',
    type: 'EVENT',
    tags: ['war', 'conflict', 'eclipse'],
    position: { x: 150, y: 450 },
  });

  edgeRepo.create({ ideaId: moonKingdom.id, source: moonRoot.id, target: queenAria.id, relationship: 'ruled by' });
  edgeRepo.create({ ideaId: moonKingdom.id, source: moonRoot.id, target: shadowForm.id, relationship: 'exists as' });
  edgeRepo.create({ ideaId: moonKingdom.id, source: moonRoot.id, target: eclipseGates.id, relationship: 'uses' });
  edgeRepo.create({ ideaId: moonKingdom.id, source: moonRoot.id, target: moonMemory.id, relationship: 'maintains' });
  edgeRepo.create({ ideaId: moonKingdom.id, source: eclipseWar.id, target: moonRoot.id, relationship: 'threatened' });
  edgeRepo.create({ ideaId: moonKingdom.id, source: queenAria.id, target: moonMemory.id, relationship: 'performs' });

  // ─── THE SEVEN IMMORTAL SWORDS ────────────────────────────────────────────
  const swords = ideaRepo.create({
    title: 'The Seven Immortal Swords',
    description:
      'Seven blades forged from the condensed grief of dying gods. Each sword kills something beyond flesh — memory, time, love, language.',
    tags: ['artifact', 'magic', 'gods', 'swords'],
    coverColor: '#3A2D5C',
  });
  ideaRepo.update(swords.id, { createdAt: hoursAgo(120), updatedAt: hoursAgo(20) });

  const swordsRoot = nodeRepo.create({
    ideaId: swords.id,
    title: 'Seven Immortal Swords',
    description:
      'Seven legendary blades, each forged from the condensed grief of a dying god. They cannot be destroyed, only lost. Each blade kills something intangible rather than flesh alone — making them the most terrifying weapons ever made.',
    type: 'OBJECT',
    tags: ['sword', 'artifact', 'divine', 'legend'],
    position: { x: 400, y: 300 },
    isRoot: true,
  });

  const griefForge = nodeRepo.create({
    ideaId: swords.id,
    title: 'The Grief Forge',
    description:
      'The mythological location where the swords were created. Said to exist at the intersection of three dying stars. No mortal has found it, though the Bladekeepers — a monastic order — dedicate their lives to the search.',
    type: 'LOCATION',
    tags: ['forge', 'creation', 'myth'],
    position: { x: 150, y: 150 },
  });

  const bladeOfForgetting = nodeRepo.create({
    ideaId: swords.id,
    title: 'Blade of Forgetting',
    description:
      'The most feared of the seven. A wound from this blade causes the victim to slowly forget their entire life. The process takes weeks. Victims remain alive and functional but lose all memory, identity, and attachment. They become peaceful strangers in their own skin.',
    type: 'OBJECT',
    tags: ['sword', 'memory', 'curse'],
    position: { x: 650, y: 150 },
  });

  const bladekeepers = nodeRepo.create({
    ideaId: swords.id,
    title: 'The Bladekeepers',
    description:
      'A monastic order that has tracked the location of each of the seven swords for over six centuries. They believe the swords must never be united — that bringing all seven together would create a weapon capable of killing existence itself.',
    type: 'FACTION',
    tags: ['order', 'monks', 'guardian'],
    position: { x: 400, y: 500 },
  });

  const divineGrief = nodeRepo.create({
    ideaId: swords.id,
    title: 'Divine Grief',
    description:
      'The emotional substance from which the swords were forged. Gods experience grief differently from mortals — it does not fade but instead crystallizes into a substance denser than any known material. The swords are the only known objects made of crystallized divine emotion.',
    type: 'CONCEPT',
    tags: ['grief', 'divine', 'emotion', 'material'],
    position: { x: 650, y: 450 },
  });

  edgeRepo.create({ ideaId: swords.id, source: swordsRoot.id, target: griefForge.id, relationship: 'forged at' });
  edgeRepo.create({ ideaId: swords.id, source: swordsRoot.id, target: bladeOfForgetting.id, relationship: 'includes' });
  edgeRepo.create({ ideaId: swords.id, source: swordsRoot.id, target: bladekeepers.id, relationship: 'guarded by' });
  edgeRepo.create({ ideaId: swords.id, source: divineGrief.id, target: swordsRoot.id, relationship: 'forms' });
  edgeRepo.create({ ideaId: swords.id, source: bladeOfForgetting.id, target: divineGrief.id, relationship: 'contains' });

  // ─── CITIES BENEATH THE OCEAN ─────────────────────────────────────────────
  const oceanCities = ideaRepo.create({
    title: 'Cities Beneath the Ocean',
    description:
      'Drowned civilizations that continue to function perfectly underwater, their citizens transformed to breathe the deep.',
    tags: ['civilization', 'ocean', 'mystery', 'drowned'],
    coverColor: '#1A3A4A',
  });
  ideaRepo.update(oceanCities.id, { createdAt: hoursAgo(168), updatedAt: hoursAgo(36) });

  const oceanRoot = nodeRepo.create({
    ideaId: oceanCities.id,
    title: 'Sunken Cities',
    description:
      'Several ancient cities sank beneath the ocean centuries ago, but rather than being destroyed, they adapted. Their populations transformed — some willingly, some through a curse — into beings capable of surviving the deep pressure. The cities continue to function, trade, and evolve.',
    type: 'LOCATION',
    tags: ['city', 'ocean', 'ancient', 'underwater'],
    position: { x: 400, y: 300 },
    isRoot: true,
  });

  const deepTransformation = nodeRepo.create({
    ideaId: oceanCities.id,
    title: 'The Deep Transformation',
    description:
      'The process by which the citizens of the sunken cities adapted. Over generations, exposure to deep-ocean minerals and an unknown magical catalyst changed their biology. They breathe water, see in the dark, and communicate through bioluminescent patterns on their skin.',
    type: 'MAGIC',
    tags: ['transformation', 'biology', 'magic'],
    position: { x: 150, y: 150 },
  });

  const abyssalMarket = nodeRepo.create({
    ideaId: oceanCities.id,
    title: 'The Abyssal Market',
    description:
      'The largest underwater trading hub, located in the ruins of what was once the wealthiest merchant city on the surface. Currency here is not gold but compressed light — captured in crystalline spheres that glow for decades.',
    type: 'LOCATION',
    tags: ['market', 'trade', 'economy'],
    position: { x: 650, y: 200 },
  });

  const pressureGlass = nodeRepo.create({
    ideaId: oceanCities.id,
    title: 'Pressure Glass',
    description:
      'A material unique to the sunken cities, formed by subjecting sand to extreme deep-ocean pressure in furnaces heated by volcanic vents. Pressure Glass is stronger than steel, perfectly transparent, and vibrates at frequencies that repel most deep-sea predators.',
    type: 'OBJECT',
    tags: ['material', 'glass', 'invention'],
    position: { x: 400, y: 500 },
  });

  edgeRepo.create({ ideaId: oceanCities.id, source: oceanRoot.id, target: deepTransformation.id, relationship: 'caused' });
  edgeRepo.create({ ideaId: oceanCities.id, source: oceanRoot.id, target: abyssalMarket.id, relationship: 'contains' });
  edgeRepo.create({ ideaId: oceanCities.id, source: oceanRoot.id, target: pressureGlass.id, relationship: 'produces' });

  // ─── THE GOD WHO FORGOT HIS NAME ─────────────────────────────────────────
  const forgottenGod = ideaRepo.create({
    title: 'The God Who Forgot His Name',
    description:
      'A deity of immense power who has lost all memory of what they were worshipped for. They now wander among mortals, asking strange questions.',
    tags: ['god', 'memory', 'mystery', 'wandering'],
    coverColor: '#2A2A3A',
  });
  ideaRepo.update(forgottenGod.id, { createdAt: hoursAgo(96), updatedAt: hoursAgo(12) });

  const godRoot = nodeRepo.create({
    ideaId: forgottenGod.id,
    title: 'The Unnamed God',
    description:
      'Once a god of immense power and clear purpose, the Unnamed God lost all memory of their own divine function sometime in the past three centuries. They retain their power but cannot access it reliably, as divine magic is apparently tied to self-knowledge.',
    type: 'CHARACTER',
    tags: ['god', 'divine', 'amnesiac'],
    position: { x: 400, y: 300 },
    isRoot: true,
  });

  const forgottenDomain = nodeRepo.create({
    ideaId: forgottenGod.id,
    title: 'The Forgotten Domain',
    description:
      'Whatever the Unnamed God was the deity of has begun to fail. Scholars argue over what it might be — some say Death, others say Language, others say Doors. The failure of this domain manifests differently in different places, causing strange phenomena.',
    type: 'CONCEPT',
    tags: ['domain', 'failing', 'mystery'],
    position: { x: 150, y: 150 },
  });

  const godSeekers = nodeRepo.create({
    ideaId: forgottenGod.id,
    title: 'The God-Seekers',
    description:
      'A loose network of scholars, priests, and dreamers who have encountered the Unnamed God and dedicated themselves to helping the deity remember. They collect stories, fragments, and clues, believing that when the God remembers, something crucial will be restored to the world.',
    type: 'FACTION',
    tags: ['seekers', 'scholars', 'devotees'],
    position: { x: 650, y: 150 },
  });

  const strangeQuestions = nodeRepo.create({
    ideaId: forgottenGod.id,
    title: 'The Strange Questions',
    description:
      'The Unnamed God wanders among mortals asking questions that seem nonsensical but are actually attempts to piece together identity. "Do you know where thresholds sleep?" "What does it feel like when something is finally over?" The questions are recorded by the God-Seekers.',
    type: 'LORE',
    tags: ['questions', 'mystery', 'wandering'],
    position: { x: 400, y: 500 },
  });

  edgeRepo.create({ ideaId: forgottenGod.id, source: godRoot.id, target: forgottenDomain.id, relationship: 'governs' });
  edgeRepo.create({ ideaId: forgottenGod.id, source: godRoot.id, target: godSeekers.id, relationship: 'followed by' });
  edgeRepo.create({ ideaId: forgottenGod.id, source: godRoot.id, target: strangeQuestions.id, relationship: 'asks' });
  edgeRepo.create({ ideaId: forgottenGod.id, source: godSeekers.id, target: strangeQuestions.id, relationship: 'records' });

  markSeeded();
}

export function forceSeedDemoData() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('loregraph:seeded');
  } catch (e) {
    console.error(e);
  }
  seedDemoData();
}
