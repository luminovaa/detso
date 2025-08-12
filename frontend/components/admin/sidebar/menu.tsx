"use client";

import Link from "next/link";
import { 
  LogOut, 
  User, 
  Settings,  
  ChevronRight,
  Ellipsis 
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { CollapseMenuButton } from "./collpase-menu";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getMenuList } from "./menu-list";
import { useAuth } from "../context/auth-provider";

interface MenuProps {
  isOpen: boolean | undefined;
}

export function Menu({ isOpen }: MenuProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth(); 
  const menuList = getMenuList(pathname);

  return (
    <ScrollArea className="[&>div>div[style]]:!block">
      <nav className="h-full mt-5 w-full">
        <ul className="flex flex-col min-h-[calc(100vh-48px-36px-16px-32px)] lg:min-h-[calc(100vh-32px-40px-32px)] items-start space-y-1 px-3">
          {menuList.map(({ groupLabel, menus }, index) => (
            <li className={cn("w-full", groupLabel ? "pt-4" : "")} key={index}>
              {(isOpen && groupLabel) || isOpen === undefined ? (
                <div className="flex items-center px-1 mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider truncate">
                    {groupLabel}
                  </p>
                  <Separator className="ml-2 flex-1" />
                </div>
              ) : !isOpen && isOpen !== undefined && groupLabel ? (
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger className="w-full">
                      <div className="w-full flex justify-center items-center py-2">
                        <Ellipsis className="h-4 w-4" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="text-xs font-semibold uppercase">{groupLabel}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <div className="pb-1"></div>
              )}
              {menus.map(
                ({ href, label, icon: Icon, active, submenus }, index) =>
                  !submenus || submenus.length === 0 ? (
                    <div className="w-full" key={index}>
                      <TooltipProvider disableHoverableContent>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={
                                (active === undefined && pathname.startsWith(href)) ||
                                active
                                  ? "default"
                                  : "ghost"
                              }
                              className={cn(
                                "w-full justify-start h-10 mb-1 transition-all",
                                "hover:bg-accent hover:text-primary hover:rounded-3xl",
                                (active === undefined && pathname.startsWith(href)) || active
                                  ? "bg-accent/50 text-primary font-medium rounded-3xl"
                                  : ""
                              )}
                              asChild
                            >
                              <Link href={href}>
                                <span
                                  className={cn(
                                    "flex items-center justify-center",
                                    isOpen === false ? "mx-auto" : "mr-3"
                                  )}
                                >
                                  <Icon size={18} className="shrink-0" />
                                </span>
                                <p
                                  className={cn(
                                    "max-w-[200px] truncate transition-all",
                                    isOpen === false
                                      ? "-translate-x-96 opacity-0"
                                      : "translate-x-0 opacity-100"
                                  )}
                                >
                                  {label}
                                </p>
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          {isOpen === false && (
                            <TooltipContent side="right" className="bg-foreground text-background">
                              {label}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ) : (
                    <div className="w-full" key={index}>
                      <CollapseMenuButton
                        icon={Icon}
                        label={label}
                        active={
                          active === undefined
                            ? pathname.startsWith(href)
                            : active
                        }
                        submenus={submenus}
                        isOpen={isOpen}
                      />
                    </div>
                  )
              )}
            </li>
          ))}

          {/* User Dropdown */}
          <li className="w-full grow flex items-end mb-4">
            {user ? (
              <DropdownMenu>
                <TooltipProvider disableHoverableContent>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start rounded-3xl h-10 mt-4 group",
                            "hover:bg-primary/10 hover:text-accent-foreground",
                            isOpen === false ? "justify-center" : ""
                          )}
                        >
                          <div
                            className={cn(
                              "flex items-center justify-center",
                              isOpen === false ? "mx-auto" : "mr-3"
                            )}
                          >
                            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                          </div>
                          <div
                            className={cn(
                              "flex flex-col items-start max-w-[180px] truncate",
                              isOpen === false ? "opacity-0 hidden" : "opacity-100"
                            )}
                          >
                            <span className="text-sm font-medium truncate">
                              {user.profile?.full_name || user.username || user.email}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </span>
                          </div>
                          <ChevronRight
                            className={cn(
                              "ml-auto transition-transform duration-200",
                              "group-hover:rotate-90",
                              isOpen === false ? "opacity-0" : "opacity-100"
                            )}
                          />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    {isOpen === false && (
                      <TooltipContent side="right" className="bg-foreground text-background">
                        {user.profile?.full_name || user.username}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenuContent
                  align="end"
                  side="right"
                  sideOffset={5}
                  className="w-56 rounded-3xl"
                >
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-3xl">
                    <Link href="/admin/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                    }}
                    className="text-destructive focus:text-destructive rounded-3xl"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start h-10 mt-4"
                asChild
              >
                <Link href="/admin/sign-in">Sign In</Link>
              </Button>
            )}
          </li>
        </ul>
      </nav>
    </ScrollArea>
  );
}