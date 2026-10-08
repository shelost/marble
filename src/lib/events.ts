import type { WorldEvent } from './types';

/** Turning points on the timeline. Traditional dates are marked as such. */
export const EVENTS: WorldEvent[] = [
	{ year: -814, en: 'Phoenicians found Carthage (traditional date).', ko: '페니키아인이 카르타고를 세운다(전승).', at: [10.32, 36.85] },
	{
		year: -771,
		en: 'The Zhou move east to Luoyang; the Spring and Autumn period begins.',
		ko: '주나라가 낙양으로 천도한다. 춘추 시대가 시작된다.',
		at: [112.45, 34.62]
	},
	{ year: -753, en: 'Rome is founded, by its own tradition.', ko: '로마가 세워진다(전승).', at: [12.5, 41.9] },
	{ year: -722, en: 'Assyria destroys the Kingdom of Israel.', ko: '아시리아가 이스라엘 왕국을 멸망시킨다.', at: [35.19, 32.28] },
	{ year: -671, en: 'Assyria conquers Egypt.', ko: '아시리아가 이집트를 정복한다.', at: [31.25, 29.85] },
	{
		year: -612,
		en: 'Babylon and the Medes sack Nineveh; Assyria falls.',
		ko: '바빌로니아와 메디아가 니네베를 함락한다. 아시리아 몰락.',
		at: [43.15, 36.36]
	},
	{ year: -587, en: 'Babylon destroys Jerusalem.', ko: '바빌로니아가 예루살렘을 파괴한다.', at: [35.23, 31.78] },
	{
		year: -550,
		en: 'Cyrus the Great overthrows the Medes and founds the Persian Empire.',
		ko: '키루스 대왕이 메디아를 무너뜨리고 페르시아 제국을 세운다.',
		at: [53.2, 30.2]
	},
	{ year: -539, en: 'Cyrus takes Babylon.', ko: '키루스가 바빌론을 점령한다.', at: [44.42, 32.54] },
	{ year: -525, en: 'Persia conquers Egypt.', ko: '페르시아가 이집트를 정복한다.', at: [31.25, 29.85] },
	{
		year: -509,
		en: 'Rome expels its last king and becomes a republic.',
		ko: '로마가 마지막 왕을 몰아내고 공화정이 된다.',
		at: [12.5, 41.9]
	},
	{
		year: -480,
		en: 'Xerxes invades Greece: Thermopylae and Salamis.',
		ko: '크세르크세스의 그리스 원정. 테르모필레와 살라미스.',
		at: [22.54, 38.8]
	},
	{ year: -475, en: 'The Warring States period begins in China.', ko: '중국에서 전국 시대가 시작된다.', at: [113, 35] },
	{ year: -431, en: 'The Peloponnesian War begins.', ko: '펠로폰네소스 전쟁이 시작된다.', at: [22.4, 37.7] },
	{ year: -334, en: 'Alexander crosses into Asia.', ko: '알렉산드로스가 아시아로 건너간다.', at: [26.4, 40.2] },
	{
		year: -323,
		en: 'Alexander dies in Babylon; his generals divide the empire.',
		ko: '알렉산드로스가 바빌론에서 죽고, 장군들이 제국을 나눈다.',
		at: [44.42, 32.54]
	},
	{ year: -321, en: 'Chandragupta founds the Maurya Empire.', ko: '찬드라굽타가 마우리아 제국을 세운다.', at: [85.1, 25.6] },
	{ year: -261, en: 'Ashoka conquers Kalinga.', ko: '아소카가 칼링가를 정복한다.', at: [85.8, 20.3] },
	{ year: -221, en: 'Qin unifies China.', ko: '진나라가 중국을 통일한다.', at: [108.7, 34.33] },
	{ year: -209, en: 'Modu Chanyu unites the Xiongnu.', ko: '묵돌 선우가 흉노를 통일한다.', at: [103, 47] },
	{ year: -202, en: 'Liu Bang founds the Han.', ko: '유방이 한나라를 세운다.', at: [108.9, 34.3] },
	{ year: -146, en: 'Rome destroys Carthage and Corinth.', ko: '로마가 카르타고와 코린토스를 멸한다.', at: [10.32, 36.85] },
	{ year: -108, en: 'The Han conquer Gojoseon.', ko: '한나라가 고조선을 멸한다.', at: [125.75, 39.02] },
	{ year: -57, en: 'Silla is founded, by its own count.', ko: '신라가 세워진다(전승).', at: [129.2, 35.85] },
	{ year: -37, en: 'Jumong founds Goguryeo (traditional date).', ko: '주몽이 고구려를 세운다(전승).', at: [125.3, 41.3] },
	{ year: -30, en: 'Rome annexes Egypt after Actium.', ko: '악티움 해전 뒤 로마가 이집트를 병합한다.', at: [29.9, 31.2] },
	{ year: -27, en: 'Augustus becomes the first Roman emperor.', ko: '아우구스투스가 로마의 첫 황제가 된다.', at: [12.5, 41.9] },
	{ year: 9, en: 'Wang Mang seizes the Han throne and proclaims Xin.', ko: '왕망이 한의 제위를 빼앗고 신을 세운다.', at: [108.9, 34.3] },
	{ year: 25, en: 'The Han are restored at Luoyang.', ko: '한나라가 낙양에서 다시 일어선다(후한).', at: [112.45, 34.62] },
	{
		year: 117,
		en: 'The Roman Empire reaches its greatest extent under Trajan.',
		ko: '트라야누스 치세에 로마 제국이 최대 판도에 이른다.',
		at: [12.5, 41.9]
	},
	{ year: 220, en: 'The Han dynasty ends; the Three Kingdoms begin.', ko: '한나라가 끝나고 삼국 시대가 열린다.', at: [112.45, 34.62] },
	{ year: 224, en: 'Ardashir founds the Sasanian Empire.', ko: '아르다시르가 사산 제국을 세운다.', at: [44.58, 33.09] },
	{ year: 320, en: 'Chandragupta I founds the Gupta Empire.', ko: '찬드라굽타 1세가 굽타 제국을 세운다.', at: [85.1, 25.6] },
	{ year: 395, en: 'The Roman Empire divides into east and west for good.', ko: '로마 제국이 동서로 완전히 나뉜다.', at: [28.98, 41.01] },
	{ year: 410, en: 'The Visigoths sack Rome.', ko: '서고트족이 로마를 약탈한다.', at: [12.5, 41.9] },
	{ year: 476, en: 'The last Western Roman emperor is deposed.', ko: '서로마 제국의 마지막 황제가 폐위된다.', at: [12.2, 44.42] },
	{ year: 552, en: 'The Göktürks overthrow the Rouran.', ko: '돌궐이 유연을 무너뜨린다.', at: [102.8, 47.5] },
	{ year: 589, en: 'The Sui reunite China.', ko: '수나라가 중국을 다시 통일한다.', at: [108.9, 34.3] },
	{ year: 618, en: 'The Tang dynasty is founded.', ko: '당나라가 세워진다.', at: [108.9, 34.3] },
	{ year: 622, en: "Muhammad's Hijra to Medina.", ko: '무함마드가 메디나로 이주한다(헤지라).', at: [39.61, 24.47] },
	{
		year: 632,
		en: 'Muhammad dies; the Rashidun caliphs begin their conquests.',
		ko: '무함마드 사후 정통 칼리파들이 정복을 시작한다.',
		at: [39.61, 24.47]
	},
	{ year: 651, en: 'The Sasanian Empire falls to the Arabs.', ko: '사산 제국이 아랍에 멸망한다.', at: [61.8, 37.6] },
	{
		year: 668,
		en: 'Silla and the Tang take Pyongyang; Goguryeo falls.',
		ko: '신라와 당이 평양을 함락한다. 고구려 멸망.',
		at: [125.75, 39.02]
	},
	{ year: 698, en: 'Dae Jo-yeong founds Balhae.', ko: '대조영이 발해를 세운다.', at: [128.6, 43.4] },
	{ year: 711, en: 'The Umayyads cross into Spain.', ko: '우마이야 왕조가 이베리아로 건너간다.', at: [-5.35, 36.14] },
	{ year: 750, en: 'The Abbasids overthrow the Umayyads.', ko: '아바스 왕조가 우마이야 왕조를 무너뜨린다.', at: [44.4, 33.3] },
	{ year: 751, en: 'Tang and Abbasid armies meet at Talas.', ko: '당과 아바스가 탈라스에서 맞붙는다.', at: [72.2, 42.5] },
	{ year: 800, en: 'Charlemagne is crowned emperor in Rome.', ko: '카롤루스 대제가 로마에서 황제로 대관한다.', at: [6.08, 50.78] },
	{ year: 843, en: 'The Treaty of Verdun splits the Frankish empire.', ko: '베르됭 조약으로 프랑크 왕국이 나뉜다.', at: [5.38, 49.16] },
	{ year: 907, en: 'The Tang dynasty falls.', ko: '당나라가 멸망한다.', at: [108.9, 34.3] },
	{ year: 918, en: 'Wang Geon founds Goryeo.', ko: '왕건이 고려를 세운다.', at: [126.55, 37.97] },
	{ year: 960, en: 'The Song dynasty is founded.', ko: '송나라가 세워진다.', at: [114.3, 34.8] },
	{
		year: 962,
		en: 'Otto I is crowned emperor: the Holy Roman Empire.',
		ko: '오토 1세가 황제로 대관한다. 신성 로마 제국.',
		at: [10.4, 51.2]
	},
	{ year: 1066, en: 'The Normans conquer England.', ko: '노르만이 잉글랜드를 정복한다.', at: [0.49, 50.91] },
	{ year: 1071, en: 'The Seljuks defeat Byzantium at Manzikert.', ko: '셀주크가 만지케르트에서 비잔티움을 꺾는다.', at: [42.53, 39.14] },
	{ year: 1099, en: 'The First Crusade takes Jerusalem.', ko: '제1차 십자군이 예루살렘을 점령한다.', at: [35.23, 31.78] },
	{
		year: 1127,
		en: 'The Jurchen Jin take Kaifeng; the Song flee south.',
		ko: '금나라가 카이펑을 함락하고 송은 남쪽으로 옮긴다.',
		at: [114.3, 34.8]
	},
	{ year: 1206, en: 'Temüjin is proclaimed Genghis Khan.', ko: '테무진이 칭기즈 칸으로 추대된다.', at: [110, 48.5] },
	{ year: 1258, en: 'The Mongols sack Baghdad.', ko: '몽골이 바그다드를 함락한다.', at: [44.4, 33.3] },
	{ year: 1271, en: 'Kublai Khan proclaims the Yuan dynasty.', ko: '쿠빌라이 칸이 원나라를 선포한다.', at: [116.4, 39.9] },
	{ year: 1279, en: 'The Yuan conquer the Southern Song.', ko: '원나라가 남송을 정복한다.', at: [113.1, 22.3] },
	{
		year: 1299,
		en: 'Osman I founds the Ottoman state (traditional date).',
		ko: '오스만 1세가 오스만 국가를 세운다(전승).',
		at: [30.18, 40.02]
	},
	{ year: 1324, en: 'Mansa Musa of Mali makes his pilgrimage to Mecca.', ko: '말리의 만사 무사가 메카로 순례한다.', at: [-3, 16.8] },
	{ year: 1368, en: 'The Ming drive the Mongols out of China.', ko: '명나라가 몽골을 중국에서 몰아낸다.', at: [118.8, 32.06] },
	{ year: 1392, en: 'Yi Seong-gye founds Joseon.', ko: '이성계가 조선을 세운다.', at: [126.98, 37.57] },
	{ year: 1428, en: 'The Aztec Triple Alliance is formed.', ko: '아즈텍 삼각동맹이 결성된다.', at: [-99.13, 19.43] },
	{ year: 1438, en: 'Pachacuti begins the Inca expansion.', ko: '파차쿠티가 잉카의 팽창을 시작한다.', at: [-71.97, -13.53] },
	{ year: 1453, en: 'The Ottomans take Constantinople.', ko: '오스만이 콘스탄티노폴리스를 함락한다.', at: [28.98, 41.01] },
	{ year: 1480, en: 'Moscow throws off Mongol rule.', ko: '모스크바가 몽골의 지배에서 벗어난다.', at: [37.6, 55.75] },
	{ year: 1492, en: 'Granada falls; Columbus reaches the Americas.', ko: '그라나다 함락. 콜럼버스가 아메리카에 닿는다.', at: [-40, 25] },
	{ year: 1521, en: 'Cortés takes Tenochtitlan.', ko: '코르테스가 테노치티틀란을 점령한다.', at: [-99.13, 19.43] },
	{ year: 1526, en: 'Babur founds the Mughal Empire at Panipat.', ko: '바부르가 파니파트에서 무굴 제국을 세운다.', at: [76.97, 29.39] },
	{
		year: 1533,
		en: 'Pizarro executes Atahualpa; the Inca Empire falls.',
		ko: '피사로가 아타우알파를 처형한다. 잉카 몰락.',
		at: [-78.5, -7.16]
	},
	{ year: 1592, en: 'Japan invades Korea (the Imjin War).', ko: '일본이 조선을 침략한다(임진왜란).', at: [129.04, 35.1] },
	{ year: 1603, en: 'The Tokugawa shogunate begins.', ko: '도쿠가와 막부가 시작된다.', at: [139.76, 35.68] },
	{ year: 1644, en: 'The Qing take Beijing.', ko: '청나라가 베이징을 차지한다.', at: [116.4, 39.9] },
	{ year: 1648, en: 'The Peace of Westphalia.', ko: '베스트팔렌 조약이 맺어진다.', at: [7.63, 51.96] },
	{
		year: 1707,
		en: 'England and Scotland unite as Great Britain.',
		ko: '잉글랜드와 스코틀랜드가 그레이트브리튼으로 합쳐진다.',
		at: [-2, 54]
	},
	{ year: 1757, en: 'The British East India Company wins at Plassey.', ko: '영국 동인도 회사가 플라시에서 승리한다.', at: [88.25, 23.8] },
	{ year: 1776, en: 'The United States declares independence.', ko: '미국이 독립을 선언한다.', at: [-75.16, 39.95] },
	{ year: 1789, en: 'The French Revolution.', ko: '프랑스 혁명.', at: [2.35, 48.86] },
	{
		year: 1804,
		en: 'Napoleon crowns himself emperor; Haiti wins independence.',
		ko: '나폴레옹이 황제에 오르고, 아이티가 독립한다.',
		at: [-20, 35]
	},
	{
		year: 1815,
		en: 'Napoleon falls; the Congress of Vienna redraws Europe.',
		ko: '나폴레옹이 몰락하고 빈 회의가 유럽을 다시 그린다.',
		at: [16.37, 48.21]
	},
	{ year: 1821, en: 'Mexico and Peru win independence from Spain.', ko: '멕시코와 페루가 스페인에서 독립한다.', at: [-85, 5] },
	{ year: 1868, en: 'The Meiji Restoration.', ko: '메이지 유신.', at: [139.7, 35.7] },
	{ year: 1871, en: 'Germany unites as an empire.', ko: '독일이 제국으로 통일된다.', at: [13.4, 52.5] },
	{ year: 1884, en: 'The Berlin Conference opens the scramble for Africa.', ko: '베를린 회의로 아프리카 분할이 본격화된다.', at: [15, 5] },
	{ year: 1910, en: 'Japan annexes Korea.', ko: '일본이 대한제국을 병합한다.', at: [126.98, 37.57] },
	{
		year: 1912,
		en: 'The Qing dynasty ends; the Republic of China is founded.',
		ko: '청나라가 끝나고 중화민국이 선다.',
		at: [118.8, 32.06]
	},
	{ year: 1914, en: 'The First World War begins.', ko: '제1차 세계 대전이 시작된다.', at: [18.41, 43.86] },
	{ year: 1917, en: 'The Russian Revolution.', ko: '러시아 혁명.', at: [30.3, 59.94] },
	{ year: 1918, en: 'The First World War ends; four empires fall.', ko: '제1차 세계 대전이 끝나고 네 제국이 무너진다.', at: [20, 48] },
	{
		year: 1922,
		en: 'The Soviet Union is founded; the Ottoman sultanate is abolished.',
		ko: '소련이 수립되고 오스만 술탄제가 폐지된다.',
		at: [37.6, 55.75]
	},
	{ year: 1939, en: 'The Second World War begins.', ko: '제2차 세계 대전이 시작된다.', at: [21, 52.2] },
	{
		year: 1945,
		en: 'The Second World War ends; Korea is liberated and divided.',
		ko: '제2차 세계 대전이 끝나고 한국이 광복과 함께 분단된다.',
		at: [127, 37.5]
	},
	{ year: 1947, en: 'India and Pakistan become independent.', ko: '인도와 파키스탄이 독립한다.', at: [77.2, 28.6] },
	{ year: 1949, en: "The People's Republic of China is proclaimed.", ko: '중화인민공화국이 선포된다.', at: [116.4, 39.9] },
	{ year: 1960, en: 'Seventeen African countries win independence.', ko: '아프리카 17개국이 독립한다.', at: [15, 5] },
	{ year: 1991, en: 'The Soviet Union dissolves.', ko: '소련이 해체된다.', at: [37.6, 55.75] }
];

/** The latest event at or before `year`, if it was recent enough to still be the story. */
export function eventAt(year: number, within = 120): WorldEvent | null {
	const event = EVENTS.findLast((e) => e.year <= year);
	return event && year - event.year <= within ? event : null;
}
