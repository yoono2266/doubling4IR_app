import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { apiCommonClient } from '../utils/apiClient';
import { getStoredUserInfo } from '../utils/auth';

// 댓글 타입 (tb_comments.tb_type)
export const COMMENT_TYPE_VIDEO = 0;
export const COMMENT_TYPE_CHALLENGE = 1;
export const COMMENT_TYPE_OFFER = 2;

// tb_comments 테이블 스키마 그대로 사용 (tb_index, mem_index, tb_type, target_index, tb_comment, tb_status, reg_timestamp).
// 작성자 표시용 필드(u_name/u_profile 등)는 서버가 조인해서 함께 내려줄 것으로 가정하고 여러 후보 키를 방어적으로 읽는다.
export interface ApiComment {
  tb_index: number;
  mem_index: number;
  tb_type: number;
  target_index: number;
  tb_comment: string;
  tb_status: number;
  reg_timestamp: number;
  u_name?: string;
  u_profile?: string;
  mem_name?: string;
  mem_profile?: string;
}

// reg_timestamp는 서버가 KST 기준으로 그대로 내려주는 값이라, "지금"도 같은 기준(UTC+9)으로 맞춰서 상대 시간을 계산한다.
const KST_OFFSET_SEC = 9 * 60 * 60;
export const formatCommentTime = (regTimestamp: number): string => {
  if (!regTimestamp) return '';
  const nowKst = Math.floor(Date.now() / 1000) + KST_OFFSET_SEC;
  const diff = Math.max(0, nowKst - regTimestamp);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
};

// tb_type + target_index 기준 댓글 목록 조회/작성/삭제(비노출 처리) 공용 훅.
// 영상 댓글(PostDetailScreen), 챌린지 댓글(PolyMarketDetailScreen) 등에서 공용으로 사용.
export function useComments(tbType: number, targetIndex: number) {
  const { myProfile, showToast } = useApp();
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myUidx = myProfile?.memberInfo?.uidx ?? getStoredUserInfo()?.uidx;

  const fetchComments = useCallback(async () => {
    if (!targetIndex) return;
    setCommentsLoading(true);
    try {
      const response = await apiCommonClient.post<any, { tb_type: number; target_index: number }>(
        '/comments/list',
        { tb_type: tbType, target_index: targetIndex }
      );
      const rawData = response?.data;
      const list: ApiComment[] = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.data)
        ? rawData.data
        : [];
      // 노출(1)만 표시 — 서버가 이미 필터링해서 줄 수도 있지만 안전하게 한 번 더 거른다.
      setComments(list.filter((c) => c.tb_status === 1));
    } catch (error) {
      console.error('[comments/list] 조회 실패:', error);
    } finally {
      setCommentsLoading(false);
    }
  }, [tbType, targetIndex]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const submitComment = useCallback(async (text: string): Promise<boolean> => {
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return false;

    setIsSubmitting(true);
    try {
      const response = await apiCommonClient.post<any, { tb_type: number; target_index: number; tb_comment: string }>(
        '/comments/create',
        { tb_type: tbType, target_index: targetIndex, tb_comment: trimmed }
      );
      if (response?.result === 0) {
        showToast('댓글이 등록되었습니다.');
        await fetchComments();
        return true;
      }
      showToast(response?.message || '댓글 등록에 실패했습니다.');
      return false;
    } catch (error) {
      console.error('[comments/create] 등록 실패:', error);
      showToast('댓글 등록 중 오류가 발생했습니다.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [tbType, targetIndex, isSubmitting, fetchComments, showToast]);

  const deleteComment = useCallback(async (tbIndex: number) => {
    try {
      const response = await apiCommonClient.post<any, { tb_index: number; tb_status: number }>(
        '/comments/update-status',
        { tb_index: tbIndex, tb_status: -1 }
      );
      if (response?.result === 0) {
        setComments((prev) => prev.filter((c) => c.tb_index !== tbIndex));
        showToast('댓글이 삭제되었습니다.');
      } else {
        showToast(response?.message || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('[comments/update-status] 삭제 실패:', error);
      showToast('삭제 중 오류가 발생했습니다.');
    }
  }, [showToast]);

  return { comments, commentsLoading, isSubmitting, myUidx, submitComment, deleteComment, refetch: fetchComments };
}
