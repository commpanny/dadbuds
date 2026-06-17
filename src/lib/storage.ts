const userKey = "dadbuds:userId";
const emailKey = "dadbuds:email";

export function saveLocalUser(userId: number, email: string) {
  localStorage.setItem(userKey, String(userId));
  localStorage.setItem(emailKey, email);
}

export function getLocalUserId() {
  const value = localStorage.getItem(userKey);
  return value ? Number(value) : null;
}

export function getLocalEmail() {
  return localStorage.getItem(emailKey) ?? "";
}

