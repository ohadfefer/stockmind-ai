import path from "node:path"

// The logged-in session the setup project saves and every logged-in test
// starts from. Gitignored: it holds a live session cookie.
export const AUTH_FILE = path.join(__dirname, "../playwright/.auth/user.json")
