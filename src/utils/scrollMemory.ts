// 화면 전환 시 App.tsx의 공용 <main> 스크롤 컨테이너가 재사용되면서, 상세 화면 진입 시
// 앵커 스크롤 등으로 스크롤 위치가 바뀌어버려 목록으로 돌아왔을 때 이전 위치가 유지되지 않는다.
// 목록 화면(HomeScreen 등)에서 상세 화면으로 진입하기 직전 스크롤 위치를 저장해두고,
// 목록으로 복귀했을 때 복원하기 위한 유틸.
//
// 2026-09-27: 저장값이 한 번 복원된 뒤에도 남아 있어, 이후 다른 탭(프로그래시브 등)을 다녀와
// 홈이 다시 마운트될 때마다 예전 게시글 진입 위치로 튀는 문제 수정.
// → 저장값은 "복원 대기" 상태일 때 1회만 복원하고, 대기 중이 아니면 최상단으로 이동한다.

let savedScrollTop = 0;
let hasPendingRestore = false;

export const saveMainScrollTop = () => {
  const main = document.querySelector('main');
  if (main) {
    savedScrollTop = main.scrollTop;
    hasPendingRestore = true;
  }
};

export const restoreMainScrollTop = () => {
  const main = document.querySelector('main');
  if (main) main.scrollTop = hasPendingRestore ? savedScrollTop : 0;
  // 개발 모드 React.StrictMode는 마운트 effect를 연달아 두 번 실행하므로, 같은 마운트 안의
  // 두 번째 호출도 저장값을 복원하도록 대기 해제를 다음 태스크로 미룬다.
  setTimeout(() => {
    hasPendingRestore = false;
  }, 0);
};

// 하단 탭 이동처럼 새로 진입하는 경우: 대기 중인 복원을 취소하고 최상단으로 이동
export const resetMainScrollTop = () => {
  hasPendingRestore = false;
  savedScrollTop = 0;
  const main = document.querySelector('main');
  if (main) main.scrollTop = 0;
};
