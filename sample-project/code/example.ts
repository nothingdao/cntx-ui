// files/code/example.ts
// test
interface User {
  id: string
  name: string
  email: string
}

export function formatUser(user: User): string {
  return `${user.name} <${user.email}>`
}
