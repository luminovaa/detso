"use client";
import { ChevronsDown, Github, Menu, Wifi } from "lucide-react";
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import Link from "next/link";
import { ToggleTheme } from "./toogle-theme";
import Image from "next/image";

interface RouteProps {
  href: string;
  label: string;
}

const routeList: RouteProps[] = [
  {
    href: "#home",
    label: "Beranda",
  },
  {
    href: "#pricing-section",
    label: "Harga",
  },
  {
    href: "#area",
    label: "Area",
  },
  {
    href: "#faq-section",
    label: "FAQ",
  },
];

const Logo = ({ className = "" }: { className?: string }) => (
  <Link href="/" className={`font-bold text-lg flex items-center hover:opacity-80 transition-opacity duration-200 ${className}`}>
    <Image src="/logo.png" alt="Detsonet Logo" width={100} height={100}/>
  </Link>
);

// Desktop Header Component
const DesktopHeader = () => (
  <header className="hidden md:flex bg-opacity-15 w-full h-16 sticky top-0 border-b-2 border-secondary z-40 justify-between items-center px-6 lg:px-20 xl:px-80 bg-card">
    <Logo className="ml-4" />
    
    <div className="flex items-center gap-4 mr-4">
      <nav className="flex items-center gap-10">
        {routeList.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-base font-medium text-foreground hover:text-primary transition-colors duration-200 hover:scale-105 transform"
          >
            {label}
          </Link>
        ))}
      </nav>
      
      <div className="flex items-center gap-2 ml-4">
        <ToggleTheme />
      </div>
    </div>
  </header>
);

// Mobile Header Component
const MobileHeader = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <header className="block md:hidden bg-opacity-15 w-full px-10 mx-auto h-16 sticky -top-2 border-b-2 border-secondary z-40 bg-card">
      <div className="flex justify-between items-center p-2 h-full">
        <Logo className="ml-2" />
        
        <div className="flex items-center mr-2">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Menu
                onClick={() => setIsOpen(!isOpen)}
                className="cursor-pointer hover:text-primary transition-colors duration-200"
              />
            </SheetTrigger>

            <SheetContent
              side="right"
              className="flex flex-col justify-between rounded-tl-2xl rounded-bl-2xl bg-card border-secondary"
            >
              <div>
                <SheetHeader className="mb-4 ml-4">
                  <SheetTitle className="flex items-center">
                    <Logo />
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-2">
                  {routeList.map(({ href, label }) => (
                    <Button
                      key={href}
                      onClick={() => setIsOpen(false)}
                      asChild
                      variant="ghost"
                      className="justify-start text-base hover:bg-muted hover:text-primary transition-all duration-200"
                    >
                      <Link href={href}>{label}</Link>
                    </Button>
                  ))}
                </div>
              </div>

              <SheetFooter className="flex-col sm:flex-col justify-start items-start">
                <Separator className="mb-2" />
                <ToggleTheme />
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

// Main Navbar Component
export const Navbar = () => {
  return (
    <>
      <DesktopHeader />
      <MobileHeader />
    </>
  );
};