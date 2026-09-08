// 화면 전환 시 App.tsx의 공용 <main> 스크롤 컨테이너가 재사용되면서, 상세 화면 진입 시
// 앵커 스크롤 등으로 스크롤 위치가 바뀌어버려 목록으로 돌아왔을 때 이전 위치가 유지되지 않는다.
// 목록 화면(HomeScreen 등)에서 상세 화면으로 진입하기 직전 스크롤 위치를 저장해두고,
// 목록으로 복귀했을 때 복원하기 위한 유틸.

let savedScrollTop = 0;

export const saveMainScrollTop = () => {
  const main = document.querySelector('main');
  if (main) savedScrollTop = main.scrollTop;
};

export const restoreMainScrollTop = () => {
  const main = document.querySelector('main');
  if (main) main.scrollTop = savedScrollTop;
};
