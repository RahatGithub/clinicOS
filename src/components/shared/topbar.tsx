'use client'

import { Menu, Bell, LogOut, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { UserAvatar } from '@/components/shared/user-avatar'
import { roleLabels, roleHomePath } from '@/lib/nav-config'
import type { Role } from '@/types'
import Link from 'next/link'

interface TopbarProps {
  userName: string
  userRole: Role
  userAvatarUrl?: string
  onMenuClick?: () => void
  onLogout?: () => void
}

const notifications = [
  { id: 1, text: 'New appointment booked for tomorrow', time: '2 min ago' },
  { id: 2, text: 'Lab results ready for Roger Binny', time: '15 min ago' },
  { id: 3, text: 'Staff schedule updated', time: '1 hr ago' },
]

export function Topbar({ userName, userRole, userAvatarUrl, onMenuClick, onLogout }: TopbarProps) {
  const profilePath =
    userRole === 'doctor'
      ? '/doctor/profile'
      : userRole === 'nurse'
        ? '/nurse/profile'
        : userRole === 'receptionist'
          ? '/receptionist/profile'
          : roleHomePath(userRole)

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-line bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications bell */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="relative" />
            }
          >
            <Bell className="h-[18px] w-[18px] text-ink-soft" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((n) => (
              <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5 py-2">
                <span className="text-sm">{n.text}</span>
                <span className="text-[11px] text-ink-faint">{n.time}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-line-soft" />
            }
          >
            <UserAvatar name={userName} src={userAvatarUrl} size="sm" />
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-tight text-ink">{userName}</p>
              <p className="text-[11px] leading-tight text-ink-faint">
                {roleLabels[userRole]}
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem render={<Link href={profilePath} />}>
              <UserRound className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
