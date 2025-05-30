import Link from "next/link"
import { Search, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Navbar() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-[#1B59FA] mr-8">
            <div className="relative">
              <Building2 className="h-6 w-6" />
              <Search className="h-3.5 w-3.5 absolute -bottom-1 -right-1 text-[#1B59FA] bg-white rounded-full" />
            </div>
            <span>개원스캐너</span>
          </Link>
          <nav className="flex items-center">
            <Link href="#database" className="text-sm font-medium hover:text-[#1B59FA] transition-colors">
              의료기관 찾기
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-sm font-medium text-[#1B59FA] hover:bg-blue-50">
            로그인
          </Button>
          <Button className="text-sm font-medium bg-[#1B59FA] hover:bg-blue-700 text-white">회원가입</Button>
        </div>
      </div>
    </header>
  )
}
