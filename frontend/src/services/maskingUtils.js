// 마스킹 유틸리티 함수들

export const maskEmail = (email) => {
  if (!email) return '';
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  return `${localPart[0]}${'*'.repeat(localPart.length - 2)}${localPart[localPart.length - 1]}@${domain}`;
};

export const maskName = (name) => {
  if (!name) return '';
  if (name.length <= 1) return name;
  if (name.length === 2) {
    return name[0] + '*';
  }
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
};

export const maskUserId = (userId) => {
  if (!userId) return '';
  const userIdStr = userId.toString();
  if (userIdStr.length <= 3) {
    return '*'.repeat(userIdStr.length);
  }
  return userIdStr.substring(0, 2) + '*'.repeat(userIdStr.length - 2);
};