// files/code/example.ts
interface User {
  id: string
  name: string
  email: string
}

export function formatUser(user: User): string {
  return `${user.name} <${user.email}>`
}
