import React, {useEffect, useState} from 'react'

import Image from 'next/image'
import Link from 'next/link'
import MobileNav from './mobile-nav'
import { PC_CENTER_PAGE, WebSiteName } from '@/constants'
import LogOutButton from './auth/logout-button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { navbarLinks } from '@/constants'
import {usePathname} from "next/navigation";
import {useUser} from "@/hooks/use-user";
import {cn} from "@/lib/utils";

type NavbarLink = {
  label: string;
  route: string;
  min_needed_role: number;
}

const Navbar = () => {

  const pathname = usePathname();
  const { userRole, isLoadingUser, username } = useUser()

  const [linksFiltered, setLinksFiltered] = useState<NavbarLink[]>([])

  useEffect(() => {
    const linksFilteredArr = navbarLinks.filter(link =>
      link.min_needed_role <= userRole)
    setLinksFiltered(linksFilteredArr)
  }, [userRole])

  return (
    <nav className='flex justify-between fixed z-50 w-full bg-light-2 px-6 py-4 lg:px-10 shadow'>
      <div className='flex gap-6'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={PC_CENTER_PAGE} className='flex w-fit items-center gap-1'>
                <Image
                  src='/icons/logo.svg'
                  width={36}
                  height={36}
                  alt='Site-logo'
                  className='max-sm:size-10'
                />
                <p className='text-[26px] text-blue-2 font-extrabold max-sm:hidden transition-colors hover:text-blue-500'> {WebSiteName} </p>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Перейти на сайт компьютерного центра</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className='flex gap-6'>
          {linksFiltered.map((link) => {
            const isActive = pathname === link.route || pathname.startsWith(`${link.route}/`);

            return (
              <a
                href={link.route}
                key={link.label}
                className={cn(
                  'flex gap-4 items-center p-4 rounded-lg justify-start transition-colors hover:bg-zinc-300',
                  {
                    'bg-blue-1 hover:bg-blue-500': isActive,
                  }
                )}
              >
                <p className='text-lg font-semibold max-lg:hidden'>
                  {link.label}
                </p>
              </a>
            )
          })}
        </div>
      </div>

      <div className='flex items-center gap-5'>
        <p>{username}</p>
        <LogOutButton additionalClassName={'max-sm:hidden'}/>
      </div>
    </nav>
  )
}

export default Navbar
