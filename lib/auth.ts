import { hash } from "bcrypt"

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10)
}
