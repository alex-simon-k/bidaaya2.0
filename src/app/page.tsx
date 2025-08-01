import { redirect } from 'next/navigation'

export default function Home() {
  // Automatically redirect to login page
  redirect('/auth/login')
}
