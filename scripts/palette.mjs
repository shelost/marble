/**
 * A colour for every polity. Successor states keep their family's hue, the way atlases keep
 * China yellow and the British Empire pink, so a change of dynasty reads as continuity; each
 * name then gets its own shade so neighbours of one family stay apart. Korean kingdoms keep
 * the colours they have in the kingdom map. Anything unlisted gets a hue from its name.
 */

/** @type {Record<string, string>} exact colours, first match wins */
const EXACT = {
	Gojoseon: '#2f7f8f',
	Goguryeo: '#e94949',
	Baekje: '#ffb900',
	Hubaekje: '#ffb900',
	Silla: '#3e79e4',
	'Unified Silla': '#3e79e4',
	Gaya: '#8b5cf6',
	Balhae: '#6b8e23',
	Goryeo: '#4b8bd6',
	Joseon: '#3a6fc9'
};

/** [pattern, hue, saturation %, lightness %] */
const FAMILIES = [
	[/^(Korean Empire|Republic of Korea|South Korea)$/, 218, 55, 52],
	[/(Democratic People's Republic of Korea|North Korea)/, 4, 55, 50],
	[
		/(Zhou|Qin|Han Dynasty|Xin Dynasty|Cao Wei|Shu Han|Eastern Wu|Jin\b|Liu Song|Southern Qi|Liang Dynasty|Chen Dynasty|Sui Dynasty|Tang Dynasty|Song\b|Yuan Dynasty|Ming|Qing Dynasty|Empire of China|Republic of China|Kuomintang|People's Republic of China|Northern Wei|Northern Zhou|Northern Qi|Eastern Wei|Western Wei|Former Qin|Later Zhao|^Chu$|^Qi$|^Yan$|^Zhao$|^Wei$|^Han$|^Wey$|^Lu$|^Zheng$|^Cai$|^Chen$|^Cao$|^Teng$|^Zhu$|^Xu$|^Wu$|^Yue$|^Shu$|^Ba$|Zhongshan)/,
		44,
		72,
		54
	],
	[/(Liao Dynasty|Great Jin|Later Jin|Western Xia|Kara-Khitan)/, 196, 32, 50],
	[/(Roman|Byzantine|Nicaea|Trebizond)/, 330, 45, 42],
	[/(Median|Achaemenid|Parthian|Sasanian|Safavid|Afsharid|Zand|Qajar|Pahlavi|Iran)/, 172, 50, 40],
	[/(Rashidun|Umayyad|Abbasid|Fatimid|Ayyubid|Mamluk|Córdoba|Almoravid|Almohad)/, 104, 38, 44],
	[
		/(Xiongnu|Xianbei|Rouran|Göktürk|Türgesh|Uyghur|Kimek|Kipchak|Mongol|Horde|Chagatai|Ilkhanate|Northern Yuan|Oirat|Dzungar|Kazakh|Sibir|Tümed|Hun|Khazar|Cuman|Pecheneg|Timurid|Shaybanid|Scythia|Yuezhi|Avar)/,
		36,
		36,
		58
	],
	[/(Ottoman|Seljuk|Sultanate of Rum|Republic of Turkey|Turkey)/, 12, 52, 47],
	[/(Kievan Rus|Moscow|Novgorod|Tsardom of Russia|Russian|Soviet)/, 140, 30, 42],
	[/(Kingdom of England|Great Britain|British|United Kingdom)/, 340, 52, 70],
	[/(Francia|Frankish|Carolingian|Kingdom of France|French|France)/, 216, 50, 50],
	[/(Castile|Aragon|Spanish|Spain)/, 38, 64, 50],
	[/(Portug|Estado Novo)/, 150, 42, 40],
	[/(Dutch|Netherlands)/, 24, 82, 56],
	[/(Holy Roman Empire|German|Prussia|Weimar|Austria|Habsburg)/, 220, 8, 52],
	[/(Japan|Shogunate|Asuka|Nara|Heian|Kamakura|Muromachi|Ashikaga|Tokugawa|Yamato)/, 352, 58, 52],
	[
		/(Maurya|Gupta|Mughal|Delhi|Tughlaq|Khalji|Lodi|Maratha|British Raj|Republic of India|Vijayanagara|Chola|Pala|Rashtrakuta|Satavahana|Magadha|Janapada|Shunga|Kanva)/,
		28,
		70,
		56
	],
	[/(Egypt|Ptolemaic|Khedivate|Muhammad Ali)/, 40, 48, 60],
	[/(Macedon|Seleucid|Greek|Athen|Sparta|Hellen|Peloponnesian|Bactria)/, 204, 52, 54],
	[/(United States|Confederate States)/, 214, 46, 46],
	[/(Mexic|Aztec|Tenochtitlan)/, 8, 46, 48],
	[/(Inca|Peru)/, 30, 56, 46],
	[/(Maya)/, 156, 34, 46],
	[/(Brazil)/, 132, 38, 44]
];

/** FNV-1a, so colours stay put between builds. @param {string} text */
function hash(text) {
	let h = 2166136261;
	for (const char of text) h = Math.imul(h ^ char.codePointAt(0), 16777619);
	return h >>> 0;
}

/** @param {number} h @param {number} s @param {number} l */
function hsl(h, s, l) {
	const k = (/** @type {number} */ n) => (n + h / 30) % 12;
	const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
	const f = (/** @type {number} */ n) => l / 100 - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
	const hex = (/** @type {number} */ v) =>
		Math.round(v * 255)
			.toString(16)
			.padStart(2, '0');
	return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;
}

/** @param {string} name */
export function colorFor(name) {
	if (EXACT[name]) return EXACT[name];
	const h = hash(name);
	const shade = ((h % 1000) / 1000 - 0.5) * 2;
	const family = FAMILIES.find(([pattern]) => pattern.test(name));
	if (family) {
		const [, hue, saturation, lightness] = family;
		return hsl((hue + shade * 6 + 360) % 360, saturation, Math.max(28, Math.min(78, lightness + shade * 8)));
	}
	return hsl(h % 360, 42 + ((h >>> 9) % 18), 48 + ((h >>> 17) % 14));
}
