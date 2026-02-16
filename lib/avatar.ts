export const DEFAULT_AVATAR_URL =
  'https://ui-avatars.com/api/?name=User&background=E5E7EB&color=111827';

export const getAvatarUrl = (avatar?: string | null, name?: string | null) => {
  if (avatar) return avatar;
  if (name && name.trim().length > 0) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name.trim()
    )}&background=E5E7EB&color=111827`;
  }
  return DEFAULT_AVATAR_URL;
};

