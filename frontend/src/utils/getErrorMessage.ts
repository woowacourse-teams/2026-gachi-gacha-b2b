export const getErrorMessage = (cause: unknown) =>
  cause instanceof Error ? cause.message : '알 수 없는 오류가 발생했습니다.';
