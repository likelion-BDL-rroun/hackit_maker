// New PNG graphic assets (exported from Figma, human-readable filenames under src/assets/new-graphics)
import imgBulb from '../../assets/new-graphics/01_idea_bulb.png';
import imgCoffee from '../../assets/new-graphics/02_coffee-awake.png';
import imgSymbol from '../../assets/new-graphics/03_symbol.png';
import imgCursor from '../../assets/new-graphics/04_cursor-direction.png';
import imgCrown from '../../assets/new-graphics/05_crown.png';
import imgMoney from '../../assets/new-graphics/06_cash-prize.png';
import imgFire from '../../assets/new-graphics/07_explosion-passion.png';
import imgPaw from '../../assets/new-graphics/08_paw-lion.png';
import imgTape from '../../assets/new-graphics/09_tape-repair.png';
import imgEyes from '../../assets/new-graphics/10_eyes-search.png';
import imgQuestion from '../../assets/new-graphics/11_question-mark.png';
import imgSmile from '../../assets/new-graphics/12_smile.png';
import imgEsc from '../../assets/new-graphics/13_ESC.png';
import imgRocket from '../../assets/new-graphics/14_rocket-launch.png';
import imgClip from '../../assets/new-graphics/15_paperclip-attach.png';
import imgComputer from '../../assets/new-graphics/16_computer-digital.png';
import imgError from '../../assets/new-graphics/17_error.png';
import imgDanger from '../../assets/new-graphics/18_danger.png';
import imgEnter from '../../assets/new-graphics/19_enter-start.png';
import imgHorse2026 from '../../assets/new-graphics/20_chess-strategy.png';
import imgCalendar from '../../assets/new-graphics/21_calendar.png';
import imgLightning from '../../assets/new-graphics/22_lightning-speed.png';
import imgTerminal from '../../assets/new-graphics/23_terminal-coding.png';
import imgClock from '../../assets/new-graphics/24_clock-time.png';
import imgDeadline from '../../assets/new-graphics/25_bomb-deadline.png';
import imgExclamation from '../../assets/new-graphics/26_exclamation-mark.png';
import imgChat from '../../assets/new-graphics/27_speech-bubble.png';
import imgPizza from '../../assets/new-graphics/28_pizza-food.png';
import imgUfo from '../../assets/new-graphics/29_UFO.png';
import imgGhost from '../../assets/new-graphics/30_ghost.png';

// Logos
import imgLogoLikelion from '../../assets/c5914f048948c4d542e04d194615de5ffe5cbbb2.png';
import imgLogoUniv from '../../assets/f579b1e5a34f1596dd863a7069d370f16099e9cf.png';
import imgLogoFull from '../../assets/e8d67e4acbfc2c170ee6a49c0a9f3d9b71910bcd.png';

export interface GraphicDef {
  name: string;
  category: string;
  path: string;
  viewBox: string;
  /** Optional PNG/raster image URL — used instead of SVG path when present */
  imageUrl?: string;
  /** Default insert width (px). Falls back to 200 if omitted */
  defaultWidth?: number;
  /** Default insert height (px). Falls back to defaultWidth if omitted */
  defaultHeight?: number;
  /** Search keywords for filtering */
  keywords?: string[];
  /** Logo flag — logos use same global themeColor as graphics */
  isLogo?: boolean;
}

export const GRAPHIC_CATEGORIES = ['심볼'];

export const GRAPHICS: GraphicDef[] = [
  // 새 PNG 그래픽 에셋 (src/assets/new-graphics 기준, 파일 이름/의미 기반 검색어)
  { name: '01_idea_bulb', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgBulb, defaultWidth: 120, defaultHeight: 120, keywords: ['전구', '아이디어', '아이디어전구', '생각', '발상', 'idea', 'bulb', 'lightbulb'] },
  { name: '02_coffee-awake', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgCoffee, defaultWidth: 120, defaultHeight: 120, keywords: ['커피', '각성', '카페인', '밤샘', '야근', 'coffee', 'caffeine', 'awake'] },
  { name: '03_symbol', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgSymbol, defaultWidth: 120, defaultHeight: 120, keywords: ['심볼', '아이콘', 'symbol'] },
  { name: '04_cursor-direction', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgCursor, defaultWidth: 120, defaultHeight: 120, keywords: ['커서', '마우스', '클릭', '포인터', '방향', 'cursor', 'pointer'] },
  { name: '05_crown', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgCrown, defaultWidth: 120, defaultHeight: 120, keywords: ['왕관', '우승', '1등', '왕', '크라운', 'crown', 'winner'] },
  { name: '06_cash-prize', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgMoney, defaultWidth: 120, defaultHeight: 120, keywords: ['돈', '상금', '머니', '현금', '지폐', '보상', '시상', 'money', 'cash', 'prize'] },
  // 불(열정/버닝) — 불, 열정, 버닝 중 아무거나 검색해도 나오도록
  { name: '07_explosion-passion', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgFire, defaultWidth: 120, defaultHeight: 120, keywords: ['불', '열정', '버닝', '불꽃', '화염', 'fire', 'burning', 'passion'] },
  { name: '08_paw-lion', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgPaw, defaultWidth: 120, defaultHeight: 120, keywords: ['사자발', '멋사', '멋쟁이사자처럼', '사자', '발바닥', 'paw', 'likelion'] },
  { name: '09_tape-repair', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgTape, defaultWidth: 120, defaultHeight: 120, keywords: ['테이프', '수리', '복구', '수정', '붙이기', 'tape', 'fix', 'repair'] },
  { name: '10_eyes-search', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgEyes, defaultWidth: 120, defaultHeight: 120, keywords: ['눈동자', '눈', '서치', '검색', '찾기', 'eyes', 'search'] },
  { name: '11_question-mark', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgQuestion, defaultWidth: 120, defaultHeight: 120, keywords: ['물음표', '물음', '질문', '궁금', 'question', 'why'] },
  { name: '12_smile', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgSmile, defaultWidth: 120, defaultHeight: 120, keywords: ['스마일', '웃음', '이모지', '웃는', 'happy', 'smile'] },
  { name: '13_ESC', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgEsc, defaultWidth: 120, defaultHeight: 120, keywords: ['ESC', 'esc', '이스케이프', '키보드', '탈출', 'escape', '취소'] },
  { name: '14_rocket-launch', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgRocket, defaultWidth: 120, defaultHeight: 120, keywords: ['로켓', '스타트업', '부스터', '발사', '성장', 'rocket', 'startup', 'booster'] },
  { name: '15_paperclip-attach', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgClip, defaultWidth: 120, defaultHeight: 120, keywords: ['클립', '첨부', '첨부파일', '집게', 'clip', 'attach'] },
  { name: '16_computer-digital', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgComputer, defaultWidth: 120, defaultHeight: 120, keywords: ['컴퓨터', '디지털', '모니터', 'PC', '기술', 'computer', 'digital', 'tech'] },
  { name: '17_error', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgError, defaultWidth: 120, defaultHeight: 120, keywords: ['에러', '오류', '경고', '에러페이지', 'error', 'bug'] },
  { name: '18_danger', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgDanger, defaultWidth: 120, defaultHeight: 120, keywords: ['위험', '주의', '경고', '위험표시', 'danger', 'warning', 'alert'] },
  { name: '19_enter-start', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgEnter, defaultWidth: 120, defaultHeight: 120, keywords: ['엔터', '시작', '엔터키', '출발', 'enter', 'start'] },
  { name: '20_chess-strategy', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgHorse2026, defaultWidth: 120, defaultHeight: 120, keywords: ['말', '2026년', '2026', '띠', '말띠', 'horse', 'chess', 'strategy'] },
  { name: '21_calendar', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgCalendar, defaultWidth: 120, defaultHeight: 120, keywords: ['캘린더', '달력', '일정', '날짜', 'calendar', 'date'] },
  { name: '22_lightning-speed', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgLightning, defaultWidth: 120, defaultHeight: 120, keywords: ['번개', '속도', '전기', '빠름', 'lightning', 'speed'] },
  { name: '23_terminal-coding', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgTerminal, defaultWidth: 120, defaultHeight: 120, keywords: ['터미널', '코딩', '코드', '개발', '프로그래밍', 'terminal', 'coding', 'code'] },
  { name: '24_clock-time', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgClock, defaultWidth: 120, defaultHeight: 120, keywords: ['시계', '시간', '알람', '타이머', 'clock', 'time', 'alarm'] },
  { name: '25_bomb-deadline', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgDeadline, defaultWidth: 120, defaultHeight: 120, keywords: ['마감', '데드라인', '급함', '폭탄', 'bomb', 'deadline'] },
  { name: '26_exclamation-mark', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgExclamation, defaultWidth: 120, defaultHeight: 120, keywords: ['느낌표', '느낌', '강조', '느낌표아이콘', 'exclamation', 'important'] },
  { name: '27_speech-bubble', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgChat, defaultWidth: 120, defaultHeight: 120, keywords: ['말풍선', '대화', '채팅', '메시지', 'speech', 'chat'] },
  { name: '28_pizza-food', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgPizza, defaultWidth: 120, defaultHeight: 120, keywords: ['피자', '식사', '야식', '간식', '치즈', 'pizza', 'snack'] },
  { name: '29_UFO', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgUfo, defaultWidth: 120, defaultHeight: 120, keywords: ['UFO', '외계인', '미지', '특이', 'ufo', 'alien'] },
  { name: '30_ghost', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgGhost, defaultWidth: 120, defaultHeight: 120, keywords: ['유령', '고스트', '버그', '미스터리', 'ghost', 'spooky'] },
];

// ── Logo 에셋 (그래픽과 동일하게 전역 themeColor 적용) ──
export const BRAND_LOGOS: GraphicDef[] = [
  { name: 'LIKELION', category: '로고', viewBox: '0 0 100 100', path: '', imageUrl: imgLogoLikelion, defaultWidth: 300, defaultHeight: 60, keywords: ['멋사', 'likelion', '로고', '영문'], isLogo: true },
  { name: '멋사대학', category: '로고', viewBox: '0 0 100 100', path: '', imageUrl: imgLogoUniv, defaultWidth: 280, defaultHeight: 80, keywords: ['대학', '멋사대학', '로고', '한글'], isLogo: true },
  { name: '멋쟁이사자처럼', category: '로고', viewBox: '0 0 100 100', path: '', imageUrl: imgLogoFull, defaultWidth: 320, defaultHeight: 60, keywords: ['멋쟁이사자처럼', '풀네임', '로고', '한글'], isLogo: true },
];