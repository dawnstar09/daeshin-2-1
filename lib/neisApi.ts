// NEIS Open API 유틸리티 함수

interface MealInfo {
  ATPT_OFCDC_SC_CODE: string  // 시도교육청코드
  ATPT_OFCDC_SC_NM: string    // 시도교육청명
  SD_SCHUL_CODE: string        // 표준학교코드
  SCHUL_NM: string             // 학교명
  MMEAL_SC_CODE: string        // 식사코드
  MMEAL_SC_NM: string          // 식사명
  MLSV_YMD: string             // 급식일자
  MLSV_FGR: string             // 급식인원수
  DDISH_NM: string             // 요리명
  ORPLC_INFO: string           // 원산지정보
  CAL_INFO: string             // 칼로리정보
  NTR_INFO: string             // 영양정보
  MLSV_FROM_YMD: string        // 급식시작일자
  MLSV_TO_YMD: string          // 급식종료일자
}

interface NeisApiResponse {
  mealServiceDietInfo?: Array<{
    head: any[]
    row: MealInfo[]
  }>
  RESULT?: {
    CODE: string
    MESSAGE: string
  }
}

/**
 * NEIS API에서 급식 정보 조회
 * @param date - 조회할 날짜 (YYYYMMDD 형식)
 * @returns 급식 정보 배열
 */
export async function fetchMealInfo(date: string): Promise<MealInfo[]> {
  const API_KEY = process.env.NEXT_PUBLIC_NEIS_API_KEY
  const ATPT_OFCDC_SC_CODE = process.env.NEXT_PUBLIC_NEIS_ATPT_OFCDC_SC_CODE
  const SD_SCHUL_CODE = process.env.NEXT_PUBLIC_NEIS_SD_SCHUL_CODE

  if (!API_KEY || API_KEY === 'YOUR_NEIS_API_KEY_HERE') {
    return []
  }

  const url = new URL('https://open.neis.go.kr/hub/mealServiceDietInfo')
  url.searchParams.append('KEY', API_KEY)
  url.searchParams.append('Type', 'json')
  url.searchParams.append('pIndex', '1')
  url.searchParams.append('pSize', '10')
  url.searchParams.append('ATPT_OFCDC_SC_CODE', ATPT_OFCDC_SC_CODE || '')
  url.searchParams.append('SD_SCHUL_CODE', SD_SCHUL_CODE || '')
  url.searchParams.append('MLSV_YMD', date)

  try {
    const response = await fetch(url.toString())
    const data: NeisApiResponse = await response.json()

    // 에러 체크
    if (data.RESULT) {
      return []
    }

    // 데이터가 있는지 확인 - row는 배열의 두 번째 요소에 있음
    if (!data.mealServiceDietInfo || data.mealServiceDietInfo.length < 2 || !data.mealServiceDietInfo[1]?.row) {
      return []
    }

    const mealData = data.mealServiceDietInfo[1].row
    return mealData
  } catch {
    return []
  }
}

/**
 * 급식 메뉴 문자열을 정리 (HTML 태그 제거, 알레르기 정보 정리)
 * @param menuText - 원본 메뉴 문자열
 * @returns 정리된 메뉴 문자열
 */
export function cleanMenuText(menuText: string): string {
  if (!menuText) return ''
  
  return menuText
    // <br/> 태그를 줄바꿈으로 변경
    .replace(/<br\s*\/?>/gi, '\n')
    // 알레르기 정보 괄호 제거 (예: (1.2.3))
    .replace(/\([0-9.\s]+\)/g, '')
    // 각 줄의 앞뒤 공백 제거하고, 같은 줄의 여러 공백은 하나로
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(line => line.length > 0)
    .join('\n')
}

/**
 * 날짜를 YYYYMMDD 형식으로 변환
 * @param date - Date 객체
 * @returns YYYYMMDD 형식 문자열
 */
export function formatDateForNeis(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

/**
 * 급식 코드에서 급식 타입 추출
 * @param code - 급식 코드 (1: 조식, 2: 중식, 3: 석식)
 * @returns 급식 타입
 */
export function getMealType(code: string): 'breakfast' | 'lunch' | 'dinner' | null {
  switch (code) {
    case '1':
      return 'breakfast'
    case '2':
      return 'lunch'
    case '3':
      return 'dinner'
    default:
      return null
  }
}
