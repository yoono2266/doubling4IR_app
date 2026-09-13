import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  POINT_PRODUCT_CATEGORIES,
  getPointProductsByCategory,
  PointProduct,
  PointProductCategoryId
} from '../data/pointRedemptionData';

// 포인트 사용처 화면. "더블링 포인트" 화면(MyPageScreen의 my-wallet)에서 "포인트 사용처"
// 버튼으로 진입한다. 카테고리 → 상품 목록 → 상품 상세 → 사용 확인 모달 → 완료 순서로 진행되며,
// 전부 mock(AppContext.redeemPointProduct, 실제 결제/재고 연동 아님)이다.
type Step = 'category' | 'list' | 'detail' | 'complete';

// 받침 유무에 따라 "으로"/"로" 조사를 붙인다 (예: "호텔 바우처" → "로", "기타 상품" → "으로").
const withRoParticle = (word: string): string => {
  const lastChar = word.trim().slice(-1);
  const code = lastChar.charCodeAt(0);
  const hasBatchim = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
  return `${word}${hasBatchim ? '으로' : '로'}`;
};

export const PointRedemptionScreen: React.FC = () => {
  const { setCurrentSubScreen, myProfile, pointRedemptions, redeemPointProduct } = useApp();

  const [step, setStep] = useState<Step>('category');
  const [selectedCategoryId, setSelectedCategoryId] = useState<PointProductCategoryId | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<PointProduct | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [completedVoucherCode, setCompletedVoucherCode] = useState('');

  const totalRedeemedDp = pointRedemptions.reduce((sum, r) => sum + r.dpCost, 0);
  const availableDp = Math.max(0, (myProfile?.memberInfo?.u_dp || 0) - totalRedeemedDp);

  const selectedCategory = POINT_PRODUCT_CATEGORIES.find((c) => c.id === selectedCategoryId) || null;

  const handleBack = () => {
    if (step === 'category') {
      setCurrentSubScreen('my-wallet');
    } else if (step === 'list') {
      setStep('category');
      setSelectedCategoryId(null);
    } else if (step === 'detail') {
      setStep('list');
      setSelectedProduct(null);
    } else {
      setCurrentSubScreen('my-wallet');
    }
  };

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
    step === 'category' ? '더블링 포인트로 돌아가기' :
    step === 'list' ? '포인트 사용처로 돌아가기' :
    step === 'detail' ? `${withRoParticle(selectedCategory?.title || '상품 목록')} 돌아가기` :
    '더블링 포인트로 돌아가기';

  return (
    <div className="flex flex-col gap-4 pb-44 pt-2">
      <button
        onClick={handleBack}
        className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        <span>{backLabel}</span>
      </button>

      {/* STEP 1: 카테고리 목록 */}
      {step === 'category' && (
        <>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#C5A059]">storefront</span>
            포인트 사용처
          </h2>
          <div className="bg-[#0D1B2A] border border-[#1F334D] rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">사용 가능 포인트</span>
            <span className="font-mono font-black text-[#FFF0D0]">{availableDp.toLocaleString()} <span className="text-[#E2C28E] text-[10px] font-sans font-bold">DP</span></span>
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
                <img src={category.image} alt={category.title} className="w-20 h-20 object-cover shrink-0" />
                <div className="flex-1 min-w-0 py-2 pr-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#C5A059] text-base">{category.icon}</span>
                    {category.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{category.subtitle}</p>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-sm shrink-0 mr-3">chevron_right</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* STEP 2: 상품 목록 */}
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

      {/* STEP 3: 상품 상세 */}
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

      {/* STEP 4 (모달): 사용 확인 */}
      {showConfirmModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#1E2E44] via-[#162639] to-[#0D1B2A] border-2 border-[#C5A059] rounded-3xl p-6 w-full max-w-sm flex flex-col items-center gap-4 text-center shadow-[0_0_40px_rgba(197,160,89,0.4)] animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-[#C5A059]/20 border-2 border-[#C5A059] flex items-center justify-center text-[#C5A059]">
              <span className="material-symbols-outlined text-2xl">redeem</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-white leading-snug">{selectedProduct.name}</h3>
              <p className="text-xs text-slate-300 mt-1">
                <span className="font-mono font-black text-[#E2C28E]">{selectedProduct.dpCost.toLocaleString()} DP</span>를 사용하시겠습니까?
              </p>
            </div>
            <div className="w-full flex gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-1/3 py-3 rounded-xl bg-[#162639] border border-[#1F334D] text-slate-300 font-bold text-xs hover:bg-[#1F334D] transition"
              >
                취소
              </button>
              <button
                onClick={handleConfirmRedeem}
                className="w-2/3 py-3 rounded-xl gold-button-gradient text-[#0D1B2A] font-black text-xs shadow-lg hover:brightness-110 active:scale-98 transition"
              >
                사용하기
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
            사용한 포인트는 "더블링 포인트 &gt; 포인트 지급 및 차감 내역"에서 확인할 수 있습니다.
          </p>

          <button
            onClick={() => {
              setStep('category');
              setSelectedCategoryId(null);
              setSelectedProduct(null);
              setCurrentSubScreen('my-wallet');
            }}
            className="w-full py-3 rounded-xl gold-button-gradient text-[#0D1B2A] font-black text-xs shadow-lg hover:brightness-110 active:scale-98 transition"
          >
            더블링 포인트로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
};
