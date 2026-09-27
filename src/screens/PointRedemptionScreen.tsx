import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useInnerStepBack } from '../hooks/useInnerStepBack';
import {
  POINT_PRODUCT_CATEGORIES,
  POINT_PRODUCTS,
  getPointProductsByCategory,
  PointProduct,
  PointProductCategoryId
} from '../data/pointRedemptionData';

// 포인트 교환소(구 포인트 사용처) 화면. 2026-09-27부터 마이페이지 DP 카드의 "포인트 교환소" 버튼으로
// 진입한다(기존: "더블링 포인트" 화면 my-wallet의 "포인트 사용처" 버튼, 해당 박스는 주석 처리됨). 카테고리 → 상품 목록 → 상품 상세 → 사용 확인 모달 → 완료 순서로 진행되며,
// 전부 mock(AppContext.redeemPointProduct, 실제 결제/재고 연동 아님)이다.
// 2026-09-27: 구성 간소화 — 카테고리 카드 단계를 없애고, 첫 화면에서 태그(전체·바우처·식음료권·기타)로
// 상품 목록을 바로 필터링한다. 흐름: 태그+상품 목록 → 상품 상세 → 사용 확인 모달 → 완료.
// (기존 Step: 'category' | 'list' | 'detail' | 'complete')
type Step = 'list' | 'detail' | 'complete';
type FilterId = 'all' | PointProductCategoryId;

// 태그 표기 (데이터의 카테고리 title보다 짧게)
const FILTER_TAGS: { id: FilterId; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'hotel_voucher', label: '바우처' },
  { id: 'dining_voucher', label: '식음료권' },
  { id: 'other', label: '기타' },
];

/* 2026-09-27 비활성화 (삭제하지 않고 주석 보존).
   사유: 카테고리 단계가 없어져 "호텔 바우처로 돌아가기" 같은 조사 처리 라벨이 더 이상 필요 없음.
// 받침 유무에 따라 "으로"/"로" 조사를 붙인다 (예: "호텔 바우처" → "로", "기타 상품" → "으로").
const withRoParticle = (word: string): string => {
  const lastChar = word.trim().slice(-1);
  const code = lastChar.charCodeAt(0);
  const hasBatchim = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
  return `${word}${hasBatchim ? '으로' : '로'}`;
};
*/

export const PointRedemptionScreen: React.FC = () => {
  const { setCurrentSubScreen, myProfile, pointRedemptions, redeemPointProduct } = useApp();

  const [step, setStep] = useState<Step>('list');
  const [filterId, setFilterId] = useState<FilterId>('all');
  const [selectedProduct, setSelectedProduct] = useState<PointProduct | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [completedVoucherCode, setCompletedVoucherCode] = useState('');

  const totalRedeemedDp = pointRedemptions.reduce((sum, r) => sum + r.dpCost, 0);
  const availableDp = Math.max(0, (myProfile?.memberInfo?.u_dp || 0) - totalRedeemedDp);

  const countOf = (id: FilterId) => (id === 'all' ? POINT_PRODUCTS.length : getPointProductsByCategory(id).length);
  const visibleProducts = filterId === 'all' ? POINT_PRODUCTS : getPointProductsByCategory(filterId);
  const categoryOf = (id: PointProductCategoryId) => POINT_PRODUCT_CATEGORIES.find((c) => c.id === id);

  const handleBack = () => {
    if (step === 'list') {
      // 2026-09-27: 진입점이 마이페이지로 바뀌어 첫 단계 뒤로가기는 마이페이지로 (기존: my-wallet)
      setCurrentSubScreen(null);
    } else if (step === 'detail') {
      setStep('list');
      setSelectedProduct(null);
    } else {
      setCurrentSubScreen('my-wallet');
    }
  };

  // 2026-09-27: 상품 상세에서 기기·브라우저 뒤로가기 → 마이페이지가 아니라 교환소 목록으로 (기존: 마이페이지로 나감)
  useInnerStepBack(step === 'detail', () => {
    setShowConfirmModal(false);
    setStep('list');
    setSelectedProduct(null);
  });

  const handleConfirmRedeem = () => {
    if (!selectedProduct) return;
    const result = redeemPointProduct({
      id: selectedProduct.id,
      name: selectedProduct.name,
      categoryId: selectedProduct.categoryId,
      dpCost: selectedProduct.dpCost
    });

    setShowConfirmModal(false);

    if (result.success && result.voucherCode) {
      setCompletedVoucherCode(result.voucherCode);
      setStep('complete');
    }
  };

  const backLabel =
    step === 'list' ? '마이페이지로 돌아가기' :
    step === 'detail' ? '포인트 교환소로 돌아가기' :
    'DOUBLE RING 포인트로 돌아가기';

  return (
    <div className="flex flex-col gap-4 pb-44 pt-2">
      <button
        onClick={handleBack}
        className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        <span>{backLabel}</span>
      </button>

      {/* 2026-09-27: 제목과 보유 포인트를 한 줄로 (기존: 제목 아래 "사용 가능 포인트" 박스) */}
      {step === 'list' && (
        <>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-[#C5A059]">storefront</span>
              포인트 교환소
            </h2>
            <span className="shrink-0 text-lg font-extrabold text-[#FFF0D0] tabular-nums leading-none">
              {availableDp.toLocaleString()} <span className="text-[#E2C28E] text-xs font-bold">DP</span>
            </span>
          </div>

          {/* 태그 필터: 전체(n) · 바우처(n) · 식음료권(n) · 기타(n) */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
            {FILTER_TAGS.map((tag) => {
              const isActive = filterId === tag.id;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setFilterId(tag.id)}
                  aria-pressed={isActive}
                  className={`shrink-0 h-8 px-3 rounded-lg border text-xs font-bold whitespace-nowrap tabular-nums transition ${
                    isActive
                      ? 'bg-[#C5A059] border-[#C5A059] text-[#0D1B2A]'
                      : 'bg-[#162639] border-[#1F334D] text-slate-300 hover:border-[#C5A059]/50'
                  }`}
                >
                  {tag.label} ({countOf(tag.id)})
                </button>
              );
            })}
          </div>

          {/* 상품 리스트 */}
          <div className="flex flex-col gap-2">
            {visibleProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => {
                  setSelectedProduct(product);
                  setStep('detail');
                }}
                className="w-full text-left bg-[#162639] border border-[#1F334D] hover:border-[#C5A059]/50 rounded-xl p-2 pr-3 flex items-center gap-3 transition active:scale-[0.99]"
              >
                <img src={product.image} alt={product.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-[#C5A059]">{categoryOf(product.categoryId)?.icon}</span>
                    {categoryOf(product.categoryId)?.title}
                  </span>
                  <h4 className="mt-0.5 text-[13px] font-bold text-white leading-snug line-clamp-2 break-keep">{product.name}</h4>
                </div>
                <span className="shrink-0 text-sm font-extrabold text-[#E2C28E] tabular-nums">
                  {product.dpCost.toLocaleString()} <span className="text-[11px] font-bold">DP</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* [기존 STEP 1 카테고리 카드 · STEP 2 카테고리별 상품 그리드 — 2026-09-27 비활성화 (삭제하지 않고 주석 보존).
          사유: 페이지 구성 간소화 요청으로 태그 필터 + 단일 상품 리스트로 대체.
      // STEP 1: 카테고리 목록
      {step === 'category' && (
        <>
          // 2026-09-27: 제목 "포인트 사용처" → "포인트 교환소"
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#C5A059]">storefront</span>
            포인트 교환소
          </h2>
          // 2026-09-27: 가독성 — 라벨 12px → 13px, 금액 font-mono 12px → Pretendard tabular-nums 18px
          <div className="bg-[#0D1B2A] border border-[#C5A059]/30 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-[13px] text-slate-300 font-semibold">사용 가능 포인트</span>
            <span className="text-lg font-extrabold text-[#FFF0D0] tabular-nums leading-none">{availableDp.toLocaleString()} <span className="text-[#E2C28E] text-xs font-bold">DP</span></span>
          </div>

          <div className="flex flex-col gap-3">
            {POINT_PRODUCT_CATEGORIES.map((category) => (
              <div
                key={category.id}
                onClick={() => {
                  setSelectedCategoryId(category.id);
                  setStep('list');
                }}
                className="bg-[#162639] border border-[#1F334D] hover:border-[#C5A059]/50 rounded-2xl overflow-hidden cursor-pointer transition flex items-center gap-3 shadow-md"
              >
                // 2026-09-27: 가독성 — 이미지 80 → 88px, 제목 14 → 15px, 설명 11 → 12px(두 줄까지)
                <img src={category.image} alt={category.title} className="w-[88px] h-[88px] object-cover shrink-0" />
                <div className="flex-1 min-w-0 py-2 pr-2">
                  <h3 className="text-[15px] font-bold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#C5A059] text-lg">{category.icon}</span>
                    {category.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-snug line-clamp-2 break-keep">{category.subtitle}</p>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-sm shrink-0 mr-3">chevron_right</span>
              </div>
            ))}
          </div>
        </>
      )}

      // STEP 2: 상품 목록
      {step === 'list' && selectedCategory && (
        <>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#C5A059]">{selectedCategory.icon}</span>
            {selectedCategory.title}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {getPointProductsByCategory(selectedCategory.id).map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  setSelectedProduct(product);
                  setStep('detail');
                }}
                className="bg-[#162639] border border-[#1F334D] hover:border-[#C5A059]/50 rounded-2xl overflow-hidden cursor-pointer transition flex flex-col shadow-md"
              >
                <img src={product.image} alt={product.name} className="w-full h-24 object-cover" />
                <div className="p-2.5 flex flex-col gap-1.5">
                  <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">{product.name}</h4>
                  <span className="text-xs font-mono font-black text-[#E2C28E]">{product.dpCost.toLocaleString()} DP</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      */}

      {/* STEP 3: 상품 상세
          2026-09-27 UI/UX 정리: 분류 표시 추가, 제목 16 → 17px·설명 12 → 13px, font-mono → Pretendard tabular-nums,
          보유 포인트를 정보 박스 안으로 합치고 "교환 후 잔여"(부족 시 "부족 포인트") 행 추가,
          레드 경고 문구 제거(금지 패턴), 드롭 섀도우 제거, 교환 버튼 높이 48px·14px */}
      {step === 'detail' && selectedProduct && (() => {
        const category = categoryOf(selectedProduct.categoryId);
        const isShort = availableDp < selectedProduct.dpCost;
        const remainDp = availableDp - selectedProduct.dpCost;
        return (
          <div className="bg-[#162639] border border-[#1F334D] rounded-2xl overflow-hidden flex flex-col">
            {/* 2026-09-27: 호텔 프로그래시브 상세 히어로와 같은 구성 — 이미지 하단 그라디언트 위에 교환권 이름,
                분류는 이미지 좌측 상단 뱃지 (기존: 이미지 아래 본문에 분류·이름 표시).
                이름 ↔ 설명 간격 24px → 12px (이름 bottom-3 → bottom-1.5, 본문 pt-3 → pt-1.5) */}
            <div className="relative h-48 w-full">
              <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#162639] via-[#162639]/40 to-transparent"></div>
              {category && (
                <span className="absolute top-3 left-3 h-6 px-2 rounded-md bg-[#0D1B2A]/80 backdrop-blur-sm border border-[#C5A059]/50 text-[#E2C28E] text-[11px] font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">{category.icon}</span>
                  {category.title}
                </span>
              )}
              <h2 className="absolute bottom-1.5 left-4 right-4 text-xl font-black text-white tracking-tight leading-snug drop-shadow-md break-keep">
                {selectedProduct.name}
              </h2>
            </div>
            <div className="p-4 pt-1.5 flex flex-col gap-4">
              <p className="text-[13px] text-slate-300 leading-relaxed break-keep">{selectedProduct.description}</p>

              <div className="bg-[#0D1B2A] border border-[#1F334D] rounded-xl px-3.5 py-3 flex flex-col gap-2.5 tabular-nums">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">필요 포인트</span>
                  <span className="text-base font-extrabold text-[#E2C28E]">
                    {selectedProduct.dpCost.toLocaleString()} <span className="text-xs font-bold">DP</span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">보유 포인트</span>
                  <span className="text-[13px] font-bold text-white">{availableDp.toLocaleString()} DP</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">{isShort ? '부족 포인트' : '교환 후 잔여'}</span>
                  <span className={`text-[13px] font-bold ${isShort ? 'text-amber-300' : 'text-white'}`}>
                    {Math.abs(remainDp).toLocaleString()} DP
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 pt-2.5 border-t border-[#1F334D]">
                  <span className="shrink-0 text-xs text-slate-400">유효기간</span>
                  <span className="text-[13px] text-slate-200 text-right break-keep">{selectedProduct.validUntil}</span>
                </div>
              </div>

              {isShort ? (
                <button
                  type="button"
                  disabled
                  className="w-full h-12 rounded-xl bg-[#0D1B2A] border border-[#1F334D] text-slate-500 font-bold text-sm cursor-not-allowed"
                >
                  포인트가 부족합니다
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full h-12 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-sm tabular-nums hover:brightness-110 active:scale-[0.98] transition"
                >
                  {selectedProduct.dpCost.toLocaleString()} DP로 교환하기
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* [기존 STEP 3 상품 상세 JSX — 2026-09-27 위 레이아웃으로 대체 (삭제하지 않고 주석 보존)]
      {step === 'detail' && selectedProduct && (
      {step === 'detail' && selectedProduct && (
        <>
          <div className="bg-[#162639] border border-[#1F334D] rounded-2xl overflow-hidden shadow-xl flex flex-col">
            <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-44 object-cover" />
            <div className="p-4 flex flex-col gap-3">
              <h2 className="text-base font-black text-white leading-snug">{selectedProduct.name}</h2>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedProduct.description}</p>

              <div className="bg-[#0D1B2A] border border-[#1F334D] rounded-xl p-3 flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">필요 포인트</span>
                  <span className="font-mono font-black text-[#E2C28E] text-sm">{selectedProduct.dpCost.toLocaleString()} DP</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-[#1F334D]">
                  <span className="text-slate-400">유효기간</span>
                  <span className="text-slate-200 font-medium">{selectedProduct.validUntil}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
                <span>보유 포인트</span>
                <span className="font-mono font-bold text-white">{availableDp.toLocaleString()} DP</span>
              </div>

              {availableDp < selectedProduct.dpCost ? (
                <div className="flex flex-col gap-1.5">
                  <button
                    disabled
                    className="w-full py-3 rounded-xl bg-[#0D1B2A] border border-[#1F334D] text-slate-500 font-bold text-xs cursor-not-allowed"
                  >
                    포인트 부족으로 교환할 수 없습니다
                  </button>
                  <p className="text-[10px] text-rose-400 text-center">
                    {(selectedProduct.dpCost - availableDp).toLocaleString()} DP가 부족합니다
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full py-3 rounded-xl gold-button-gradient text-[#0D1B2A] font-black text-xs shadow-lg hover:brightness-110 active:scale-98 transition"
                >
                  {selectedProduct.dpCost.toLocaleString()} DP로 교환하기
                </button>
              )}
            </div>
          </div>
        </>
      )}

      */}

      {/* STEP 4 (모달): 사용 확인 */}
      {showConfirmModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#1E2E44] via-[#162639] to-[#0D1B2A] border-2 border-[#C5A059] rounded-3xl p-6 w-full max-w-sm flex flex-col items-center gap-4 text-center animate-in zoom-in-95">
            {/* 2026-09-27: 글로우 섀도우 제거, font-mono → tabular-nums, 교환 후 잔여 포인트 안내, 버튼 문구 "사용하기" → "교환하기" */}
            <div className="w-14 h-14 rounded-full bg-[#C5A059]/20 border-2 border-[#C5A059] flex items-center justify-center text-[#C5A059]">
              <span className="material-symbols-outlined text-2xl">redeem</span>
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-white leading-snug break-keep">{selectedProduct.name}</h3>
              <p className="text-[13px] text-slate-300 mt-1.5 tabular-nums">
                <span className="font-extrabold text-[#E2C28E]">{selectedProduct.dpCost.toLocaleString()} DP</span>를 사용해 교환하시겠습니까?
              </p>
              <p className="text-xs text-slate-400 mt-1 tabular-nums">
                교환 후 잔여 {(availableDp - selectedProduct.dpCost).toLocaleString()} DP
              </p>
            </div>
            <div className="w-full flex gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                type="button"
                className="w-1/3 h-12 rounded-xl bg-[#162639] border border-[#1F334D] text-slate-300 font-bold text-sm hover:bg-[#1F334D] transition"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmRedeem}
                className="w-2/3 h-12 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-sm hover:brightness-110 active:scale-[0.98] transition"
              >
                교환하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: 완료 화면 */}
      {step === 'complete' && selectedProduct && (
        <div className="bg-[#162639] border border-emerald-500/40 rounded-2xl p-6 flex flex-col items-center gap-4 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
          </div>
          <div>
            <h3 className="text-base font-black text-white">교환이 완료되었습니다!</h3>
            <p className="text-xs text-slate-300 mt-1">{selectedProduct.name}</p>
          </div>

          <div className="w-full bg-[#0D1B2A] border border-[#C5A059]/40 rounded-2xl p-4 flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">바우처 코드</span>
            <span className="text-lg font-mono font-black text-[#E2C28E] tracking-wider">{completedVoucherCode}</span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            사용한 포인트는 "DOUBLE RING 포인트 &gt; 포인트 지급 및 차감 내역"에서 확인할 수 있습니다.
          </p>

          <button
            onClick={() => {
              setStep('list');
              setFilterId('all');
              setSelectedProduct(null);
              setCurrentSubScreen('my-wallet');
            }}
            className="w-full py-3 rounded-xl gold-button-gradient text-[#0D1B2A] font-black text-xs shadow-lg hover:brightness-110 active:scale-98 transition"
          >
            DOUBLE RING 포인트로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
};
