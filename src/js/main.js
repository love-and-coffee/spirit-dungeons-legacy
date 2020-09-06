const monetization = document.monetization;
const addEvent = (e, t, f) => {
	e.addEventListener(t, f);
};

let isPremium = false;
if (monetization) {
	addEvent(monetization, 'monetizationstart', () => {
		isPremium = true;
	});
}

const click = 'click';
const afterbegin = 'afterbegin';
const m = Math;
const svgStart = '<svg viewBox="0 0 64 64">';
const increase = 'Increases your ';

const getElemById = (id) => document.getElementById(id);

const getElemBySelector = (selector) => document.querySelectorAll(selector);

const setStyle = (element, property, value) => {
	element.style[property] = value;
};

const getLength = (array) => array.length;

const insertHtml = (element, where, what) => {
	element.insertAdjacentHTML(where, what);
};

class Tween {
	constructor(target, handler, settings) {
		this.target = target;
		this.handler = handler;

		this.start = settings.start;
		this.end = settings.end;

		this.easing = settings.easing;

		this.from = settings.from;
		this.to = settings.to;
		this.keys = [];

		this.onstart = settings.onstart;
		this.onprogress = settings.onprogress;
		this.onend = settings.onend;

		this.running = false;

		this.store = target.__liike || (target.__liike = {});
	}

	init() {
		for (const key in this.to) {
			if (!(key in this.from)) {
				this.from[key] = this.store[key] || 0;
			}
			this.keys.push(key);
		}

		for (const key in this.from) {
			if (!(key in this.to)) {
				this.to[key] = this.store[key] || 0;
				this.keys.push(key);
			}
		}
	}

	tick(t) {
		const e = this.easing(t);

		for (let i = 0; i < getLength(this.keys); i++) {
			const key = this.keys[i];

			this.store[key] = this.from[key] + (this.to[key] - this.from[key]) * e;
		}

		this.handler(this.target, this.store);
	}
}

const easeInBy = (power) => (t) => m.pow(t, power);
const easeOutBy = (power) => (t) => 1 - m.abs(m.pow(t - 1, power));

const quadOut = easeOutBy(2);
const quartIn = easeInBy(4);
const quintOut = easeOutBy(5);

// 0 - quadOut
// 1 - quartIn
// 2 - quintOut

const ease = [
	quadOut,
	quartIn,
	quintOut,
];

const tweens = [];
const jobs = [];
const nullFunc = () => {};

let ticking = 0;

const tick = (now) => {
	while (getLength(jobs)) {
		const job = jobs.shift();

		job(now);
	}

	for (let i = 0; i < getLength(tweens); i++) {
		const tween = tweens[i];

		if (now < tween.start) {
			// not yet started
			continue;
		}

		if (!tween.running) {
			tween.running = true;
			tween.init();
			tween.onstart(tween.target);
		}

		const t = (now - tween.start) / (tween.end - tween.start);

		tween.tick((t < 1) ? t : 1);
		tween.onprogress(tween.target, t);

		if (now > tween.end) {
			tween.onend(tween.target);
			tweens.splice(i--, 1);
		}
	}

	if (getLength(jobs) || getLength(tweens)) {
		ticking = requestAnimationFrame(tick);
	} else {
		ticking = 0;
	}
};

const liike = (handler) => function (target, settings) {
	const { delay = 0 } = settings;
	const { duration = 0 } = settings;
	const { from = {} } = settings;
	const { to = {} } = settings;
	const { easing = 0 } = settings;
	const { onprogress = nullFunc } = settings;
	const { onstart = nullFunc } = settings;
	const { onend = nullFunc } = settings;

	jobs.push((now) => {
		const tween = new Tween(target, handler, {
			start: now + delay,
			end: now + delay + duration,
			from,
			to,
			easing: ease[easing],
			onstart,
			onprogress,
			onend,
		});

		tweens.push(tween);
	});
	if (!ticking) {
		ticking = requestAnimationFrame(tick);
	}
};

const transform = (target, data) => {
	const {
		x = 0, y = 0, rotation = 0, opacity = 1,
	} = data;

	setStyle(target, 'transform', `translate(${x}px, ${y}px) rotate(${rotation}deg)`);
	setStyle(target, 'opacity', opacity);
};

const tween = liike(transform);

let gameState;
let player;
let enemy;
let lastRender = 0;
let inBattle = true;
let unitToRestoreGeneration = null;
let nextSaveAt = 30000;

let playerBattleUnits;
let enemyBattleUnits;

let navElements;

const tabContent = [];

let playerCurrentLevelElement;
let playerNextLevelProgressElement;
let playerCurrentGoldElement;
let playerGoldPerSecondElement;
let playerUnitTimeProgressElements = [];
let playerUnitAmountElements = [];
let playerUnitElements = [];

let stageCurrentElement;
let battleBlockElement;

let firstGameLockDone = false;

let attackElement;

let attackAttributeValueElement;
let defenseAttributeValueElement;

let attributeBlockElement;

let navSkillsElement;
let navMoralityElement;
let navTrophiesElement;

let trophyTitleElement;
let trophyListElement;
let lastTrophyNotification;

let skillTitleElement;
let skillLockElement;
const skillLockRemoved = false;

let goldAmountsToCheck = [];
let lostGoldAmountsToCheck = [];

let processingAttackAction = 0;

const unitUnlockLevel = [0, 10, 22, 36, 50, 70];

const uiIcons = {
	gold: `${svgStart}<path d="M31 3c-1 0-3 0-4 2l-1 1-1-1-5-1c-2 0-3 1-4 3l-1 1h-1l-4-1-2 2 10 8h7l6-3 4-10a5 6 0 00-4-1zm2 12a17 17 0 01-10 5l-2 2h1c0 3 1 6 3 8l-2 1-3-4 2 9-2 1c-2-6-3-12 0-17l-3-1-1 2c-4 5-6 11-5 15 0 3 2 5 3 7a19 19 0 016 1h3l10 2 2 1a4 5 0 010-1l-1-4c0-2 1-4 3-5v-2l-2-4 1-2a5 5 0 01-1-5l-2-3 2-4-2-2zm14 1l-8 1c-2 1-3 2-3 4l3 3 8 2 4-1v-2l4-1v2l3-3c0-2-1-3-3-4l-8-1zm12 8l-2 1 1 4 2-3-1-2zm-22 2l3 3 9 2 5-1v-3l-7 1-9-2zm1 4l-1 1 3 4 9 1h4v-3a25 25 0 01-14-2zm22 0a11 11 0 01-3 2v2l3-3zm1 5l-1 1v4l2-3-1-2zm-22 2l3 3a22 22 0 0014 1v-3l-7 1-10-2zm-1 2c-2 1-2 2-2 3l3 3 8 2h4v-3h-1c-3 0-6 0-9-2-1 0-3-1-3-3zm20 4l-3 1v1c2 0 2-1 3-2zm1 2l-2 2v3l3-3-1-2zm-43 1a19 19 0 00-11 3c-2 2-3 3-2 4 0 1 1 2 3 2h7l3-1v-2l4-3v3l2-4-3-2h-3zm7 0l1 2v2a14 14 0 015 3l3-2v3l3-3-3-3-9-2zm14 1l3 4 9 1h4v-4a24 24 0 01-16-1zm1 5l-1 1 3 3 9 2 4-1v-3a25 25 0 01-14-1zm21 0a11 12 0 01-2 1v3l3-3zm-36 0l-2 2a22 22 0 01-11 4l2 2 7 2 4-1v-2l4-2v3l2-3-3-3-3-2z"/></svg>`,
	book: `${svgStart}<path d="M7 5v31l10 4v-3l-8-4 2-1 6 2-3-27-7-2zm50 0c-8 3-18 0-24 9v26c2-3 6-5 9-5 4-1 8-1 11-4l2 2c-4 3-9 3-13 4-3 1-7 2-9 8l24-9zM16 6l3 29v27l3-5 3 5V37L21 7zm8 3l3 27a11 11 0 014 4V14l-7-5zM3 9v31l14 5v-3L5 38V9zm56 0v29L32 48l-5-2v5c3 1 7 0 11-1v-2l23-8V9zM27 39v4l3 2-3-6z"/></svg>`,
	level: `${svgStart}<path d="M12 2v19l1 1 15 3 6-8 6 8a68 62 0 0016-4l1-19-11 12-5-12-7 13-7-13-5 12zm22 19l-4 5 4 5 4-5zm-23 3h-1c0 1 0 2 3 3l17 3-2-3a57 51 0 01-17-3zm46 0h-1l-15 3-3 3c6 0 11-1 17-3l3-3h-1zm-3 5l-17 4-3 2-2-2-18-3c-2 3-3 7-3 11 5 2 9 5 11 8 1 3 2 7 1 10l3 1 1-6h3l-1 7h4v-7h3v7h4l-1-7h2l1 6 3-2c0-3 0-6 2-9s5-5 10-8l-3-12zm-36 6c4 0 9 2 14 5-7 4-18 4-15-5zm33 0h1c3 9-8 9-15 5 5-3 9-5 14-5zm-17 7l4 8h-7c0-3 2-6 3-8z"/></svg>`,
	battle: `${svgStart}<path d="M8 2a2 2 0 00-1 1 2 2 0 002 4l7 8-6 5 3 4 4-7 1 5 10-2-3-3-5-2 7-4-3-3-6 5-8-8a2 2 0 00-2-3zm48 0a2 2 0 00-2 3l-7 8-6-5-3 3 7 4-5 2-3 3 10 1v-4l5 7 3-4-6-5 7-8a2 2 0 100-5zM33 22l-15 2c0 11 4 26 15 33 10-7 15-22 15-33l-15-2zM18 41L8 53l-2 8 8-2 8-10-4-8zm29 1l-4 8 8 9 8 2-2-8z"/></svg>`,
	morality: `${svgStart}<path d="M32 3a29 29 0 100 58 29 29 0 000-58zm-1 2c-15 1-15 27 1 27s16 26 1 27h-1a27 27 0 01-1-54zm1 8c3 0 5 2 5 5s-2 5-5 5-5-2-5-5 2-5 5-5zm0 28c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5z"/></svg>`,
	trophy: `${svgStart}<path d="M32 3L17 4l-4 1h-2l-1 2v4H7V8L4 7C3 20 8 33 18 42l1-3-1-2 2-2 6 4c3 2 1 4-3 5 7 1 5 7-2 11h-1l-3 1-2 1v2l2 1 3 1a86 86 0 0027-1l1-1 1-1-1-1-1-1-3-1h-1c-7-4-9-10-2-11-4-1-6-3-3-5l6-4 2 2-2 2 2 3c10-9 15-22 14-35l-3 1v3h-3V7l-1-2h-2l-4-1-15-1zm0 2a99 99 0 0118 2h1-1a98 98 0 01-36 0h-1 1a98 98 0 0118-2zM7 14h4c1 7 3 14 7 18l-3 3c-4-6-7-14-8-21zm46 0h4c-1 7-4 14-9 20l-2-2c4-4 6-11 7-18z"/></svg>`,
};

const premiumIcons = {
	gold: '💰',
	book: '📚',
	level: '🤴',
	battle: '⚔️',
	morality: '😇',
	trophy: '🏆',
};

const trophyColors = [
	'#ffffff', '#619663', '#4d84b9', '#8c458c', '#ce9938', '#ff6280',
];

// 0 - icon
// 1 - icon2
// 2 - time
// 3 - attack
// 4 - defense
// 5 - minDamage
// 6 - maxDamage
// 7 - health
// 8 - speed
// 9 - exp

const units = [
	[
		'<svg class="skeleton" viewBox="0 0 128 128"><path d="M64 4C34 4 4 19 4 42c0 15 11 22 11 37 0 11-4 11-4 19 0 4 12 8 23 11v15h60v-15s23-7 22-11c0-7-3-8-3-19 0-7 11-23 11-37 0-23-30-38-60-38zM41 49a15 15 0 110 30 15 15 0 010-30zm45 0a15 15 0 110 30 15 15 0 010-30zM64 75c4 0 11 15 11 19 0 8 0 8-4 8H56c-3 0-3 0-3-8 0-4 7-19 11-19z"/></svg>',
		'💀',
		1020, // 60 * 17
		5,
		4,
		1,
		3,
		6,
		4,
		0.01,
	],
	[
		`${svgStart}<path d="M32 3l-5 1c6 3 13 6 22 8l-3-3c-4-3-9-6-14-6zm-9 2l-7 5 4 1a326 326 0 0024 6h7v-2C40 13 31 9 23 5zm-8 7l-1 3-2 4 23-2h-4a338 338 0 01-16-5zm37 7l-42 3v3c15-2 29-1 43 0v-3l-1-3zm-35 7l5 6c2 1 5-1 7-2-4 0-8-2-12-4zm30 0c-4 2-8 4-11 4 1 1 4 3 6 2l5-6zm4 1l-2 6h2l2-6zm-38 0l-2 1v2l3 1zm-4 3l-4 9 4 1 2-3-1-2zm3 3l2 6c11 3 24 3 36 3l1-7c-13 1-26 1-39-2zm3 9l2 7c14-3 26-3 32-3v-2c-11 0-23 0-34-2zm22 7h-3l1 2zm8 0l-2 4h2l2-4zm4 0l-2 5 4 6 3-5a16 16 0 01-5-6zm-19 0h-2l1 3zm-10 1l-2 1 1 2h2zm6 1l-1 3h2zm6 0v3h2zm6 1l-1 2h2zm-18 3l1 3 7 3 7-5-15-1zm24 0l-6 1-7 5h1c5 0 9-1 11-3z"/></svg>`,
		'🧟',
		1700, // 100 * 17
		5,
		5,
		2,
		3,
		15,
		3,
		0.02,
	],
	[
		`${svgStart}<path d="M34 2h-1c-6 1-11 6-10 10 0 3 2 6 5 7l1 1 2 2 9-1 1-3c3-2 4-5 4-8 0-4-5-8-11-8zm6 6a3 3 0 110 6 3 3 0 010-6zm-11 2a3 3 0 110 6 3 3 0 010-6zm5 4l3 5h-5zm-20 1c-7 0-8 2-11 3 0 8 4 16 2 29 2-1 7-12 7-12l-1 11 7-12v6l4-6c0 3-1 7-3 9-5 7-6 17-6 17l5-7-2 9c5-4 7-8 8-13l1 13 3-8 5 8v-9c1 3 7 6 10 5-5-5-8-20 2-25l-3 8c4-1 6-4 7-6l-1 14 6-14v13c7-6 7-13 7-27-4-3-9-5-15-6l-3 5-1 3h-1l1 4h-3v-3h-2v4h-2l-1-4h-2v4h-2l-1-4-2-3a12 12 0 01-6-5l-7-1z"/></svg>`,
		'👻',
		3400, // 200 * 17
		7,
		7,
		3,
		5,
		18,
		5,
		0.04,
	],
	[
		`${svgStart}<path d="M32 2c-6 0-13 1-17 5-2 3-3 7-3 11l1 5 1 1 1-2a51 51 0 010-4v-1h1v-3h-1v-1h3v-3h-2l1-2c4-3 9-3 13-3l2 5 2-5c4 0 10 0 13 3l1 2h-2v3h3v1h-1v3h1v1a51 51 0 010 4l1 2 1-1 1-5c0-4-1-8-3-11-5-5-11-5-17-5zM21 19c-4 2-6 7-6 13v6c1 3 4 5 6 7v11l1 1c3 2 7 3 10 3 4 0 7 0 10-3l1-1V45c2-2 6-4 6-7v-6c0-6-2-11-5-13l-6-1-6 3-6-3-5 1zM7 23c0 3 1 7 3 10l2 5h1v-6-6l-3-2-3-1zm50 0l-3 1-3 2v12h1l3-5 2-10zm-35 3l9 9-1 1v2H18c0-2 2-6 6-6h1l-3-3-3 3-2-1zm2 12a2 2 0 100-4 2 2 0 000 4zm18-12l5 5-2 1-3-3-2 3c4 0 6 4 6 6H34l1-2-2-1zm-2 12a2 2 0 100-4 2 2 0 000 4zm-25 4L3 47c5 2 9 5 11 8 2 2 3 5 3 7h9l-5-3-2-3V46l-4-4zm34 0l-4 4v10l-1 3-6 3h9c0-2 1-5 3-7 2-3 6-6 11-8l-12-5zm-20 1l3 1 3-1 2 1c-2 1-3 3-5 3l-5-3zm-4 6l2 1h11l1-1 2 1-2 3h-1l-2 5-2-5h-4l-2 5-2-5-3-3z"/></svg>`,
		'🧛',
		6120, // 360 * 17
		10,
		9,
		5,
		8,
		30,
		6,
		0.08,
	],
	[
		`${svgStart}<path d="M31 3c-8 0-16 2-21 5H9c3 7 6 12 10 16v9l8 4-6 24h24l-4-17 8 13 2-1c-2-6-6-10-9-14l4-3-6-13 6-5c-2-4-5-8-9-11-4 2-6 7-9 11l-4 5-9-12c9-6 24-8 37-5-5-5-13-6-21-6z"/></svg>`,
		'👽',
		20400, // 1200 * 17
		16,
		16,
		15,
		30,
		120,
		7,
		0.3,
	],
	[
		`${svgStart}<path d="M25 5C5 10-2 38 5 54a51 51 0 0111-39c-3 12-3 24 1 32-2-10-1-22 2-30 0 7 1 14 4 19-1-13 6-5 8-1v5c0 2-2 4-4 5-4 2-7 5-7 8-1 2 0 5 2 7 1 1 4 2 7 1 2-1 4-3 5-6l3 2c0-4 1-7 3-10l-12 5 4 1c-1 4-3 5-4 6l-5-1c-1-1-2-3-1-5 0-2 2-4 6-6 3-1 5-3 6-6l-1-8c3-4 9-8 7 3 3-5 4-12 4-19 4 8 5 20 2 30 5-8 5-20 2-32 8 9 13 23 11 39 7-16-1-44-21-49 4 11 6 20-6 24-12-4-11-13-7-24zm2 7l-1 4c0 5 2 8 6 10a11 11 0 004-14s-2 7-4 9l-5-9z"/></svg>`,
		'🐲',
		30600, // 1800 * 17
		17,
		15,
		25,
		50,
		150,
		9,
		0.5,
	],
];

const skillKey = {
	wrath: 0,
	calm: 1,
	prosperity: 2,
	learning: 3,
	necromancy: 4,
	skeleton: 5,
	zombie: 6,
	wight: 7,
	vampire: 8,
	// lich: 9,
	grimReaper: 9,
	boneDragon: 10,
};

const skills = [
	['Wrath', `${increase}Attack power`, skillKey.wrath, 0.05, 1000, 1.05],
	['Calm', `${increase}Defense power`, skillKey.calm, 0.025, 1000, 1.05],
	['Prosperity', `${increase}Gold gain`, skillKey.prosperity, 0.05, 1000, 1.05],
	['Learning', `${increase}Experience gain`, skillKey.learning, 0.025, 1000, 1.1],
	['Necromancy', `${increase}Production speed`, skillKey.necromancy, 0.01, 10000, 1.5],
	['Skeleton', `${increase}Skeleton power`, skillKey.skeleton, 0.05, 1000, 1.05],
	['Zombie', `${increase}Zombie power`, skillKey.zombie, 0.05, 1000, 1.05],
	['Wight', `${increase}Wight power`, skillKey.wight, 0.05, 1000, 1.05],
	['Vampire', `${increase}Vampire power`, skillKey.vampire, 0.05, 1000, 1.05],
	['Grim Reaper', `${increase}Grim Reaper power`, skillKey.grimReaper, 0.05, 1000, 1.05],
	['Bone Dragon', `${increase}Bone Dragon power`, skillKey.boneDragon, 0.05, 1000, 1.05],
];

const trophyKey = {
	skeleton: 0,
	zombie: 1,
	wight: 2,
	vampire: 3,
	grimReaper: 4,
	boneDragon: 5,
	gold: 6,
	level: 7,
	attack: 8,
	defense: 9,
	skillUpgrades: 10,
	enemiesKilled: 11,
	morality: 12,
	stage: 13,
};

const trophies = [
	{ type: trophyKey.skeleton, value: 100 },
	{ type: trophyKey.skeleton, value: 500 },
	{ type: trophyKey.skeleton, value: 1000 },
	{ type: trophyKey.skeleton, value: 5000 },
	{ type: trophyKey.skeleton, value: 10000 },
	{ type: trophyKey.skeleton, value: 25000 },
	{ type: trophyKey.zombie, value: 100 },
	{ type: trophyKey.zombie, value: 500 },
	{ type: trophyKey.zombie, value: 1000 },
	{ type: trophyKey.zombie, value: 4000 },
	{ type: trophyKey.zombie, value: 8000 },
	{ type: trophyKey.zombie, value: 15000 },
	{ type: trophyKey.wight, value: 10 },
	{ type: trophyKey.wight, value: 50 },
	{ type: trophyKey.wight, value: 100 },
	{ type: trophyKey.wight, value: 500 },
	{ type: trophyKey.wight, value: 1000 },
	{ type: trophyKey.wight, value: 5000 },
	{ type: trophyKey.vampire, value: 10 },
	{ type: trophyKey.vampire, value: 50 },
	{ type: trophyKey.vampire, value: 100 },
	{ type: trophyKey.vampire, value: 500 },
	{ type: trophyKey.vampire, value: 1000 },
	{ type: trophyKey.vampire, value: 5000 },
	{ type: trophyKey.grimReaper, value: 10 },
	{ type: trophyKey.grimReaper, value: 50 },
	{ type: trophyKey.grimReaper, value: 100 },
	{ type: trophyKey.grimReaper, value: 500 },
	{ type: trophyKey.grimReaper, value: 1000 },
	{ type: trophyKey.grimReaper, value: 5000 },
	{ type: trophyKey.boneDragon, value: 10 },
	{ type: trophyKey.boneDragon, value: 50 },
	{ type: trophyKey.boneDragon, value: 100 },
	{ type: trophyKey.boneDragon, value: 500 },
	{ type: trophyKey.boneDragon, value: 1000 },
	{ type: trophyKey.boneDragon, value: 2500 },
	{ type: trophyKey.gold, value: 10000 },
	{ type: trophyKey.gold, value: 100000 },
	{ type: trophyKey.gold, value: 1000000 },
	{ type: trophyKey.gold, value: 1000000000 },
	{ type: trophyKey.gold, value: 1000000000000 },
	{ type: trophyKey.gold, value: 10000000000000000 },
	{ type: trophyKey.level, value: 3 },
	{ type: trophyKey.level, value: 6 },
	{ type: trophyKey.level, value: 12 },
	{ type: trophyKey.level, value: 20 },
	{ type: trophyKey.level, value: 30 },
	{ type: trophyKey.level, value: 50 },
	{ type: trophyKey.attack, value: 3 },
	{ type: trophyKey.attack, value: 6 },
	{ type: trophyKey.attack, value: 10 },
	{ type: trophyKey.attack, value: 16 },
	{ type: trophyKey.attack, value: 22 },
	{ type: trophyKey.attack, value: 30 },
	{ type: trophyKey.defense, value: 3 },
	{ type: trophyKey.defense, value: 6 },
	{ type: trophyKey.defense, value: 10 },
	{ type: trophyKey.defense, value: 16 },
	{ type: trophyKey.defense, value: 22 },
	{ type: trophyKey.defense, value: 30 },
	{ type: trophyKey.skillUpgrades, value: 100 },
	{ type: trophyKey.skillUpgrades, value: 250 },
	{ type: trophyKey.skillUpgrades, value: 500 },
	{ type: trophyKey.skillUpgrades, value: 1000 },
	{ type: trophyKey.skillUpgrades, value: 2500 },
	{ type: trophyKey.skillUpgrades, value: 5000 },
	{ type: trophyKey.enemiesKilled, value: 100 },
	{ type: trophyKey.enemiesKilled, value: 1000 },
	{ type: trophyKey.enemiesKilled, value: 5000 },
	{ type: trophyKey.enemiesKilled, value: 25000 },
	{ type: trophyKey.enemiesKilled, value: 100000 },
	{ type: trophyKey.enemiesKilled, value: 500000 },
	{ type: trophyKey.morality, value: 1 },
	{ type: trophyKey.stage, value: 10 },
	{ type: trophyKey.stage, value: 25 },
	{ type: trophyKey.stage, value: 50 },
	{ type: trophyKey.stage, value: 100 },
	{ type: trophyKey.stage, value: 125 },
	{ type: trophyKey.stage, value: 150 },
];

// 0 - version
// 1 - firstGameOpenTime
// 2 - lastGameOpenTime
// 3 - lastGameSaveTime
// 4 - playerLevel
// 5 - playerExperience
// 6 - playerAttack
// 7 - playerDefense
// 8 - playerGold
// 9 - stage
// 10 - enemyUnits
// 11 - enemyUnitHealth
// 12 - playerUnits
// 13 - playerUnitHealth
// 14 - playerUnitTimeProgress
// 15 - unlockedSkills
// 16 - unlockedSkillLevels
// 17 - playerUnitGenerating
// 18 - currentBattleUnit
// 19 - allBattleUnitsBySpeed
// 20 - stageCompleteGoldBonus
// 21 - stageCompleteGoldModifier
// 22 - playerGoldPerSecondModifier
// 23 - unlockedTrophies
// 24 - trophyUnitsGenerated
// 25 - trophyGoldGained
// 26 - trophyPlayerLevelReached
// 27 - trophyAttackGained
// 28 - trophyDefenseGained
// 29 - trophySkillUpgradesBought
// 30 - trophyEnemiesKilled
// 31 - trophyStageReached
// 32 - trophyMoralityReached
// 33 - isPremium
// 34 - usePremiumTheme
// 35 - trophyBonus
// 36 - playerBonusAttack
// 37 - playerBonusDefense
// 38 - buyAmount

const initialGameState = [
	'0.1',
	Date.now(),
	Date.now(),
	Date.now(),
	1,
	16, // start at 16
	0,
	0,
	0,
	0,
	[],
	[],
	[20], // [50], // [50, 1, 1, 1, 1, 1],
	[units[0][7], units[1][7], units[2][7], units[3][7], units[4][7]], // [units[0][7], units[1][7], units[2][7], units[3][7], units[4][7], units[5][7]],
	[0], // [0, 0, 0, 0, 0, 0],
	[],
	[],
	0,
	-1,
	[],
	100,
	1.15,
	1.15,
	[],
	[0, 0, 0, 0, 0, 0],
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	false,
	false,
	1,
	0,
	0,
	1,
];

const abbreviatedNumberDictionary = ['', 'k', 'm', 'b', 't', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', 'Vg', 'Uvg', 'Dvg', 'Tvg', 'Qavg', 'Qivg', 'Sxvg', 'Spvg', 'Ocvg', 'Novg', 'Tg', 'Utg', 'Dtg', 'Ttg', 'Qatg', 'Qitg', 'Sxtg', 'Sptg', 'Octg', 'Notg', 'Qag', 'Uqag', 'Dqag', 'Tqag', 'Qaqag', 'Qiqag', 'Sxqag', 'Spqag', 'Ocqag', 'Noqag', 'Qig', 'Uqig', 'Dqig', 'Tqig', 'Qaqig', 'Qiqig', 'Sxqig', 'Spqig', 'Ocqig', 'Noqig', 'Sxg', 'Usxg', 'Dsxg', 'Tsxg', 'Qasxg', 'Qisxg', 'Sxsxg', 'Spsxg', 'Ocsxg', 'Nosxg', 'Spg', 'Uspg', 'Dspg', 'Tspg', 'Qaspg', 'Qispg', 'Sxspg', 'Spspg', 'Ocspg', 'Nospg', 'Ocg', 'Uocg', 'Docg', 'Tocg', 'Qaocg', 'Qiocg', 'Sxocg', 'Spocg', 'Ococg', 'Noocg', 'Nog', 'Unog', 'Dnog', 'Tnog', 'Qanog', 'Qinog', 'Sxnog', 'Spnog', 'Ocnog', 'Nonog', 'C', 'Uc', 'Dc', 'Tc', 'Qac', 'Qic', 'Sxc', 'Spc', 'Occ', 'Noc'];

const getAbbreviatedNumberNotation = (exp) => {
	const exp3 = m.floor(m.abs(exp) / 3);
	return abbreviatedNumberDictionary[exp3];
};

const formatNumber = (number, floor = true) => {
	let sign = '';
	if (number < 0) {
		sign = '-';
	}
	number = m.abs(number);
	if (number < 1000) {
		return sign + m.floor(number);
	}
	if (floor) {
		return sign + (m.floor(number / m.pow(10, m.floor(m.abs(m.log10(number)) / 3) * 3) * 10) / 10).toFixed(1) + getAbbreviatedNumberNotation(m.floor(m.log10(number)));
	}
	return sign + (m.ceil(number / m.pow(10, m.floor(m.abs(m.log10(number)) / 3) * 3) * 10) / 10).toFixed(1) + getAbbreviatedNumberNotation(m.floor(m.log10(number)));
};

const getRandomArbitrary = (min, max) => m.random() * (max - min) + min;

const getRandomInt = (min, max) => {
	min = m.ceil(min);
	max = m.floor(max);
	return m.floor(m.random() * (max - min + 1)) + min;
};

const orderBySpeed = (a, b) => {
	if (a.speed > b.speed) {
		return -1;
	}
	if (a.speed < b.speed) {
		return 1;
	}
	return 0;
};

const saveGame = (gameStateToSave) => {
	gameStateToSave[3] = Date.now();
	localStorage.setItem('soulNotFoundGameState', JSON.stringify(gameStateToSave));
	return gameStateToSave;
};

const loadGame = (forceNew = false) => {
	const loadedGameState = localStorage.getItem('soulNotFoundGameState');

	if (loadedGameState == null || forceNew) {
		return saveGame(initialGameState.slice());
	}
	return JSON.parse(loadedGameState);
};

const restartGame = () => {
	if (gameState[4] < 10) {
		return;
	}

	if (!confirm('This will make things easier as you keep your attributes and trophy bonuses.')) {
		return;
	}

	const newGame = initialGameState.slice();

	newGame[36] = gameState[36] + gameState[6];
	newGame[37] = gameState[37] + gameState[7];
	newGame[24] = gameState[24];
	newGame[25] = gameState[25];
	newGame[26] = gameState[26];
	newGame[27] = gameState[27];
	newGame[28] = gameState[28];
	newGame[29] = gameState[29];
	newGame[30] = gameState[30];
	newGame[31] = gameState[31];
	newGame[32] = gameState[32];

	gameState = newGame;

	saveGame(gameState);
	location.reload();
};

const renderPlayerCurrentGold = () => {
	playerCurrentGoldElement.innerHTML = formatNumber(gameState[8], true);
};

const getSkillBonus = (skillIndex, skillId = null, backend = false) => {
	if (skillIndex === null) {
		for (let i = 0; i < getLength(gameState[15]); i++) {
			if (gameState[15][i] == skillId) {
				skillIndex = i;
				break;
			}
		}

		if (skillIndex === null) {
			if (backend) {
				return 1;
			}
			return 0;
		}
	} else {
		skillId = gameState[15][skillIndex];
	}
	const skillLevel = gameState[16][skillIndex];
	const skill = skills[skillId];

	if (backend) {
		return (1 + m.floor(skill[3] * skillLevel * 100) * 0.01) * gameState[35];
	}

	if (skillId == skillKey.necromancy && skillLevel >= 25) {
		return m.floor(skill[3] * 25 * 100 * gameState[35]);
	}
	return m.floor(skill[3] * skillLevel * 100 * gameState[35]);
};

const renderPlayerGoldPerSecond = () => {
	playerGoldPerSecondElement.innerHTML = `+${formatNumber(m.pow(gameState[22], gameState[9]) * 10 * getSkillBonus(null, skillKey.prosperity, true))}/s`;
};

const skillAtLevelCost = (skillToUpgrade, level) => m.ceil(skillToUpgrade[4] * m.pow(skillToUpgrade[5], level));

const getSkillUpgradeCost = (skill, level) => {
	const skillToUpgrade = skills[skill];

	let levelsBought = 0;
	let cost = 0;

	do {
		levelsBought += 1;
		cost += skillAtLevelCost(skillToUpgrade, level + levelsBought);
		if (gameState[38] == 99999999 && gameState[8] < cost) {
			if (levelsBought > 1) {
				cost -= skillAtLevelCost(skillToUpgrade, level + levelsBought);
			}
			levelsBought -= 1;
			break;
		}
	} while (levelsBought < gameState[38]);

	return [cost, levelsBought];
};

const getUnusedAttributes = () => gameState[4] - 1 - gameState[6] - gameState[7];

const getUnusedSkills = () => m.min(6, m.floor(gameState[4] / 6)) - getLength(gameState[15]);

const addLockIcon = (query) => {
	const elements = getElemBySelector(query);

	for (let i = 0; i < getLength(elements); i++) {
		if (gameState[34]) {
			insertHtml(elements[i], afterbegin, '🔒');
		} else {
			insertHtml(elements[i], afterbegin, `${svgStart}<path d="M32 2c-10 0-18 8-18 19v9h6v-9a12 12 0 1124 0v9h6v-9c0-10-8-19-18-19zM11 32l-3 9c0 12 10 21 24 21 13 0 24-9 24-21l-3-9zm21 3c3 0 5 2 5 5 0 2-1 4-3 5l4 12H26l4-12a5 5 0 012-10z"/></svg>`);
		}
	}
};

const renderNotifications = () => {
	let affordableUpgrades = false;
	let costs;

	for (let i = 0; i < getLength(gameState[15]); i++) {
		costs = getSkillUpgradeCost(gameState[15][i], gameState[16][i]);
		if (gameState[8] >= costs[0]) {
			affordableUpgrades = true;
			break;
		}
	}

	if (affordableUpgrades) {
		navSkillsElement.classList.add('notify');
	} else {
		navSkillsElement.classList.remove('notify');
	}

	if (getUnusedAttributes() > 0) {
		navSkillsElement.classList.add('notify-1');
	} else {
		navSkillsElement.classList.remove('notify-1');
	}

	if (getUnusedSkills() > 0) {
		navSkillsElement.classList.add('notify-2');
	} else {
		navSkillsElement.classList.remove('notify-2');
	}

	const newTrophies = getLength(gameState[23]) - lastTrophyNotification;

	if (newTrophies >= 1) {
		navTrophiesElement.classList.add('notify');
	} else {
		navTrophiesElement.classList.remove('notify');
	}

	if (newTrophies >= 3) {
		navTrophiesElement.classList.add('notify-1');
	} else {
		navTrophiesElement.classList.remove('notify-1');
	}

	if (newTrophies >= 5) {
		navTrophiesElement.classList.add('notify-2');
	} else {
		navTrophiesElement.classList.remove('notify-2');
	}
};

const renderPlayerSkills = () => {
	const skillPointsAvailable = getUnusedSkills();

	let skillScreen = 'viewSkills';
	if (skillPointsAvailable > 0) {
		skillScreen = 'pickSkills';
		skillTitleElement.innerText = 'Pick a Skill';
		skillLockElement.className = '';
	} else {
		skillTitleElement.innerText = 'Upgrade a Skill';
		skillLockElement.classList.add('done');
	}

	let skillHtml = '';
	goldAmountsToCheck = [];
	lostGoldAmountsToCheck = [];

	if (skillPointsAvailable > 0) {
		let skillsShown = 0;
		for (let i = 0; i < getLength(skills); i++) {
			if (gameState[15].includes(i)) {
				continue;
			}

			skillHtml += `<a href="#" class="open pickSkill" data-id="${i}"><strong>${skills[i][0]}</strong><span>${skills[i][1]}</span></a>`;
			skillsShown += 1;

			if (skillsShown >= 6) {
				break;
			}
		}
	} else {
		let skillUpgradeClass;
		let nextLevelCost;

		for (let i = 0; i < getLength(gameState[15]); i++) {
			skillUpgradeClass = 'upgradeSkill';
			nextLevelCost = getSkillUpgradeCost(gameState[15][i], gameState[16][i]);
			if (gameState[8] >= nextLevelCost[0]) {
				skillUpgradeClass += ' open';
				lostGoldAmountsToCheck.push(nextLevelCost[0]);
			} else {
				goldAmountsToCheck.push(nextLevelCost[0]);
			}

			skillHtml += `<a href="#" title="${skills[gameState[15][i]][1]}" class="${skillUpgradeClass}" data-id="${i}"><div><span class="skillStats"><span class="skillLevelInfo">lvl ${gameState[16][i]} / </span>+${getSkillBonus(i)}%</span><span>${skills[gameState[15][i]][0]}</span></div><div class="cost"><span>${formatNumber(nextLevelCost[0])}</span><span class="buy">Buy</span></div></a>`;
		}
		if (getLength(gameState[15]) < 6) {
			skillHtml += `<a href="#" class="nextSkill"><span>lvl ${m.round((getLength(gameState[15]) + 1) * 6)}</span></a>`;
		}
	}

	goldAmountsToCheck = goldAmountsToCheck.sort();
	lostGoldAmountsToCheck = lostGoldAmountsToCheck.sort((a, b) => b - a);

	skillLockElement.innerHTML = skillHtml;

	addLockIcon('.nextSkill');
	renderNotifications();
};

const addPlayerGold = (amount) => {
	const amountGained = amount * gameState[35] * getSkillBonus(null, skillKey.prosperity, true);
	gameState[8] += amountGained;
	gameState[25] += amountGained;

	for (let i = 0; i < getLength(goldAmountsToCheck); i++) {
		if (gameState[8] >= goldAmountsToCheck[i]) {
			renderPlayerSkills();
			break;
		}
	}
	renderPlayerCurrentGold();
};

const removePlayerGold = (amount) => {
	gameState[8] -= amount;

	for (let i = 0; i < getLength(lostGoldAmountsToCheck); i++) {
		if (gameState[8] < lostGoldAmountsToCheck[i]) {
			renderPlayerSkills();
			break;
		}
	}
	renderPlayerCurrentGold();
};

const expNeededForLevel = (level) => m.pow(m.pow(level - 1, 2) + 4, 2);

const expNeededForNextLevel = (level) => expNeededForLevel(level + 1) - expNeededForLevel(level);

const renderPlayerLevel = () => {
	playerCurrentLevelElement.innerHTML = `lvl ${gameState[4]}`;
};

const renderPlayerNextLevelProgress = () => {
	playerNextLevelProgressElement.innerHTML = `${m.round((expNeededForNextLevel(gameState[4]) - (expNeededForNextLevel(gameState[4]) - (gameState[5] - expNeededForLevel(gameState[4])))) / expNeededForNextLevel(gameState[4]) * 100)}%`;
};

const unlockTabs = () => {
	if (gameState[4] >= 2) {
		navSkillsElement.classList.add('unlocked');
		const lockedNavElements = navSkillsElement.getElementsByClassName('c');
		if (getLength(lockedNavElements) > 0) {
			lockedNavElements[0].remove();
		}
	}
	if (gameState[4] >= 10) {
		setStyle(getElemById('e'), 'display', 'flex');
		setStyle(getElemById('d'), 'display', 'none');
	}
	if (gameState[4] >= 30) {
		navMoralityElement.classList.add('unlocked');
		const lockedNavElements = navMoralityElement.getElementsByClassName('c');
		if (getLength(lockedNavElements) > 0) {
			lockedNavElements[0].remove();
		}
	}
};

const renderPlayerAttributes = () => {
	const unusedAttributes = getUnusedAttributes();

	if (unusedAttributes > 0) {
		attributeBlockElement.classList.remove('done');
	} else {
		attributeBlockElement.classList.add('done');
	}
	attackAttributeValueElement.innerHTML = gameState[6] + gameState[36];
	defenseAttributeValueElement.innerHTML = gameState[7] + gameState[37];
};

const unlockSkills = () => {
	if (gameState[4] >= 6) {
		if (skillLockElement) {
			skillLockElement.innerHTML = '';
			skillLockElement.classList.remove('lock');
		}

		renderPlayerSkills();
		renderNotifications();
	}
};

const openPopUp = (title) => {
	getElemById('popupContent').innerText = title;
	setStyle(getElemById('popup'), 'display', 'flex');
};

const closePopUp = () => {
	setStyle(getElemById('popup'), 'display', 'none');
};

const renderTrophies = () => {
	let icon;
	let title;
	let trophyClass;
	const unlockedTrophiesInCategory = [];

	for (let i = 0; i < getLength(Object.keys(trophyKey)); i++) {
		unlockedTrophiesInCategory.push(0);
	}

	trophyListElement.innerHTML = '';
	gameState[23] = [];

	const trophyChecks = {
		[trophyKey.skeleton]: {
			icon: units[0][0],
			icon2: units[0][1],
			check: gameState[24][0],
			title: 'Resurrect XXX Skeletons',
		},
		[trophyKey.zombie]: {
			icon: units[1][0],
			icon2: units[1][1],
			check: gameState[24][1],
			title: 'Resurrect XXX Zombies',
		},
		[trophyKey.wight]: {
			icon: units[2][0],
			icon2: units[2][1],
			check: gameState[24][2],
			title: 'Resurrect XXX Wights',
		},
		[trophyKey.vampire]: {
			icon: units[3][0],
			icon2: units[3][1],
			check: gameState[24][3],
			title: 'Resurrect XXX Vampires',
		},
		[trophyKey.grimReaper]: {
			icon: units[4][0],
			icon2: units[4][1],
			check: gameState[24][4],
			title: 'Resurrect XXX Grim Reapers',
		},
		[trophyKey.boneDragon]: {
			icon: units[5][0],
			icon2: units[5][1],
			check: gameState[24][5],
			title: 'Resurrect XXX Bone Dragons',
		},
		[trophyKey.gold]: {
			icon: uiIcons.gold,
			icon2: premiumIcons.gold,
			check: gameState[25],
			title: 'Gain XXX Gold',
		},
		[trophyKey.level]: {
			icon: uiIcons.level,
			icon2: premiumIcons.level,
			check: gameState[26],
			title: 'Reach Level XXX',
		},
		[trophyKey.attack]: {
			icon: uiIcons.battle,
			icon2: premiumIcons.battle,
			check: gameState[27],
			title: 'Gain XXX Attack',
		},
		[trophyKey.defense]: {
			icon: uiIcons.battle,
			icon2: '🛡️',
			check: gameState[28],
			title: 'Gain XXX Defense',
		},
		[trophyKey.skillUpgrades]: {
			icon: uiIcons.book,
			icon2: premiumIcons.book,
			check: gameState[29],
			title: 'Upgrade Skills XXX Times',
		},
		[trophyKey.enemiesKilled]: {
			icon: units[4][0],
			icon2: '😵',
			check: gameState[30],
			title: 'Kill XXX Enemy Units',
		},
		[trophyKey.morality]: {
			icon: uiIcons.morality,
			icon2: premiumIcons.morality,
			check: gameState[32],
			title: 'Reach Morality',
		},
		[trophyKey.stage]: {
			icon: uiIcons.trophy,
			icon2: premiumIcons.trophy,
			check: gameState[31],
			title: 'Beat Stage XXX',
		},
	};

	for (let i = 0; i < getLength(trophies); i++) {
		if (gameState[34]) {
			icon = trophyChecks[trophies[i].type].icon2;
		} else {
			icon = trophyChecks[trophies[i].type].icon;
		}
		if (trophyChecks[trophies[i].type].check >= trophies[i].value) {
			gameState[23].push(i);
		}
		title = trophyChecks[trophies[i].type].title.replace('XXX', formatNumber(trophies[i].value));

		trophyClass = 'class="openPopUp"';
		if (gameState[23].includes(i)) {
			trophyClass = 'class="openPopUp unlockedTrophy"';
		}

		const trophyColor = trophyColors[unlockedTrophiesInCategory[trophies[i].type]];

		if (trophyClass == 'class="openPopUp"') {
			if (gameState[34]) {
				trophyListElement.innerHTML += `<li style="position: relative; box-shadow: 0 0 5px 0 #444; background: #444" ${trophyClass} title="${title}"><span style="text-shadow: 0 2px 10px #000">${icon}</span><div class="trophyOverlay"></div></li>`;
			} else {
				trophyListElement.innerHTML += `<li ${trophyClass} title="${title}">${icon.replace('<path ', '<path fill="#444" ')}</li>`;
			}
		} else {
			if (gameState[34]) {
				trophyListElement.innerHTML += `<li style="position: relative; box-shadow: 0 0 5px 0 ${trophyColor}; background: ${trophyColor}aa" ${trophyClass} title="${title}"><span style="text-shadow: 0 2px 10px #000">${icon}</span><div class="trophyOverlay"></div></li>`;
			} else {
				trophyListElement.innerHTML += `<li ${trophyClass} title="${title}">${icon.replace('<path ', `<path fill="${trophyColor}" `)}</li>`;
			}
		}

		unlockedTrophiesInCategory[trophies[i].type] += 1;
	}

	trophyTitleElement.innerHTML = `Trophies - ${getLength(gameState[23])}/${getLength(trophies)}`;
	if (getLength(gameState[23]) == getLength(trophies)) {
		gameState[35] = 100.99;
	} else {
		gameState[35] = 1 + m.floor(getLength(gameState[23]) * 1.5) * 0.01;
	}
	getElemById('trophyBonusAmount').innerText = `${m.round((gameState[35] - 1) * 100)}%`;

	renderNotifications();
	renderPlayerGoldPerSecond();
	renderPlayerSkills();
};

const levelUpPlayer = () => {
	gameState[4] += 1;

	if (gameState[4] > gameState[26]) {
		gameState[26] = gameState[4];
	}

	if (gameState[4] >= 30) {
		gameState[32] = 1;
	}

	renderTrophies();
	unlockSkills();

	saveGame(gameState);
	unlockTabs();
	renderPlayerAttributes();
	renderPlayerLevel();
	renderNotifications();
};

const getEnemyLevels = (stage) => {
	const enemyUnits = [];
	for (let i = 0; i < getLength(units); i++) {
		if (unitUnlockLevel[i] > stage) {
			break;
		}

		enemyUnits.push(m.floor(m.sqrt(m.pow(1.25, 5 + stage - unitUnlockLevel[i] / 2))));
	}

	return enemyUnits;
};

const pickSkill = (skill) => {
	const unusedSkills = getUnusedSkills();
	if (unusedSkills <= 0 || skill === null) {
		return;
	}

	gameState[15].push(skill);
	gameState[16].push(0);
	renderPlayerSkills();
	renderNotifications();
};

const upgradeSkill = (skill) => {
	if (skill === null) {
		return;
	}

	const skillToUpgrade = gameState[15][skill];
	const currentSkillLevel = gameState[16][skill];
	const nextLevelCost = getSkillUpgradeCost(skillToUpgrade, currentSkillLevel);

	if (gameState[8] >= nextLevelCost[0]) {
		gameState[16][skill] += nextLevelCost[1];
		gameState[29] += nextLevelCost[1];
		removePlayerGold(nextLevelCost[0]);
		renderPlayerSkills();
		renderNotifications();
		renderPlayerGoldPerSecond();
	}
};

const addPlayerExperience = (amount) => {
	gameState[5] += amount * 15 * getSkillBonus(null, skillKey.learning, true);

	if (gameState[5] >= expNeededForLevel(gameState[4] + 1)) {
		levelUpPlayer();
	}
	renderPlayerNextLevelProgress();
};

const openTab = (navLink, event, tab) => {
	if (event != null) {
		event.preventDefault();
	}

	if (tab == 1 && gameState[4] < 2) {
		return;
	}

	if (tab == 2 && gameState[4] < 30) {
		return;
	}

	if (tab == 3) {
		lastTrophyNotification = getLength(gameState[23]);
		renderNotifications();
	}

	setStyle(tabContent[0], 'display', 'none');
	setStyle(tabContent[1], 'display', 'none');
	setStyle(tabContent[2], 'display', 'none');
	setStyle(tabContent[3], 'display', 'none');

	const links = getElemBySelector('#nav a');
	for (let i = 0; i < getLength(links); i++) {
		links[i].classList.remove('active');
	}

	setStyle(tabContent[tab], 'display', 'inherit');
	navLink.classList.add('active');
	closePopUp();
};

const renderStageNumber = () => {
	stageCurrentElement.innerHTML = `Stage #${gameState[9] + 1}`;
};

const renderEnemyUnits = () => {
	enemy.innerHTML = '';
	let enemyHTML = '';
	const enemyLevels = getEnemyLevels(gameState[9]);

	for (let i = 0; i < getLength(enemyLevels); i++) {
		if (enemyLevels[i] <= 0) {
			continue;
		}

		if (gameState[10][i] == 0) {
			enemyHTML += `<div id="e-${i}-unit" class="unit dead">`;
		} else {
			enemyHTML += `<div id="e-${i}-unit" class="unit">`;
		}

		enemyHTML += `<span id="e-${i}-amount">${formatNumber(gameState[10][i], true)}</span>`;
		if (gameState[34]) {
			enemyHTML += `<strong id="e-${i}">${units[i][1]}</strong>`;
		} else {
			enemyHTML += units[i][0].replace('<svg ', `<svg id="e-${i}" `);
		}
		enemyHTML += '</div>';
	}

	enemy.innerHTML = enemyHTML;
};

const renderUnitGenerationProgress = () => {
	if (gameState[17] === null) {
		return;
	}

	playerUnitTimeProgressElements[gameState[17]].innerHTML = `${m.floor(m.max(0, m.min(100, (gameState[14][gameState[17]] / (units[gameState[17]][2] * m.max(0.1, 1 - getSkillBonus(null, skillKey.necromancy) * 0.01))) * 100)))}%`;
};

const renderPlayerUnit = (unit) => {
	if (gameState[17] === null) {
		return;
	}

	if (gameState[12][unit] > 0) {
		playerUnitElements[unit].classList.remove('dead');
	}

	playerUnitAmountElements[unit].innerHTML = formatNumber(gameState[12][unit], true);
};

const renderPlayerUnits = () => {
	player.innerHTML = '';
	let playerHTML = '';

	for (let i = 0; i < getLength(gameState[12]); i++) {
		if (gameState[12][i] == 0) {
			if (gameState[17] === i) {
				playerHTML += `<div id="p-${i}-unit" data-id="${i}" class="unit dead active">`;
			} else {
				playerHTML += `<div id="p-${i}-unit" data-id="${i}" class="unit dead">`;
			}
		} else if (gameState[17] === i) {
			playerHTML += `<div id="p-${i}-unit" data-id="${i}" class="unit active">`;
		} else {
			playerHTML += `<div id="p-${i}-unit" data-id="${i}" class="unit">`;
		}

		if (gameState[34]) {
			playerHTML += `<strong id="p-${i}">${units[i][1]}</strong>`;
		} else {
			playerHTML += units[i][0].replace('<svg ', `<svg id="p-${i}" `);
		}
		playerHTML += `<span class="p-amount" id="p-${i}-amount">${formatNumber(gameState[12][i], true)}</span>`;
		playerHTML += '<div class="arrow-up"></div>';
		playerHTML += `<span class="unit-progress" id="unit-${i}-progress"></span></div>`;
	}

	if (getLength(gameState[12]) < getLength(units)) {
		playerHTML += `<div class="unit not"><div id="next-unit-lock" class="c"></div>${units[getLength(gameState[12])][0]}<span class="p-amount">#${unitUnlockLevel[getLength(gameState[12])] + 2}</span></div>`;
	}

	player.innerHTML = playerHTML;

	if (getLength(gameState[12]) < getLength(units) && firstGameLockDone) {
		addLockIcon('#next-unit-lock');
	}

	playerUnitElements = player.getElementsByClassName('unit');
	playerUnitAmountElements = player.getElementsByClassName('p-amount');
	playerUnitTimeProgressElements = player.getElementsByClassName('unit-progress');

	renderUnitGenerationProgress();
};

const addAttribute = (type) => {
	const unusedAttributes = getUnusedAttributes();

	if (unusedAttributes <= 0) {
		return;
	}

	if (type == 0) {
		gameState[6] += 1;
		gameState[27] += 1;
	} else if (type == 1) {
		gameState[7] += 1;
		gameState[28] += 1;
	}

	renderTrophies();
	renderPlayerAttributes();
	renderNotifications();
};

const generateUnit = (unit, override = false) => {
	if (inBattle && unit !== null) {
		return;
	}

	for (let i = 0; i < getLength(playerUnitElements); i++) {
		playerUnitElements[i].classList.remove('active');
	}

	if (override && gameState[17] === unit) {
		gameState[17] = null;
	} else {
		gameState[17] = unit;
		if (playerUnitElements[unit]) {
			playerUnitElements[unit].classList.add('active');
		}
	}

	renderPlayerUnit(unit);
	renderUnitGenerationProgress();
};

const openStage = (stage) => {
	if (stage != gameState[9]) {
		gameState[10] = getEnemyLevels(gameState[9] + 1);
		for (let i = 0; i < getLength(gameState[10]); i++) {
			if (gameState[10][i] == 0) {
				gameState[11][i] = 0;
			} else {
				gameState[11][i] = units[i][7];
			}
		}
	}

	gameState[9] = stage;

	renderStageNumber();
	renderEnemyUnits();
	renderPlayerUnits();
};

const addPlayerUnitGenerationProgress = (progress) => {
	if (gameState[17] === null) {
		return;
	}

	gameState[14][gameState[17]] += progress;
	const timeToGenerateOneUnit = units[gameState[17]][2] * m.max(0.1, 1 - getSkillBonus(null, skillKey.necromancy) * 0.01);
	if (gameState[14][gameState[17]] > timeToGenerateOneUnit) {
		const unitsGenerated = m.floor(gameState[14][gameState[17]] / timeToGenerateOneUnit);

		gameState[24][gameState[17]] += unitsGenerated;

		gameState[14][gameState[17]] -= timeToGenerateOneUnit * unitsGenerated;
		gameState[12][gameState[17]] += unitsGenerated;
		renderPlayerUnit(gameState[17]);
	}
};

const getDefender = (targetType) => {
	let defender = null;
	if (targetType == 'player') {
		let unitsDead = 0;
		for (let j = 0; j < getLength(gameState[12]); j++) {
			if (gameState[12][j] <= 0) {
				unitsDead += 1;
			}
		}

		let targetUnit = getRandomInt(0, getLength(gameState[12]) - 1 - unitsDead);

		for (let j = 0; j < getLength(gameState[12]); j++) {
			if (gameState[12][j] <= 0) {
				continue;
			}
			if (targetUnit == 0) {
				defender = j;
				break;
			}
			targetUnit -= 1;
		}
	} else {
		let unitsDead = 0;
		for (let j = 0; j < getLength(gameState[10]); j++) {
			if (gameState[10][j] <= 0) {
				unitsDead += 1;
			}
		}

		let targetUnit = getRandomInt(0, getLength(gameState[10]) - 1 - unitsDead);

		for (let j = 0; j < getLength(gameState[10]); j++) {
			if (gameState[10][j] <= 0) {
				continue;
			}
			if (targetUnit == 0) {
				defender = j;
				break;
			}
			targetUnit -= 1;
		}
	}

	return defender;
};

const resetAttackButton = () => {
	if (processingAttackAction == 0) {
		attackElement.classList.remove('idle');
		attackElement.innerHTML = '<span>Attack!</span>';
	}
};

const stopBattle = () => {
	if (inBattle) {
		inBattle = false;
		resetAttackButton();
		generateUnit(unitToRestoreGeneration);
	}
	saveGame(gameState);
};

const openNextStage = () => {
	const enemyLevels = getEnemyLevels(gameState[9] + 1);
	for (let i = 0; i < getLength(enemyLevels); i++) {
		gameState[30] += enemyLevels[i];
	}
	if ((gameState[9] + 1) > gameState[31]) {
		gameState[31] = gameState[9] + 1;
	}

	let unitsUnlocked = 1;
	for (let i = 0; i < getLength(unitUnlockLevel); i++) {
		if (unitUnlockLevel[i] < gameState[9]) {
			unitsUnlocked = i + 1;
		}
	}
	unitsUnlocked -= getLength(gameState[12]);
	for (let i = 0; i < unitsUnlocked; i++) {
		gameState[13].push(units[getLength(gameState[12])][7]);
		gameState[12].push(0);
		gameState[14].push(0);
	}

	renderTrophies();
	gameState[18] = -1;
	addPlayerExperience(gameState[9] + 1);
	addPlayerGold((gameState[9] + 1) * gameState[20] * gameState[21]);
	renderPlayerGoldPerSecond();
	openStage(gameState[9] + 1);

	if (inBattle) {
		setupAllBattleUnitsBySpeed();
		doAnAttack();
		resetAttackButton();
	} else {
		stopBattle();
		generateUnit(gameState[17]);
	}
};

const calculateAttackDamage = (isPlayerAttacking, attackerUnit, defenderUnit) => {
	let damage = 0;
	let attackerUnitCount;
	let defenderUnitCount;
	let attackDefenseDifference;

	if (isPlayerAttacking) {
		attackerUnitCount = gameState[12][attackerUnit];
		defenderUnitCount = gameState[10][defenderUnit];

		attackDefenseDifference = gameState[36] + gameState[6] + units[attackerUnit][3] - units[defenderUnit][4] - 10;
	} else {
		attackerUnitCount = gameState[10][attackerUnit];
		defenderUnitCount = gameState[12][defenderUnit];
		attackDefenseDifference = units[attackerUnit][3] - units[defenderUnit][4] - gameState[7] - gameState[37];
	}

	for (let i = 0; i < 10; i++) {
		damage += getRandomInt(units[attackerUnit][5], units[attackerUnit][6]);
	}

	damage *= attackerUnitCount / 10;

	if (attackDefenseDifference > 0) {
		if (isPlayerAttacking) {
			damage *= (1 + (attackDefenseDifference * 0.05)) * getSkillBonus(null, skillKey.wrath, true);
		} else {
			damage *= (1 + (attackDefenseDifference * 0.05));
		}
	} else {
		if (isPlayerAttacking) {
			damage *= m.max(0.025, (1 + (attackDefenseDifference * 0.025)));
		} else {
			damage *= m.max(0.025, (1 + (attackDefenseDifference * 0.025 * getSkillBonus(null, skillKey.calm, true))));
		}
	}

	if (isPlayerAttacking == false) {
		return m.floor(damage);
	}

	if (attackerUnit == 0) {
		damage *= getSkillBonus(null, skillKey.skeleton, true);
	}

	if (attackerUnit == 1) {
		damage *= getSkillBonus(null, skillKey.zombie, true);
	}

	if (attackerUnit == 2) {
		damage *= getSkillBonus(null, skillKey.wight, true);
	}

	if (attackerUnit == 3) {
		damage *= getSkillBonus(null, skillKey.vampire, true);
	}

	if (attackerUnit == 4) {
		damage *= getSkillBonus(null, skillKey.grimReaper, true);
	}

	if (attackerUnit == 5) {
		damage *= getSkillBonus(null, skillKey.boneDragon, true);
	}

	return m.floor(damage);
};

let setupAllBattleUnitsBySpeed = () => {
	gameState[19] = [];

	for (let i = 0; i < getLength(gameState[12]); i++) {
		gameState[19].push({
			type: 'player',
			unit: i,
			speed: units[i][8],
		});
	}

	for (let i = 0; i < getLength(gameState[10]); i++) {
		gameState[19].push({
			type: 'enemy',
			unit: i,
			speed: units[i][8],
		});
	}

	gameState[19].sort(orderBySpeed);
};

const shouldStopBattle = () => {
	let enemyIsDead = true;

	for (let i = 0; i < getLength(gameState[10]); i++) {
		if (gameState[10][i] > 0) {
			enemyIsDead = false;
			break;
		}
	}

	if (enemyIsDead) {
		openNextStage();
		return true;
	}

	let playerIsDead = true;

	for (let i = 0; i < getLength(gameState[12]); i++) {
		if (gameState[12][i] > 0) {
			playerIsDead = false;
			break;
		}
	}

	if (playerIsDead) {
		stopBattle();
		return true;
	}

	if (inBattle == false) {
		stopBattle();
		return true;
	}

	return false;
};

let doAnAttack = () => {
	if (shouldStopBattle()) {
		return;
	}

	gameState[18] = (gameState[18] + 1) % getLength(gameState[19]);
	const currentAttackerUnit = gameState[19][gameState[18]];
	let attackerUnits;

	let enemyType;
	if (currentAttackerUnit.type == 'player') {
		attackerUnits = gameState[12];
		enemyType = 'enemy';
	} else {
		attackerUnits = gameState[10];
		enemyType = 'player';
	}

	if (attackerUnits[currentAttackerUnit.unit] <= 0) {
		doAnAttack();
		return;
	}

	const defenderUnit = getDefender(enemyType);

	if (defenderUnit === null) {
		doAnAttack();
		return;
	}

	const targetType = currentAttackerUnit.type;
	const attacker = currentAttackerUnit.unit;
	const defender = defenderUnit;
	let targetEnemy;
	let targetEnemyAmount;
	let targetPlayer;
	let targetPlayerAmount;
	let attackerDistance = 30;
	let defenderDistance = 20;
	let attackDamageIndicatorDistance = 50;
	let enemyId;
	let playerId;
	let playerDamageIndicatorDelay = 100;
	let enemyDamageIndicatorDelay = 0;

	if (targetType == 'enemy') {
		targetEnemy = getElemById(`e-${attacker}`);
		targetPlayer = getElemById(`p-${defender}`);
		targetEnemyAmount = getElemById(`e-${attacker}-amount`);
		targetPlayerAmount = getElemById(`p-${defender}-amount`);
		enemyId = attacker;
		playerId = defender;
		defenderDistance *= -1;
		enemyDamageIndicatorDelay += 100;
	} else {
		targetEnemy = getElemById(`p-${attacker}`);
		targetPlayer = getElemById(`e-${defender}`);
		targetEnemyAmount = getElemById(`e-${defender}-amount`);
		targetPlayerAmount = getElemById(`p-${attacker}-amount`);
		enemyId = defender;
		playerId = attacker;
		attackerDistance *= -1;
		attackDamageIndicatorDistance = -50;
		playerDamageIndicatorDelay += 100;
	}
	processingAttackAction += 2;
	tween(targetEnemy, {
		delay: 0,
		duration: 300,
		easing: 1,
		from: {
			y: 0,
		},
		to: {
			y: attackerDistance,
		},
		onend(target) {
			const currentTime = Date.now();

			let damageDefender = calculateAttackDamage(targetType == 'player', attacker, defender);
			const oldPlayerUnitCount = gameState[12][playerId];
			const oldEnemyUnitCount = gameState[10][enemyId];

			if (targetType == 'player') {
				if (gameState[11][enemyId] > damageDefender) {
					gameState[11][enemyId] -= damageDefender;
				} else {
					damageDefender -= gameState[11][enemyId];
					gameState[10][enemyId] -= 1;
					gameState[10][enemyId] -= m.floor(damageDefender / units[enemyId][7]);
					gameState[10][enemyId] = m.max(0, gameState[10][enemyId]);
					gameState[11][enemyId] = damageDefender - (m.floor(damageDefender / units[enemyId][7]) * units[enemyId][7]);
				}
			} else {
				if (gameState[13][playerId] > damageDefender) {
					gameState[13][playerId] -= damageDefender;
				} else {
					damageDefender -= gameState[13][playerId];
					gameState[12][playerId] -= 1;
					gameState[12][playerId] -= m.floor(damageDefender / units[playerId][7]);
					gameState[12][playerId] = m.max(0, gameState[12][playerId]);
					gameState[13][playerId] = damageDefender - (m.floor(damageDefender / units[playerId][7]) * units[playerId][7]);
				}
			}

			let damageAttacker = calculateAttackDamage(targetType == 'enemy', defender, attacker);

			if (targetType == 'enemy') {
				if (gameState[11][enemyId] > damageAttacker) {
					gameState[11][enemyId] -= damageAttacker;
				} else {
					damageAttacker -= gameState[11][enemyId];
					gameState[10][enemyId] -= 1;
					gameState[10][enemyId] -= m.floor(damageAttacker / units[enemyId][7]);
					gameState[10][enemyId] = m.max(0, gameState[10][enemyId]);
					gameState[11][enemyId] = damageAttacker - (m.floor(damageAttacker / units[enemyId][7]) * units[enemyId][7]);
				}
			} else {
				if (gameState[13][playerId] > damageAttacker) {
					gameState[13][playerId] -= damageAttacker;
				} else {
					damageAttacker -= gameState[13][playerId];
					gameState[12][playerId] -= 1;
					gameState[12][playerId] -= m.floor(damageAttacker / units[playerId][7]);
					gameState[12][playerId] = m.max(0, gameState[12][playerId]);
					gameState[13][playerId] = damageAttacker - (m.floor(damageAttacker / units[playerId][7]) * units[playerId][7]);
				}
			}

			targetPlayerAmount.innerHTML = formatNumber(gameState[12][playerId], true);
			targetEnemyAmount.innerHTML = formatNumber(gameState[10][enemyId], true);

			if (gameState[12][playerId] <= 0) {
				getElemById(`p-${playerId}-unit`).classList.add('dead');
			}
			if (gameState[10][enemyId] <= 0) {
				getElemById(`e-${enemyId}-unit`).classList.add('dead');
			}

			let playerUnitCountDifference = 0;
			let enemyUnitCountDifference = 0;

			let killedEnemies;
			if (targetType == 'player') {
				playerUnitCountDifference = gameState[10][enemyId] - oldEnemyUnitCount;
				enemyUnitCountDifference = gameState[12][playerId] - oldPlayerUnitCount;
				killedEnemies = m.abs(playerUnitCountDifference);
			} else {
				playerUnitCountDifference = gameState[12][playerId] - oldPlayerUnitCount;
				enemyUnitCountDifference = gameState[10][enemyId] - oldEnemyUnitCount;
				killedEnemies = m.abs(enemyUnitCountDifference);
			}

			addPlayerExperience(killedEnemies * units[enemyId][9]);

			if (enemyUnitCountDifference < 0) {
				insertHtml(targetEnemy, 'beforebegin', `<span id="e-${currentTime}" class="damage-indicator">${formatNumber(enemyUnitCountDifference, true)}</span>`);
				tween(getElemById(`e-${currentTime}`), {
					delay: enemyDamageIndicatorDelay,
					duration: 1750,
					easing: 0,
					from: {
						opacity: 1,
						y: 0,
					},
					to: {
						opacity: 0,
						y: attackDamageIndicatorDistance * -1,
					},
					onend(damageIndicatorTarget) {
						damageIndicatorTarget.remove();
						processingAttackAction -= 1;
						resetAttackButton();
					},
				});
			} else {
				processingAttackAction -= 1;
				resetAttackButton();
			}
			if (playerUnitCountDifference < 0) {
				insertHtml(targetPlayer, 'afterend', `<span id="p-${currentTime}" class="damage-indicator">${formatNumber(playerUnitCountDifference, true)}</span>`);
				tween(getElemById(`p-${currentTime}`), {
					delay: playerDamageIndicatorDelay,
					duration: 1750,
					easing: 0,
					from: {
						opacity: 1,
						y: 0,
					},
					to: {
						opacity: 0,
						y: attackDamageIndicatorDistance,
					},
					onend(damageIndicatorTarget) {
						damageIndicatorTarget.remove();
						processingAttackAction -= 1;
						resetAttackButton();
					},
				});
			} else {
				processingAttackAction -= 1;
				resetAttackButton();
			}

			tween(target, {
				delay: 0,
				duration: 700,
				easing: 2,
				from: {
					y: attackerDistance,
				},
				to: {
					y: 0,
				},
				onend(newTarget) {
					doAnAttack();
				},
			});
		},
	});

	tween(targetPlayer, {
		delay: 100,
		duration: 250,
		easing: 1,
		from: {
			y: 0,
		},
		to: {
			y: defenderDistance,
		},
		onend(target) {
			tween(target, {
				delay: 0,
				duration: 650,
				easing: 2,
				from: {
					y: defenderDistance,
				},
				to: {
					y: 0,
				},
			});
		},
	});
};

const startBattle = () => {
	inBattle = true;
	attackElement.classList.add('idle');
	attackElement.innerHTML = '<span>Stop Battle!</span>';
	unitToRestoreGeneration = gameState[17];
	generateUnit(null);
	setupAllBattleUnitsBySpeed();
	doAnAttack();
	resetAttackButton();
};

const attack = () => {
	if (processingAttackAction > 0) {
		attackElement.classList.add('idle');
		attackElement.innerHTML = '<span>Stopping Battle...</span>';
		stopBattle();
		return;
	}
	if (inBattle) {
		stopBattle();
	} else {
		startBattle();
	}
};

const setBuyAmount = (target, amount) => {
	const buyOptions = getElemBySelector('.buyOption');
	for (let i = 0; i < getLength(buyOptions); i++) {
		buyOptions[i].classList.remove('active');
	}
	target.classList.add('active');
	gameState[38] = amount;
	renderPlayerSkills();
};

const update = (progress) => {
	addPlayerGold(m.pow(gameState[22], gameState[9]) * 10 * progress * 0.001);
	addPlayerUnitGenerationProgress(progress);
};

const draw = () => {
	renderUnitGenerationProgress();
};

const loop = (timestamp) => {
	const progress = timestamp - lastRender;

	if (timestamp > nextSaveAt) {
		saveGame(gameState);
		renderTrophies();
		nextSaveAt = timestamp + 30000;
	}

	update(progress);
	draw();

	lastRender = timestamp;
	requestAnimationFrame(loop);
};

const unlockThemes = () => {
	gameState[33] = true;

	document.body.classList.add('premium');
	getElemById('premiumSwitchLock').remove();

	saveGame(gameState);
};

const switchTheme = (changeState, event = null) => {
	if (event != null) {
		event.preventDefault();
	}
	if (gameState[34]) {
		setStyle(getElemById('normalIcon'), 'opacity', 0.1);
		setStyle(getElemById('premiumIcon'), 'opacity', 1);
	} else {
		setStyle(getElemById('normalIcon'), 'opacity', 1);
		setStyle(getElemById('premiumIcon'), 'opacity', 0.1);
	}

	if (gameState[33] != true) {
		if (event != null) {
			if (confirm('This is premium game theme! Do you want to be redirected to coil.com to get a membership?')) {
				const win = open('https://coil.com/?ref=soul-not-found', '_blank');
				win.focus();
			} else {
				event.preventDefault();
			}
		}
		return;
	}
	if (changeState) {
		gameState[34] = !gameState[34];
		saveGame(gameState);
		location.reload();
	}
};

const setup = () => {
	gameState = loadGame(false);

	if (getLength(gameState[10]) == 0) {
		gameState[10] = getEnemyLevels(gameState[9] + 1);
		for (let i = 0; i < getLength(gameState[10]); i++) {
			if (gameState[10][i] == 0) {
				gameState[11][i] = 0;
			} else {
				gameState[11][i] = units[i][7];
			}
		}
	}

	if (!gameState[36]) {
		gameState[36] = 0;
		gameState[37] = 0;
	}

	if (!gameState[38]) {
		gameState[38] = 1;
	}

	for (let i = 0; i < getLength(gameState[14]); i++) {
		if (gameState[14][i] <= 0) {
			gameState[14][i] = 0;
		}
	}

	insertHtml(getElemById('normalIcon'), afterbegin, uiIcons.level.replace('<path ', '<path fill="#4d85b9" '));
	insertHtml(getElemById('premiumIcon'), afterbegin, premiumIcons.level);

	if (gameState[34]) {
		insertHtml(getElemById('goldBlock'), afterbegin, premiumIcons.gold);
		insertHtml(getElemById('playerLevelBlock'), afterbegin, premiumIcons.level);
		insertHtml(getElemById('navSkills'), afterbegin, `<strong>${premiumIcons.book}</strong>`);
		insertHtml(getElemById('navBattle'), afterbegin, `<strong>${premiumIcons.battle}</strong>`);
		insertHtml(getElemById('navMorality'), afterbegin, `<strong>${premiumIcons.morality}</strong>`);
		insertHtml(getElemById('navTrophies'), afterbegin, `<strong>${premiumIcons.trophy}</strong>`);
	} else {
		insertHtml(getElemById('goldBlock'), afterbegin, uiIcons.gold.replace('<path ', '<path fill="#c7aa0a" '));
		insertHtml(getElemById('playerLevelBlock'), afterbegin, uiIcons.level.replace('<path ', '<path fill="#4d85b9" '));
		insertHtml(getElemById('navSkills'), afterbegin, uiIcons.book);
		insertHtml(getElemById('navBattle'), afterbegin, uiIcons.battle);
		insertHtml(getElemById('navMorality'), afterbegin, uiIcons.morality);
		insertHtml(getElemById('navTrophies'), afterbegin, uiIcons.trophy);
	}

	tabContent[0] = getElemById('battle');
	tabContent[1] = getElemById('skills');
	tabContent[2] = getElemById('morality');
	tabContent[3] = getElemById('trophies');

	navSkillsElement = getElemById('navSkills');
	navMoralityElement = getElemById('navMorality');
	navTrophiesElement = getElemById('navTrophies');

	unlockTabs();

	player = getElemById('player');
	enemy = getElemById('enemy');

	playerGoldPerSecondElement = getElemById('b');
	playerCurrentGoldElement = getElemById('a');
	playerCurrentLevelElement = getElemById('playerCurrentLevel');
	playerNextLevelProgressElement = getElemById('f');

	stageCurrentElement = getElemById('stageCurrent');
	battleBlockElement = getElemById('battleBlock');

	attackAttributeValueElement = getElemById('attackAttributeValue');
	defenseAttributeValueElement = getElemById('defenseAttributeValue');
	addEvent(getElemById('attackAttribute'), click, () => { // eslint-disable-line no-undef
		addAttribute(0);
	});
	addEvent(getElemById('defenseAttribute'), click, () => { // eslint-disable-line no-undef
		addAttribute(1);
	});

	attributeBlockElement = getElemById('attributeBlock');

	skillTitleElement = getElemById('skillTitle');
	skillLockElement = getElemById('skillLock');
	trophyListElement = getElemById('trophyList');
	trophyTitleElement = getElemById('trophyTitle');

	addEvent(skillLockElement, click, (e) => { // eslint-disable-line no-undef
		let element = e.target.closest('.pickSkill');
		if (element) {
			pickSkill(element.dataset.id);
		}
		element = e.target.closest('.upgradeSkill');
		if (element) {
			upgradeSkill(element.dataset.id);
		}
	});

	addEvent(player, click, (e) => { // eslint-disable-line no-undef
		const element = e.target.closest('.unit');
		const id = element.dataset.id;
		if (element && id < getLength(gameState[12])) {
			generateUnit(id);
		}
	});

	attackElement = getElemById('attack');
	addEvent(attackElement, click, () => { // eslint-disable-line no-undef
		attack(attackElement);
	});

	addEvent(getElemById('popupButton'), click, () => { // eslint-disable-line no-undef
		closePopUp();
	});

	lastTrophyNotification = getLength(gameState[23]);

	renderPlayerCurrentGold();
	renderPlayerGoldPerSecond();
	renderPlayerLevel();
	renderPlayerNextLevelProgress();

	openStage(gameState[9]);
	generateUnit(gameState[17]);
	renderUnitGenerationProgress();

	renderPlayerAttributes();
	unlockSkills();
	pickSkill(null);
	upgradeSkill(null);

	const buyAmountElements = getElemBySelector('.buyOption');
	let buyAmountTarget = 3;
	if (gameState[38] == 1) {
		buyAmountTarget = 0;
	}
	if (gameState[38] == 10) {
		buyAmountTarget = 1;
	}
	if (gameState[38] == 50) {
		buyAmountTarget = 2;
	}
	setBuyAmount(buyAmountElements[buyAmountTarget], gameState[38]);

	unitToRestoreGeneration = gameState[17];
	update(Date.now() - gameState[3]);

	attack();
	renderTrophies();
	addLockIcon('.c');
	firstGameLockDone = true;
	openPopUp('loading');
	closePopUp();

	navElements = getElemBySelector('#nav a');
	for (let i = 0; i < getLength(navElements); i++) {
		addEvent(navElements[i], click, (e) => { // eslint-disable-line no-undef
			openTab(navElements[i], e, i);
		});
	}

	for (let i = 0; i < getLength(buyAmountElements); i++) {
		addEvent(buyAmountElements[i], click, (e) => { // eslint-disable-line no-undef
			e.preventDefault();
			setBuyAmount(e.target, e.target.dataset.id);
		});
	}

	addEvent(document, click, (e) => { // eslint-disable-line no-undef
		const element = e.target.closest('.openPopUp');
		if (e.target && element) {
			openPopUp(element.title);
		}
	});

	openTab(navElements[0], null, 0);
	gameState[2] = Date.now();

	if (gameState[33] == false) {
		if (monetization) {
			addEvent(monetization, 'monetizationstart', () => {
				unlockThemes();
			});
		}

		if (isPremium) {
			unlockThemes();
		}
	} else {
		document.body.classList.add('premium');
		getElemById('premiumSwitchLock').remove();
	}

	addEvent(getElemById('premiumSwitch'), click, (e) => { // eslint-disable-line no-undef
		switchTheme(true, e);
	});

	addEvent(getElemById('e'), click, () => { // eslint-disable-line no-undef
		restartGame();
	});

	switchTheme(false);

	saveGame(gameState);

	requestAnimationFrame(loop);
};

(function () {
	setup();

	addEvent(window, 'beforeunload', () => { // eslint-disable-line no-undef
		stopBattle();
	});
}());
