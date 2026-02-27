// Batch 1 — 기존 PNG 에셋
import imgExclamation from '../../assets/6887a4ecc946bd8402871ea1b6ba5ae792b87778.png';
import imgQuestion from '../../assets/3203d1953fdf20274dd80c2255398d4089d43f80.png';
import imgEsc from '../../assets/6cc818526c54e58e709b9528897285d29048eea2.png';
import imgSmile from '../../assets/1a8f2d69ccf2af198284f77b37206f4a09342acd.png';
import imgDeadline from '../../assets/114982979533017780dc543896fc19462666d8c5.png';
import imgLightning from '../../assets/eac9e160e0b61b62704ab42572ac2e5636313829.png';
import imgEyes from '../../assets/b193963b11dd20b6a34e2061b6567f865c6ea0b0.png';
import imgHorse from '../../assets/9dc8ad7614b800818cdfefe02806d0a7ab184cda.png';
import imgEnter from '../../assets/7fefe70d856aae0e0c7c99adfd18dc8294db852d.png';
import imgCalendar from '../../assets/b58b601554026741e2d78d92a16324edb73dcf06.png';

// Batch 2 — 추가 PNG 에셋
import imgPaw from '../../assets/8e9914bca6513157d18187e7e664d5b9322abbcd.png';
import imgTape from '../../assets/cc9444e6bdf9706291df8008272a8b0a0e3ef39d.png';
import imgClip from '../../assets/742b78fa9f3cb16a08130bcc56bfb85517366712.png';
import imgCrown from '../../assets/4d280c10116f0579b32a949c9df6d1b4cef9515c.png';
import imgRocket from '../../assets/ab98d515ac1df3ae37c64383495e8c44b76d61de.png';
import imgMoney from '../../assets/0d0979ad04cee544b145627330e7e3f4dd4f4f3a.png';
import imgFire from '../../assets/c9e53ead2fa03978f91b509a05e831a2b5838f45.png';
import imgLogo from '../../assets/0b05cf6952afaee0988876e29134c44421e09b80.png';
import imgCoffee from '../../assets/3755c2b48eaa9b75304da690e12ccd751edb0fb6.png';
import imgCursor from '../../assets/e6b026026c1be12c461723cfcbff91d026d97d22.png';

// Batch 3 — 추가 PNG 에셋
import imgBulb from '../../assets/18df144984c80f94090626ccedf877fa4666717c.png';
import imgError from '../../assets/32cf3b62bc609c6ad729a19744ceb881f2df1a09.png';
import imgDanger from '../../assets/ca5ab975c2ec720f70e5d258a64d8005d7e1ed27.png';
import imgTerminal from '../../assets/92660a1e74100ae2003c033fc38b0ea7fd734f6d.png';
import imgComputer from '../../assets/4718a4ce87ca7af4a7f3e96c9e9ee4c4888a5e83.png';
import imgClock from '../../assets/e5aa203165082a1e65029afede8748c784b4542b.png';

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
  /** Logo flag — logos use brand-restricted colors only */
  isLogo?: boolean;
}

export const GRAPHIC_CATEGORIES = ['심볼'];

export const GRAPHICS: GraphicDef[] = [
  // ── Batch 1 PNG 그래픽 에셋 ──
  { name: '느낌표', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgExclamation, defaultWidth: 120, defaultHeight: 120, keywords: ['느낌표', '느낌', '강조', 'exclamation'] },
  { name: 'ESC', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgEsc, defaultWidth: 120, defaultHeight: 120, keywords: ['ESC', 'esc', '이스케이프', '키보드', '탈출', 'escape'] },
  { name: '물음표', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgQuestion, defaultWidth: 120, defaultHeight: 120, keywords: ['물음표', '물음', '질문', 'question'] },
  { name: '번개(속도)', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgLightning, defaultWidth: 120, defaultHeight: 120, keywords: ['번개', '속도', '전기', '빠름', 'lightning', 'speed'] },
  { name: '마감', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgDeadline, defaultWidth: 120, defaultHeight: 120, keywords: ['마감', '폭탄', '데드라인', '급함', 'deadline', 'bomb'] },
  { name: '스마일', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgSmile, defaultWidth: 120, defaultHeight: 120, keywords: ['스마일', '웃음', '이모지', '웃는', 'smile', 'happy'] },
  { name: '캘린더', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgCalendar, defaultWidth: 120, defaultHeight: 120, keywords: ['캘린더', '달력', '일정', '날짜', 'calendar', 'date'] },
  { name: '말(2026년)', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgHorse, defaultWidth: 120, defaultHeight: 120, keywords: ['말', '2026년', '2026', '띠', '말띠', 'horse'] },
  { name: '엔터(시작)', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgEnter, defaultWidth: 120, defaultHeight: 120, keywords: ['엔터', '시작', '엔터키', '출발', 'enter', 'start'] },
  { name: '눈동자(서치)', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgEyes, defaultWidth: 120, defaultHeight: 120, keywords: ['눈동자', '서치', '눈', '검색', '찾기', 'eyes', 'search'] },

  // ── Batch 2 PNG 그래픽 에셋 ──
  { name: '사자발(멋사)', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgPaw, defaultWidth: 120, defaultHeight: 120, keywords: ['사자발', '멋사', '멋쟁이사자처럼', '사자', '발', 'paw', 'likelion'] },
  { name: '테이프(수리/복구/수정)', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgTape, defaultWidth: 120, defaultHeight: 120, keywords: ['테이프', '수리', '복구', '수정', '붙이기', 'tape', 'fix', 'repair'] },
  { name: '클립(첨부)', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgClip, defaultWidth: 120, defaultHeight: 120, keywords: ['클립', '첨부', '첨부파일', '클립보드', 'clip', 'attach'] },
  { name: '왕관(우승)', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgCrown, defaultWidth: 120, defaultHeight: 120, keywords: ['왕관', '우승', '왕', '크라운', '1등', 'crown', 'winner'] },
  { name: '로켓(스타트업/부스터)', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgRocket, defaultWidth: 120, defaultHeight: 120, keywords: ['로켓', '스타트업', '부스터', '발사', '성장', 'rocket', 'startup', 'booster'] },
  { name: '돈(상금)', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgMoney, defaultWidth: 120, defaultHeight: 120, keywords: ['돈', '상금', '머니', '현금', '지폐', '보상', 'money', 'cash', 'prize'] },
  { name: '불(열정/버닝)', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgFire, defaultWidth: 120, defaultHeight: 120, keywords: ['불', '열정', '버닝', '화재', '불꽃', 'fire', 'burning', 'passion'] },
  { name: '로고', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgLogo, defaultWidth: 120, defaultHeight: 120, keywords: ['로고', '브랜드', 'logo', 'brand'] },
  { name: '커피(각성)', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgCoffee, defaultWidth: 120, defaultHeight: 120, keywords: ['커피', '각성', '카페인', '컵', '음료', 'coffee', 'caffeine', 'awake'] },
  { name: '커서', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgCursor, defaultWidth: 120, defaultHeight: 120, keywords: ['커서', '마우스', '클릭', '포인터', 'cursor', 'pointer', 'click'] },

  // ── Batch 3 PNG 그래픽 에셋 ──
  { name: '전구(아이디어)', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgBulb, defaultWidth: 120, defaultHeight: 120, keywords: ['전구', '아이디어', '생각', '발상', 'idea', 'bulb', 'lightbulb'] },
  { name: '에러', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgError, defaultWidth: 120, defaultHeight: 120, keywords: ['에러', '오류', '경고', '에러페이지', 'error', 'bug'] },
  { name: '위험', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgDanger, defaultWidth: 120, defaultHeight: 120, keywords: ['위험', '주의', '경고', '위험표시', 'danger', 'warning', 'alert'] },
  { name: '터미널(코딩)', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgTerminal, defaultWidth: 120, defaultHeight: 120, keywords: ['터미널', '코딩', '코드', '개발', '프로그래밍', 'terminal', 'coding', 'code'] },
  { name: '컴퓨터(디지털)', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgComputer, defaultWidth: 120, defaultHeight: 120, keywords: ['컴퓨터', '디지털', '모니터', 'PC', '기술', 'computer', 'digital', 'tech'] },
  { name: '시계(시간)', category: '심볼', viewBox: '0 0 100 100', path: '', imageUrl: imgClock, defaultWidth: 120, defaultHeight: 120, keywords: ['시계', '시간', '알람', '타이머', 'clock', 'time', 'alarm'] },
];

// ── Logo 에셋 (브랜드 컬러 3종 전용, 그래픽 컬러 통일 로직에서 제외) ──
export const BRAND_LOGOS: GraphicDef[] = [
  { name: 'LIKELION', category: '로고', viewBox: '0 0 100 100', path: '', imageUrl: imgLogoLikelion, defaultWidth: 300, defaultHeight: 60, keywords: ['멋사', 'likelion', '로고', '영문'], isLogo: true },
  { name: '멋사대학', category: '로고', viewBox: '0 0 100 100', path: '', imageUrl: imgLogoUniv, defaultWidth: 280, defaultHeight: 80, keywords: ['대학', '멋사대학', '로고', '한글'], isLogo: true },
  { name: '멋쟁이사자처럼', category: '로고', viewBox: '0 0 100 100', path: '', imageUrl: imgLogoFull, defaultWidth: 320, defaultHeight: 60, keywords: ['멋쟁이사자처럼', '풀네임', '로고', '한글'], isLogo: true },
];

/** Brand-restricted colors for logos only */
export const LOGO_COLORS = ['#FF6000', '#1C1C1C', '#F9F9F9'] as const;